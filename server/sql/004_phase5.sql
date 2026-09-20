-- 004_phase5.sql — Civic Fix
-- Run FOURTH (after 001/002/003). Mirrors docs/database.md §8 (Phase 5 additions).
-- Uses `create or replace` / `create or replace view`, so it can be re-run safely.

-- ---------------------------------------------------------------------------
-- reports_with_coords: reports plus lat/lng extracted from the geography column.
-- PostgREST/supabase-js can select ordinary columns and embedded relations from
-- a view exactly like a table, but cannot compute st_y/st_x inline — hence the view
-- instead of a bare `select('lat, lng')` on `reports` (architecture.md D14 follow-up).
-- security_invoker mirrors the base table's RLS instead of running as the view owner.
-- ---------------------------------------------------------------------------
create or replace view reports_with_coords
with (security_invoker = true) as
select
  r.*,
  st_y(r.location::geometry) as lat,
  st_x(r.location::geometry) as lng
from reports r;

revoke all on reports_with_coords from public, anon, authenticated;
grant select on reports_with_coords to service_role;

-- ---------------------------------------------------------------------------
-- Lazy profile upsert (rules.md §8: a profiles row is created on first
-- authenticated write). display_name/avatar_url come from Clerk and may change
-- between calls, so this always refreshes them rather than only inserting once.
-- ---------------------------------------------------------------------------
create or replace function upsert_profile(p_id text, p_display_name text, p_avatar_url text default null)
returns void language sql as $$
  insert into profiles (id, display_name, avatar_url)
  values (p_id, p_display_name, p_avatar_url)
  on conflict (id) do update
    set display_name = excluded.display_name,
        avatar_url = excluded.avatar_url;
$$;

-- ---------------------------------------------------------------------------
-- Create a report atomically: the report row, its `before` images, and the
-- initial null -> reported status_history row all succeed or all fail together
-- (rules.md §6: multi-table writes go through a transaction or a DB function).
-- p_reporter_id must already exist in profiles — the API calls upsert_profile first.
-- ---------------------------------------------------------------------------
create or replace function create_report(
  p_reporter_id text,
  p_category_id int,
  p_title text,
  p_description text,
  p_severity smallint,
  p_lat double precision,
  p_lng double precision,
  p_area_name text,
  p_image_paths text[],
  p_ai_category_id int default null,
  p_ai_severity smallint default null
) returns uuid language plpgsql as $$
declare v_report_id uuid; v_path text;
begin
  insert into reports (
    reporter_id, category_id, title, description, severity,
    location, area_name, ai_category_id, ai_severity
  ) values (
    p_reporter_id, p_category_id, p_title, p_description, p_severity,
    st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography, p_area_name,
    p_ai_category_id, p_ai_severity
  ) returning id into v_report_id;

  foreach v_path in array p_image_paths loop
    insert into report_images (report_id, storage_path, kind, uploaded_by)
    values (v_report_id, v_path, 'before', p_reporter_id);
  end loop;

  insert into status_history (report_id, from_status, to_status, changed_by)
  values (v_report_id, null, 'reported', p_reporter_id);

  return v_report_id;
end; $$;

-- ---------------------------------------------------------------------------
-- Toggle upvote: insert if absent, delete if present. The upvotes_sync trigger
-- (001_schema.sql) keeps reports.upvote_count in step either way.
-- Returns true if the report is now upvoted by this user, false if removed.
-- ---------------------------------------------------------------------------
create or replace function toggle_upvote(p_report_id uuid, p_user_id text)
returns boolean language plpgsql as $$
declare v_existed boolean;
begin
  select true into v_existed from upvotes where report_id = p_report_id and user_id = p_user_id;

  if v_existed then
    delete from upvotes where report_id = p_report_id and user_id = p_user_id;
    return false;
  else
    insert into upvotes (report_id, user_id) values (p_report_id, p_user_id);
    return true;
  end if;
end; $$;

revoke execute on function
  upsert_profile(text, text, text),
  create_report(text, int, text, text, smallint, double precision, double precision, text, text[], int, smallint),
  toggle_upvote(uuid, text)
from public, anon, authenticated;

grant execute on function
  upsert_profile(text, text, text),
  create_report(text, int, text, text, smallint, double precision, double precision, text, text[], int, smallint),
  toggle_upvote(uuid, text)
to service_role;
