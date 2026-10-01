-- Browser push notifications: new listings within a receiver's radius, and
-- claims on a donor's listing. Run after 006_receiver_cancel_claim.sql.

alter table public.profiles
  add column if not exists notify_radius_miles double precision not null default 10,
  add column if not exists notify_new_listings boolean not null default true,
  add column if not exists notify_claims boolean not null default true;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "users manage their own push subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
