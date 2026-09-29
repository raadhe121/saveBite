-- Lets a receiver cancel their own pending claim (they changed their mind,
-- or can no longer make it) — separate from the donor's "no-show" cancel.
-- Run after 005_admin_and_safety.sql.
--
-- security definer because reverting listings.status requires write access
-- the receiver doesn't otherwise have (only the donor/admin can update a
-- listing), and this function checks ownership of the claim itself instead.
create or replace function public.cancel_my_claim(p_listing_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_claim public.claims;
begin
  select * into v_claim
  from public.claims
  where listing_id = p_listing_id and receiver_id = auth.uid() and status = 'pending';

  if not found then
    raise exception 'No active claim found for this listing';
  end if;

  update public.listings
    set status = 'available', claimed_by = null, claimed_at = null, quantity_claimed = null
    where id = p_listing_id and status = 'claimed';

  delete from public.claims where id = v_claim.id;
end;
$$;

grant execute on function public.cancel_my_claim(uuid) to authenticated;
