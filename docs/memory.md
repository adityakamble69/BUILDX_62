# memory.md — Civic Fix

> Living project state. Update after every meaningful change.
> Last updated: 2026-09-20

---

## Current Phase
**Phase 5 — Core Backend: Reports API** (code complete; blocked on running `001`–`004` SQL in a real Supabase project — nothing here has touched real data yet)
Next: create the Supabase project, run all four SQL files + sanity checks, upload seed images, finish the Phase 4 Clerk checklist, then **Phase 6 — Citizen Frontend Features**

## Current Task
Create the Supabase project (enable `postgis`, `pgcrypto`), run `001_schema.sql` → `002_functions.sql` → `003_seed.sql` → `004_phase5.sql` in that order in the SQL editor, upload `server/sql/seed-images/*` to the `report-images` bucket under `seed/`, then run every block of `sanity_checks.sql` (14 checks now) and compare against the expected values in its comments. In parallel: create the Clerk application (still pending from Phase 4) and run `server/requests/reports.http` end to end once both are live.

## Project Snapshot
- **Project:** Civic Fix — citizen issue reporting with a public map and an admin resolution panel
- **Event:** BUILD-X (intercollegiate full stack web dev, A.C.E.S. Forum), theme "CITY"
- **Stack:** Next.js 15 (App Router, JS) + Tailwind 3.4 (Vercel) · Node.js/Express (Render) · Supabase Postgres + PostGIS + Storage · Clerk auth
- **Roles:** Guest, Citizen, Admin (Clerk `publicMetadata.role = "admin"`)

## Completed
- [x] PRD.md
- [x] architecture.md (updated for Next.js)
- [x] database.md
- [x] rules.md (updated for Next.js)
- [x] phases.md (updated for Next.js)
- [x] design.md (updated for Next.js: fonts, Tailwind mapping)
- [x] memory.md
- [x] Phase 2 SQL: `001_schema.sql`, `002_functions.sql`, `003_seed.sql` (80 Nagpur reports), `sanity_checks.sql`, 18 placeholder photos in `server/sql/seed-images/`. Verified on a local Postgres 16 with PostGIS stubbed out (counts, integrity, re-run, functions, trigger all passed); the real PostGIS calls are unverified until run on Supabase
- [x] Phase 1 code: `client/` Next.js skeleton (placeholder page that calls `/health`), `server/` Express skeleton (`/health`, CORS, helmet, env validation, error handler), `.env.example` files, `.gitignore`, root README
- [x] Phase 3 UI kit: `ui/` — Button, Card, Input, Textarea, Select, Badge, StatusBadge, Modal, Toast/ToastContext, Skeleton, EmptyState
- [x] Phase 3 layouts: Navbar (desktop nav + mobile drawer + floating "Report an Issue" FAB), Footer, admin Sidebar (dark rail + mobile drawer)
- [x] Phase 3 map/report: `MapView` (browse mode, react-leaflet, status-colored pins sized by upvotes) + `DynamicMapView` (`next/dynamic`, `ssr:false`), `ReportCard`
- [x] Phase 3 shell: root `layout.jsx` now renders `ToastProvider` → `Navbar` → page → `Footer`; temporary `/style-guide` page exercises every component
- [x] Phase 4 server: `@clerk/express` `clerkMiddleware` in `index.js`, `middleware/auth.js` (`getAuthContext`/`requireAuth`/`requireAdmin`), `utils/AppError.js`, `utils/asyncHandler.js`, `GET /api/v1/me`, `GET /api/v1/admin/ping`, Clerk keys required in `config/env.js`, `requests/auth.http`
- [x] Phase 4 client: `@clerk/nextjs` installed; `ClerkProvider` in the root layout, `src/middleware.js` route guards, `/sign-in` + `/sign-up` catch-all pages, `lib/useApi.js`, `lib/utils/clerkAppearance.js`, Navbar `SignedIn`/`SignedOut`/`UserButton`, Sidebar `SignOutButton`, `(admin)/admin/layout.jsx` server-side role guard + placeholder `/admin` page, temporary `/auth-check` page
- [x] Phase 4 verification done here: server boots and returns 401 for no/garbage token on `/api/v1/me` and `/api/v1/admin/ping`, 404 envelope intact; `next build` compiles all 7 routes and the middleware (fonts stubbed locally, see below)
- [x] Phase 5 SQL: `server/sql/004_phase5.sql` — view `reports_with_coords`, functions `upsert_profile`, `create_report` (atomic report + images + initial status_history), `toggle_upvote`; revoked from `anon`/`authenticated`, granted to `service_role` only, matching the Phase 2 pattern. `sanity_checks.sql` extended with 4 more checks (11–14)
- [x] Phase 5 server: `config/supabaseClient.js` (service-role client), `utils/pagination.js`, `middleware/validate.js`, `middleware/rateLimit.js` (global 120/min + 10/hr create-report + 15/min create-comment, keyed by Clerk userId with IP fallback), validators for reports/comments/uploads/notifications
- [x] Phase 5 services: `categoryService`, `reportService` (list/map/detail/duplicates/create/upvote/myReports), `uploadService` (signed upload URLs, path `reports/<userId>/<uuid>.<ext>`), `statsService`, `notificationService`, `commentService` (delete restricted to the comment's own author — admin delete-any is a Phase 7 route)
- [x] Phase 5 routes: `public.js` (`/categories`, `/stats/public`), `reports.js` (public reads + citizen writes combined in one router, **static paths `/map` and `/nearby-duplicates` registered before the dynamic `/:id`** — see D17), `comments.js`, `uploads.js`, `me.js` extended with `/reports`, `/notifications`, `/notifications/read`
- [x] Phase 5 verification done here (fake Supabase project, so only the shape is provable, not real data): server boots with `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` required; every route returns the correct status/envelope — 401 before validation on protected routes, 422 with `details` for bad query/body (bad `pageSize`, non-uuid `:id`), and a clean 500 (`{ error: { code: "INTERNAL_ERROR" } }`, no stack leaked) instead of a crash when Supabase itself is unreachable; confirmed `/reports/nearby-duplicates` and `/reports/map` are NOT swallowed by the `/:id` route

## Currently Working On
- Phase 5 sign-off: create the Supabase project and run the SQL (nothing here can be tested against real data until then); Phase 4's Clerk account setup is still outstanding alongside it

## Files Currently Being Modified
- None

## Pending Tasks
- [ ] Create the Clerk application; enable email + Google; **Sessions → Customize session token** must be set to `{ "metadata": "{{user.public_metadata}}" }` or every user reads as a citizen
- [ ] Set `publicMetadata` `{ "role": "admin" }` on one Clerk user and confirm `/api/v1/me` returns `role: "admin"`
- [ ] Run the Phase 4 test matrix: guest → `/report/new` redirects to sign-in; citizen → `/admin` redirects to `/`; citizen token → `/api/v1/admin/ping` = 403; admin token = 200
- [ ] Manually check `/style-guide` at 360 / 768 / 1280 px in a real browser (not yet done)
- [ ] Delete the temporary `/style-guide` and `/auth-check` pages before the demo
- [ ] Verify `next build` succeeds where Google Fonts are reachable (this dev sandbox blocks `fonts.googleapis.com`, so `next/font/google` could not be build-verified here; code is unchanged from the documented approach)
- [ ] Create GitHub repo `civic-fix` and push
- [ ] Create Supabase project (Phase 1 step, needed now); enable `postgis` and `pgcrypto`
- [ ] Run the three SQL files, upload seed images, run sanity checks (Phase 2)
- [ ] Deploy client to Vercel (root `client`) and server to Render (root `server`)
- [ ] Set up uptime pinger for `/health`
- [ ] Confirm the demo city (seed assumes Nagpur; coordinates are in `003_seed.sql`)
- [ ] Decide AI provider (Claude vs Gemini) and get an API key
- [ ] Decide hackathon time budget and trim phases if needed (Phase 8 is optional)

## Known Bugs
- None

## Current Errors
- None

## Important Decisions
| # | Decision | Date |
|---|---|---|
| 1 | Project = **Civic Fix** (chosen for public usability + admin panel + judge-friendly demo) | 2026-09-20 |
| 2 | Stack: Express, Supabase (DB + Storage only), Clerk auth, Vercel + Render | 2026-09-20 |
| 3 | Frontend never accesses the DB; Express is the single enforcement point; RLS on with no public policies | 2026-09-20 |
| 4 | In-app notifications only in v1 (no email) | 2026-09-20 |
| 5 | Field-worker role deferred; admin assigns to a department only | 2026-09-20 |
| 6 | AI auto-categorization is optional, feature-flagged, done after the core loop | 2026-09-20 |
| 7 | Leaflet + OpenStreetMap for maps (no API key) | 2026-09-20 |
| 8 | Frontend changed from SvelteKit to **Next.js 15 (App Router, JavaScript)**; backend, DB, auth unchanged | 2026-09-20 |
| 9 | Local CORS origin is `http://localhost:3000` (Next.js dev), not 5173; local API port is 4000 | 2026-09-20 |
| 10 | Tailwind pinned to 3.4 so the `design.md` token config works as written | 2026-09-20 |
| 11 | Phase 1 installs only what Phase 1 needs (client: next, react, react-dom, tailwindcss, postcss, autoprefixer; server: express, cors, helmet, dotenv, zod). Other approved deps are added in the phase that uses them | 2026-09-20 |
| 12 | Seed city = Nagpur (approximate locality coordinates) | 2026-09-20 |
| 13 | Aggregate/geo queries are Postgres functions called via `.rpc()`; all DB functions are executable only by `service_role` | 2026-09-20 |
| 14 | `003_seed.sql` sets `upvote_count` directly (documented exception to the trigger rule); it is re-runnable and only deletes `user_seed_*` rows | 2026-09-20 |
| 15 | Seed adds a 6th demo profile `user_seed_admin` for official comments and status changes | 2026-09-20 |
| 16 | RLS and the `report-images` bucket (public read, JPEG/PNG/WebP, 5 MB) are created inside `001_schema.sql` | 2026-09-20 |

| 17 | Added `lucide-react` to rules.md's approved client dependency list (design.md already required Lucide icons; the list had been missed) | 2026-09-20 |
| 18 | `lib/api.js` stays Clerk-free; a new `lib/useApi.js` hook injects the token. One fetch wrapper is preserved and `api.js` remains usable from non-React code | 2026-09-20 |
| 19 | Public navbar/footer hidden on `/admin` via a `SiteChrome` client wrapper rather than moving every public page into a `(public)` route group (architecture D15) | 2026-09-20 |
| 20 | `CLERK_PUBLISHABLE_KEY`/`CLERK_SECRET_KEY` are **required** server env vars from Phase 4; the server refuses to boot without them (architecture D16) | 2026-09-20 |
| 21 | Phase 4's "lazy `profiles` upsert" task moved to Phase 5: it needs `@supabase/supabase-js` (a Phase 5 dependency) and Phase 4 has no authenticated write endpoints to hook it to. `phases.md` updated in both places | 2026-09-20 |
| 22 | Added `GET /api/v1/admin/ping` as a throwaway role smoke test so `requireAdmin` is testable before Phase 7; documented in architecture.md §10 and to be removed once real admin routes exist | 2026-09-20 |
| 23 | Report list/detail read `lat`/`lng` via a new view `reports_with_coords` rather than an RPC, so supabase-js can still use `.select()` with embedded relations (architecture D14 follow-up, documented in database.md §8) | 2026-09-20 |
| 24 | `reports.js` combines public reads and citizen writes in one router instead of a second `citizen.js`, specifically so route registration order can guarantee `/map` and `/nearby-duplicates` are matched before the dynamic `/:id` (architecture D17) | 2026-09-20 |
| 25 | `comments`/`notifications` use plain `supabase.from()` calls instead of RPCs; only multi-table transactions (`create_report`) or PostGIS math need a DB function now that the service-role key bypasses RLS (architecture D18) | 2026-09-20 |
| 26 | `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are **required** server env vars from Phase 5, same fail-fast pattern as Clerk in Phase 4 (architecture D19) | 2026-09-20 |
| 27 | Rate limits are keyed by Clerk `userId` when authenticated, falling back to IP for guests, so the limit tracks a person rather than a shared office/campus IP | 2026-09-20 |

## Dependency Log
- Approved for later phases (client): `chart.js` + `react-chartjs-2` (Phase 7/8)
- Installed in Phase 4 (client): `@clerk/nextjs` ^6.39 · (server): `@clerk/express` ^1.7
- Installed in Phase 3 (client): `leaflet`, `react-leaflet` v5, `leaflet.heat`, `lucide-react` — `lucide-react` was missing from rules.md's approved list even though design.md §7 mandates Lucide icons; added it to rules.md to resolve the conflict before installing
- Installed in Phase 5 (server): `@supabase/supabase-js` ^2.47, `express-rate-limit` ^7.5

## Assumptions Made (confirm or change)
- Docs review with the team is treated as done because Phase 1 was started.
- Single target city; no multi-city support.
- Team size and exact hackathon duration not yet known.
- Categories: pothole, garbage, streetlight, water_leak, drainage, other.
- Departments: Roads, Sanitation, Electricity, Water Supply, Drainage.

## Recent Changes
- 2026-09-20: Phase 4 auth implemented on both sides (see Completed). Docs updated: architecture.md §5/§10/§14 + D15/D16, phases.md Phase 4 ticks and the profiles-upsert move to Phase 5.
- 2026-09-20: Phase 5 Reports API implemented (see Completed): `sql/004_phase5.sql`, all services/controllers/routes, rate limiting, REST collection. Docs updated: database.md §8, architecture.md §14 + D17/D18/D19, phases.md Phase 5 ticks, sanity_checks.sql checks 11-14. Verified route shape and error handling against a fake Supabase project; real data paths need Phase 2's SQL run for real.
- 2026-09-20: Created all seven documentation files (initial versions).
- 2026-09-20: Switched frontend from SvelteKit to Next.js; updated architecture, rules, design, phases, memory.
- 2026-09-20: Phase 1 code skeletons for `client/` and `server/` created.
- 2026-09-20: Phase 2 SQL, seed data, and placeholder photos created; database.md §7-§9, architecture.md (folder tree, D14), rules.md §6, phases.md updated.
- 2026-09-20: Phase 3 UI kit, layouts (Navbar/Footer/Sidebar), MapView/DynamicMapView, ReportCard, and a temporary `/style-guide` page built; root layout now renders ToastProvider/Navbar/Footer; added `lucide-react` to rules.md's approved deps and installed leaflet/react-leaflet/leaflet.heat/lucide-react. `npm run build` could not be fully verified in this sandbox because `next/font/google` needs `fonts.googleapis.com`, which this environment's egress allowlist blocks — untested on a network that can reach Google Fonts.

## Notes for Later Phases
- Phase 4/7: `change_report_status` needs the admin's row in `profiles` (FK on `status_history.changed_by`), so the API must upsert the admin profile before calling it.
- Phase 5: report list/detail endpoints need `lat`/`lng`; decide between PostgREST computed columns and an RPC, and document it in `database.md` §8 first.
- Phase 6: `ReportCard` must handle a missing image (seed photos only exist after the upload step).

## Next Task
Create the Supabase project and run `001_schema.sql` → `002_functions.sql` → `003_seed.sql` → `004_phase5.sql` + `sanity_checks.sql`, upload seed images, and finish the outstanding Phase 4 Clerk setup alongside it. Once both are live, re-run `server/requests/auth.http` and `server/requests/reports.http` with real tokens and a real seeded report id, then start **Phase 6 — Citizen Frontend Features** against the real API.

## Deployment Status
| Item | Status | URL |
|---|---|---|
| Client (Vercel) | Not deployed | — |
| Server (Render) | Not deployed | — |
| Supabase project | Not created | — |
| Clerk application | Not created | — |
| Uptime pinger | Not set up | — |

## Environment Checklist (values live in dashboards, never in this file)
- Client (Vercel): `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` (server-only), plus the four `NEXT_PUBLIC_CLERK_*_URL` values in `client/.env.example`
- Server (Render): `NODE_ENV`, `PORT` (Render sets it), `CLIENT_ORIGIN`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (all required as of Phase 5); `AI_ENABLED`, `AI_API_KEY` from Phase 8

## Phase Progress
| Phase | Status |
|---|---|
| 0 Documentation | Done |
| 1 Setup & accounts | Code done, running locally; accounts + deploys pending |
| 2 Database & seed | SQL written and tested; run in Supabase pending (now 4 files: 001-004) |
| 3 UI foundation | Component kit, layouts, MapView, ReportCard, style-guide page done; responsive device check pending |
| 4 Auth & roles | Code done; Clerk account + live token tests pending |
| 5 Reports API | Code done; Supabase project + real SQL run pending |
| 6 Citizen frontend | Not started |
| 7 Admin panel | Not started |
| 8 AI + City Health | Not started |
| 9 Testing & polish | Not started |
| 10 Deployment & demo | Not started |
