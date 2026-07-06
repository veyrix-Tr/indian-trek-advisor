-- ─── TrekAdvisor Database Schema ───────────────────────────
-- Run this in: Supabase Dashboard > SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Profile (extends Supabase Auth users) ─────────────────
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  account_type text not null check (account_type in ('trekker', 'guide')),
  image text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Trekker ────────────────────────────────────────────────
create table public.trekkers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique not null,
  saved_treks text[] default '{}',
  review_count int default 0
);

-- ─── Guide ──────────────────────────────────────────────────
create table public.guides (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique not null,
  experience text,
  phone text,
  base_location text,
  certifications text[] default '{}',
  known_treks text[] default '{}',
  id_proof_url text,
  cert_doc_url text,
  profile_photo_url text,
  verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Auto-create profile on signup ──────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, account_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'account_type', 'trekker')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Auto-create trekker/guide on profile creation ──────────
create or replace function public.handle_new_profile()
returns trigger as $$
begin
  if new.account_type = 'trekker' then
    insert into public.trekkers (user_id) values (new.id);
  elsif new.account_type = 'guide' then
    insert into public.guides (user_id) values (new.id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute function public.handle_new_profile();

-- ─── Row Level Security ─────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.trekkers enable row level security;
alter table public.guides enable row level security;

-- Profiles: users can read all, update own
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Trekkers: users can read all, update own
create policy "Trekkers viewable by everyone"
  on public.trekkers for select using (true);

create policy "Users can update own trekker"
  on public.trekkers for update using (auth.uid() = user_id);

-- Guides: users can read all, update own
create policy "Guides viewable by everyone"
  on public.guides for select using (true);

create policy "Users can update own guide"
  on public.guides for update using (auth.uid() = user_id);
