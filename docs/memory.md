# memory.md — Civic Fix

> Living project state. Update after every meaningful change.
> Last updated: 2026-09-20

---

## Current Phase
**Phase 7 — Admin Panel** (server + all 4 admin pages built — dashboard, reports table, report detail/manage, heatmap, departments — code-only like Phases 5/6, still blocked on a real Supabase + Clerk project to test against real data)
Next: same infrastructure blocker as before — nothing in Phase 5, 6 or 7 has run against real data yet. Once live: walk both the citizen and admin journeys in a browser (PRD §11), which finishes Phase 6's polish task and Phase 7's "notification on status change" checklist item at the same time. Phase 8 (AI + City Health) is the next build phase after that.

## Current Task
Set up the real infrastructure so Phases 5-7 can actually be tested: create the Supabase project, run `001`–`005` SQL + sanity checks, upload seed images, finish the Phase 4 Clerk checklist (customized session token, one admin user). Nothing built since Phase 4 has touched real data yet.

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
- [x] Phase 6 landing page (`app/page.jsx`, `components/home/{HeroSection,StatsStrip,CategoryGrid,LatestReports}.jsx`): hero + CTA (server component, decorative inline SVG skyline instead of a stock photo), live stats strip (client component, `GET /stats/public`, fails soft to nothing if the API errors), browse-by-category grid (server component, static from the existing `lib/utils/categories.js` lookup — matches `ReportCard`'s existing pattern, no extra network call for fixed data), latest reports grid (client component, `GET /reports?pageSize=4&sort=newest`, reuses `ReportCard`/`ReportCardSkeleton`/`EmptyState`). Removed the temporary Phase 1 `ApiStatus` widget and its only usage in `page.jsx`, per its own "remove once real pages call the API" comment. Added `lib/utils/imageUrl.js` (`getReportImageUrl`/`getThumbnailUrl`) to turn `report_images.storage_path` into a public Storage URL client-side, and `lib/api.js` gained `getStatsPublic`/`getCategories`/`listReports`/`getReportById` helpers (rules.md §"use lib/api.js", not scattered fetches) — `getCategories` is added for later Phase 6 pages (e.g. the report form's category select) even though the landing page itself doesn't call it. Verified with `next build` locally (fonts stubbed to isolate the pre-existing Google Fonts sandbox limitation from D-3/style-guide's note — real code paths compiled and `/` prerendered as static with no errors); real data still unverified until Supabase is live
- [x] Phase 6 `/map` (`app/map/page.jsx`, `components/map/MapReportListItem.jsx`): filter toolbar (search — client-side only, narrows the already-loaded list since the reports endpoint has no full-text param; category/status/sort selects wired to `GET /reports/map` + `GET /reports`), synced report list beside the map (`GET /reports`, pageSize 50, reuses `MapReportListItem` rather than `ReportCard` so a row click can re-center the map without colliding with the "view details" link — see D30/D31), marker popups enriched with thumbnail/area/time where the id also appears in the 50-row list, bare fallback (title/status/category only, via a new `GET /categories` id→name lookup) for markers beyond that. Added `getReportsMap` to `lib/api.js`. Changed `MapView` (Phase 3): marker click now only opens the popup (react-leaflet's default); previously the marker's own click handler fired the same `onMarkerClick` as the popup's "View details" button, which would have navigated away before the popup was visibly usable — first real caller of `onMarkerClick`, so this is the first time that bug was reachable. Added `hideLabel` to `ui/Select` and `ui/Input` (renders the label `sr-only` instead of dropping it, for compact filter toolbars) and made `ui/Select` a normal controlled input when a caller passes `value` (it previously always set `defaultValue=""`, which conflicts with `value` and is only safe for the wizard's uncontrolled usage) — both are additive, non-breaking changes to existing components. Verified with `next build` (same font-stub method as above); `/map` compiles and prerenders with no errors

- [x] Phase 6 `/reports` (`app/reports/page.jsx`): filterable/sortable/paginated feed against `GET /reports` (category/status/sort selects, same option lists as `/map` minus the "excludes rejected" carve-out — `/reports` isn't capped like the map RPC, so "Rejected" is a valid status filter here), grid of `ReportCard`/`ReportCardSkeleton` (`sm:grid-cols-2 lg:grid-cols-4`, matching the landing page's `LatestReports` grid), report count next to the filters (`meta.total`). No search box: unlike `/map` (which loads up to 50 rows and can narrow them client-side), this page only ever holds one page of rows at a time, so a client-side filter would silently miss matches on other pages — left out rather than shipped misleading. New `ui/Pagination.jsx` (Prev/Next + "Page X of Y" against `meta.page/pageSize/total`, renders nothing for a single page) — first list view to need real pagination controls, built as a reusable `ui/` component since Phase 7's admin reports table will need the same thing. Changing any filter/sort resets to page 1 (a stale page number could otherwise land past the new result set's last page). Verified with `next build` (same font-stub method as `/map`); `/reports` compiles and prerenders with no errors

- [x] Phase 6 `/my-reports` + `/notifications` (`app/my-reports/page.jsx`, `app/notifications/page.jsx`): `/my-reports` is `GET /me/reports` (paginated, newest first) rendered with the existing `ReportCard`/`ReportCardSkeleton`/`Pagination`/`EmptyState`, empty state routing to `/report/new`. Deliberately no All/Open/Resolved tabs despite the mockup showing them — `/me/reports` takes pagination only, so a tab would filter just the loaded page and silently hide matching reports on other pages (same reasoning as `/reports`' missing search box); tabs need a `status` param on the endpoint first (D36). `/notifications` is `GET /me/notifications` with unread rows tinted + dotted, per-row open (marks that one read via `PATCH /me/notifications/read` `{ id }`, fire-and-forget, then navigates to the report) and "Mark all as read" (`{ all: true }`, optimistic with rollback); both call `NotificationContext`'s `refresh()` so the navbar dot updates without waiting for its 60 s poll. The bell itself needed no work — `SiteChrome` was already passing `unreadCount` into `Navbar`; only Navbar's stale "wired in Phase 6, until then no dot" comment was corrected, and a signed-in "My Reports" link added to the desktop nav and mobile drawer (the page had no entry point otherwise). `lib/api.js` `authPaths` extended with `myReports`, `myNotifications`, `notificationsRead`. Verified with `next build` (same font-stub method); both routes compile and prerender with no errors

- [x] Phase 6 `/report/new` (`app/report/new/page.jsx` + `components/report/wizard/{Stepper,PhotoStep,LocationStep,DetailsStep,ReviewStep}.jsx` + `lib/utils/uploadReportImages.js`): 4-step wizard in phases.md's order — Photos (camera or file picker, `compressImage` run at *pick* time so the wizard holds upload-ready blobs, max 3, remove/re-pick) → Location (`MapView`'s existing Phase 3 `pick-location` mode + its locate-me control, 800 ms-debounced Nominatim reverse geocode filling an editable area-name field) → Details (title/description/severity + category from `GET /categories`, per-field errors) → Review (runs `GET /reports/nearby-duplicates` on open, shows matches with distance + upvote count as an advisory warning linking to each, never a block). Submit signs uploads (`POST /uploads/sign`), PUTs each blob straight to Supabase Storage, then `POST /reports` and redirects to the new report's detail page. Photos upload only on submit, so an abandoned wizard leaves nothing orphaned in Storage (D34). `lib/api.js` `authPaths` extended with `uploadSign`, `reports`, `nearbyDuplicates`. Verified with `next build` (same font-stub method); `/report/new` compiles and prerenders with no errors

- [x] Phase 7 Admin Panel — server (`server/sql/005_phase7.sql` + `reportService.js`/`commentService.js` admin functions + new `departmentService.js` + `statsService.js` admin functions + `adminValidators.js` + `adminReportsController.js`/`adminStatsController.js`/`adminDepartmentsController.js` + `commentsController.js`'s `deleteAdminComment` + a rewritten `routes/admin.js`) and client (`app/(admin)/admin/{page,reports/page,reports/[id]/page,heatmap/page,departments/page}.jsx` + `components/admin/*`). Server: `GET /admin/reports` (status/category/department filters, sort by newest/upvotes/severity), `PATCH .../status` (note required when rejecting, becomes `reports.reject_reason`), `PATCH .../assign`, `POST .../resolution-image` (same signed-upload contract as the citizen wizard, attached as `kind: 'after'`), `DELETE` on both reports and comments (cascades via `001_schema.sql`'s FKs), `GET /admin/stats` (KPIs + category/status/department breakdowns + a 7-day trend, all via new RPCs in `005_phase7.sql`), `GET /admin/heatmap` (existing but previously-unused `get_heatmap_points()` from Phase 2), and departments CRUD (no hard delete — `is_active` toggle only, since `reports.department_id` references it). Removed the Phase 4 `/admin/ping` placeholder now that real admin routes exist. Client: dashboard (`StatCard`/`ChartCard` + Chart.js donuts for category/status + a Chart.js trend line + a plain-divs department bar list — kept off Chart.js since it's just proportional widths against one max), reports table (sticky header, horizontal-scroll on mobile per design.md §12, filters as a `Select` row, reused `Pagination`), manage page (reuses `PhotoGallery`/`StatusTimeline` from Phase 6, new `AssignDepartmentForm`/`StatusChangeForm`/`ResolutionImageUpload`/`AdminCommentsModeration`/`DeleteReportButton` with a confirm `Modal`), heatmap (`MapView` gained a third `heat` mode via a new `HeatLayer` using `leaflet.heat`'s imperative `L.heatLayer`, gradient teal→amber→red per design.md §9), departments (list/create/activate-toggle, no delete). `Sidebar.jsx` nav rewritten to the routes architecture.md actually defines (D37 — the mockup's Assign Task/Submissions/Incomplete/Analytics have no matching route in any doc). Verified: server boots against a fake Supabase/Clerk project and every `/admin/*` route correctly 401s with no/garbage token; `next build` passes clean, 15/15 routes, admin pages compile as dynamic routes

- [x] Phase 6 `/reports/[id]` (`app/reports/[id]/page.jsx` + `components/report/{PhotoGallery,UpvoteButton,CommentsSection}.jsx`): photo gallery (before photos first, admin "after fix" photo last and badged), title/status/meta header, description, reject reason (only when `status === 'rejected'`), a 4-cell facts grid (category, severity, department, reported), status timeline (reuses the Phase 3 `StatusTimeline`), optimistic upvote, comment thread with post + delete-own, and a 240px single-marker `DynamicMapView` for location. The page fetches through `useApi().request` rather than the plain `getReportById` helper and waits for Clerk's `isLoaded` — `GET /reports/:id` is public, but a token makes the server return `viewerHasUpvoted`, without which a signed-in user would see an un-upvoted button until they clicked (see D33). `lib/api.js` gained an `authPaths` map (report detail/upvote/comments/comment) so token-bearing endpoint paths are still declared in one file while `api.js` stays Clerk-free (D18). Guests aren't shown disabled controls: upvote and comment both route to `/sign-in?redirect_url=<current path>`. Verified with `next build` (same font-stub method as `/map` and `/reports`); `/reports/[id]` compiles as a dynamic route with no errors

- [x] Fixed a server-wide bug: every service (`reportService`, `profileService`, `statsService`, `uploadService`, `categoryService`, `notificationService`, `commentService` — 21 call sites) threw a bare `AppError('INTERNAL_ERROR', ...)` on a Supabase error without logging the Supabase error itself, so any real failure (missing migration, bad `SUPABASE_URL`/key, RLS denial, unreachable project) showed up in the server log as only its own generic message (e.g. "Could not load reports") with no way to diagnose it — this is what the user hit testing `/reports` locally. Added `server/src/utils/dbError.js` (`dbError(context, error, clientMessage)`): logs the real `message`/`code`/`details`/`hint` via `logger.error`, then returns the same generic `AppError` to throw — client response is unchanged (rules.md §10, no raw errors to clients), only the server log gained the missing detail. Verified by booting the server against an unreachable fake `SUPABASE_URL` and hitting `/api/v1/categories`: the log now shows `"Supabase error in listCategories"` with the real DNS/fetch failure right before the generic error, where previously nothing but the generic message would have appeared

## Currently Working On
- Phase 7 is code-complete (see Completed) — server + all admin pages. What's left across Phases 5-7 is the same thing: a real Supabase project and Clerk app to test any of it against
- Still open underneath: Phase 5 sign-off (create the Supabase project and run the SQL) and Phase 4's outstanding Clerk account setup

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
- [ ] Run all five SQL files (`001`-`005`), upload seed images, run `sanity_checks.sql` (now 18 checks, Phases 2/5/7)
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
| 28 | Report photo URLs are built client-side from `NEXT_PUBLIC_SUPABASE_URL` + the fixed `report-images` bucket path, not returned by the API — the API keeps returning storage *paths* only (unchanged Phase 5 contract); this is a pure string operation on a public-read bucket, not a DB/auth concern | 2026-09-20 |
| 29 | Landing page's category grid stays static (local `categories.js` lookup) instead of calling `GET /categories`, since the six categories are fixed seed data `ReportCard` already trusts from the same source; `GET /categories` is still used wherever the *set of active categories* could actually change server-side (e.g. the report form's select, Phase 6 later) | 2026-09-20 |
| 30 | `/map`'s sidebar reuses a new `MapReportListItem`, not `ReportCard` — `ReportCard` is one big `<Link>`, and the sidebar needs a click that re-centers the map plus a separate click that navigates, which don't nest safely inside one anchor | 2026-09-20 |
| 31 | `/reports/map` markers are enriched from the same-filtered `GET /reports` call (capped at 50 rows) rather than adding thumbnail/area/time to the map RPC itself — keeps `get_map_points` lightweight (rules.md §16's whole point) while still giving the common case a rich popup; markers past row 50 fall back to a bare popup | 2026-09-20 |
| 32 | `suppressHydrationWarning` added to `ui/Input`'s `<input>`, `ui/Select`'s `<select>`, and `ui/Textarea`'s `<textarea>` — form-filler browser extensions (LastPass and similar) stamp a `fdprocessedid` attribute onto form fields before React hydrates, which otherwise trips a false-positive hydration warning on every page with a form control; confirmed via `/map`'s toolbar in a real browser | 2026-09-20 |
| 33 | `/reports/[id]` sends the Clerk token on a *public* GET so `viewerHasUpvoted` comes back on the first load; the alternative (a second authenticated call just for upvote state) costs a round trip and a visible flip of the button | 2026-09-20 |
| 34 | The wizard uploads photos only at submit, not at the photo step: an abandoned wizard then leaves no orphaned objects in Storage (nothing deletes them — there's no cleanup job), at the cost of a slightly longer submit | 2026-09-20 |
| 35 | Wizard step order follows phases.md (Photos → Location → Details → Review), which differs from the uploaded UI mockup's Details → Location → Photos → Review. phases.md is the source of truth (rules.md §0); the duplicate check also needs both location *and* category, so it lands naturally on the Review step either way. Flag for the team if the mockup order is preferred | 2026-09-20 |
| 36 | `/my-reports` ships without the mockup's All/Open/Resolved tabs: `GET /me/reports` has no `status` param, so tabs would filter one page client-side and hide matches on other pages. Adding the param is a small Phase 7-era change to `me.js` + `getMyReports` + architecture.md if the tabs are wanted | 2026-09-20 |
| 37 | Admin `Sidebar.jsx` nav rewritten to match architecture.md's actual folder tree (Dashboard/Reports/Heatmap/Departments) instead of the uploaded mockup's Assign Task/Submissions/Incomplete/Analytics, which have no route anywhere in the docs. Same reasoning as D35 — docs are the source of truth (rules.md §0); flag for the team if those extra pages are wanted | 2026-09-20 |
| 38 | Admin departments have no hard delete, only an `is_active` toggle — `reports.department_id` is a FK to `departments.id`, so deleting one would either cascade-orphan every report assigned to it or be blocked outright. Deactivating removes it from the assign dropdown while keeping past assignments intact | 2026-09-20 |

## Dependency Log
- Installed in Phase 7 (client): `chart.js` ^4.4, `react-chartjs-2` ^5.2
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
- 2026-09-20: Phase 7 Admin Panel built end to end, server + client (see Completed). Docs updated: phases.md ticks all Phase 7 tasks except the live-verification one, memory.md D37/D38, phase progress table, dependency log (chart.js/react-chartjs-2 now installed).
- 2026-09-20: Phase 6 `/my-reports` + `/notifications` built and the navbar bell confirmed wired (see Completed). Docs updated: phases.md ticks both tasks, memory.md D36, phase progress table. Phase 6's build work is now complete; only the polish pass remains.
- 2026-09-20: Phase 6 `/report/new` wizard built (see Completed). New `components/report/wizard/*`, `lib/utils/uploadReportImages.js`. Docs updated: phases.md ticks the wizard + reverse-geocode tasks, memory.md D34/D35, phase progress table.
- 2026-09-20: Phase 6 `/reports/[id]` built (see Completed). New `components/report/{PhotoGallery,UpvoteButton,CommentsSection}.jsx`, new `authPaths` in `lib/api.js`. Docs updated: phases.md ticks "`/reports/[id]` detail…", memory.md D33, phase progress table.
- 2026-09-20: Fixed swallowed Supabase errors across all 7 server services (21 call sites) — new `server/src/utils/dbError.js` logs the real DB error before throwing the generic `AppError`. See Completed. Found while debugging the user's local "Could not load reports" 500 on `/reports`.
- 2026-09-20: Phase 6 `/reports` built (see Completed). New `ui/Pagination.jsx`. Docs updated: phases.md ticks "`/reports` feed with filters, sort, pagination", memory.md, phase progress table.
- 2026-09-20: Fixed a false-positive hydration warning on `/map`'s filter toolbar (see D32) — `suppressHydrationWarning` added to `ui/Input`, `ui/Select`, `ui/Textarea`.
- 2026-09-20: Phase 6 `/map` built (see Completed). Docs updated: phases.md ticks "`/map` with filters and marker popups", memory.md D30/D31, phase progress table.
- 2026-09-20: Phase 6 landing page built (see Completed). Docs updated: phases.md ticks "Landing page with live stats", memory.md D28/D29, environment checklist (`NEXT_PUBLIC_SUPABASE_URL`), phase progress table.
- 2026-09-20: Phase 4 auth implemented on both sides (see Completed). Docs updated: architecture.md §5/§10/§14 + D15/D16, phases.md Phase 4 ticks and the profiles-upsert move to Phase 5.
- 2026-09-20: Phase 5 Reports API implemented (see Completed): `sql/004_phase5.sql`, all services/controllers/routes, rate limiting, REST collection. Docs updated: database.md §8, architecture.md §14 + D17/D18/D19, phases.md Phase 5 ticks, sanity_checks.sql checks 11-14. Verified route shape and error handling against a fake Supabase project; real data paths need Phase 2's SQL run for real.
- 2026-09-20: Created all seven documentation files (initial versions).
- 2026-09-20: Switched frontend from SvelteKit to Next.js; updated architecture, rules, design, phases, memory.
- 2026-09-20: Phase 1 code skeletons for `client/` and `server/` created.
- 2026-09-20: Phase 2 SQL, seed data, and placeholder photos created; database.md §7-§9, architecture.md (folder tree, D14), rules.md §6, phases.md updated.
- 2026-09-20: Phase 3 UI kit, layouts (Navbar/Footer/Sidebar), MapView/DynamicMapView, ReportCard, and a temporary `/style-guide` page built; root layout now renders ToastProvider/Navbar/Footer; added `lucide-react` to rules.md's approved deps and installed leaflet/react-leaflet/leaflet.heat/lucide-react. `npm run build` could not be fully verified in this sandbox because `next/font/google` needs `fonts.googleapis.com`, which this environment's egress allowlist blocks — untested on a network that can reach Google Fonts.

## Notes for Later Phases
- ~~Phase 4/7: `change_report_status` needs the admin's row in `profiles`~~ — done: `adminReportsController.patchReportStatus`/`postResolutionImage` both call `ensureProfile(userId)` before their RPC.
- Phase 5: report list/detail endpoints need `lat`/`lng`; decide between PostgREST computed columns and an RPC, and document it in `database.md` §8 first.
- Phase 6: `ReportCard` must handle a missing image (seed photos only exist after the upload step).

## Next Task
Phases 5, 6 and 7 all have zero build work left — every route and page is written. The only remaining blocker is infrastructure, and it can't be done from here: create the Supabase project (enable `postgis`+`pgcrypto`), run `001_schema.sql` → `002_functions.sql` → `003_seed.sql` → `004_phase5.sql` → `005_phase7.sql` + `sanity_checks.sql` (18 checks), upload the seed images, create the Clerk app with the customized session token (`Sessions → Customize session token` = `{ "metadata": "{{user.public_metadata}}" }`), and set one user's `publicMetadata` to `{ "role": "admin" }`. Once that's live: walk the full citizen journey (PRD §11) to close Phase 6's polish task, then the full admin journey (assign → status change → resolution photo → citizen sees the update + notification) to close Phase 7's last checklist item. After that, start Phase 8 (AI + City Health) — first decide the AI provider (Claude vs Gemini) and get an API key, per the still-open item in Assumptions.

## Deployment Status
| Item | Status | URL |
|---|---|---|
| Client (Vercel) | Not deployed | — |
| Server (Render) | Not deployed | — |
| Supabase project | Not created | — |
| Clerk application | Not created | — |
| Uptime pinger | Not set up | — |

## Environment Checklist (values live in dashboards, never in this file)
- Client (Vercel): `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL` (Phase 6, builds public report-photo URLs — safe to expose, same project as the server's `SUPABASE_URL`), `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` (server-only), plus the four `NEXT_PUBLIC_CLERK_*_URL` values in `client/.env.example`
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
| 6 Citizen frontend | All pages built (landing, `/map`, `/reports`, `/reports/[id]`, `/report/new`, `/my-reports`, `/notifications`); browser polish pass pending, blocked on live data |
| 7 Admin panel | Code done (dashboard, reports table, report manage, heatmap, departments); Supabase project + real data + browser verification pending |
| 8 AI + City Health | Not started |
| 9 Testing & polish | Not started |
| 10 Deployment & demo | Not started |
