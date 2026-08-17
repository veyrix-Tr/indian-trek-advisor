-- ─── Booking Overhaul — schema hardening ─────────────────────────
-- Run this in: Supabase Dashboard > SQL Editor
-- Idempotent. Adds booking pricing/detail fields + an audit-history table,
-- and fixes the guide-side RLS policies that never matched (they compared
-- auth.uid() = guide_id, but bookings.guide_id references guides.id, a
-- generated UUID — NOT the auth user id).

-- ─── Bookings: new detail / pricing columns ──────────────────────
alter table public.bookings
  add column if not exists notes text,
  add column if not exists num_trekkers int not null default 1,
  add column if not exists trek_days int not null default 1,
  add column if not exists base_rate decimal not null default 0,
  add column if not exists total_amount decimal not null default 0,
  add column if not exists cancelled_by uuid references public.profiles(id) on delete set null,
  add column if not exists cancelled_by_role text;

-- ─── Booking status history (audit trail) ────────────────────────
create table if not exists public.booking_status_history (
  id uuid default uuid_generate_v4() primary key,
  booking_id uuid references public.bookings(id) on delete cascade not null,
  from_status text not null,
  to_status text not null,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role text,
  note text,
  created_at timestamptz default now()
);

create index if not exists booking_status_history_booking_idx
  on public.booking_status_history (booking_id, created_at);

alter table if exists public.booking_status_history enable row level security;

-- History is readable by the trekker, the guide, or an admin.
drop policy if exists "Parties can view booking history" on public.booking_status_history;
create policy "Parties can view booking history"
  on public.booking_status_history for select using (
    booking_id in (
      select b.id from public.bookings b
      where b.trekker_id = auth.uid()
         or b.guide_id in (select g.id from public.guides g where g.user_id = auth.uid())
         or exists (select 1 from public.profiles p where p.id = auth.uid() and p.account_type = 'admin')
    )
  );

drop policy if exists "Service writes booking history" on public.booking_status_history;
create policy "Service writes booking history"
  on public.booking_status_history for insert with check (true);

-- ─── Fix guide-side RLS (use guides.user_id = auth.uid()) ─────────
-- These previously used auth.uid() = guide_id which never matched because
-- guide_id is the generated guides.id UUID, not the auth user id.

drop policy if exists "Guides can update own bookings" on public.bookings;
create policy "Guides can update own bookings"
  on public.bookings for update using (
    guide_id in (select id from public.guides where user_id = auth.uid())
  );

drop policy if exists "Guides can manage own availability" on public.guide_availability;
create policy "Guides can manage own availability"
  on public.guide_availability for all using (
    guide_id in (select id from public.guides where user_id = auth.uid())
  );

drop policy if exists "Guides can manage own associations" on public.guide_trek_associations;
create policy "Guides can manage own associations"
  on public.guide_trek_associations for all using (
    guide_id in (select id from public.guides where user_id = auth.uid())
  );