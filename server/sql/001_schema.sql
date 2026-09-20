-- 001_schema.sql — Civic Fix
-- Run FIRST in the Supabase SQL editor. Mirrors docs/database.md §7 (keep both in sync).
-- Safe to run once on an empty project; it is NOT idempotent (types/tables are created without IF NOT EXISTS).

create extension if not exists postgis;
create extension if not exists pgcrypto;

create type report_status as enum ('reported','in_progress','resolved','rejected');
create type image_kind as enum ('before','after');

create table profiles (
  id text primary key,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table categories (
  id serial primary key,
  slug text unique not null,
  name text not null,
  icon text not null,
  is_active boolean not null default true
);

create table departments (
  id serial primary key,
  name text unique not null,
  is_active boolean not null default true
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id text not null references profiles(id),
  category_id int not null references categories(id),
  department_id int references departments(id),
  title text not null check (char_length(title) between 5 and 120),
  description text not null check (char_length(description) <= 2000),
  status report_status not null default 'reported',
  severity smallint not null default 2 check (severity between 1 and 5),
  location geography(Point,4326) not null,
  area_name text,
  upvote_count int not null default 0,
  ai_category_id int references categories(id),
  ai_severity smallint,
  reject_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table report_images (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  storage_path text not null,
  kind image_kind not null default 'before',
  uploaded_by text not null references profiles(id),
  created_at timestamptz not null default now()
);

create table upvotes (
  report_id uuid not null references reports(id) on delete cascade,
  user_id text not null references profiles(id),
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  user_id text not null references profiles(id),
  body text not null check (char_length(body) between 1 and 500),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table status_history (
  id bigserial primary key,
  report_id uuid not null references reports(id) on delete cascade,
  from_status report_status,
  to_status report_status not null,
  changed_by text not null references profiles(id),
  note text,
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references profiles(id),
  report_id uuid not null references reports(id) on delete cascade,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Indexes
create index reports_location_gix on reports using gist (location);
create index reports_status_created_idx on reports (status, created_at desc);
create index reports_category_status_idx on reports (category_id, status);
create index reports_reporter_idx on reports (reporter_id, created_at desc);
create index reports_upvotes_idx on reports (upvote_count desc);
create index report_images_report_idx on report_images (report_id);
create index comments_report_idx on comments (report_id, created_at);
create index status_history_report_idx on status_history (report_id, created_at);
create index notifications_user_idx on notifications (user_id, is_read, created_at desc);

-- Triggers
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

create trigger reports_updated_at before update on reports
for each row execute function set_updated_at();

create or replace function sync_upvote_count() returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update reports set upvote_count = upvote_count + 1 where id = new.report_id;
  elsif tg_op = 'DELETE' then
    update reports set upvote_count = greatest(upvote_count - 1, 0) where id = old.report_id;
  end if;
  return null;
end; $$ language plpgsql;

create trigger upvotes_sync after insert or delete on upvotes
for each row execute function sync_upvote_count();

-- ---------------------------------------------------------------------------
-- Row Level Security: enabled everywhere with NO public policies.
-- The anon/authenticated keys can read or write nothing; only the Express API
-- (service-role key, which bypasses RLS) touches the database.
-- ---------------------------------------------------------------------------
alter table profiles        enable row level security;
alter table categories      enable row level security;
alter table departments     enable row level security;
alter table reports         enable row level security;
alter table report_images   enable row level security;
alter table upvotes         enable row level security;
alter table comments        enable row level security;
alter table status_history  enable row level security;
alter table notifications   enable row level security;

-- ---------------------------------------------------------------------------
-- Storage bucket for report photos: public read, JPEG/PNG/WebP only, max 5 MB.
-- Writes happen only through signed upload URLs issued by Express (no storage policies needed).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-images', 'report-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
