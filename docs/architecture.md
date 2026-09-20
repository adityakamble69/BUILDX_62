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
            ┌──────────────┐
  User ───► │   Next.js    │  (Vercel)
            │  frontend    │
            └──────┬───────┘
                   │ HTTPS + Clerk session token (Bearer)
                   ▼
            ┌──────────────┐        ┌───────────────┐
            │ Express API  │ ─────► │ Clerk (verify │
            │  (Render)    │ ◄───── │  token/claims)│
            └──────┬───────┘        └───────────────┘
                   │ service-role key (server only)
        ┌──────────┼─────────────────┐
        ▼          ▼                 ▼
  Supabase      Supabase         LLM API
  Postgres      Storage          (optional)
  + PostGIS     (images)
```

Key principle: **the frontend never talks to the database directly.** All data access goes through Express. Images are uploaded straight to Supabase Storage using short-lived signed upload URLs issued by Express.

## 3. Application Flow

1. Page loads in Next.js. Public pages call public API endpoints without a token.
2. Protected pages require a Clerk session; the frontend attaches the token on API calls.
3. Express verifies the token, loads role from claims, runs validation, then queries Supabase.
4. Response returns JSON in the standard shape (see §10).

## 4. User Flow

```
Guest ─► Map/Feed/Detail/City Health
   │
   └─► Sign in (Clerk) ─► Citizen
                            ├─► Report new issue ─► Duplicate check ─► Submit
                            ├─► Upvote / Comment
                            └─► My Reports / Notifications

Admin ─► /admin ─► Reports table ─► Report manage page
                                       ├─► Assign department
                                       ├─► Change status (+ note)
                                       └─► Upload after photo ─► Notify reporter
```

## 5. Frontend Architecture (Next.js)

- **Framework:** Next.js 15 App Router, JavaScript (no TypeScript), React 19. Import alias `@/` maps to `client/src`.
- **Routing:** file-based under `client/src/app` (`page.jsx`, `layout.jsx`).
- **Layouts:**
  - `app/layout.jsx` (root): `<ClerkProvider>`, toast host, fonts via `next/font/google`, and `<SiteChrome>`.
  - `SiteChrome` (client) renders the public navbar/footer and returns children untouched on `/admin`, so the admin shell is not double-framed. This avoids splitting every public page into a second route group.
  - `app/(admin)/admin/layout.jsx`: admin shell with sidebar + server-side role guard (`auth()` → redirect).
- **Auth:** `@clerk/nextjs` (added in Phase 4). `src/middleware.js` uses `clerkMiddleware` to redirect unauthenticated users away from citizen pages and non-admins away from `/admin` (reads `sessionClaims.metadata.role`). Client components call `useApi()` (`lib/useApi.js`), which reads `useAuth().getToken()` and passes the token to `lib/api.js`; `api.js` itself stays Clerk-free.
- **Single data source:** Next.js code never imports Supabase and never touches the database. The only data source is the Express API.
- **Server vs client components:** default to server components for static shells; add `'use client'` only when a component needs state, effects, or browser APIs (maps, forms, upvote, comments). Public data pages (map, feed, City Health) fetch on the client with skeleton loaders, because a sleeping Render instance would otherwise hang the whole server render. If a page does fetch on the server, it must use a short timeout and `revalidate`.
- **State:** React Context + hooks in `lib/context/` for current user, filters, and notification count. No global state library.
- **Maps and charts:** `<MapView>` uses `react-leaflet` (modes: `browse`, `pick-location`, `heat`; heat via `leaflet.heat`); charts use `react-chartjs-2`. Both are loaded with `next/dynamic` (`ssr: false`) because they need `window`.
- **Images and fonts:** `next/image` with the Supabase Storage host in `images.remotePatterns`; Space Grotesk and DM Sans via `next/font/google`.
- **Styling:** Tailwind 3.4 with tokens from `design.md`.

## 6. Backend Architecture (Express)

Layered structure, one responsibility per layer:

```
routes  →  controllers  →  services  →  supabase client
              ↑
          middleware (auth, role, validate, error)
```

- **routes:** URL + middleware wiring only.
- **controllers:** parse request, call service, shape response.
- **services:** business logic and DB queries (the only layer that imports the Supabase client).
- **middleware:** `clerkMiddleware`, `requireAuth`, `requireAdmin`, `validate(schema)`, `errorHandler`, `rateLimit`.
- **validation:** Zod schemas per endpoint.

## 7. Database Architecture
See `database.md`. Summary: Postgres on Supabase with PostGIS; `reports` is the central table; `upvotes`, `comments`, `report_images`, `status_history`, `notifications` hang off it; `categories` and `departments` are lookup tables.

## 8. Authentication Flow

```
Browser ──sign in──► Clerk ──► session created
Browser ──API call + Bearer token──► Express
Express ──clerkMiddleware verifies token──► req.auth (userId, sessionClaims)
Express ──requireAuth──► 401 if no valid session
Express ──requireAdmin──► 403 if claims.metadata.role !== "admin"
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
| Create report, upvote, comment | `requireAuth` |
| Edit/delete own comment | `requireAuth` + ownership check in service |
| Admin routes | `requireAdmin` |
| UI hiding of admin links | Frontend (cosmetic only) |

Users are identified by Clerk `userId` (string like `user_2abc...`). It is stored as `text` in DB tables.

## 10. API Architecture

- Base path: `/api/v1`
- Format: JSON
- Success: `{ "data": ..., "meta": { "page": 1, "pageSize": 20, "total": 134 } }` (meta only for lists)
- Error: `{ "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [...] } }`
- Status codes: 200, 201, 400, 401, 403, 404, 409, 422, 429, 500
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
| GET | `/api/v1/me` | Current user id + role (auth smoke test, Phase 4) |
| POST | `/api/v1/uploads/sign` | Get signed upload URL(s) for images |
| GET | `/api/v1/reports/nearby-duplicates` | Duplicate check (`lat,lng,category`) |
| POST | `/api/v1/reports` | Create report |
| POST | `/api/v1/reports/:id/upvote` | Toggle upvote |
| POST | `/api/v1/reports/:id/comments` | Add comment |
| DELETE | `/api/v1/comments/:id` | Delete own comment |
| GET | `/api/v1/me/reports` | Own reports |
| GET | `/api/v1/me/notifications` | Own notifications |
| PATCH | `/api/v1/me/notifications/read` | Mark all/one as read |
| POST | `/api/v1/ai/classify` | Optional AI category/severity suggestion |

**Admin (auth + admin)**
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/admin/ping` | Role smoke test: 200 admin, 403 citizen (Phase 4; remove after Phase 7) |
| GET | `/api/v1/admin/reports` | Full table with filters |
| PATCH | `/api/v1/admin/reports/:id/status` | Change status + note |
| PATCH | `/api/v1/admin/reports/:id/assign` | Assign department |
| POST | `/api/v1/admin/reports/:id/resolution-image` | Attach after photo |
| DELETE | `/api/v1/admin/reports/:id` | Delete report |
| DELETE | `/api/v1/admin/comments/:id` | Delete any comment |
| GET | `/api/v1/admin/stats` | Dashboard KPIs and charts data |
| GET | `/api/v1/admin/heatmap` | Points for heatmap |
| GET/POST/PATCH | `/api/v1/admin/departments` | Manage departments |

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

```
Admin ─► PATCH /admin/reports/:id/status { status, note }
            │
            ▼
       service.updateStatus (transaction / RPC)
            ├─► update reports.status (+ resolved_at)
            ├─► insert status_history
            └─► insert notifications for reporter
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
│   │   │   ├── auth-check/page.jsx          # temporary Phase 4 token test, delete before demo
│   │   │   ├── style-guide/page.jsx         # temporary Phase 3 component gallery, delete before demo
│   │   │   └── (admin)/admin/
│   │   │       ├── layout.jsx
│   │   │       ├── page.jsx
│   │   │       ├── reports/page.jsx
│   │   │       ├── reports/[id]/page.jsx
│   │   │       ├── heatmap/page.jsx
│   │   │       └── departments/page.jsx
│   │   ├── components/
│   │   │   ├── ui/              # Button, Card, Input, Badge, Modal, Toast, Skeleton
│   │   │   ├── layout/          # Navbar, Sidebar, Footer, SiteChrome, Logo
│   │   │   ├── map/             # MapView, MarkerPopup, HeatLayer
│   │   │   └── report/          # ReportCard, ReportForm, StatusTimeline, UpvoteButton, CommentList
│   │   ├── lib/
│   │   │   ├── api.js           # fetch wrapper (token passed in from Clerk)
│   │   │   ├── useApi.js        # hook: apiFetch + current Clerk token
│   │   │   ├── context/         # user, filters, notifications
│   │   │   └── utils/           # formatters, constants
│   │   └── middleware.js        # Clerk route protection (Phase 4)
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
    │   ├── middleware/          # auth (requireAuth/requireAdmin), validate, errorHandler, rateLimit
    │   ├── routes/              # index.js, public.js, reports.js, comments.js, uploads.js, me.js, admin.js
    │   ├── controllers/         # categoriesController, reportsController, commentsController, uploadsController, statsController, meController
    │   ├── services/            # categoryService, reportService, commentService, uploadService, statsService, notificationService, profileService, aiService (Phase 8)
    │   ├── validators/          # Zod schemas (reportValidators, commentValidators, uploadValidators, notificationValidators)
    │   └── utils/               # AppError, asyncHandler, pagination
    ├── sql/
    │   ├── 001_schema.sql        # tables, indexes, triggers, RLS, storage bucket
    │   ├── 002_functions.sql     # duplicates, status change, stats/map/heatmap RPCs
    │   ├── 003_seed.sql          # demo data
    │   ├── 004_phase5.sql        # reports_with_coords view, upsert_profile, create_report, toggle_upvote
    │   ├── sanity_checks.sql     # verification queries with expected values
    │   └── seed-images/          # placeholder photos to upload to the bucket under seed/
    ├── .env.example
    └── package.json
```

## 15. Component Structure (key components)

| Component | Responsibility |
|---|---|
| `MapView` | Leaflet map; modes: `browse`, `pick-location`, `heat` |
| `ReportCard` | Compact report summary with status badge and upvotes |
| `ReportForm` | Multi-step form: photo → location → details → submit |
| `DuplicateSuggestion` | Shows nearby similar reports with "Upvote instead" |
| `StatusTimeline` | Vertical timeline from `status_history` |
| `UpvoteButton` | Optimistic toggle |
| `StatCard`, `ChartCard` | Admin and City Health widgets |
| `DataTable` | Reusable admin table with sort/filter |
| `NotificationBell` | Unread count + dropdown |

## 16. Route Structure
See §14 (`client/src/app`). Guards:
- Citizen pages: redirect to sign-in when unauthenticated (enforced in `middleware.js`).
- `(admin)` group: redirect to `/` if role is not admin (`middleware.js` + admin layout check; backend `requireAdmin` is the real protection).

## 17. Important Technical Decisions

| # | Decision | Reason |
|---|---|---|
| D1 | Clerk for auth, Supabase only as DB/Storage | Faster sign-in UX and roles; avoids mixing two auth systems |
| D2 | No direct frontend → Supabase DB access; no RLS reliance | One enforcement point (Express); simpler with Clerk |
| D3 | Service-role key only on Render | Never exposed to browsers |
| D4 | PostGIS `geography(Point, 4326)` for locations | Native distance queries for duplicates and heatmap |
| D5 | Signed direct uploads to Storage | Avoids passing large files through a free-tier server |
| D6 | Status change through a single DB function/transaction | Guarantees history and notification are never out of sync |
| D7 | Leaflet + OSM | Free, no API key, works everywhere |
| D8 | AI behind a feature flag | Core flow must work even if the AI provider fails |
| D9 | Zod validation on every write endpoint | Consistent input safety |
| D10 | Free-tier cold start mitigation (uptime pinger) | Render free instances sleep |
| D11 | Frontend is Next.js (App Router) instead of SvelteKit; backend, DB, and auth are unchanged | Team decision (2026-09-20); Next.js deploys to Vercel and Clerk has a first-class Next.js SDK |
| D12 | Next.js server code never imports Supabase; it only calls Express | Keeps D2 intact (one enforcement point) |
| D13 | Public data pages fetch client-side (or server-side with timeout + revalidate) | Render cold start must not hang server rendering |
| D14 | Aggregate and geo queries are Postgres functions called with `.rpc()`, executable only by `service_role` | `supabase-js` cannot run raw SQL; Supabase would otherwise expose the functions to `anon` |
| D15 | Public chrome is hidden on `/admin` by a `SiteChrome` client wrapper instead of a `(public)` route group | Keeps the documented `app/` tree intact; one file instead of moving every public page |
| D16 | Clerk keys are required env vars on the server from Phase 4 (startup fails without them) | Auth silently degrading to "everyone is a guest" is worse than a loud boot failure |
| D17 | `reports.js` mixes public reads and citizen writes in one router (not split into `public.js` + a citizen router) with static routes (`/map`, `/nearby-duplicates`) registered before the dynamic `/:id` | Express matches routes by registration order, not specificity — a `/:id` route registered first would swallow `/reports/map` as `id = "map"` |
| D18 | `comments` and `notifications` are read/written with plain `supabase.from(...)` calls, not RPCs | The service-role key already bypasses RLS; a function is only needed for multi-table transactions (`create_report`, `change_report_status`) or geometry math the PostgREST query builder can't express |
| D19 | Supabase keys are required env vars on the server from Phase 5 (startup fails without them), same pattern as D16 for Clerk | Consistent fail-fast behavior; a half-configured backend should refuse to boot, not serve 500s for every request |

## 18. Deployment Architecture
- `client/` → Vercel (root directory `client`, framework preset Next.js), env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` (server-only; Clerk keys are needed from Phase 4).
- `server/` → Render Web Service (root `server`, start `node src/index.js`), env: `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CLIENT_ORIGIN`, `AI_ENABLED`, `AI_API_KEY`.
- CORS: allow `CLIENT_ORIGIN` and `http://localhost:3000` (Next.js dev server) only; allow `Authorization` and `Content-Type` headers.
- Health check path on Render: `/health`.
