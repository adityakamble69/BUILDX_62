# phases.md — Civic Fix

> Development roadmap. Each phase produces a meaningful working result.
> Tick checkboxes as work completes and mirror progress in `memory.md`.
> Time estimates are relative weights (S/M/L) since the exact hackathon duration is not yet fixed; scale them to the available hours.

**Priority order if time runs short:** Phases 0–6 and 9–10 are the must-have core. Phases 7 and 8 are the differentiators; do 7 before 8.

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
**Objective:** Empty but deployable skeletons for client and server, all accounts ready.
**Tasks**
- [ ] Create GitHub repo `civic-fix` with `client/`, `server/`, `docs/`
- [ ] Create Supabase project; enable `postgis` and `pgcrypto`
- [ ] Create Clerk application; enable email + Google; customize session token with `{ "metadata": "{{user.public_metadata}}" }`
- [x] Scaffold Next.js app (App Router, JS) + Tailwind 3.4 in `client/`
- [x] Scaffold Express app in `server/` with `/health`
- [x] Add `.env.example` files and `.gitignore`
- [ ] Deploy empty client to Vercel (root `client`) and server to Render (root `server`, start `node src/index.js`, health check `/health`)
- [ ] Set up uptime pinger for `/health`
**Files:** `client/package.json`, `server/src/index.js`, `.env.example` files
**Dependencies:** Phase 0
**Expected result:** Vercel URL loads a placeholder page; Render `/health` returns OK; CORS works between them.
**Completion criteria:** Client can call `/health` on the deployed server from the deployed client.

---

## Phase 2 — Database & Seed Data  (M)
**Objective:** Full schema live with realistic demo data.
**Tasks**
- [x] Write `001_schema.sql` (schema, RLS on all tables with no public policies, `report-images` bucket)
- [x] Write `002_functions.sql` (duplicates, status change, stats/map/heatmap RPCs, permissions)
- [x] Write `003_seed.sql` (80 reports around Nagpur with clusters, history, comments, notifications)
- [x] Write `sanity_checks.sql` and placeholder photos in `seed-images/`
- [ ] Run `001_schema.sql` in the Supabase SQL editor
- [ ] Run `002_functions.sql`
- [ ] Run `003_seed.sql`
- [ ] Upload `server/sql/seed-images/*` to bucket `report-images` under the folder `seed/`
- [ ] Run each block of `sanity_checks.sql` and compare with the expected values in its comments
**Files:** `server/sql/001_schema.sql`, `002_functions.sql`, `003_seed.sql`, `sanity_checks.sql`, `seed-images/`
**Dependencies:** Phase 1
**Expected result:** DB populated; queries in `database.md` return sensible results.
**Completion criteria:** Stats query and duplicate function return expected rows for seeded data.

---

## Phase 3 — UI Foundation & Design System  (M)
**Objective:** Reusable UI kit and layouts matching `design.md`.
**Tasks**
- [x] Configure Tailwind theme tokens (colors, fonts, radius, shadows)
- [x] Build `ui/` components: Button, Card, Input, Textarea, Select, Badge, Modal, Toast, Skeleton, EmptyState
- [x] Build Navbar, Footer, admin Sidebar layouts
- [x] Build `MapView` component (browse mode) with `react-leaflet` (loaded via `next/dynamic`, `ssr: false`)
- [x] Build `ReportCard` and `StatusBadge`
- [ ] Responsive check at 360 / 768 / 1280 px
**Files:** `client/src/components/**`, `tailwind.config.js`, `client/src/app/globals.css`
**Dependencies:** Phase 1
**Expected result:** A style-guide page (temporary) shows all components consistently.
**Completion criteria:** Components render correctly on mobile and desktop with no hardcoded colors.

---

## Phase 4 — Authentication & Roles  (M)
**Objective:** Sign-in works end to end, admin role enforced on the backend.
**Tasks**
- [x] Integrate `@clerk/nextjs` (ClerkProvider, `middleware.js`, sign-in/sign-up catch-all pages, user button)
- [x] `lib/api.js` fetch wrapper attaching the Clerk token (token passed in from `useAuth().getToken` via the `useApi` hook)
- [x] Server: `clerkMiddleware`, `requireAuth`, `requireAdmin`
- [x] `GET /api/v1/me` (returns id + role) for a quick auth test
- [~] Lazy `profiles` upsert on first authenticated write — **moved to Phase 5** (needs the Supabase client, and Phase 4 has no write endpoints)
- [ ] Set `role: "admin"` on one Clerk user; verify claims reach the server
- [x] Route guards: `middleware.js` for citizen pages and `/admin`, plus the `(admin)` layout check
**Files:** `client/src/app/sign-in`, `client/src/app/sign-up`, `client/src/lib/api.js`, `client/src/lib/useApi.js`, `client/src/middleware.js`, `client/src/app/(admin)/admin/layout.jsx`, `server/src/middleware/auth.js`
**Dependencies:** Phases 1, 3
**Expected result:** Citizen and admin logins behave differently; admin API returns 403 for citizens.
**Completion criteria:** Tested with a citizen token and an admin token on the deployed API.

---

## Phase 5 — Core Backend: Reports API  (L)
**Objective:** All citizen and public endpoints working.
**Tasks**
- [x] Zod validators, pagination util (`AppError`, `errorHandler`, `asyncHandler` done in Phase 4)
- [x] Lazy `profiles` upsert on the first authenticated write (moved here from Phase 4) — `upsert_profile` RPC + `ensureProfile()`
- [x] `GET /categories`
- [x] `GET /reports`, `GET /reports/map`, `GET /reports/:id`
- [x] `POST /uploads/sign`
- [x] `GET /reports/nearby-duplicates`
- [x] `POST /reports`
- [x] `POST /reports/:id/upvote` (toggle)
- [x] `POST /reports/:id/comments`, `DELETE /comments/:id`
- [x] `GET /me/reports`, `GET /me/notifications`, `PATCH /me/notifications/read`
- [x] `GET /stats/public`
- [x] Rate limits on write endpoints (global 120/min, 10/hr on `POST /reports`, 15/min on `POST /comments`)
- [x] Save a REST client collection in `server/` (`server/requests/reports.http`)
- [ ] Run `004_phase5.sql` in the Supabase SQL editor (after 001–003) and its block in `sanity_checks.sql`
**Files:** `server/src/routes|controllers|services|validators/**`, `server/sql/004_phase5.sql`
**Dependencies:** Phases 2, 4
**Expected result:** Full public/citizen API usable with a REST client.
**Completion criteria:** Every endpoint tested for success, validation error, and unauthorized cases — done here with a fake Supabase project (boot + auth + validation paths only); real data-path testing needs Phase 2's SQL actually run in Supabase.

---

## Phase 6 — Citizen Frontend Features  (L)
**Objective:** The complete citizen experience against the real API.
**Tasks**
- [x] Landing page with live stats
- [x] `/map` with filters and marker popups
- [x] `/reports` feed with filters, sort, pagination
- [ ] `/reports/[id]` detail with photos, timeline, upvote, comments
- [ ] `/report/new` multi-step form: photo (client-side compression) → location pick / "use my location" → details → duplicate check → submit
- [ ] Reverse geocode area name (Nominatim) on pin change
- [ ] `/my-reports`
- [ ] Notification bell + `/notifications`
- [ ] Optimistic upvote, toasts, loading/empty/error states
**Files:** `client/src/app/**`, `client/src/components/report/**`, `client/src/components/map/**`
**Dependencies:** Phases 3, 4, 5
**Expected result:** A citizen can file, browse, upvote, and comment on real data on mobile and desktop.
**Completion criteria:** Full citizen journey from PRD §11 works on the deployed site.

---

## Phase 7 — Admin Panel  (L)
**Objective:** The admin can run the full resolution workflow and see analytics.
**Tasks**
- [ ] Server: `/admin/reports`, status change (RPC), assign, resolution image, deletes, `/admin/stats`, `/admin/heatmap`, departments CRUD
- [ ] `/admin` dashboard: KPI cards + Chart.js charts (by category, by status, trend)
- [ ] `/admin/reports` table with filters and sorting by upvotes/severity
- [ ] `/admin/reports/[id]`: assign department, change status with note, upload after photo
- [ ] `/admin/heatmap` (Leaflet heat layer)
- [ ] `/admin/departments`
- [ ] Notification created on each status change (verify from citizen account)
**Files:** `server/src/**` admin routes/services, `client/src/app/(admin)/**`
**Dependencies:** Phases 5, 6
**Expected result:** Admin resolves a report and the citizen sees the update and notification.
**Completion criteria:** Admin journey from PRD §11 works end to end on the deployed site.

---

## Phase 8 — Differentiators (AI + City Health)  (M)
**Objective:** Add the features that make judges remember the project.
**Tasks**
- [ ] `POST /ai/classify` (photo + text → suggested category + severity), behind `AI_ENABLED`
- [ ] Form pre-fills AI suggestion, user can override; store `ai_category_id`/`ai_severity`
- [ ] Graceful fallback when AI fails or is disabled
- [ ] `/city-health` public page (resolution rate, avg fix time, category breakdown, top open issues)
- [ ] Optional: "Official response" badge on admin comments
**Files:** `server/src/services/aiService.js`, `client/src/app/city-health/page.jsx`, `ReportForm` update
**Dependencies:** Phase 6 (and 7 for stats consistency)
**Expected result:** Filing a report feels smart; City Health tells a strong story.
**Completion criteria:** AI suggestion appears within a few seconds, and the form still works when AI is turned off.

---

## Phase 9 — Testing, Polish & Optimization  (M)
**Objective:** Make it demo-proof.
**Tasks**
- [ ] Manual test matrix: guest / citizen / admin × mobile / desktop
- [ ] Fix bugs and rough edges; check empty, loading, and error states
- [ ] Accessibility pass (labels, focus, contrast, alt text)
- [ ] Performance pass (image sizes, lazy loading, pagination)
- [ ] Security pass (no secrets in repo, CORS, role checks, rate limits)
- [ ] Re-seed the database with clean demo data
- [ ] Prepare 2 demo accounts (citizen + admin) and note credentials outside the repo
**Files:** across the project
**Dependencies:** Phases 6–8
**Expected result:** No blocking bugs in the demo path.
**Completion criteria:** The full demo script runs twice without failure on the deployed URLs.

---

## Phase 10 — Deployment & Demo Prep  (S)
**Objective:** Final production state and presentation assets.
**Tasks**
- [ ] Confirm production env vars on Vercel and Render
- [ ] Confirm CORS and Clerk allowed origins for the production domain
- [ ] Confirm uptime pinger is running; warm the server before presenting
- [ ] Generate a QR code for the live URL
- [ ] Write a concise README (problem, features, stack, screenshots, live link)
- [ ] Prepare the 2-minute demo script: report → upvote/duplicate → admin assign → resolve → citizen notification → City Health
- [ ] Prepare slides (problem, solution, architecture, impact, future)
- [ ] Tag final release `v1.0`
**Files:** `README.md`, demo notes (outside repo if they contain credentials)
**Dependencies:** Phase 9
**Expected result:** Live product + rehearsed presentation.
**Completion criteria:** A stranger can scan the QR code and complete a report on their phone.
