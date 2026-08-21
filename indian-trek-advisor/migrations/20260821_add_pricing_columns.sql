-- Pricing system migration: add breakdown columns to bookings table.
-- Run this in: Supabase Dashboard > SQL Editor

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS guide_required boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS trek_assist_required boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS guide_fee decimal DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trek_assist_fee decimal DEFAULT 0;
