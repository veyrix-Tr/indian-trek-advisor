-- ─── Guide rating columns + baseline ───────────────────────────
-- Run this in: Supabase Dashboard > SQL Editor
--
-- CRITICAL: guides.rating and guides.total_ratings do not exist in the live
-- database at all, despite being defined in supabase-schema.sql — schema
-- drift, the ALTER for these two columns was apparently never actually run.
-- Every write/read of a guide's rating this session has been silently
-- failing against the real DB until this runs. This adds them with the new
-- 4.1 baseline default (see lib/guide-rating.ts for why 4.1, not 4.5).

alter table public.guides
  add column if not exists rating decimal default 4.1,
  add column if not exists total_ratings int default 5;

-- Backfill any existing guide rows (created before these columns existed)
-- that have no real reviews yet.
update public.guides
set rating = 4.1, total_ratings = 5
where rating is null
  and not exists (
    select 1 from public.guide_ratings where guide_ratings.guide_id = guides.id
  );
