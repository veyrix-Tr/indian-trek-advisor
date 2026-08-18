-- Enables realtime delivery for the notifications table so the bell can
-- update live (no manual refresh) when a new notification arrives.
--
-- Apply from Supabase Dashboard: SQL Editor -> New query -> paste -> Run.
--   alter publication supabase_realtime add table public.notifications;

begin;

-- idempotent: add only if not already a member
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

commit;
