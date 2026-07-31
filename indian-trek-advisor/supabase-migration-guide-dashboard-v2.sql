-- ─── Guide Dashboard v2 — schema additions ───────────────────────────
-- Run this in: Supabase Dashboard > SQL Editor
-- Adds: guide_payout_details, notifications, bookings response-time columns.
-- Drops: guides.available_dates (dead column, superseded by guide_availability).
--
-- Note on RLS: existing policies on bookings/guide_availability/guide_trek_associations
-- compare auth.uid() = guide_id, but guide_id references guides.id (a separate
-- generated UUID, not the auth user's id — see app/api/auth/signup/route.ts).
-- Those policies never actually match and are not touched here (out of scope,
-- and harmless today since all API routes use the service-role key and bypass
-- RLS). The new tables below use a correct guides.user_id = auth.uid() subquery
-- instead, so this bug isn't propagated forward.

-- ─── Payout Details ───────────────────────────────────────────
create table if not exists public.guide_payout_details (
  id uuid default uuid_generate_v4() primary key,
  guide_id uuid references public.guides(id) on delete cascade unique not null,
  method text not null check (method in ('upi', 'bank_transfer')),
  upi_id text,
  bank_account_number text,
  bank_ifsc text,
  bank_account_name text,
  updated_at timestamptz default now()
);

alter table if exists public.guide_payout_details enable row level security;

drop policy if exists "Guides can manage own payout details" on public.guide_payout_details;
create policy "Guides can manage own payout details"
  on public.guide_payout_details for all using (
    guide_id in (select id from public.guides where user_id = auth.uid())
  );

-- ─── In-app Notifications ─────────────────────────────────────
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('booking_request', 'booking_status_change', 'review_received', 'verification_update')),
  booking_id uuid references public.bookings(id) on delete cascade,
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

create index if not exists notifications_user_read_idx on public.notifications (user_id, read);

alter table if exists public.notifications enable row level security;

drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications for select using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update using (auth.uid() = user_id);

-- ─── Booking response-time / accountability tracking ──────────
alter table public.bookings
  add column if not exists guide_responded_at timestamptz,
  add column if not exists rejection_reason text;

-- ─── Dead column cleanup ───────────────────────────────────────
-- guide_availability already tracks per-date availability; this array
-- column is not read or written anywhere in the app.
alter table public.guides drop column if exists available_dates;
