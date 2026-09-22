# architecture.md — Civic Fix

> Source of truth for HOW the system is structured.
> Must stay consistent with `PRD.md`, `database.md`, `rules.md`.

---

## 1. Tech Stack (final)

| Layer | Choice | Hosting |
|---|---|---|
| Frontend | Next.js 15 (App Router, JavaScript), React 19, Tailwind CSS 3.4, Leaflet, Chart.js | Vercel |
| Backend | Node.js + Express | Render |
| Database | Supabase Postgres + PostGIS | Supabase |
| File storage | Supabase Storage (bucket `report-images`) | Supabase |
| Auth | Clerk | Clerk |
| AI (optional) | Claude or Gemini vision API, called from Express only | Provider |
| Maps | Leaflet + OpenStreetMap tiles, Nominatim reverse geocode | — |

## 2. Overall Architecture

```
User ───► Next.js (Vercel) frontend
              │  HTTPS + Clerk session token (Bearer)
              ▼
        Express API (Render) ─────► Clerk (verify token/claims)
              │  service-role key (server only)
      ┌───────┼──────────────┐
      ▼       ▼              ▼
  Supabase  Supabase       LLM API
  Postgres  Storage        (optional)
  PostGIS   (images)
```

Key principle: **the frontend never talks to the database directly.** All data access goes through Express. Images are uploaded straight to Supabase Storage using short-lived signed upload URLs issued by Express.

## 3. Application Flow

1. Page loads in Next.js. Public pages call public API endpoints without a token.
2. Protected pages require a Clerk session; the frontend attaches the token on API calls.
3. Express verifies the token, loads role from claims, runs validation, then queries Supabase.
4. Response returns JSON in the standard shape (see §10).

## 4. User Flow

```
Guest ─► Map / Feed / Detail / City Health
    │
    └─► Sign in (Clerk) ─► Citizen
            ├─► Report new issue ─► Duplicate check ─► Submit
            ├─► Upvote / Comment
            └─► My Reports / Notifications

Worker ─► /worker/tasks ─► See assigned tasks ─► Submit resolution photo + details
              │
              ▼
        Admin reviews (Approve / Request changes)

Admin ─► /admin ─► Dashboard / Reports / Assign Task / Submissions / Incomplete / Analytics
    ├─► Reports table ─► Report manage page
    │     ├─► Assign department
    │     ├─► Change status (+ note)
    │     └─► Upload after photo
    ├─► Assign Task ─► pick report + department + worker + due date
    ├─► Submissions ─► review modal ─► Approve (closes loop) / Request changes
    ├─► Incomplete ─► aging view of open reports
    └─► Analytics ─► KPIs + department performance + heatmap
```

## 5. Frontend Architecture (Next.js)

- **Framework:** Next.js 15 App Router, JavaScript (no TypeScript), React 19. Import alias `@/` maps to `client/src`.
- **Routing:** file-based under `client/src/app` (`page.jsx`, `layout.jsx`).
- **Layouts:**
  - `app/layout.jsx` (root): `<ClerkProvider>`, toast host, fonts via `next/font/google`, and `<SiteChrome>`.
  - `SiteChrome` (client) renders the public navbar/footer and returns children untouched on `/admin`, so the admin shell is not double-framed.
  - `app/(admin)/admin/layout.jsx`: admin shell with `Sidebar` + `AdminTopbar` + server-side role guard (`auth()` → redirect).
- **Auth:** `@clerk/nextjs`. `src/middleware.js` uses `clerkMiddleware` for three route classes:
  - Citizen routes (`/report/new`, `/my-reports`, `/notifications`) — any signed-in user (guest redirects to sign-in).
  - Worker routes (`/worker(.*)`) — redirect to `/` unless `sessionClaims.metadata.role === "worker"`.
  - Admin routes (`/admin(.*)`) — redirect to `/` unless role is `"admin"`.
  Client components call `useApi()` (`lib/useApi.js`), which reads `useAuth().getToken()` and passes the token to `lib/api.js`; `api.js` itself stays Clerk-free.
- **Single data source:** Next.js code never imports Supabase and never touches the database. The only data source is the Express API.
- **Server vs client components:** default to server components for static shells; add `'use client'` only when a component needs state, effects, or browser APIs (maps, forms, upvote, comments). Public data pages fetch on the client with skeleton loaders.
- **State:** React Context + hooks in `lib/context/` for current user, filters, and notification count.
- **Maps and charts:** `<MapView>` uses `react-leaflet` (modes: `browse`, `pick-location`, `heat`); charts use `react-chartjs-2`. Both loaded with `next/dynamic` (`ssr: false`).
- **Images and fonts:** `next/image` with the Supabase Storage host in `images.remotePatterns`; Space Grotesk and DM Sans via `next/font/google`.
- **Styling:** Tailwind 3.4 with tokens from `design.md`.
- **Role-aware Navbar:** `Navbar.jsx` reads Clerk `publicMetadata.role` and renders four variants:
  - **Guest:** `Sign In` (secondary) + `Report an Issue` (primary).
  - **Citizen:** `Report an Issue` (primary) only.
  - **Worker:** `My Tasks` (primary, teal with icon) — no `Report an Issue` in the desktop topbar (kept in the mobile drawer).
  - **Admin:** `Admin Panel` (primary, teal with shield icon) — no `Report an Issue` in the desktop topbar (kept in the mobile drawer).
- **Admin topbar:** `AdminTopbar` (client) is a sticky header above `main` in `(admin)/admin/layout.jsx`, separate from `Sidebar`. Its search routes to `/admin/reports?search=` — the only admin surface with server-side search. All action buttons carry `suppressHydrationWarning` (browser-extension false positive, memory.md D32/D44).
- **Worker routes:** `/worker/tasks` is guarded by `middleware.js` (redirect to `/` if role is not `worker`). The page fetches `/me/tasks` (worker-scoped server-side); its tabs are client-side visual filters over the already-scoped list.

## 6. Backend Architecture (Express)

Layered structure, one responsibility per layer:

```
routes → controllers → services → supabase client
              ↑
      middleware (auth, role, validate, error)
```

- **routes:** URL + middleware wiring only.
- **controllers:** parse request, call service, shape response.
- **services:** business logic and DB queries (the only layer that imports the Supabase client).
- **middleware:** `clerkMiddleware`, `requireAuth`, `requireAdmin`, `requireWorker`, `validate(schema)`, `errorHandler`, `rateLimit`.
- **validation:** Zod schemas per endpoint.

## 7. Database Architecture

See `database.md`. Summary: Postgres on Supabase with PostGIS; `reports` is the central table; `upvotes`, `comments`, `report_images`, `status_history`, `notifications` hang off it; `categories` and `departments` are lookup tables; `tasks` and `submissions` (Phase 7.5) close the resolution loop.

## 8. Authentication Flow

```
Browser ──sign in──► Clerk ──► session created
Browser ──API call + Bearer token──► Express
Express ──clerkMiddleware verifies token──► req.auth (userId, sessionClaims)
Express ──requireAuth──► 401 if no valid session
Express ──requireAdmin──► 403 if claims.metadata.role !== "admin"
Express ──requireWorker──► 403 if claims.metadata.role !== "worker"
```

Setup requirement (Clerk dashboard → Sessions → Customize session token):

```json
{ "metadata": "{{user.public_metadata}}" }
```

Then the role is read as `sessionClaims.metadata.role`.

## 9. Authorization / Role System

| Check | Where enforced |
|---|---|
| Any public read | No auth |
| Create report, upvote, comment | requireAuth |
| Edit/delete own comment | requireAuth + ownership check in service |
| Admin routes | requireAdmin |
| Worker routes (`/me/tasks`, `/me/tasks/:id/submission`) | requireWorker |
| Worker submission ownership | `worker_create_submission` RPC verifies `tasks.assigned_to_id = caller` |
| UI hiding of role-specific links | Frontend (cosmetic only) |

Users are identified by Clerk `userId` (string like `user_2abc...`). It is stored as text in DB tables.

Role independence: `admin` and `worker` are independent Clerk roles. An admin is NOT automatically a worker — `requireWorker` rejects non-workers with 403, and vice versa. This keeps `/me/tasks` semantically unambiguous ("my assigned tasks" as a worker).

## 10. API Architecture

- Base path: `/api/v1`
- Format: JSON
- Success: `{ "data": ..., "meta": { "page": 1, "pageSize": 20, "total": 134 } }` (meta only for lists)
- Error: `{ "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [...] } }`
- Status codes: 200, 201, 204, 400, 401, 403, 404, 409, 422, 429, 500
- Pagination: `?page=1&pageSize=20`
- Filtering: `?category=pothole&status=reported&sort=upvotes`

### Endpoint list

**Public**

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Health check (no `/api/v1` prefix) |
| GET | `/api/v1/categories` | List categories |
| GET | `/api/v1/reports` | List/filter reports |
| GET | `/api/v1/reports/map` | Lightweight points for the map |
| GET | `/api/v1/reports/:id` | Report detail with history + comments |
| GET | `/api/v1/stats/public` | City Health numbers |

**Citizen (auth)**

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/me` | Current user id + role |
| POST | `/api/v1/uploads/sign` | Get signed upload URL(s) for images |
| GET | `/api/v1/reports/nearby-duplicates` | Duplicate check (lat,lng,category) |
| POST | `/api/v1/reports` | Create report |
| POST | `/api/v1/reports/:id/upvote` | Toggle upvote |
| POST | `/api/v1/reports/:id/comments` | Add comment |
| DELETE | `/api/v1/comments/:id` | Delete own comment |
| GET | `/api/v1/me/reports` | Own reports |
| GET | `/api/v1/me/notifications` | Own notifications |
| PATCH | `/api/v1/me/notifications/read` | Mark all/one as read |
| POST | `/api/v1/ai/classify` | Optional AI category/severity suggestion |

**Worker (auth + worker role)**

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/me/tasks` | Worker's own assigned tasks |
| POST | `/api/v1/me/tasks/:id/submission` | Worker submits resolution evidence |

**Admin (auth + admin role) — Phase 7**

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/admin/reports` | Full table with filters (`?category=&status=&department=&search=&sort=&page=&pageSize=`) |
| PATCH | `/api/v1/admin/reports/:id/status` | Change status + note |
| PATCH | `/api/v1/admin/reports/:id/assign` | Assign department |
| POST | `/api/v1/admin/reports/:id/resolution-image` | Attach after photo |
| DELETE | `/api/v1/admin/reports/:id` | Delete report |
| DELETE | `/api/v1/admin/comments/:id` | Delete any comment |
| GET | `/api/v1/admin/stats` | Dashboard KPIs and charts data |
| GET | `/api/v1/admin/heatmap` | Points for heatmap |
| GET/POST | `/api/v1/admin/departments` | List/create departments |
| PATCH | `/api/v1/admin/departments/:id` | Update department name / isActive |

**Admin — Phase 7.5 (Assign Task / Submissions / Incomplete / Analytics)**

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/admin/tasks` | List tasks (filter by status/department/priority) |
| POST | `/api/v1/admin/tasks` | Create task (optionally assign to worker; notifies the worker) |
| PATCH | `/api/v1/admin/tasks/:id/status` | Update task status |
| GET | `/api/v1/admin/submissions` | List submissions (filter by status/search) |
| POST | `/api/v1/admin/submissions` | Create submission (admin-side) |
| PATCH | `/api/v1/admin/submissions/:id/review` | Approve / request changes (+ grade, remarks) |
| GET | `/api/v1/admin/incomplete` | Open reports with days-pending aging |
| GET | `/api/v1/admin/analytics` | KPIs + department performance + status distribution |
| GET | `/api/v1/admin/workers` | List Clerk users with role = "worker" |

## 11. Data Flow — Create Report

```
Form ─► POST /uploads/sign ─► signed URL(s)
     ─► upload images directly to Supabase Storage
     ─► GET /reports/nearby-duplicates
     ─► (optional) POST /ai/classify
     ─► POST /reports { fields + image paths }
              │
              ▼
        validate (Zod) → service.createReport
              │
              ├─► insert reports (status = reported)
              ├─► insert report_images
              └─► insert status_history (null → reported)
```

## 12. Data Flow — Resolve Report

Two paths.

**Direct** (admin on `/admin/reports/[id]`):

```
Admin ─► PATCH /admin/reports/:id/status { status, note }
            │
            ▼
       change_report_status RPC
            ├─► update reports.status (+ resolved_at)
            ├─► insert status_history
            └─► insert notifications for reporter
```

**Via worker submission** (Phase 7.5 + 7.6):

```
Admin ─► POST /admin/tasks { reportId, departmentId, assignedToId, ... }
            │
            ▼
       create_task RPC ─► insert tasks + auto-assign report.department_id if unset
            └─► API inserts notifications row for assignedToId (worker bell)

Worker ─► POST /me/tasks/:id/submission { resolutionImagePath, details }
            │
            ▼
       worker_create_submission RPC (verifies assignee)
            ├─► insert submissions (status = pending_review)
            └─► flip task status pending → in_progress

Admin ─► PATCH /admin/submissions/:id/review { status: approved, grade, remarks }
            │
            ▼
       review_submission RPC (one function, four writes)
            ├─► update submissions (status, grade, remarks, reviewed_by/at)
            ├─► update tasks.status → completed
            ├─► insert report_images (kind='after', if image path present)
            └─► change_report_status(report → resolved)
                    └─► insert status_history + notifications for reporter
```

## 13. External Services

- **Clerk:** identity; needs `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` on Vercel (the secret key is server-side only, used by Next.js middleware) and `CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` on Render.
- **Supabase:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` on the backend only.
- **LLM API:** key on the backend only; feature-flagged with `AI_ENABLED`.
- **Nominatim:** called from the frontend for reverse geocoding with a proper User-Agent/referrer and low request rate; result stored in `area_name`.

## 14. Folder Structure

```
civic-fix/
├── docs/
│   ├── PRD.md
│   ├── architecture.md
│   ├── database.md
│   ├── rules.md
│   ├── phases.md
│   ├── design.md
│   └── memory.md
├── client/                      # Next.js → Vercel
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.jsx
│   │   │   ├── globals.css
│   │   │   ├── page.jsx                     # landing
│   │   │   ├── map/page.jsx
│   │   │   ├── reports/page.jsx
│   │   │   ├── reports/[id]/page.jsx
│   │   │   ├── city-health/page.jsx
│   │   │   ├── report/new/page.jsx
│   │   │   ├── my-reports/page.jsx
│   │   │   ├── notifications/page.jsx
│   │   │   ├── sign-in/[[...sign-in]]/page.jsx
│   │   │   ├── sign-up/[[...sign-up]]/page.jsx
│   │   │   ├── worker/
│   │   │   │   └── tasks/page.jsx            # worker dashboard
│   │   │   └── (admin)/admin/
│   │   │       ├── layout.jsx                # Sidebar + AdminTopbar
│   │   │       ├── page.jsx                  # dashboard
│   │   │       ├── reports/page.jsx
│   │   │       ├── reports/[id]/page.jsx
│   │   │       ├── tasks/page.jsx            # Assign Task
│   │   │       ├── submissions/page.jsx
│   │   │       ├── incomplete/page.jsx
│   │   │       ├── analytics/page.jsx
│   │   │       ├── heatmap/page.jsx
│   │   │       └── departments/page.jsx
│   │   ├── components/
│   │   │   ├── ui/              # Button, Card, Input, Badge, Modal, Toast, Skeleton, Pagination, EmptyState
│   │   │   ├── layout/          # Navbar, Sidebar, Footer, SiteChrome, Logo
│   │   │   ├── map/             # MapView, DynamicMapView, MapReportListItem, MapFiltersPanel
│   │   │   ├── report/          # ReportCard, PhotoGallery, StatusTimeline, UpvoteButton, CommentsSection, wizard/*
│   │   │   ├── home/            # HeroSection, CategoryGrid, LatestReports
│   │   │   ├── city-health/     # TopOpenReportsList, TopAreasList
│   │   │   ├── admin/           # StatCard, ChartCard, AdminTopbar, AdminReportsTable,
│   │   │   │                    # AssignDepartmentForm, StatusChangeForm, ResolutionImageUpload,
│   │   │   │                    # DeleteReportButton, TaskForm, TaskTable, SubmissionTable,
│   │   │   │                    # SubmissionReviewModal, IncompleteTable, DepartmentPerformanceTable,
│   │   │   │                    # RecentReportsTable, TopCategoriesList, DepartmentBreakdownList,
│   │   │   │                    # CategoryBreakdownChart, StatusBreakdownChart, ReportsTrendChart, chartSetup
│   │   │   └── worker/          # WorkerTaskCard, WorkerSubmissionModal
│   │   ├── lib/
│   │   │   ├── api.js           # fetch wrapper + authPaths map (token passed in from Clerk)
│   │   │   ├── useApi.js        # hook: apiFetch + current Clerk token
│   │   │   ├── context/         # ToastContext, NotificationContext
│   │   │   └── utils/           # formatters, constants, layout, imageUrl, categories, severity,
│   │   │                        # timeAgo, duration, cn, geocode, compressImage, uploadReportImages, blobToBase64
│   │   └── middleware.js        # Clerk route protection (citizen / worker / admin)
│   ├── public/
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── jsconfig.json
│   ├── .env.example
│   └── package.json
└── server/                      # Express → Render
    ├── src/
    │   ├── index.js             # app bootstrap
    │   ├── config/              # env loader, supabase client, clerk setup
    │   ├── middleware/          # auth (requireAuth/requireAdmin/requireWorker), validate, errorHandler, rateLimit
    │   ├── routes/              # index.js, public.js, reports.js, comments.js, uploads.js, me.js, admin.js, ai.js
    │   ├── controllers/         # categories, reports, comments, uploads, stats, me, ai,
    │   │                        # adminReports, adminStats, adminDepartments,
    │   │                        # adminTasks, adminSubmissions, adminAnalytics, workers
    │   ├── services/            # categoryService, reportService, commentService, uploadService,
    │   │                        # statsService, notificationService, profileService, aiService,
    │   │                        # taskService, submissionService, analyticsService, workerService
    │   ├── validators/          # Zod schemas (reportValidators, commentValidators, uploadValidators,
    │   │                        # notificationValidators, adminValidators, meValidators, aiValidators)
    │   └── utils/               # AppError, asyncHandler, pagination, dbError, logger
    ├── sql/
    │   ├── 001_schema.sql        # tables, indexes, triggers, RLS, storage bucket
    │   ├── 002_functions.sql     # duplicates, status change, stats/map/heatmap RPCs
    │   ├── 003_seed.sql          # demo data
    │   ├── 004_phase5.sql        # reports_with_coords view, upsert_profile, create_report, toggle_upvote
    │   ├── 005_phase7.sql        # admin_reports_view, assign/delete/resolution RPCs, admin stats
    │   ├── 006_phase8.sql        # get_top_open_reports
    │   ├── 007_tasks_submissions.sql  # tasks + submissions tables + 8 RPCs
    │   ├── 008_seed_tasks.sql    # demo tasks + submissions
    │   ├── 009_worker_role.sql   # tasks.assigned_to_id + get_worker_tasks + worker_create_submission
    │   ├── sanity_checks.sql     # verification queries with expected values
    │   └── seed-images/          # placeholder photos to upload to the bucket under seed/
    ├── .env.example
    └── package.json
```

## 15. Component Structure (key components)

| Component | Responsibility |
|---|---|
| `MapView` | Leaflet map; modes: browse, pick-location, heat |
| `ReportCard` | Compact report summary with status badge and upvotes |
| `ReportForm` (wizard) | Multi-step form: Photos → Location → Details → Review |
| `StatusTimeline` | Full lifecycle timeline (Reported → In Progress → Resolved → After Photo) |
| `UpvoteButton` | Optimistic toggle |
| `AdminTopbar` | Admin search + refresh + bell + profile + logout |
| `Sidebar` | Admin nav in 2 groups (Operations / Insights) |
| `StatCard`, `ChartCard` | Admin and City Health widgets |
| `AdminReportsTable` | Full admin reports table with sticky header |
| `TaskForm`, `TaskTable` | Assign Task page |
| `SubmissionTable`, `SubmissionReviewModal` | Submissions page + review |
| `IncompleteTable` | Incomplete page with aging indicators |
| `DepartmentPerformanceTable` | Analytics page |
| `WorkerTaskCard`, `WorkerSubmissionModal` | Worker dashboard + submission upload |

## 16. Route Structure

See §14 (`client/src/app`). Guards:

- Citizen pages: redirect to sign-in when unauthenticated (enforced in `middleware.js`).
- Worker pages (`/worker(.*)`): redirect to `/` if role is not worker.
- `(admin)` group: redirect to `/` if role is not admin (`middleware.js` + admin layout check; backend `requireAdmin` is the real protection).

## 17. Important Technical Decisions

| # | Decision | Reason |
|---|---|---|
| D1 | Clerk for auth, Supabase only as DB/Storage | Faster sign-in UX and roles |
| D2 | No direct frontend → Supabase DB access; no RLS reliance | One enforcement point (Express) |
| D3 | Service-role key only on Render | Never exposed to browsers |
| D4 | PostGIS `geography(Point, 4326)` for locations | Native distance queries |
| D5 | Signed direct uploads to Storage | Avoids passing large files through a free-tier server |
| D6 | Status change through a single DB function/transaction | History + notification never out of sync |
| D7 | Leaflet + OSM | Free, no API key |
| D8 | AI behind a feature flag | Core flow works even if the AI provider fails |
| D9 | Zod validation on every write endpoint | Consistent input safety |
| D10 | Free-tier cold start mitigation (uptime pinger) | Render free instances sleep |
| D11 | Frontend is Next.js (App Router) instead of SvelteKit | Team decision (2026-09-20) |
| D12 | Next.js server code never imports Supabase; it only calls Express | Keeps D2 intact |
| D13 | Public data pages fetch client-side | Render cold start must not hang server rendering |
| D14 | Aggregate and geo queries are Postgres functions called with `.rpc()`, executable only by `service_role` | supabase-js cannot run raw SQL |
| D15 | Public chrome hidden on `/admin` via `SiteChrome` | Keeps the documented `app/` tree intact |
| D16 | Clerk keys are required env vars on the server from Phase 4 | Auth silently degrading is worse than a boot failure |
| D17 | `reports.js` mixes public reads + citizen writes with static routes before `/:id` | Express matches by registration order |
| D18 | comments/notifications use plain `.from()` calls | Service role bypasses RLS; only transactions need functions |
| D19 | Supabase keys are required server env vars from Phase 5 | Consistent fail-fast |
| D20 | Phase 7.5 (tasks/submissions) is a self-contained feature with its own DB tables | Approving a submission is the only path that closes the loop; those four writes happen inside one `review_submission` DB function |
| D21 | `tasks.assigned_to_id` is deliberately NOT a FK to `profiles` | Admins assign before the worker has signed in; workers resolved live from Clerk |
| D22 | `worker_create_submission` verifies the caller is the assignee in SQL | Trusting the client would let any worker submit against any task |
| D23 | Worker role is independent of admin | Cleanest mental model for two orthogonal roles |
| D24 | Worker assignment notification is inserted in Express after `create_task`, not inside the RPC | Avoids a new SQL migration; `ensureProfile(worker)` runs first because `notifications.user_id` is a FK while `assigned_to_id` is not |

## 18. Deployment Architecture

- `client/` → Vercel (root directory `client`, framework preset Next.js), env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` (server-only), plus the four `NEXT_PUBLIC_CLERK_*_URL` values.
- `server/` → Render Web Service (root `server`, start `node src/index.js`), env: `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CLIENT_ORIGIN`, `AI_ENABLED`, `AI_API_KEY`.
- CORS: allow `CLIENT_ORIGIN` and `http://localhost:3000` only; allow `Authorization` and `Content-Type` headers.
- Health check path on Render: `/health`.
