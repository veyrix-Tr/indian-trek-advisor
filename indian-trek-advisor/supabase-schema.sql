-- ─── TrekAdvisor Database Schema ───────────────────────────
-- Run this in: Supabase Dashboard > SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Profile (extends Supabase Auth users) ─────────────────
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  account_type text not null check (account_type in ('trekker', 'guide', 'admin')),
  image text,
  city text,
  phone text,
  bio text,
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
  rating decimal default 4.5,
  total_ratings int default 5,
  available_dates date[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Bookings ───────────────────────────────────────────────
create table public.bookings (
  id uuid default uuid_generate_v4() primary key,
  trek_id text not null,
  trekker_id uuid references public.profiles(id) on delete cascade not null,
  guide_id uuid references public.guides(id) on delete cascade not null,
  booking_date date not null,
  status text not null check (status in ('pending', 'guide_approved', 'admin_approved', 'confirmed', 'completed', 'cancelled')),
  payment_status text default 'pending' check (payment_status in ('pending', 'paid')),
  payment_amount decimal,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  trek_completion_date date
);

-- ─── Guide Availability ─────────────────────────────────────
create table public.guide_availability (
  id uuid default uuid_generate_v4() primary key,
  guide_id uuid references public.guides(id) on delete cascade not null,
  date date not null,
  status text default 'available' check (status in ('available', 'booked', 'unavailable')),
  booking_id uuid references public.bookings(id) on delete set null,
  unique(guide_id, date)
);

-- ─── Guide Ratings ──────────────────────────────────────────
create table public.guide_ratings (
  id uuid default uuid_generate_v4() primary key,
  guide_id uuid references public.guides(id) on delete cascade not null,
  trekker_id uuid references public.profiles(id) on delete cascade not null,
  booking_id uuid references public.bookings(id) on delete cascade not null,
  rating int not null check (rating >= 1 and rating <= 5),
  review text,
  created_at timestamptz default now(),
  unique(booking_id)
);

-- ─── Guide Trek Associations ─────────────────────────────────
create table public.guide_trek_associations (
  id uuid default uuid_generate_v4() primary key,
  guide_id uuid references public.guides(id) on delete cascade not null,
  trek_id text not null,
  base_rate decimal not null,
  created_at timestamptz default now(),
  unique(guide_id, trek_id)
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

create policy "Admins can update any guide"
  on public.guides for update using (
    exists (select 1 from public.profiles where id = auth.uid() and account_type = 'admin')
  );

-- Enable RLS on new tables
alter table public.bookings enable row level security;
alter table public.guide_availability enable row level security;
alter table public.guide_ratings enable row level security;
alter table public.guide_trek_associations enable row level security;

-- Bookings RLS
create policy "Users can view own bookings"
  on public.bookings for select using (auth.uid() = trekker_id or auth.uid() = guide_id);

create policy "Guides can update own bookings"
  on public.bookings for update using (auth.uid() = guide_id);

create policy "Trekkers can create bookings"
  on public.bookings for insert with check (auth.uid() = trekker_id);

create policy "Admins can view all bookings"
  on public.bookings for select using (
    exists (select 1 from public.profiles where id = auth.uid() and account_type = 'admin')
  );

create policy "Admins can update all bookings"
  on public.bookings for update using (
    exists (select 1 from public.profiles where id = auth.uid() and account_type = 'admin')
  );

-- Guide Availability RLS
create policy "Guides can manage own availability"
  on public.guide_availability for all using (auth.uid() = guide_id);

create policy "Public can view guide availability"
  on public.guide_availability for select using (true);

-- Guide Ratings RLS
create policy "Users can view all ratings"
  on public.guide_ratings for select using (true);

create policy "Trekkers can create own ratings"
  on public.guide_ratings for insert with check (auth.uid() = trekker_id);

create policy "Users can update own ratings"
  on public.guide_ratings for update using (auth.uid() = trekker_id);

-- Guide Trek Associations RLS
create policy "Guides can manage own associations"
  on public.guide_trek_associations for all using (auth.uid() = guide_id);

create policy "Public can view guide associations"
  on public.guide_trek_associations for select using (true);
