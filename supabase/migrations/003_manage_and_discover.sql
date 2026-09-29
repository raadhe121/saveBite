-- Supports §3.3 (manage listings) and §3.4 (discover food).
-- Run after 002_mvp_extensions.sql.

-- Donors need to remove the claim row when they cancel a no-show claim
-- (the listing itself reverts to 'available' via a normal UPDATE, which the
-- existing "donors can update their own listings" policy already allows).
create policy "donors can remove claims on their own listings"
  on public.claims for delete using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.donor_id = auth.uid()
    )
  );
