-- Supports §3.5 Claim & Pickup Flow: partial-quantity claims, a pickup code
-- per claim, donor code verification, and auto-expiry.
-- Run after 003_manage_and_discover.sql.

-- ---------- Listings: numeric quantity tracking ----------
-- quantity stays the free-text field donors type ("20 sandwiches"); these
-- numeric columns are a best-effort parse of it, used only to offer partial
-- claims when possible. Both are null when the quantity can't be parsed.
alter table public.listings
  add column if not exists quantity_total numeric,
  add column if not exists quantity_claimed numeric;

-- ---------- Claims: pickup code + status ----------
-- The pickup code is intentionally NOT stored on `listings` (which is
-- publicly readable) — it lives only here, where RLS already restricts
-- reads to the receiver who claimed it and the donor who owns the listing.
alter table public.claims
  add column if not exists quantity_claimed numeric,
  add column if not exists pickup_code text,
  add column if not exists status text not null default 'pending' check (status in ('pending', 'completed')),
  add column if not exists picked_up_at timestamptz;

-- Donors need to mark a claim completed once the pickup code matches.
create policy "donors can complete claims on their own listings"
  on public.claims for update using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.donor_id = auth.uid()
    )
  );

-- ---------- Atomic claim RPC (replaces the 001 version) ----------
-- Adds an optional partial-quantity claim and issues a pickup code.
create or replace function public.claim_listing(p_listing_id uuid, p_quantity numeric default null)
returns public.listings
language plpgsql
security definer set search_path = public
as $$
declare
  v_listing public.listings;
  v_code text;
  v_claimed numeric;
begin
  select * into v_listing from public.listings where id = p_listing_id for update;

  if not found then
    raise exception 'Listing not found';
  end if;

  if v_listing.status <> 'available' then
    raise exception 'Listing is no longer available';
  end if;

  if v_listing.quantity_total is not null and p_quantity is not null then
    if p_quantity <= 0 or p_quantity > v_listing.quantity_total then
      raise exception 'Invalid claim quantity';
    end if;
    v_claimed := p_quantity;
  else
    v_claimed := v_listing.quantity_total;
  end if;

  v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

  update public.listings
    set status = 'claimed', claimed_by = auth.uid(), claimed_at = now(), quantity_claimed = v_claimed
    where id = p_listing_id
    returning * into v_listing;

  insert into public.claims (listing_id, receiver_id, quantity_claimed, pickup_code)
    values (p_listing_id, auth.uid(), v_claimed, v_code);

  return v_listing;
end;
$$;

grant execute on function public.claim_listing(uuid, numeric) to authenticated;

-- ---------- Auto-release expired listings ----------
-- Lazy expiry (via the app, RLS-scoped to whoever owns the row) covers the
-- common case immediately. For a real background sweep independent of page
-- visits, enable pg_cron in your project's Database > Extensions, then run:
--
--   select cron.schedule(
--     'savebite-expire-listings',
--     '*/5 * * * *',
--     $$update public.listings set status = 'expired'
--       where status in ('available', 'claimed') and expires_at < now()$$
--   );
--
-- This is commented out here because pg_cron isn't enabled on every project
-- by default and this migration should run cleanly without it.
