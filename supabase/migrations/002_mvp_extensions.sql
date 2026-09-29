-- MVP extensions: profile details, donor business info, listing dietary tags,
-- pickup windows, and storage buckets for photos.
-- Safe to run after supabase/schema.sql. Run in the Supabase SQL editor.

-- ---------- Profiles: contact/business details ----------
alter table public.profiles
  add column if not exists photo_url text,
  add column if not exists business_type text,
  add column if not exists operating_hours text;

-- ---------- Listings: dietary tags, unit, pickup window, instructions ----------
create type public.dietary_tag as enum ('vegetarian', 'vegan', 'halal', 'gluten_free', 'contains_nuts');

-- 'beverages' was added to food_category after the base schema; add it if missing
-- (no-op if you applied the updated schema.sql that already includes it).
alter type public.food_category add value if not exists 'beverages';

alter table public.listings
  add column if not exists unit text not null default 'items',
  add column if not exists dietary_tags public.dietary_tag[] not null default '{}',
  add column if not exists pickup_start timestamptz,
  add column if not exists pickup_end timestamptz,
  add column if not exists special_instructions text;

-- Backfill pickup_start for any existing rows so it can be made required going forward.
update public.listings set pickup_start = available_from where pickup_start is null;

-- ---------- Storage buckets ----------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

-- Public read for both buckets (photos are shown on public listings/profiles).
create policy "avatar images are publicly accessible"
  on storage.objects for select using (bucket_id = 'avatars');

create policy "listing photos are publicly accessible"
  on storage.objects for select using (bucket_id = 'listing-photos');

-- Authenticated users can upload/update/delete only their own folder (<uid>/...).
create policy "users can upload their own avatar"
  on storage.objects for insert with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can update their own avatar"
  on storage.objects for update using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can delete their own avatar"
  on storage.objects for delete using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "donors can upload their own listing photos"
  on storage.objects for insert with check (
    bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "donors can update their own listing photos"
  on storage.objects for update using (
    bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "donors can delete their own listing photos"
  on storage.objects for delete using (
    bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );
