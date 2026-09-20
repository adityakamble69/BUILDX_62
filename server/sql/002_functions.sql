-- 002_functions.sql — Civic Fix
-- Run SECOND (after 001_schema.sql). Mirrors docs/database.md §8.
-- Uses `create or replace`, so it can be re-run safely.

-- ---------------------------------------------------------------------------
-- Nearby duplicate check: same category, still open, within p_radius metres.
-- ---------------------------------------------------------------------------
create or replace function nearby_duplicates(p_lat double precision, p_lng double precision, p_category int, p_radius int default 50)
returns table (id uuid, title text, upvote_count int, distance_m double precision)
language sql stable as $$
  select r.id, r.title, r.upvote_count,
         st_distance(r.location, st_setsrid(st_makepoint(p_lng, p_lat),4326)::geography) as distance_m
  from reports r
  where r.category_id = p_category
    and r.status in ('reported','in_progress')
    and st_dwithin(r.location, st_setsrid(st_makepoint(p_lng, p_lat),4326)::geography, p_radius)
  order by distance_m
  limit 5;
$$;

-- ---------------------------------------------------------------------------
-- Change status atomically: report update + history row + reporter notification.
-- p_admin_id must already exist in profiles (status_history.changed_by is a FK),
-- so the API upserts the admin's profile before calling this.
-- ---------------------------------------------------------------------------
create or replace function change_report_status(
  p_report_id uuid, p_to report_status, p_admin_id text, p_note text default null
) returns void language plpgsql as $$
declare v_from report_status; v_reporter text;
begin
  select status, reporter_id into v_from, v_reporter from reports where id = p_report_id for update;
  if v_from is null then raise exception 'REPORT_NOT_FOUND'; end if;

  update reports
     set status = p_to,
         resolved_at = case when p_to = 'resolved' then now() else null end,
         reject_reason = case when p_to = 'rejected' then p_note else null end
   where id = p_report_id;

  insert into status_history (report_id, from_status, to_status, changed_by, note)
  values (p_report_id, v_from, p_to, p_admin_id, p_note);

  insert into notifications (user_id, report_id, message)
  values (v_reporter, p_report_id, 'Your report is now ' || replace(p_to::text, '_', ' ') || '.');
end; $$;

-- ---------------------------------------------------------------------------
-- Read helpers. supabase-js cannot run raw SQL, so the aggregate/geo queries from
-- database.md are exposed as functions the API calls with .rpc().
-- ---------------------------------------------------------------------------

-- City Health / admin KPIs
create or replace function get_public_stats()
returns table (total bigint, resolved bigint, in_progress bigint, resolved_pct numeric, avg_hours_to_resolve numeric)
language sql stable as $$
  select
    count(*)                                             as total,
    count(*) filter (where status = 'resolved')          as resolved,
    count(*) filter (where status = 'in_progress')       as in_progress,
    round(100.0 * count(*) filter (where status = 'resolved') / nullif(count(*), 0), 1) as resolved_pct,
    round(avg(extract(epoch from (resolved_at - created_at)) / 3600)
          filter (where status = 'resolved')::numeric, 1) as avg_hours_to_resolve
  from reports;
$$;

-- Reports per category
create or replace function get_category_breakdown()
returns table (slug text, name text, total bigint)
language sql stable as $$
  select c.slug, c.name, count(*) as total
  from reports r join categories c on c.id = r.category_id
  group by c.slug, c.name
  order by count(*) desc;
$$;

-- Heatmap points (rejected reports excluded)
create or replace function get_heatmap_points()
returns table (lat double precision, lng double precision, severity smallint)
language sql stable as $$
  select st_y(location::geometry), st_x(location::geometry), severity
  from reports
  where status <> 'rejected';
$$;

-- Lightweight map points, newest first, capped at 1000 (rules.md §16). Optional filters.
create or replace function get_map_points(p_category int default null, p_status report_status default null)
returns table (id uuid, title text, status report_status, category_id int, upvote_count int, lat double precision, lng double precision)
language sql stable as $$
  select r.id, r.title, r.status, r.category_id, r.upvote_count,
         st_y(r.location::geometry), st_x(r.location::geometry)
  from reports r
  where r.status <> 'rejected'
    and (p_category is null or r.category_id = p_category)
    and (p_status is null or r.status = p_status)
  order by r.created_at desc
  limit 1000;
$$;

-- ---------------------------------------------------------------------------
-- Lock the functions down: Supabase exposes public-schema functions over its REST API
-- to anon/authenticated by default. Only the API's service role may call them.
-- ---------------------------------------------------------------------------
revoke execute on function
  nearby_duplicates(double precision, double precision, int, int),
  change_report_status(uuid, report_status, text, text),
  get_public_stats(),
  get_category_breakdown(),
  get_heatmap_points(),
  get_map_points(int, report_status)
from public, anon, authenticated;

grant execute on function
  nearby_duplicates(double precision, double precision, int, int),
  change_report_status(uuid, report_status, text, text),
  get_public_stats(),
  get_category_breakdown(),
  get_heatmap_points(),
  get_map_points(int, report_status)
to service_role;
