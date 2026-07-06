-- ─── Migration for New Tables Only (profiles, trekkers, guides already exist) ───────────────────────────
-- Run this in: Supabase Dashboard > SQL Editor
-- This adds only the booking system tables and RLS policies

-- ─── Bookings ───────────────────────────────────────────────
create table if not exists public.bookings (
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
create table if not exists public.guide_availability (
  id uuid default uuid_generate_v4() primary key,
  guide_id uuid references public.guides(id) on delete cascade not null,
  date date not null,
  status text default 'available' check (status in ('available', 'booked', 'unavailable')),
  booking_id uuid references public.bookings(id) on delete set null,
  unique(guide_id, date)
);

-- ─── Guide Ratings ──────────────────────────────────────────
create table if not exists public.guide_ratings (
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
create table if not exists public.guide_trek_associations (
  id uuid default uuid_generate_v4() primary key,
  guide_id uuid references public.guides(id) on delete cascade not null,
  trek_id text not null,
  base_rate decimal not null,
  created_at timestamptz default now(),
  unique(guide_id, trek_id)
);

-- ─── Enable RLS on new tables ───────────────────────────────
alter table if exists public.bookings enable row level security;
alter table if exists public.guide_availability enable row level security;
alter table if exists public.guide_ratings enable row level security;
alter table if exists public.guide_trek_associations enable row level security;

-- ─── Bookings RLS ──────────────────────────────────────────
drop policy if exists "Users can view own bookings" on public.bookings;
create policy "Users can view own bookings"
  on public.bookings for select using (auth.uid() = trekker_id or auth.uid() = guide_id);

drop policy if exists "Guides can update own bookings" on public.bookings;
create policy "Guides can update own bookings"
  on public.bookings for update using (auth.uid() = guide_id);

drop policy if exists "Trekkers can create bookings" on public.bookings;
create policy "Trekkers can create bookings"
  on public.bookings for insert with check (auth.uid() = trekker_id);

drop policy if exists "Admins can view all bookings" on public.bookings;
create policy "Admins can view all bookings"
  on public.bookings for select using (
    exists (select 1 from public.profiles where id = auth.uid() and account_type = 'admin')
  );

drop policy if exists "Admins can update all bookings" on public.bookings;
create policy "Admins can update all bookings"
  on public.bookings for update using (
    exists (select 1 from public.profiles where id = auth.uid() and account_type = 'admin')
  );

-- ─── Guide Availability RLS ─────────────────────────────────
drop policy if exists "Guides can manage own availability" on public.guide_availability;
create policy "Guides can manage own availability"
  on public.guide_availability for all using (auth.uid() = guide_id);

drop policy if exists "Public can view guide availability" on public.guide_availability;
create policy "Public can view guide availability"
  on public.guide_availability for select using (true);

-- ─── Guide Ratings RLS ─────────────────────────────────────
drop policy if exists "Users can view all ratings" on public.guide_ratings;
create policy "Users can view all ratings"
  on public.guide_ratings for select using (true);

drop policy if exists "Trekkers can create own ratings" on public.guide_ratings;
create policy "Trekkers can create own ratings"
  on public.guide_ratings for insert with check (auth.uid() = trekker_id);

drop policy if exists "Users can update own ratings" on public.guide_ratings;
create policy "Users can update own ratings"
  on public.guide_ratings for update using (auth.uid() = trekker_id);

-- ─── Guide Trek Associations RLS ─────────────────────────────
drop policy if exists "Guides can manage own associations" on public.guide_trek_associations;
create policy "Guides can manage own associations"
  on public.guide_trek_associations for all using (auth.uid() = guide_id);

drop policy if exists "Public can view guide associations" on public.guide_trek_associations;
create policy "Public can view guide associations"
  on public.guide_trek_associations for select using (true);
