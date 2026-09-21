# phases.md — Civic Fix

> Development roadmap. Each phase produces a meaningful working result.
> Tick checkboxes as work completes and mirror progress in `memory.md`.
> Time estimates are relative weights (S/M/L).

**Priority order if time runs short:** Phases 0–6 and 9–10 are the must-have core. Phase 7, 7.5, 7.6, and 8 are the differentiators.

---

## Phase 0 — Documentation Foundation  (S)
**Objective:** Lock the source-of-truth docs.
**Tasks**
- [x] Write PRD.md
- [x] Write architecture.md
- [x] Write database.md
- [x] Write rules.md
- [x] Write phases.md
- [x] Write design.md
- [x] Write memory.md
- [x] Review docs for contradictions with the team
**Files:** `docs/*.md`
**Dependencies:** none
**Expected result:** Everyone agrees on scope, stack, and schema.
**Completion criteria:** Docs committed to the repo under `/docs`.

---

## Phase 1 — Project Setup & Accounts  (S)
**Objective:** Empty but deployable skeletons for client and server.
**Tasks**
- [x] Create GitHub repo `civic-fix`
- [x] Create Supabase project; enable `postgis` and `pgcrypto`
- [x] Create Clerk application
- [x] Scaffold Next.js app + Tailwind 3.4 in `client/`
- [x] Scaffold Express app in `server/`
- [x] Add `.env.example` files and `.gitignore`
- [ ] Deploy client to Vercel + server to Render
- [ ] Set up uptime pinger
**Dependencies:** Phase 0
**Expected result:** Vercel URL loads a placeholder page; Render `/health` returns OK.
**Completion criteria:** Client can call `/health` on the deployed server.

---

## Phase 2 — Database & Seed Data  (M)
**Objective:** Full schema live with realistic demo data.
**Tasks**
- [x] Write `001_schema.sql`
- [x] Write `002_functions.sql`
- [x] Write `003_seed.sql`
- [x] Write `sanity_checks.sql` and placeholder photos
- [x] Run `001` → `002` → `003` in the Supabase SQL editor
- [x] Upload `server/sql/seed-images/*` to bucket `report-images` under `seed/`
- [x] Run sanity_checks.sql blocks and compare with expected values
**Dependencies:** Phase 1
**Completion criteria:** Stats query and duplicate function return expected rows.

---

## Phase 3 — UI Foundation & Design System  (M)
**Objective:** Reusable UI kit and layouts matching `design.md`.
**Tasks**
- [x] Configure Tailwind theme tokens
- [x] Build `ui/` components
- [x] Build Navbar, Footer, admin Sidebar
- [x] Build `MapView` + `DynamicMapView`
- [x] Build `ReportCard` and `StatusBadge`
- [x] Responsive check at 360 / 768 / 1280 px
**Dependencies:** Phase 1
**Completion criteria:** Components render correctly on mobile and desktop.

---

## Phase 4 — Authentication & Roles  (M)
**Objective:** Sign-in works end to end, admin role enforced on the backend.
**Tasks**
- [x] Integrate `@clerk/nextjs`
- [x] `lib/api.js` + `lib/useApi.js`
- [x] Server: `clerkMiddleware`, `requireAuth`, `requireAdmin`
- [x] `GET /api/v1/me`
- [x] Lazy `profiles` upsert (moved to Phase 5)
- [x] Set `role: "admin"` on one Clerk user
- [x] Route guards: middleware + `(admin)` layout check
**Dependencies:** Phases 1, 3
**Completion criteria:** Citizen and admin logins behave differently; admin API returns 403 for citizens.

---

## Phase 5 — Core Backend: Reports API  (L)
**Objective:** All citizen and public endpoints working.
**Tasks**
- [x] Zod validators, pagination util
- [x] `upsert_profile` RPC + `ensureProfile()`
- [x] `GET /categories`
- [x] `GET /reports`, `GET /reports/map`, `GET /reports/:id`
- [x] `POST /uploads/sign`
- [x] `GET /reports/nearby-duplicates`
- [x] `POST /reports`
- [x] `POST /reports/:id/upvote`
- [x] `POST /reports/:id/comments`, `DELETE /comments/:id`
- [x] `GET /me/reports`, `GET /me/notifications`, `PATCH /me/notifications/read`
- [x] `GET /stats/public`
- [x] Rate limits on write endpoints
- [x] REST client collection in `server/`
- [x] Run `004_phase5.sql` in Supabase
**Dependencies:** Phases 2, 4
**Completion criteria:** Every endpoint tested for success, validation error, and unauthorized cases.

---

## Phase 6 — Citizen Frontend Features  (L)
**Objective:** Complete citizen experience against the real API.
**Tasks**
- [x] Landing page with live stats
- [x] `/map` with filters and marker popups
- [x] `/reports` feed with filters, sort, pagination
- [x] `/reports/[id]` detail with photos, timeline, upvote, comments
- [x] `/report/new` multi-step form
- [x] Reverse geocode area name (Nominatim)
- [x] `/my-reports`
- [x] Notification bell + `/notifications`
- [x] Optimistic upvote, toasts, loading/empty/error states
**Dependencies:** Phases 3, 4, 5
**Completion criteria:** Full citizen journey from PRD §11 works on the deployed site.

---

## Phase 7 — Admin Panel  (L)
**Objective:** The admin can run the full resolution workflow and see analytics.
**Tasks**
- [x] Server: `/admin/reports`, status change, assign, resolution image, deletes, `/admin/stats`, `/admin/heatmap`, departments CRUD
- [x] `/admin` dashboard: KPI cards + Chart.js charts
- [x] `/admin/reports` table with filters + sorting
- [x] `/admin/reports/[id]`: assign, change status, upload after photo
- [x] `/admin/heatmap`
- [x] `/admin/departments`
- [x] Notification created on each status change
**Dependencies:** Phases 5, 6
**Completion criteria:** Admin journey from PRD §11 works end to end.

---

## Phase 7.5 — Admin Workflow Expansion (Assign Task / Submissions / Incomplete / Analytics)  (L)
**Objective:** Extend the admin panel from "manage reports" to a full task-assignment and resolution workflow.
**Tasks**
- [x] `tasks` table + `submissions` table + 8 RPCs (sql/007_tasks_submissions.sql)
- [x] `GET/POST /admin/tasks`, `PATCH /admin/tasks/:id/status`
- [x] `GET/POST /admin/submissions`, `PATCH /admin/submissions/:id/review`
- [x] `GET /admin/incomplete` (days-pending aging + urgency color coding)
- [x] `GET /admin/analytics` (KPIs + department performance + status distribution)
- [x] `/admin/tasks` page (inline form + filterable table)
- [x] `/admin/submissions` page (table + review modal with before/after + grade + remarks)
- [x] `/admin/incomplete` page (tabs + aging indicators + filter)
- [x] `/admin/analytics` page (KPI cards + category/status donuts + trend + heatmap + department table)
- [x] `review_submission` closes the loop: task completed, after photo attached, report resolved, citizen notified
- [x] `008_seed_tasks.sql` for demo data
**Files:** `server/sql/007_tasks_submissions.sql`, `server/sql/008_seed_tasks.sql`, `server/src/services/{taskService,submissionService,analyticsService}.js`, `server/src/controllers/admin{Tasks,Submissions,Analytics}Controller.js`, `client/src/app/(admin)/admin/{tasks,submissions,incomplete,analytics}/page.jsx`, `client/src/components/admin/{TaskForm,TaskTable,SubmissionTable,SubmissionReviewModal,IncompleteTable,DepartmentPerformanceTable}.jsx`
**Dependencies:** Phases 7, 6
**Completion criteria:** Full assign → submit → review → approve → citizen notified flow works end to end.

---

## Phase 7.6 — Worker Role  (M)
**Objective:** Give field workers an account so assigned tasks reach them in-app.
**Tasks**
- [x] Clerk `worker` role (`publicMetadata.role = "worker"`, independent of admin)
- [x] `tasks.assigned_to_id` column + index (sql/009_worker_role.sql)
- [x] `requireWorker` middleware
- [x] `GET /admin/workers` — list Clerk users with role=worker
- [x] `GET /me/tasks` — worker's own assigned tasks
- [x] `POST /me/tasks/:id/submission` — worker submits resolution evidence
- [x] `worker_create_submission` RPC with assignee ownership check
- [x] Admin `TaskForm` gained "Assign to Worker" dropdown
- [x] `/worker/tasks` page with tabs + `WorkerTaskCard`
- [x] `WorkerSubmissionModal` — worker uploads resolution photo + details
- [x] Role-aware Navbar (Worker sees "My Tasks" primary button)
**Files:** `server/sql/009_worker_role.sql`, `server/src/middleware/auth.js`, `server/src/services/workerService.js`, `server/src/controllers/workersController.js`, `server/src/routes/{admin,me}.js`, `client/src/app/worker/tasks/page.jsx`, `client/src/components/worker/{WorkerTaskCard,WorkerSubmissionModal}.jsx`, `client/src/middleware.js`
**Dependencies:** Phase 7.5
**Expected result:** Admin assigns to a worker; worker logs in, sees the task, submits a proof photo; admin approves; citizen is notified.
**Completion criteria:** End-to-end worker loop works with a real Clerk worker account.

---

## Phase 8 — Differentiators (AI + City Health)  (M)
**Objective:** Add the features that make judges remember the project.
**Tasks**
- [x] `POST /ai/classify` (photo + text → suggested category + severity), behind `AI_ENABLED`
- [x] Form pre-fills AI suggestion, user can override; stores `ai_category_id`/`ai_severity`
- [x] Graceful fallback when AI fails or is disabled
- [x] `/city-health` public page (resolution rate, avg fix time, category breakdown, top open issues)
- [x] Optional: "Official response" badge on admin comments
**Dependencies:** Phase 6 (and 7 for stats consistency)
**Completion criteria:** AI suggestion appears within a few seconds, and the form still works when AI is turned off. Code-complete; needs `AI_ENABLED=true` + a real `AI_API_KEY` and live Supabase data to verify end to end.

---

## Phase 9 — Testing, Polish & Optimization  (M)
**Objective:** Make it demo-proof.
**Tasks**
- [ ] Manual test matrix: guest / citizen / worker / admin × mobile / desktop
- [ ] Fix bugs and rough edges; check empty, loading, and error states
- [ ] Accessibility pass (labels, focus, contrast, alt text)
- [ ] Performance pass (image sizes, lazy loading, pagination)
- [ ] Security pass (no secrets in repo, CORS, role checks, rate limits)
- [ ] Re-seed the database with clean demo data
- [ ] Prepare 3 demo accounts (citizen + admin + worker)
**Dependencies:** Phases 6–8, 7.5, 7.6
**Expected result:** No blocking bugs in the demo path.
**Completion criteria:** The full demo script runs twice without failure on the deployed URLs.

---

## Phase 10 — Deployment & Demo Prep  (S)
**Objective:** Final production state and presentation assets.
**Tasks**
- [ ] Confirm production env vars on Vercel and Render
- [ ] Confirm CORS and Clerk allowed origins
- [ ] Confirm uptime pinger is running
- [ ] Generate a QR code for the live URL
- [ ] Write a concise README
- [ ] Prepare the 2-minute demo script
- [ ] Prepare slides
- [ ] Tag final release `v1.0`
**Dependencies:** Phase 9
**Completion criteria:** A stranger can scan the QR code and complete a report on their phone.