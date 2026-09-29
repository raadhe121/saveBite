-- Supports §5 Admin Panel (ban users) and §6 Safety, Trust & Privacy
-- (report button data). Run after 004_claim_and_pickup_flow.sql.

alter table public.profiles
  add column if not exists banned_at timestamptz;

-- No new RLS policy needed for banning: "admins can update any profile"
-- (from schema.sql) already lets admins set banned_at. Enforcement that a
-- banned user can't act happens in the app (lib/session.ts) and is backed
-- here in the database for defense in depth.
--
-- These are RESTRICTIVE policies (ANDed with the existing permissive insert
-- policies rather than ORed) so a banned user is blocked even though the
-- normal "donors/receivers can insert..." policies would otherwise allow it.
create policy "banned users cannot insert listings"
  on public.listings as restrictive for insert with check (
    not exists (select 1 from public.profiles p where p.id = auth.uid() and p.banned_at is not null)
  );

create policy "banned users cannot claim listings"
  on public.claims as restrictive for insert with check (
    not exists (select 1 from public.profiles p where p.id = auth.uid() and p.banned_at is not null)
  );

-- claim_listing() is `security definer`, which bypasses RLS entirely, so the
-- restrictive policy above doesn't reach it — the ban check has to live
-- inside the function too.
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
  if exists (select 1 from public.profiles p where p.id = auth.uid() and p.banned_at is not null) then
    raise exception 'Your account has been suspended';
  end if;

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
