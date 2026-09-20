-- sanity_checks.sql — Civic Fix
-- Run in the Supabase SQL editor AFTER 001, 002, 003 (and the image upload) to confirm Phase 2 is healthy.
-- Expected values apply to the untouched seed; they change once real reports exist.
-- Blocks 7 and 8 use begin/rollback, so they leave no data behind.
-- The editor only shows the LAST result of a run, so run one numbered block at a time (select it, then Run).

-- 1. Row counts. Expect: reports 80 | images 126 | history 151 | comments 26 | notifications 14 | categories 6 | departments 5
select
  (select count(*) from reports)        as reports,
  (select count(*) from report_images)  as images,
  (select count(*) from status_history) as history,
  (select count(*) from comments)       as comments,
  (select count(*) from notifications)  as notifications,
  (select count(*) from categories)     as categories,
  (select count(*) from departments)    as departments;

-- 2. Status mix. Expect: reported 33 | in_progress 20 | resolved 24 | rejected 3
select status, count(*) from reports group by status order by count(*) desc;

-- 3. City Health numbers. Expect: total 80 | resolved 24 | in_progress 20 | resolved_pct 30.0 | avg_hours_to_resolve about 115.4
select * from get_public_stats();

-- 4. Category breakdown. Expect: pothole 22 | garbage 20 | streetlight 14 | water_leak 11 | drainage 7 | other 6
select * from get_category_breakdown();

-- 5. Duplicate check about 5 m from an open seeded pothole report. Expect: one row, id 9b3d6191-d1c3-5850-ae3d-5a7e8b7431bc, distance_m about 5
select * from nearby_duplicates(21.124811, 79.057730, (select id from categories where slug = 'pothole'));

-- 6. Map and heatmap points (rejected reports excluded). Expect: 77 and 77; the filtered call returns only in_progress rows (20)
select count(*) as heatmap_points from get_heatmap_points();
select count(*) as map_points     from get_map_points();
select count(*) as in_progress_points from get_map_points(null, 'in_progress');

-- 7. Atomic status change: report + history + notification move together. Rolled back afterwards.
begin;
select change_report_status('22b50f95-bbc3-5ffd-90e8-49d04b4e8f7d', 'in_progress', 'user_seed_admin', 'Sanity check');
select status from reports where id = '22b50f95-bbc3-5ffd-90e8-49d04b4e8f7d';                                   -- in_progress
select from_status, to_status, note from status_history order by id desc limit 1;              -- reported | in_progress | Sanity check
select message from notifications order by created_at desc limit 1;                             -- Your report is now in progress.
rollback;

-- 8. Upvote trigger keeps upvote_count in sync. Rolled back afterwards. Expect: count goes up by exactly 1
begin;
select upvote_count as before from reports where id = '22b50f95-bbc3-5ffd-90e8-49d04b4e8f7d';
insert into upvotes (report_id, user_id) values ('22b50f95-bbc3-5ffd-90e8-49d04b4e8f7d', 'user_seed_01');
select upvote_count as after from reports where id = '22b50f95-bbc3-5ffd-90e8-49d04b4e8f7d';
rollback;

-- 9. RLS on every table. Expect: 9 rows, all true
select relname, relrowsecurity from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('profiles','categories','departments','reports','report_images','upvotes','comments','status_history','notifications')
order by relname;

-- 10. Storage bucket. Expect: report-images | true | 5242880
select id, public, file_size_limit from storage.buckets where id = 'report-images';

-- ---------------------------------------------------------------------------
-- Phase 5 additions (sql/004_phase5.sql). Run after 004_phase5.sql.
-- ---------------------------------------------------------------------------

-- 11. reports_with_coords exposes lat/lng and matches the seeded pothole from check 5.
-- Expect: lat about 21.124811, lng about 79.057730
select lat, lng from reports_with_coords where id = '9b3d6191-d1c3-5850-ae3d-5a7e8b7431bc';

-- 12. Lazy profile upsert is idempotent. Rolled back afterwards. Expect: one profiles row, display_name updated on the second call
begin;
select upsert_profile('user_sanity_check', 'Sanity One', null);
select upsert_profile('user_sanity_check', 'Sanity Two', 'https://example.com/a.png');
select display_name, avatar_url from profiles where id = 'user_sanity_check';    -- Sanity Two | https://example.com/a.png
rollback;

-- 13. create_report inserts the report, its before image, and the initial status_history
-- row atomically. Looked up by title (no \gset — this runs in the Supabase SQL editor,
-- not psql). Rolled back afterwards. Expect: 1 image row, 1 history row (null -> reported)
begin;
select upsert_profile('user_sanity_check', 'Sanity Reporter', null);
select create_report(
  'user_sanity_check', (select id from categories where slug = 'pothole'),
  'Sanity check pothole', 'Created by sanity_checks.sql', 2,
  21.15, 79.09, 'Sanity Area', array['seed/before-pothole-1.jpg']
);
select count(*) from report_images ri join reports r on r.id = ri.report_id
  where r.title = 'Sanity check pothole';                                       -- 1
select sh.from_status, sh.to_status from status_history sh join reports r on r.id = sh.report_id
  where r.title = 'Sanity check pothole';                                       -- <null> | reported
rollback;

-- 14. toggle_upvote flips both ways and the trigger keeps upvote_count in step.
-- Rolled back afterwards. Expect: true, count+1, then false, count back to original
begin;
select upvote_count as before from reports where id = '22b50f95-bbc3-5ffd-90e8-49d04b4e8f7d';
select toggle_upvote('22b50f95-bbc3-5ffd-90e8-49d04b4e8f7d', 'user_seed_02');   -- true
select upvote_count as after_add from reports where id = '22b50f95-bbc3-5ffd-90e8-49d04b4e8f7d';
select toggle_upvote('22b50f95-bbc3-5ffd-90e8-49d04b4e8f7d', 'user_seed_02');   -- false
select upvote_count as after_remove from reports where id = '22b50f95-bbc3-5ffd-90e8-49d04b4e8f7d';
rollback;
