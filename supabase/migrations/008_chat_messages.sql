-- In-app chat so a donor and the receiver who claimed their listing can
-- coordinate pickup. One thread per listing, scoped to the two participants.
-- Run after 007_push_notifications.sql.

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index messages_listing_idx on public.messages (listing_id, created_at);

alter table public.messages enable row level security;

-- Only the listing's donor and whoever claimed it can read or post —
-- messages piggyback on claim ownership rather than a separate membership
-- table since a listing has at most one active claim at a time.
create policy "chat participants can view messages"
  on public.messages for select using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (auth.uid() = l.donor_id or auth.uid() = l.claimed_by)
    )
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "chat participants can send messages"
  on public.messages for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (auth.uid() = l.donor_id or auth.uid() = l.claimed_by)
    )
  );

alter publication supabase_realtime add table public.messages;
