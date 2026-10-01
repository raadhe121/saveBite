-- Ratings & reviews: after a pickup completes, the receiver rates the
-- donor's food quality and the donor rates the receiver's reliability.
-- Run after 008_chat_messages.sql.

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  rater_id uuid not null references public.profiles(id) on delete cascade,
  ratee_id uuid not null references public.profiles(id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (listing_id, rater_id)
);

create index ratings_ratee_idx on public.ratings (ratee_id);

alter table public.ratings enable row level security;

-- Public so anyone can see a donor's/receiver's average rating before
-- transacting with them (mirrors the "profiles viewable by everyone" policy).
create policy "ratings are viewable by everyone"
  on public.ratings for select using (true);

-- Only the two parties to a completed pickup can rate each other, and only
-- in the correct direction (donor -> receiver, receiver -> donor).
create policy "pickup participants can rate each other"
  on public.ratings for insert with check (
    auth.uid() = rater_id
    and exists (
      select 1 from public.listings l
      where l.id = listing_id
        and l.status = 'picked_up'
        and (
          (auth.uid() = l.donor_id and ratee_id = l.claimed_by)
          or (auth.uid() = l.claimed_by and ratee_id = l.donor_id)
        )
    )
  );
