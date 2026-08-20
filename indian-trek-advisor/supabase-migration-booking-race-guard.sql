-- ─── Booking race guard: no overlapping confirmed bookings per guide ──────
-- Run this in: Supabase Dashboard > SQL Editor
-- Idempotent. Closes the double-booking race where two trekkers final-verify
-- simultaneously for the same guide + date span and BOTH end up confirmed.
--
-- A Postgres exclusion constraint (btree_gist) makes it impossible for two
-- confirmed bookings of one guide to overlap on their date spans. When a race
-- happens, one final verification succeeds and the other fails with SQLSTATE
-- 23P01 (exclusion_violation), which `app/api/bookings/[id]/user-verify` maps
-- to a clean 409 "date just got booked" response.

create extension if not exists btree_gist;

alter table public.bookings
  drop constraint if exists bookings_confirmed_no_overlap;

alter table public.bookings
  add constraint bookings_confirmed_no_overlap
  exclude using gist (
    guide_id with =,
    daterange(booking_date, booking_date + (trek_days - 1), '[]') with &&
  )
  where (status = 'confirmed');