-- 007_worker.sql — Civic Fix
-- Run FOURTH after 001_schema.sql, 002_functions.sql, 003_seed.sql (and 004/005/006).
-- Adds: worker role, tasks table, submissions table, and all related RPCs.
-- Uses CREATE OR REPLACE for functions (safe to re-run).
-- Tables are created with IF NOT EXISTS (safe to re-run).

-- ---------------------------------------------------------------------------
-- 0. Drop existing functions (handles old signatures — safe even if they don't exist)
-- ---------------------------------------------------------------------------
drop function if exists create_task cascade;
drop function if exists update_task_status cascade;
drop function if exists get_worker_tasks cascade;
drop function if exists create_submission cascade;
drop function if exists worker_create_submission cascade;
drop function if exists review_submission cascade;
drop function if exists touch_tasks_updated_at cascade;

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type task_status as enum ('pending', 'in_progress', 'completed', 'cancelled');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'task_priority') then
    create type task_priority as enum ('low', 'medium', 'high', 'urgent');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'submission_status') then
    create type submission_status as enum ('pending', 'approved', 'needs_revision');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Tasks table
-- ---------------------------------------------------------------------------
create table if not exists tasks (
  id              uuid primary key default gen_random_uuid(),
  report_id       uuid not null references reports(id) on delete cascade,
  department_id   int  references departments(id) on delete set null,
  title           text not null,
  description     text,
  assigned_to     text,                -- free-text label (worker name / team)
  assigned_to_id  text,                -- Clerk userId of the assigned worker (nullable)
  priority        task_priority not null default 'medium',
  task_date       date,
  due_date        date,
  status          task_status not null default 'pending',
  created_by      text not null references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. Submissions table
-- ---------------------------------------------------------------------------
create table if not exists submissions (
  id                    uuid primary key default gen_random_uuid(),
  task_id               uuid not null references tasks(id) on delete cascade,
  report_id             uuid not null references reports(id) on delete cascade,
  assigned_person       text not null,           -- worker display name at time of submit
  resolution_image_path text,                    -- storage path (same bucket as report images)
  details               text,
  grade                 text,                    -- admin optional grade (e.g. A, B, C)
  remarks               text,                    -- admin optional remarks
  status                submission_status not null default 'pending',
  submitted_at          timestamptz not null default now(),
  reviewed_at           timestamptz,
  reviewed_by           text references profiles(id)
);

-- ---------------------------------------------------------------------------
-- 4. updated_at trigger for tasks
-- ---------------------------------------------------------------------------
create or replace function touch_tasks_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tasks_updated_at on tasks;
create trigger trg_tasks_updated_at
  before update on tasks
  for each row execute function touch_tasks_updated_at();

-- ---------------------------------------------------------------------------
-- 5. RPC: create_task
--    Admin creates a task linked to a report. Returns the new task UUID.
-- ---------------------------------------------------------------------------
create or replace function create_task(
  p_report_id      uuid,
  p_department_id  int     default null,
  p_title          text    default '',
  p_description    text    default null,
  p_assigned_to    text    default null,
  p_assigned_to_id text    default null,
  p_priority       text    default 'medium',
  p_task_date      date    default null,
  p_due_date       date    default null,
  p_created_by     text    default null
)
returns uuid
language plpgsql security definer as $$
declare
  v_task_id uuid;
begin
  -- Verify report exists
  if not exists (select 1 from reports where id = p_report_id) then
    raise exception 'REPORT_NOT_FOUND';
  end if;

  insert into tasks (
    report_id, department_id, title, description,
    assigned_to, assigned_to_id, priority,
    task_date, due_date, created_by
  ) values (
    p_report_id, p_department_id, p_title, p_description,
    p_assigned_to, p_assigned_to_id, p_priority::task_priority,
    p_task_date, p_due_date, p_created_by
  )
  returning id into v_task_id;

  return v_task_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. RPC: update_task_status
--    Admin or worker updates a task's status.
-- ---------------------------------------------------------------------------
create or replace function update_task_status(
  p_task_id uuid,
  p_status  text
)
returns void
language plpgsql security definer as $$
begin
  update tasks set status = p_status::task_status where id = p_task_id;
  if not found then
    raise exception 'TASK_NOT_FOUND';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. RPC: get_worker_tasks
--    Returns all tasks assigned to a specific worker (by Clerk userId).
--    Must DROP first because CREATE OR REPLACE cannot change a function's return type.
drop function if exists get_worker_tasks(text);
-- ---------------------------------------------------------------------------
create or replace function get_worker_tasks(p_worker_id text)
returns table (
  id              uuid,
  report_id       uuid,
  department_id   int,
  title           text,
  description     text,
  assigned_to     text,
  assigned_to_id  text,
  priority        task_priority,
  task_date       date,
  due_date        date,
  status          task_status,
  created_at      timestamptz,
  updated_at      timestamptz
)
language sql stable security definer as $$
  select
    id, report_id, department_id, title, description,
    assigned_to, assigned_to_id, priority,
    task_date, due_date, status, created_at, updated_at
  from tasks
  where assigned_to_id = p_worker_id
  order by
    case status when 'pending' then 0 when 'in_progress' then 1 else 2 end,
    due_date asc nulls last,
    created_at desc;
$$;

-- ---------------------------------------------------------------------------
-- 8. RPC: create_submission  (admin-side — no ownership check)
-- ---------------------------------------------------------------------------
create or replace function create_submission(
  p_task_id               uuid,
  p_report_id             uuid,
  p_assigned_person       text,
  p_resolution_image_path text default null,
  p_details               text default null
)
returns uuid
language plpgsql security definer as $$
declare
  v_id uuid;
begin
  if not exists (select 1 from tasks where id = p_task_id) then
    raise exception 'TASK_NOT_FOUND';
  end if;

  insert into submissions (task_id, report_id, assigned_person, resolution_image_path, details)
  values (p_task_id, p_report_id, p_assigned_person, p_resolution_image_path, p_details)
  returning id into v_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. RPC: worker_create_submission  (worker-side — verifies ownership)
-- ---------------------------------------------------------------------------
create or replace function worker_create_submission(
  p_task_id               uuid,
  p_worker_id             text,
  p_worker_name           text,
  p_resolution_image_path text default null,
  p_details               text default null
)
returns uuid
language plpgsql security definer as $$
declare
  v_report_id uuid;
  v_id        uuid;
begin
  -- Verify task exists and is assigned to this worker
  select report_id into v_report_id
  from tasks
  where id = p_task_id and assigned_to_id = p_worker_id;

  if not found then
    raise exception 'TASK_NOT_FOUND or NOT_ASSIGNED_TO_YOU';
  end if;

  insert into submissions (task_id, report_id, assigned_person, resolution_image_path, details)
  values (p_task_id, v_report_id, p_worker_name, p_resolution_image_path, p_details)
  returning id into v_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 10. RPC: review_submission
--     Admin approves or requests revision.
--     On approval: closes the task + copies image as report after-photo + notifies citizen.
-- ---------------------------------------------------------------------------
create or replace function review_submission(
  p_submission_id uuid,
  p_to            text,    -- 'approved' or 'needs_revision'
  p_admin_id      text,
  p_grade         text    default null,
  p_remarks       text    default null
)
returns void
language plpgsql security definer as $$
declare
  v_report_id   uuid;
  v_image_path  text;
  v_task_id     uuid;
begin
  -- Verify submission exists
  select report_id, resolution_image_path, task_id
  into v_report_id, v_image_path, v_task_id
  from submissions where id = p_submission_id;

  if not found then
    raise exception 'SUBMISSION_NOT_FOUND';
  end if;

  -- Update submission record
  update submissions set
    status      = p_to::submission_status,
    grade       = p_grade,
    remarks     = p_remarks,
    reviewed_at = now(),
    reviewed_by = p_admin_id
  where id = p_submission_id;

  -- On approval: complete the task + resolve the report
  if p_to = 'approved' then
    -- Close the task
    update tasks set status = 'completed' where id = v_task_id;

    -- Copy resolution image to report_images (kind = after) if present
    if v_image_path is not null then
      insert into report_images (report_id, storage_path, kind)
      values (v_report_id, v_image_path, 'after')
      on conflict do nothing;
    end if;

    -- Mark report as resolved + create citizen notification
    perform change_report_status(
      p_report_id  => v_report_id,
      p_to         => 'resolved',
      p_admin_id   => p_admin_id,
      p_note       => coalesce(p_remarks, 'Work verified and approved.')
    );
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 11. Grant execute to service_role (same pattern as 002_functions.sql)
-- ---------------------------------------------------------------------------
grant execute on function create_task              to service_role;
grant execute on function update_task_status       to service_role;
grant execute on function get_worker_tasks         to service_role;
grant execute on function create_submission        to service_role;
grant execute on function worker_create_submission to service_role;
grant execute on function review_submission        to service_role;

-- Grant table access to service_role
grant select, insert, update, delete on tasks       to service_role;
grant select, insert, update, delete on submissions to service_role;

-- ---------------------------------------------------------------------------
-- 12. Quick sanity check (run manually after migration)
-- ---------------------------------------------------------------------------
-- select count(*) from tasks;        -- expect 0 (no seed tasks)
-- select count(*) from submissions;  -- expect 0
-- select create_task(
--   p_report_id  => (select id from reports limit 1),
--   p_title      => 'Test task',
--   p_priority   => 'medium',
--   p_created_by => (select id from profiles limit 1)
-- );  -- should return a UUID
