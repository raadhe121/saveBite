-- SaveBite database schema for Supabase (Postgres + RLS + Realtime)
-- Run this in the Supabase SQL editor (or `supabase db push` with the CLI).

-- ---------- Enums ----------
create type public.user_role as enum ('donor', 'receiver', 'volunteer', 'admin');
create type public.listing_status as enum ('available', 'claimed', 'picked_up', 'expired', 'cancelled');
create type public.food_category as enum ('bakery', 'produce', 'dairy', 'cooked_meals', 'packaged', 'beverages', 'other');
create type public.verification_status as enum ('unverified', 'pending', 'verified', 'rejected');

-- ---------- Profiles ----------
-- One row per auth user. Created automatically on signup via trigger below.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'receiver',
  org_name text,
  full_name text,
  phone text,
  address text,
  lat double precision,
  lng double precision,
  verification_status public.verification_status not null default 'unverified',
  created_at timestamptz not null default now()
);

-- ---------- Listings ----------
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  category public.food_category not null default 'other',
  quantity text not null,
  photo_url text,
  lat double precision not null,
  lng double precision not null,
  address text not null,
  available_from timestamptz not null default now(),
  expires_at timestamptz not null,
  status public.listing_status not null default 'available',
  claimed_by uuid references public.profiles(id) on delete set null,
  claimed_at timestamptz,
  picked_up_at timestamptz,
  created_at timestamptz not null default now()
);

create index listings_status_idx on public.listings (status);
create index listings_donor_idx on public.listings (donor_id);
create index listings_expires_idx on public.listings (expires_at);

-- ---------- Claims (audit trail; also mirrored onto listings for quick reads) ----------
create table public.claims (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  volunteer_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (listing_id)
);

-- ---------- Reports (moderation) ----------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete cascade,
  reported_by uuid references public.profiles(id) on delete set null,
  reason text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Auto-create profile row on signup ----------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, org_name, full_name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'receiver'),
    new.raw_user_meta_data->>'org_name',
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.claims enable row level security;
alter table public.reports enable row level security;

-- profiles: everyone can read (needed to show donor/receiver names on listings & map),
-- but only the owner can update their own row. Admins can update any.
create policy "profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "admins can update any profile"
  on public.profiles for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- listings: visible to everyone (public map); only the donor can insert/update/delete their own;
-- admins can moderate (update/delete) any listing.
create policy "listings are viewable by everyone"
  on public.listings for select using (true);

create policy "donors can insert their own listings"
  on public.listings for insert with check (
    auth.uid() = donor_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('donor', 'admin'))
  );

create policy "donors can update their own listings"
  on public.listings for update using (auth.uid() = donor_id);

create policy "donors can delete their own listings"
  on public.listings for delete using (auth.uid() = donor_id);

create policy "admins can manage any listing"
  on public.listings for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- claims: receivers can see their own claims; donors can see claims on their listings.
create policy "claims viewable by involved parties"
  on public.claims for select using (
    auth.uid() = receiver_id
    or exists (select 1 from public.listings l where l.id = listing_id and l.donor_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "receivers can claim available listings"
  on public.claims for insert with check (
    auth.uid() = receiver_id
    and exists (
      select 1 from public.listings l
      where l.id = listing_id and l.status = 'available'
    )
  );

-- reports: reporter and admins only.
create policy "reports viewable by reporter or admin"
  on public.reports for select using (
    auth.uid() = reported_by
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "anyone authenticated can file a report"
  on public.reports for insert with check (auth.uid() is not null);

create policy "admins can resolve reports"
  on public.reports for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ---------- Atomic claim RPC ----------
-- Claiming must be atomic: two receivers racing on the same listing must not
-- both succeed. This function locks the row, checks status, and does the
-- update + claims insert in one transaction. Call via supabase.rpc('claim_listing', ...).
create function public.claim_listing(p_listing_id uuid)
returns public.listings
language plpgsql
security definer set search_path = public
as $$
declare
  v_listing public.listings;
begin
  select * into v_listing from public.listings where id = p_listing_id for update;

  if not found then
    raise exception 'Listing not found';
  end if;

  if v_listing.status <> 'available' then
    raise exception 'Listing is no longer available';
  end if;

  update public.listings
    set status = 'claimed', claimed_by = auth.uid(), claimed_at = now()
    where id = p_listing_id
    returning * into v_listing;

  insert into public.claims (listing_id, receiver_id) values (p_listing_id, auth.uid());

  return v_listing;
end;
$$;

grant execute on function public.claim_listing(uuid) to authenticated;

-- ---------- Realtime ----------
alter publication supabase_realtime add table public.listings;
alter publication supabase_realtime add table public.claims;
