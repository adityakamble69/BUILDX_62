# memory.md — Civic Fix

> Living project state. Update after every meaningful change.
> Last updated: 2026-09-20

---

## Current Phase
**Phase 2 — Database & Seed Data** (SQL files written and tested; still to be run in Supabase)
Phase 1 code is done and runs on localhost; accounts, deployments, and the uptime pinger are deferred until deploy time.
Next: **Phase 3 — UI Foundation & Design System**

## Current Task
Create the Supabase project, then run `001_schema.sql`, `002_functions.sql`, `003_seed.sql` in that order in the SQL editor, upload `server/sql/seed-images/*` to bucket `report-images` under `seed/`, and check `sanity_checks.sql` block by block.

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

## Currently Working On
- Phase 2 manual steps in Supabase

## Files Currently Being Modified
- None

## Pending Tasks
- [ ] Create GitHub repo `civic-fix` and push
- [ ] Create Supabase project (Phase 1 step, needed now); enable `postgis` and `pgcrypto`
- [ ] Run the three SQL files, upload seed images, run sanity checks (Phase 2)
- [ ] Create Clerk application; enable email + Google; customize session token with `{ "metadata": "{{user.public_metadata}}" }`
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

## Dependency Log
- Approved for later phases (client): `@clerk/nextjs` (Phase 4), `leaflet` + `react-leaflet` + `leaflet.heat` (Phase 3/7), `chart.js` + `react-chartjs-2` (Phase 7/8)
- Approved for later phases (server): `@clerk/express` (Phase 4), `@supabase/supabase-js` (Phase 5), `express-rate-limit` (Phase 5)

## Assumptions Made (confirm or change)
- Docs review with the team is treated as done because Phase 1 was started.
- Single target city; no multi-city support.
- Team size and exact hackathon duration not yet known.
- Categories: pothole, garbage, streetlight, water_leak, drainage, other.
- Departments: Roads, Sanitation, Electricity, Water Supply, Drainage.

## Recent Changes
- 2026-09-20: Created all seven documentation files (initial versions).
- 2026-09-20: Switched frontend from SvelteKit to Next.js; updated architecture, rules, design, phases, memory.
- 2026-09-20: Phase 1 code skeletons for `client/` and `server/` created.
- 2026-09-20: Phase 2 SQL, seed data, and placeholder photos created; database.md §7-§9, architecture.md (folder tree, D14), rules.md §6, phases.md updated.

## Notes for Later Phases
- Phase 4/7: `change_report_status` needs the admin's row in `profiles` (FK on `status_history.changed_by`), so the API must upsert the admin profile before calling it.
- Phase 5: report list/detail endpoints need `lat`/`lng`; decide between PostgREST computed columns and an RPC, and document it in `database.md` §8 first.
- Phase 6: `ReportCard` must handle a missing image (seed photos only exist after the upload step).

## Next Task
Finish the Phase 2 run steps above, then start **Phase 3** (Tailwind tokens are already configured; build the `ui/` components, layouts, `MapView`, `ReportCard`, and `StatusBadge`, using the three design screenshots as the visual reference). Phase 1 deploy steps can wait until there is something to show.

## Deployment Status
| Item | Status | URL |
|---|---|---|
| Client (Vercel) | Not deployed | — |
| Server (Render) | Not deployed | — |
| Supabase project | Not created | — |
| Clerk application | Not created | — |
| Uptime pinger | Not set up | — |

## Environment Checklist (values live in dashboards, never in this file)
- Client (Vercel): `NEXT_PUBLIC_API_URL` now; `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` (server-only) from Phase 4
- Server (Render): `NODE_ENV`, `PORT` (Render sets it), `CLIENT_ORIGIN` now; `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `AI_ENABLED`, `AI_API_KEY` from later phases

## Phase Progress
| Phase | Status |
|---|---|
| 0 Documentation | Done |
| 1 Setup & accounts | Code done, running locally; accounts + deploys pending |
| 2 Database & seed | SQL written and tested; run in Supabase pending |
| 3 UI foundation | Not started |
| 4 Auth & roles | Not started |
| 5 Reports API | Not started |
| 6 Citizen frontend | Not started |
| 7 Admin panel | Not started |
| 8 AI + City Health | Not started |
| 9 Testing & polish | Not started |
| 10 Deployment & demo | Not started |
