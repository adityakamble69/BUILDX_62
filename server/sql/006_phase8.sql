-- 006_phase8.sql — Civic Fix
-- Run SIXTH (after 001-005). Mirrors docs/database.md §8 (Phase 8 additions).
-- Uses `create or replace`, so it can be re-run safely.

-- ---------------------------------------------------------------------------
-- Top upvoted open issues, for the public City Health page (PRD FR16: "top upvoted
-- open issues"). "Open" = not yet resolved or rejected, same definition `nearby_duplicates`
-- already uses. Kept separate from `get_public_stats()` (a single-row aggregate) since this
-- returns multiple rows and the two are fetched in parallel by `statsService.getPublicStats`.
-- ---------------------------------------------------------------------------
create or replace function get_top_open_reports(p_limit int default 5)
returns table (
  id uuid,
  title text,
  status report_status,
  severity smallint,
  upvote_count int,
  area_name text,
  created_at timestamptz,
  category_slug text,
  category_name text
)
language sql stable as $$
  select r.id, r.title, r.status, r.severity, r.upvote_count, r.area_name, r.created_at,
         c.slug, c.name
  from reports r
  join categories c on c.id = r.category_id
  where r.status in ('reported', 'in_progress')
  order by r.upvote_count desc, r.created_at desc
  limit p_limit;
$$;

revoke execute on function get_top_open_reports(int) from public, anon, authenticated;
grant execute on function get_top_open_reports(int) to service_role;
