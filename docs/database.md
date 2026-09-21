# database.md — Civic Fix

> Source of truth for HOW data is stored.
> Schema changes must be documented here **before** being applied.

---

## 1. Technology
- **Database:** PostgreSQL on **Supabase**
- **Extensions:** `postgis`, `pgcrypto` (for `gen_random_uuid()`)
- **Database name:** default Supabase project database (`postgres`), schema `public`
- **Access:** only via Express using the service-role key. The frontend never queries the DB.
- **Storage bucket:** `report-images` (public read, writes only via signed upload URLs)

## 2. Entity Relationship Overview

```
categories ──┐
             ├──< reports >──┬──< report_images
departments ─┘      │        ├──< upvotes
                    │        ├──< comments
                    │        ├──< status_history
                    │        └──< notifications
profiles ───────────┘ (reports.reporter_id → profiles.id, etc.)
```

Cardinality:
- One category has many reports; one department has many reports (nullable until assigned).
- One report has many images, upvotes, comments, status history rows, notifications.
- One profile (Clerk user) creates many reports, upvotes, comments.

## 3. Enums

```
report_status:   reported | in_progress | resolved | rejected
image_kind:      before | after
```

## 4. Tables

### profiles
Minimal local mirror of a Clerk user, created on first authenticated write.
```
profiles
 ├── id            text PK              -- Clerk userId, e.g. "user_2abc"
 ├── display_name  text NOT NULL
 ├── avatar_url    text NULL
 └── created_at    timestamptz NOT NULL DEFAULT now()
```

### categories
```
categories
 ├── id        serial PK
 ├── slug      text UNIQUE NOT NULL     -- pothole, garbage, streetlight, water_leak, drainage, other
 ├── name      text NOT NULL
 ├── icon      text NOT NULL            -- icon name used by frontend
 └── is_active boolean NOT NULL DEFAULT true
```

### departments
```
departments
 ├── id        serial PK
 ├── name      text UNIQUE NOT NULL     -- e.g. Roads, Sanitation, Electricity, Water
 └── is_active boolean NOT NULL DEFAULT true
```

### reports
```
reports
 ├── id              uuid PK DEFAULT gen_random_uuid()
 ├── reporter_id     text NOT NULL → profiles.id
 ├── category_id     int  NOT NULL → categories.id
 ├── department_id   int  NULL     → departments.id
 ├── title           text NOT NULL CHECK (char_length(title) BETWEEN 5 AND 120)
 ├── description     text NOT NULL CHECK (char_length(description) <= 2000)
 ├── status          report_status NOT NULL DEFAULT 'reported'
 ├── severity        smallint NOT NULL DEFAULT 2 CHECK (severity BETWEEN 1 AND 5)
 ├── location        geography(Point,4326) NOT NULL
 ├── area_name       text NULL           -- reverse-geocoded label
 ├── upvote_count    int NOT NULL DEFAULT 0
 ├── ai_category_id  int NULL → categories.id   -- AI suggestion (audit only)
 ├── ai_severity     smallint NULL
 ├── reject_reason   text NULL
 ├── created_at      timestamptz NOT NULL DEFAULT now()
 ├── updated_at      timestamptz NOT NULL DEFAULT now()
 └── resolved_at     timestamptz NULL
```

### report_images
```
report_images
 ├── id            uuid PK DEFAULT gen_random_uuid()
 ├── report_id     uuid NOT NULL → reports.id ON DELETE CASCADE
 ├── storage_path  text NOT NULL        -- path inside bucket report-images
 ├── kind          image_kind NOT NULL DEFAULT 'before'
 ├── uploaded_by   text NOT NULL → profiles.id
 └── created_at    timestamptz NOT NULL DEFAULT now()
```
Rule: max 3 `before` images per report (enforced in service layer).

### upvotes
```
upvotes
 ├── report_id   uuid NOT NULL → reports.id ON DELETE CASCADE
 ├── user_id     text NOT NULL → profiles.id
 ├── created_at  timestamptz NOT NULL DEFAULT now()
 └── PRIMARY KEY (report_id, user_id)
```

### comments
```
comments
 ├── id          uuid PK DEFAULT gen_random_uuid()
 ├── report_id   uuid NOT NULL → reports.id ON DELETE CASCADE
 ├── user_id     text NOT NULL → profiles.id
 ├── body        text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500)
 ├── is_admin    boolean NOT NULL DEFAULT false   -- shows an "Official" badge
 └── created_at  timestamptz NOT NULL DEFAULT now()
```

### status_history
```
status_history
 ├── id          bigserial PK
 ├── report_id   uuid NOT NULL → reports.id ON DELETE CASCADE
 ├── from_status report_status NULL               -- null on creation
 ├── to_status   report_status NOT NULL
 ├── changed_by  text NOT NULL → profiles.id
 ├── note        text NULL
 └── created_at  timestamptz NOT NULL DEFAULT now()
```

### notifications
```
notifications
 ├── id          uuid PK DEFAULT gen_random_uuid()
 ├── user_id     text NOT NULL → profiles.id     -- recipient
 ├── report_id   uuid NOT NULL → reports.id ON DELETE CASCADE
 ├── message     text NOT NULL
 ├── is_read     boolean NOT NULL DEFAULT false
 └── created_at  timestamptz NOT NULL DEFAULT now()
```

## 5. Indexes

| Table | Index | Purpose |
|---|---|---|
| reports | `GIST (location)` | Distance queries, duplicate check, heatmap |
| reports | `(status, created_at DESC)` | Feed filtering |
| reports | `(category_id, status)` | Category filters and duplicate check |
| reports | `(reporter_id, created_at DESC)` | My Reports |
| reports | `(upvote_count DESC)` | Sort by most upvoted |
| report_images | `(report_id)` | Detail page |
| comments | `(report_id, created_at)` | Comment list |
| status_history | `(report_id, created_at)` | Timeline |
| notifications | `(user_id, is_read, created_at DESC)` | Bell and list |

## 6. Constraints Summary
- Unique: `categories.slug`, `departments.name`, `upvotes (report_id, user_id)`.
- Foreign keys with `ON DELETE CASCADE` for child rows of `reports`.
- Checks on title, description, severity, comment length.
- `updated_at` maintained by a trigger.
- `upvote_count` maintained by a trigger on `upvotes` insert/delete (never edited manually).
- `resolved_at` set only when status becomes `resolved`.

## 7. Schema SQL (initial — goes in `server/sql/001_schema.sql`)

```sql
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

-- Row Level Security: on everywhere, NO public policies (service role bypasses RLS)
alter table profiles        enable row level security;
alter table categories      enable row level security;
alter table departments     enable row level security;
alter table reports         enable row level security;
alter table report_images   enable row level security;
alter table upvotes         enable row level security;
alter table comments        enable row level security;
alter table status_history  enable row level security;
alter table notifications   enable row level security;

-- Storage bucket: public read, JPEG/PNG/WebP only, max 5 MB; writes via signed upload URLs only
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-images', 'report-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
```

## 8. Important Queries / Functions (`server/sql/002_functions.sql`, `server/sql/004_phase5.sql`, `server/sql/005_phase7.sql`)

`supabase-js` cannot run raw SQL, so every query below that the API needs is exposed as a Postgres function and called with `.rpc()`. The raw SQL is kept here as the reference for what each function does. All functions are `revoke`d from `public`, `anon`, and `authenticated` and granted only to `service_role`.

| Function | Wraps | Used by |
|---|---|---|
| `nearby_duplicates(lat, lng, category_id, radius = 50)` | Duplicate check | `GET /reports/nearby-duplicates` |
| `change_report_status(report_id, to, admin_id, note)` | Atomic status change | `PATCH /admin/reports/:id/status` |
| `get_public_stats()` | Public stats (adds `in_progress`) | `/stats/public`, `/admin/stats` |
| `get_category_breakdown()` | Category breakdown (adds `slug`) | `/stats/public`, `/admin/stats` |
| `get_heatmap_points()` | Heatmap points | `/admin/heatmap` |
| `get_map_points(category_id = null, status = null)` | Map points, capped at 1000, optional filters | `/reports/map` |

Notes:
- `change_report_status` writes `status_history.changed_by`, which is a FK to `profiles`; the API must upsert the admin's profile first.
- **Phase 5 decision:** report list/detail endpoints read `lat`/`lng` from the view `reports_with_coords` (`select *, st_y(location::geometry) as lat, st_x(location::geometry) as lng from reports`) rather than an RPC — supabase-js can select ordinary columns and embedded relations (`category:categories(...)`) from a view exactly like a table, which a `.rpc()` call cannot do. The view is `security_invoker`, revoked from `public`/`anon`/`authenticated`, and granted only to `service_role`, same as the functions below.

### Phase 5 additions (`server/sql/004_phase5.sql`)

| Object | Kind | Wraps | Used by |
|---|---|---|---|
| `reports_with_coords` | view | `reports` + `lat`/`lng` | `GET /reports`, `GET /reports/:id`, `GET /me/reports` |
| `upsert_profile(id, display_name, avatar_url)` | function | Lazy `profiles` upsert (rules.md §8) | Every authenticated write (`ensureProfile` in `profileService.js`) |
| `create_report(reporter_id, category_id, title, description, severity, lat, lng, area_name, image_paths[], ai_category_id, ai_severity)` | function | Atomic insert of `reports` + `report_images` (kind `before`) + the initial `status_history` row (`null -> reported`) | `POST /reports` |
| `toggle_upvote(report_id, user_id)` | function | Insert/delete on `upvotes`; the existing `upvotes_sync` trigger keeps `upvote_count` in step either way | `POST /reports/:id/upvote` |

`create_report` mirrors `change_report_status`: a multi-table write goes through one DB function so the report, its images, and its history row can never end up out of sync (rules.md §6). `comments` and `notifications` reads/writes do **not** need functions — the service-role key bypasses RLS, so `commentService.js`/`notificationService.js` use plain `supabase.from(...)` calls scoped by `user_id`/`report_id` in the query itself.

### Phase 7 additions (`server/sql/005_phase7.sql`)

| Object | Kind | Wraps | Used by |
|---|---|---|---|
| `admin_reports_view` | view | `reports` + `lat`/`lng`, every status, no reporter filter | `GET /admin/reports` |
| `assign_report_department(report_id, department_id)` | function | Sets `reports.department_id`; no note, no notification (not a status transition) | `PATCH /admin/reports/:id/assign` |
| `add_resolution_image(report_id, storage_path, admin_id)` | function | Inserts a `report_images` row with `kind = 'after'` | `POST /admin/reports/:id/resolution-image` |
| `delete_report(report_id)` | function | Deletes a report; cascades to `report_images`/`upvotes`/`comments`/`status_history`/`notifications` via their FKs | `DELETE /admin/reports/:id` |
| `admin_delete_comment(comment_id)` | function | Deletes any comment, no ownership check (citizen delete-own is a plain `.delete()` in `commentService.js`, unchanged) | `DELETE /admin/comments/:id` |
| `get_admin_stats()` | function | One row: total/reported/in_progress/resolved/rejected + resolved % + avg hours to resolve | `GET /admin/stats` |
| `get_reports_trend(days = 7)` | function | Reported/in-progress/resolved counts per day, last N days | `GET /admin/stats` |
| `get_department_breakdown()` | function | Report count per department | `GET /admin/stats` |

`add_resolution_image` and `assign_report_department` are kept separate from `change_report_status` on purpose: assigning a department isn't itself a status transition (no note, no notification), and an admin may attach an "after" photo as proof mid-fix, before the status actually moves to `resolved` — folding either into `change_report_status` would fire a reporter notification that a same-time photo upload or assignment shouldn't duplicate.

**Sanity checks:** `server/sql/sanity_checks.sql` #15–18 cover `assign_report_department` + `change_report_status` together, `add_resolution_image`, `delete_report`'s cascade, and `get_admin_stats()`/`get_department_breakdown()` returning without error.

**Nearby duplicate check** (same category, open, within 50 m):
```sql
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
```

**Change status atomically** (history + notification in one call):
```sql
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
```

**Public stats** (for City Health):
```sql
select
  count(*)                                             as total,
  count(*) filter (where status = 'resolved')          as resolved,
  round(100.0 * count(*) filter (where status='resolved') / nullif(count(*),0), 1) as resolved_pct,
  round(avg(extract(epoch from (resolved_at - created_at))/3600)
        filter (where status='resolved')::numeric, 1)  as avg_hours_to_resolve
from reports;
```

**Category breakdown:** `select c.name, count(*) from reports r join categories c on c.id = r.category_id group by c.name order by count(*) desc;`

**Heatmap points:** `select st_y(location::geometry) as lat, st_x(location::geometry) as lng, severity from reports where status <> 'rejected';`

**Map points (lightweight):** `select id, title, status, category_id, upvote_count, st_y(location::geometry) as lat, st_x(location::geometry) as lng from reports where status <> 'rejected' limit 1000;`

## 9. Seed / Dummy Data (`server/sql/003_seed.sql`)
The demo must never look empty. The file is generated deterministically, so re-running it produces the same data (timestamps are relative to `now()`).

- 6 categories (pothole, garbage, streetlight, water_leak, drainage, other) and 5 departments (Roads, Sanitation, Electricity, Water Supply, Drainage), inserted with `on conflict do nothing`.
- 6 demo profiles with fake Clerk-style ids `user_seed_01`..`user_seed_05` (citizens) and `user_seed_admin` (official replies and status changes).
- **80 reports** around **Nagpur** (approximate locality coordinates; change them in the file if the demo city differs):
  - 8 tight clusters (Sitabuldi, Dharampeth, Itwari, Manish Nagar, Sadar, Pratap Nagar, Mankapur, Sonegaon) plus scattered points, so the heatmap looks meaningful,
  - 33 reported, 20 in_progress, 24 resolved, 3 rejected,
  - upvote counts 0-60,
  - `created_at` spread over the last 45 days; resolved reports took 1-10 days,
  - in_progress and resolved reports have a department assigned.
- Status history: every report has `null -> reported`; in_progress, resolved, and rejected reports have the matching later rows (151 total).
- 26 comments (19 citizen, 7 official admin replies) and 14 notifications with the same wording as `change_report_status`.
- 126 `report_images` rows pointing at placeholder files `seed/before-<category>-<1|2>.jpg` and `seed/after-<category>.jpg`. The files are in `server/sql/seed-images/`; upload them to the `report-images` bucket under a `seed/` folder (Supabase dashboard -> Storage -> report-images -> Upload folder).
- **Exception to the trigger rule:** the seed sets `reports.upvote_count` directly, because the `upvotes` trigger only fires for real upvote rows and there are only 6 demo profiles. Real upvotes then add or subtract 1 through the trigger as usual.
- **Re-seeding:** the file first deletes rows whose ids start with `user_seed_` (reports cascade to their images, history, comments, and notifications), then inserts fresh data. Real users' data is untouched.
- `server/sql/sanity_checks.sql` verifies counts, stats, duplicates, map/heatmap points, the status-change function, the upvote trigger, RLS, and the bucket, with expected values in comments.

## 10. Database Security Considerations
- Service-role key exists **only** on the Render backend.
- Row Level Security: enable RLS on all tables with **no public policies**, so even the public anon key cannot read or write anything. All access is through Express. Database functions are also revoked from `anon`/`authenticated`, because Supabase exposes public-schema functions over its REST API by default.
- Never trust client-provided `user_id`; always take it from the verified Clerk token.
- Validate coordinates (lat −90..90, lng −180..180) and enforce image type/size limits at signed-URL creation (JPEG/PNG/WebP, max 5 MB).
- Storage bucket: public read is acceptable for report images; do not store anything private there.
- Rate-limit report creation per user (e.g., 10 per hour) to reduce spam.
- Keep a backup of the seed SQL in the repo so the DB can be rebuilt quickly before the demo.
