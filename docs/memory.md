# memory.md — Civic Fix

> Living project state. Update after every meaningful change.
> Last updated: 2026-09-22

---

## Current Phase
**Phase 7.5 + Worker Role + Visual Redesign** — ALL CODE COMPLETE. Phase 7.5 (Assign Task / Submissions / Incomplete / Analytics), worker-role end-to-end, and the full admin/citizen UI redesign are done and verified locally. Every phase from 0 through 8 is code-complete.
Next: deploy to Vercel + Render, then Phase 9 (Testing & Polish) and Phase 10 (Deployment & Demo Prep).

## Current Task
All Phase 0–8 + Phase 7.5 + Worker role code is done. Local dev + browser testing works. Remaining: deploy client to Vercel + server to Render, set env vars on both platforms, set up uptime pinger, then walk the full demo script once on the deployed URLs.

## Project Snapshot
- **Project:** Civic Fix — citizen issue reporting with a public map and an admin resolution panel
- **Event:** BUILD-X (intercollegiate full stack web dev, A.C.E.S. Forum), theme "CITY"
- **Stack:** Next.js 15 (App Router, JS) + Tailwind 3.4 (Vercel) · Node.js/Express (Render) · Supabase Postgres + PostGIS + Storage · Clerk auth
- **Roles:** Guest, Citizen, Worker, Admin (Clerk `publicMetadata.role = "worker" | "admin"`; absent = citizen)
- **Admin workflow:** Report → Assign Task → Worker submits proof → Review → Resolve → Citizen notified

## Completed
- [x] PRD.md
- [x] architecture.md (updated for Next.js)
- [x] database.md
- [x] rules.md (updated for Next.js)
- [x] phases.md (updated for Next.js)
- [x] design.md (updated for Next.js: fonts, Tailwind mapping)
- [x] memory.md
- [x] Phase 2 SQL: `001_schema.sql`, `002_functions.sql`, `003_seed.sql` (80 Nagpur reports), `sanity_checks.sql`, 18 placeholder photos in `server/sql/seed-images/`. Verified on local Postgres 16 + PostGIS
- [x] Phase 1 code: `client/` Next.js skeleton, `server/` Express skeleton, `.env.example` files, `.gitignore`, root README
- [x] Phase 3 UI kit: `ui/` — Button, Card, Input, Textarea, Select, Badge, StatusBadge, Modal, Toast/ToastContext, Skeleton, EmptyState
- [x] Phase 3 layouts: Navbar, Footer, admin Sidebar
- [x] Phase 3 map/report: `MapView` (browse mode, react-leaflet, status-colored pins sized by upvotes) + `DynamicMapView`, `ReportCard`
- [x] Phase 4 server: `@clerk/express` `clerkMiddleware`, `middleware/auth.js`, `utils/AppError.js`, `utils/asyncHandler.js`, `GET /api/v1/me`, Clerk keys required
- [x] Phase 4 client: `@clerk/nextjs`, `ClerkProvider`, `src/middleware.js` route guards, `/sign-in` + `/sign-up` pages, `lib/useApi.js`, role-aware Navbar
- [x] Phase 5 SQL: `004_phase5.sql` — view `reports_with_coords`, functions `upsert_profile`, `create_report`, `toggle_upvote`
- [x] Phase 5 server: `config/supabaseClient.js`, `utils/pagination.js`, `middleware/validate.js`, `middleware/rateLimit.js`, validators, services, controllers, routes
- [x] Phase 6 landing page + `/map` + `/reports` + `/my-reports` + `/notifications` + `/report/new` + `/reports/[id]`
- [x] Phase 7 Admin Panel — server + client (dashboard, reports table, report manage, heatmap, departments)
- [x] Phase 8 server + client (AI classify, City Health page)
- [x] **Phase 7.5 — Assign Task / Submissions / Incomplete / Analytics** (design brief §5-§8): `tasks` + `submissions` tables (sql/007_tasks_submissions.sql), 8 new admin endpoints + 4 new pages (`/admin/tasks`, `/admin/submissions`, `/admin/incomplete`, `/admin/analytics`), `TaskForm`/`TaskTable`/`SubmissionTable`/`SubmissionReviewModal`/`IncompleteTable`/`DepartmentPerformanceTable`. `008_seed_tasks.sql` seeds 8 tasks + 5 submissions for demo. Approving a submission closes the loop: task completed, resolution image attached to report, report marked resolved, citizen notified.
- [x] **Worker role** (Phase 5-worker): `tasks.assigned_to_id` column + `get_worker_tasks` + `worker_create_submission` RPCs (sql/009_worker_role.sql), `requireWorker` middleware, `/api/v1/admin/workers` + `/api/v1/me/tasks` + `/api/v1/me/tasks/:id/submission` endpoints, `/worker/tasks` page with `WorkerTaskCard` + `WorkerSubmissionModal`. Admin TaskForm has a Worker dropdown.
- [x] **Full visual redesign** (Batches 1-6): Landing hero (photo-style SVG), Map (3-col with left filter rail + right list), Report detail (inline action row + lifecycle timeline), Wizard (dashed drop zone), City Health (map + trend + top areas), ReportCard polish, `/reports` + `/my-reports` tabs.
- [x] **Admin panel refresh**: Dashboard at-a-glance row (Reports Map / Recent Reports / Top Categories) above existing charts, clickable card titles routing to full pages, KPI deltas computed client-side from trend data.
- [x] **Admin topbar** (`AdminTopbar.jsx`): search (routes to `/admin/reports?search=`), refresh, bell, profile (Clerk modal), dedicated logout button.
- [x] **Sidebar** rewritten to 8 items in 2 groups (Operations: Dashboard/Reports/Assign Task/Submissions/Incomplete; Insights: Analytics/Heatmap/Departments). Profile block removed from desktop rail (lives in topbar).
- [x] **Reports page polish**: server-side `search` param, CSV export of loaded rows, URL pre-fill from topbar search.
- [x] **Role-aware Navbar**: Guest (Sign In + Report an Issue) / Citizen (Report an Issue) / Worker (My Tasks primary) / Admin (Admin Panel primary). Report an Issue hidden from worker/admin desktop topbar, kept in mobile drawer.
- [x] **Admin filing reports**: admin can submit via `/report/new`, redirected to `/admin/reports/[id]` on submit; `/reports/[id]` shows "Manage in admin panel →" shortcut for admins; admin commenting on their own report does not get the "Official" badge.

## Currently Working On
- Nothing — all code complete. Deployment is the next unblocking step.

## Files Currently Being Modified
- None

## Pending Tasks
- [ ] Deploy client to Vercel (root `client`) and server to Render (root `server`)
- [ ] Set env vars on both platforms
- [ ] Set up uptime pinger for `/health`
- [ ] Run full demo script on deployed URLs
- [ ] Confirm AI provider (Claude vs Gemini) and set `AI_ENABLED=true` + real key
- [ ] Write Phase 9 test matrix results

## Known Bugs
- None

## Current Errors
- None

## Important Decisions
| # | Decision | Date |
|---|---|---|
| 1 | Project = **Civic Fix** | 2026-09-20 |
| 2 | Stack: Express, Supabase (DB + Storage only), Clerk auth, Vercel + Render | 2026-09-20 |
| 3 | Frontend never accesses the DB; Express is the single enforcement point; RLS on with no public policies | 2026-09-20 |
| 4 | In-app notifications only in v1 (no email) | 2026-09-20 |
| 5 | Field-worker role deferred; admin assigns to a department only | 2026-09-20 |
| 6 | AI auto-categorization is optional, feature-flagged | 2026-09-20 |
| 7 | Leaflet + OpenStreetMap for maps (no API key) | 2026-09-20 |
| 8 | Frontend changed from SvelteKit to **Next.js 15 (App Router, JavaScript)** | 2026-09-20 |
| 9 | Local CORS origin is `http://localhost:3000`; local API port is 4000 | 2026-09-20 |
| 10 | Tailwind pinned to 3.4 | 2026-09-20 |
| 11 | Phase 1 installs only what Phase 1 needs | 2026-09-20 |
| 12 | Seed city = Nagpur | 2026-09-20 |
| 13 | Aggregate/geo queries are Postgres functions called via `.rpc()`; only `service_role` may call them | 2026-09-20 |
| 14 | `003_seed.sql` sets `upvote_count` directly (documented exception) | 2026-09-20 |
| 15 | Seed adds a demo profile `user_seed_admin` for official comments | 2026-09-20 |
| 16 | RLS and the `report-images` bucket created inside `001_schema.sql` | 2026-09-20 |
| 17 | Added `lucide-react` to rules.md's approved client dep list | 2026-09-20 |
| 18 | `lib/api.js` stays Clerk-free; `lib/useApi.js` injects the token | 2026-09-20 |
| 19 | Public navbar/footer hidden on `/admin` via `SiteChrome` | 2026-09-20 |
| 20 | Clerk keys are **required** server env vars from Phase 4 | 2026-09-20 |
| 21 | Phase 4 "lazy `profiles` upsert" moved to Phase 5 | 2026-09-20 |
| 22 | Added `GET /api/v1/admin/ping` as a throwaway role smoke test | 2026-09-20 |
| 23 | Report list/detail read `lat`/`lng` via view `reports_with_coords` | 2026-09-20 |
| 24 | `reports.js` mixes public reads + citizen writes in one router (route order matters) | 2026-09-20 |
| 25 | `comments`/`notifications` use plain `.from()` calls instead of RPCs | 2026-09-20 |
| 26 | Supabase keys are **required** server env vars from Phase 5 | 2026-09-20 |
| 27 | Rate limits keyed by Clerk `userId` with IP fallback | 2026-09-20 |
| 28 | Report photo URLs built client-side from `NEXT_PUBLIC_SUPABASE_URL` | 2026-09-20 |
| 29 | Landing page's category grid stays static (local `categories.js` lookup) | 2026-09-20 |
| 30 | `/map`'s sidebar reuses `MapReportListItem`, not `ReportCard` | 2026-09-20 |
| 31 | `/reports/map` markers enriched from the same-filtered `GET /reports` (50 rows) | 2026-09-20 |
| 32 | `suppressHydrationWarning` added to `ui/Input`/`Select`/`Textarea` (extension false positive) | 2026-09-20 |
| 33 | `/reports/[id]` sends Clerk token on the public GET for `viewerHasUpvoted` | 2026-09-20 |
| 34 | Wizard uploads photos only at submit | 2026-09-20 |
| 35 | Wizard step order follows phases.md (Photos first) | 2026-09-20 |
| 36 | `/my-reports` tabs initially skipped | 2026-09-20 |
| 37 | Admin Sidebar nav matches architecture.md routes (not mockup) | 2026-09-20 |
| 38 | Admin departments have `is_active` toggle, no hard delete | 2026-09-20 |
| 39 | AI classify fires once when Photos step is confirmed | 2026-09-21 |
| 40 | AI suggestion only offers a pre-fill, never auto-applies | 2026-09-21 |
| 41 | `/city-health` reuses admin StatCard/ChartCard | 2026-09-21 |
| 42 | Public shells full-width with responsive gutters (new `PAGE_PADDING`) | 2026-09-21 |
| 43 | Admin dashboard "at-a-glance" row added above existing charts; KPI deltas computed client-side from `get_reports_trend`; `ChartCard` gained optional `href` | 2026-09-21 |
| 44 | `AdminTopbar` separate from Sidebar; search routes to `/admin/reports?search=`; refresh is hard reload; profile opens Clerk modal; all buttons carry `suppressHydrationWarning` | 2026-09-21 |
| 45 | Sidebar profile block removed from desktop rail (duplicates topbar); mobile drawer keeps a compact logout | 2026-09-21 |
| 46 | Phase 7.5 built as a complete feature (tasks + submissions tables, 8 RPCs, 4 pages); approving a submission closes the full loop in a single `review_submission` DB function | 2026-09-21 |
| 47 | Worker role is independent of admin; `tasks.assigned_to_id` is NOT a FK to profiles; workers resolved live from Clerk; `worker_create_submission` verifies assignee ownership in SQL | 2026-09-21 |
| 48 | Navbar is role-aware: Guest / Citizen / Worker / Admin variants; Report an Issue hidden from worker/admin desktop topbar but kept in mobile drawer | 2026-09-21 |
| 50 | Worker assignment notification is inserted in Express after `create_task` (not a new RPC) | 2026-09-22 |

## Dependency Log
- Installed in Phase 7 (client): `chart.js` ^4.4, `react-chartjs-2` ^5.2
- Installed in Phase 4 (client): `@clerk/nextjs` ^6.39 · (server): `@clerk/express` ^1.7
- Installed in Phase 3 (client): `leaflet`, `react-leaflet` v5, `leaflet.heat`, `lucide-react`
- Installed in Phase 5 (server): `@supabase/supabase-js` ^2.47, `express-rate-limit` ^7.5

## Assumptions Made (confirm or change)
- Docs review with the team is treated as done because Phase 1 was started.
- Single target city; no multi-city support.
- Categories: pothole, garbage, streetlight, water_leak, drainage, other.
- Departments: Roads, Sanitation, Electricity, Water Supply, Drainage.

## Recent Changes
- 2026-09-22: Worker assignment notification + report-detail/table "Assign to worker" shortcut (pre-fills `/admin/tasks?reportId=`). Docs: PRD §15, architecture D24, database `create_task` note, memory D50.
- 2026-09-21: **Full admin + citizen + worker UI redesign** (Batches 1-6) + Phase 7.5 (Assign Task / Submissions / Incomplete / Analytics) + Worker role end-to-end + role-aware Navbar + AdminTopbar + refreshed Sidebar. New SQL: `007_tasks_submissions.sql`, `008_seed_tasks.sql`, `009_worker_role.sql`. Key decisions D43-D49.
- 2026-09-21: Admin Topbar + role-aware Navbar + Reports page search/export.
- 2026-09-21: Phase 7.5 backend + frontend built.
- 2026-09-21: Worker role built end-to-end.
- 2026-09-21: `008_seed_tasks.sql` seeds 8 tasks + 5 submissions.
- 2026-09-21: `009_worker_role.sql` adds `tasks.assigned_to_id` + 2 worker RPCs + v2 `create_task`.
- 2026-09-21: Full codebase audit confirmed Phase 1-8 was already complete; deleted temporary dev pages.
- 2026-09-21: Public shells switched to full-width edge-to-edge (D42).

## Notes for Later Phases
- ~~Phase 4/7: `change_report_status` needs the admin's row in `profiles`~~ — done.
- Phase 5: report list/detail endpoints need `lat`/`lng` — done via view.
- Phase 6: `ReportCard` must handle a missing image — done.
- Deploy: Render free tier sleeps after 15 min; uptime pinger keeps it warm.

## Next Task
Deploy. Vercel (root `client`) + Render (root `server`) + env vars on both, then run the full demo script on the deployed URLs.

## Deployment Status
| Item | Status | URL |
|---|---|---|
| Client (Vercel) | Not deployed | — |
| Server (Render) | Not deployed | — |
| Supabase project | Created; SQL 001-009 run; seed images uploaded | — |
| Clerk application | Created; admin + worker users set | — |
| Uptime pinger | Not set up | — |

## Environment Checklist (values live in dashboards, never in this file)
- Client (Vercel): `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` (server-only), plus the four `NEXT_PUBLIC_CLERK_*_URL` values in `client/.env.example`
- Server (Render): `NODE_ENV`, `PORT` (Render sets it), `CLIENT_ORIGIN`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `AI_ENABLED`, `AI_API_KEY`

## Phase Progress
| Phase | Status |
|---|---|
| 0 Documentation | Done |
| 1 Setup & accounts | Code + local dev done; deploys pending |
| 2 Database & seed | SQL 001-006 run in Supabase; verified |
| 3 UI foundation | Done + responsive tested |
| 4 Auth & roles | Done; admin + worker Clerk users created |
| 5 Reports API | Done; Supabase verified |
| 6 Citizen frontend | Code-complete + browser-verified |
| 7 Admin panel | Code-complete + data verified |
| 7.5 Assign Task / Submissions / Incomplete / Analytics | Code-complete + seeded + verified locally |
| 8 AI + City Health | Code-complete; needs AI key for live verify |
| Worker role | Code-complete + Clerk users + verified locally |
| Visual redesign | Code-complete + browser-verified |
| 9 Testing & polish | Not started |
| 10 Deployment & demo | Not started |