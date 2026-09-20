-- 005_phase7.sql — Civic Fix
-- Run FIFTH (after 001-004). Mirrors docs/database.md §8 (Phase 7 additions).
-- Uses `create or replace`, so it can be re-run safely.

-- ---------------------------------------------------------------------------
-- Admin reports table: every column the table/filters need, plus reporter name
-- (architecture.md "GET /admin/reports — full table with filters"). Separate from
-- `reports_with_coords`'s citizen-facing select because the admin table also needs
-- `reporter_id`/reporter name and every status (citizen list never needs the reporter's
-- identity beyond their own "My Reports").
-- ---------------------------------------------------------------------------
create or replace view admin_reports_view
with (security_invoker = true) as
select
  r.*,
  st_y(r.location::geometry) as lat,
  st_x(r.location::geometry) as lng
from reports r;

revoke all on admin_reports_view from public, anon, authenticated;
grant select on admin_reports_view to service_role;

-- ---------------------------------------------------------------------------
-- Assign a report to a department. Kept separate from change_report_status: assigning
-- is not itself a status transition, has no note/notification, and an admin may assign
-- before or independently of changing status (PRD §"Admin journey": assign, then set
-- In progress as two clicks).
-- ---------------------------------------------------------------------------
create or replace function assign_report_department(p_report_id uuid, p_department_id int)
returns void language plpgsql as $$
begin
  update reports set department_id = p_department_id where id = p_report_id;
  if not found then raise exception 'REPORT_NOT_FOUND'; end if;
end; $$;

-- ---------------------------------------------------------------------------
-- Attach the admin's "after" photo. A plain insert would work too, but reports.status
-- doesn't require 'resolved' to attach one (an admin may upload proof mid-fix), so this
-- stays a thin function rather than folding into change_report_status, which fires a
-- reporter-facing notification that a same-time photo upload shouldn't duplicate.
-- ---------------------------------------------------------------------------
create or replace function add_resolution_image(p_report_id uuid, p_storage_path text, p_admin_id text)
returns uuid language plpgsql as $$
declare v_image_id uuid;
begin
  insert into report_images (report_id, storage_path, kind, uploaded_by)
  values (p_report_id, p_storage_path, 'after', p_admin_id)
  returning id into v_image_id;
  return v_image_id;
end; $$;

-- ---------------------------------------------------------------------------
-- Admin delete: report + everything hanging off it (report_images, upvotes, comments,
-- status_history, notifications all have `on delete cascade` to reports, 001_schema.sql).
-- ---------------------------------------------------------------------------
create or replace function delete_report(p_report_id uuid)
returns void language plpgsql as $$
begin
  delete from reports where id = p_report_id;
  if not found then raise exception 'REPORT_NOT_FOUND'; end if;
end; $$;

-- ---------------------------------------------------------------------------
-- Admin delete of *any* comment (citizen delete-own stays in commentService as a plain
-- `.delete()`, Phase 5 / architecture D18 — this is only for the admin-only route).
-- ---------------------------------------------------------------------------
create or replace function admin_delete_comment(p_comment_id uuid)
returns void language plpgsql as $$
begin
  delete from comments where id = p_comment_id;
  if not found then raise exception 'COMMENT_NOT_FOUND'; end if;
end; $$;

-- ---------------------------------------------------------------------------
-- Admin dashboard KPIs beyond get_public_stats(): counts by status the KPI cards need
-- individually (Reported/pending vs the public page's coarser total/resolved/in_progress).
-- ---------------------------------------------------------------------------
create or replace function get_admin_stats()
returns table (
  total bigint, reported bigint, in_progress bigint, resolved bigint, rejected bigint,
  resolved_pct numeric, avg_hours_to_resolve numeric
)
language sql stable as $$
  select
    count(*)                                       as total,
    count(*) filter (where status = 'reported')    as reported,
    count(*) filter (where status = 'in_progress') as in_progress,
    count(*) filter (where status = 'resolved')    as resolved,
    count(*) filter (where status = 'rejected')    as rejected,
    round(100.0 * count(*) filter (where status = 'resolved') / nullif(count(*), 0), 1) as resolved_pct,
    round(avg(extract(epoch from (resolved_at - created_at)) / 3600)
          filter (where status = 'resolved')::numeric, 1) as avg_hours_to_resolve
  from reports;
$$;

-- Reports over time, bucketed by day, split reported/in_progress/resolved counts
-- (design.md §10's Reports Trend chart / the admin dashboard trend line).
create or replace function get_reports_trend(p_days int default 7)
returns table (day date, reported bigint, in_progress bigint, resolved bigint)
language sql stable as $$
  select
    d::date as day,
    count(*) filter (where r.status = 'reported' and r.created_at::date = d)                        as reported,
    count(*) filter (where r.status = 'in_progress' and r.created_at::date = d)                      as in_progress,
    count(*) filter (where r.status = 'resolved' and r.resolved_at::date = d)                        as resolved
  from generate_series(current_date - (p_days - 1), current_date, interval '1 day') d
  left join reports r on r.created_at::date = d or r.resolved_at::date = d
  group by d
  order by d;
$$;

-- Reports per department, for the dashboard's department-wise donut.
create or replace function get_department_breakdown()
returns table (department_id int, name text, total bigint)
language sql stable as $$
  select dep.id, dep.name, count(r.id) as total
  from departments dep
  left join reports r on r.department_id = dep.id
  group by dep.id, dep.name
  order by count(r.id) desc;
$$;

revoke execute on function
  assign_report_department(uuid, int),
  add_resolution_image(uuid, text, text),
  delete_report(uuid),
  admin_delete_comment(uuid),
  get_admin_stats(),
  get_reports_trend(int),
  get_department_breakdown()
from public, anon, authenticated;

grant execute on function
  assign_report_department(uuid, int),
  add_resolution_image(uuid, text, text),
  delete_report(uuid),
  admin_delete_comment(uuid),
  get_admin_stats(),
  get_reports_trend(int),
  get_department_breakdown()
to service_role;
