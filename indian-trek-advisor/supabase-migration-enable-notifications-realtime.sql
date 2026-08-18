-- Enables realtime delivery so live UI updates work without manual refresh:
--  * notifications  -> the bell (components/notification-bell.tsx)
--  * bookings       -> the trekker dashboard (app/dashboard/bookings/page.tsx)
-- Both also have polling fallbacks, so this is a UX upgrade (instant updates),
-- not a requirement for them to function.
--
-- Apply from Supabase Dashboard: SQL Editor -> New query -> paste -> Run.

begin;

-- Idempotent: add each table only if it is not already a member of the
-- publication (avoids "already a member" errors on re-run).
do $$
declare
  t text;
begin
  foreach t in array array['notifications', 'bookings'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

commit;