-- ─── App Error Log ──────────────────────────────────────────────
-- Run this in: Supabase Dashboard > SQL Editor
-- Server-side error logging for API routes (see lib/error-log.ts).
-- Service-role client (bypasses RLS) is the only writer; RLS is enabled with no
-- policies so neither anon nor authenticated users can read or write these.

create table public.app_error_logs (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now(),
  level text not null default 'error',
  source text not null,
  route text,
  method text,
  message text,
  stack text,
  context jsonb
);

create index app_error_logs_created_idx on public.app_error_logs (created_at desc);

alter table public.app_error_logs enable row level security;

-- No grant/select policies are created on purpose: only the service-role key
-- (which bypasses RLS) may write and read these. Everyone else is denied.