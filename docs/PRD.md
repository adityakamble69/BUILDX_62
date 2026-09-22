# PRD.md — Civic Fix

> Source of truth for WHAT we are building.
> Event: BUILD-X (intercollegiate full stack web development, A.C.E.S. Forum, Dept. of Computer Engineering). Theme: **CITY**.

---

## 1. Project Name
**Civic Fix**

## 2. Project Overview
Civic Fix is a public web platform where any citizen can report a city problem (pothole, garbage, broken streetlight, water leak, etc.) with a photo and a map pin. The community upvotes reports so the most important ones rise to the top. A city/admin team manages every report from an admin panel, assigns it to a department and (optionally) a worker account, and proves resolution with an "after" photo. Everything is transparent through a public map and a City Health page.

## 3. Problem Statement
- Citizens do not know where or how to report civic issues, and reports get lost.
- Authorities receive duplicate, unstructured, unprioritized complaints.
- Citizens never see whether anything was done, so trust in the system is low.

## 4. Goal
Deliver a working, deployed, judge-friendly product within the hackathon window that proves one complete loop:

**Report → Prioritize → Assign → Resolve → Notify the citizen**

Success for the event = a polished 2-minute live demo that any judge can also try on their own phone.

## 5. Target Users
- **Citizens** of a city (primary): anyone with a phone or browser.
- **City admins / volunteer coordinators** (secondary): people who triage and resolve issues.
- **Field workers / department teams** (secondary, Phase 7.6): the people actually doing the fix, who log in to see their tasks and submit resolution proof.
- **Judges / visitors** (demo): browse the public map and stats without logging in.

## 6. User Roles

| Role | How obtained | Can do |
|---|---|---|
| Guest | No login | View public map, feed, report details, City Health page |
| Citizen | Sign up via Clerk | Everything a guest can + create reports, upvote, comment, see own reports, receive notifications |
| Worker | Clerk `publicMetadata.role = "worker"` set manually in the Clerk dashboard | See own assigned tasks at `/worker/tasks`, submit resolution photos + details for those tasks |
| Admin | Clerk `publicMetadata.role = "admin"` set manually in the Clerk dashboard | Everything a citizen can + admin panel: manage all reports, assign departments, assign workers, change status, add resolution photos, review submissions, moderate comments, view analytics |

`admin` and `worker` are independent roles — an admin is not automatically a worker and vice versa.

## 7. Core Features
Each feature has a purpose tied to the core loop.

| # | Feature | Purpose |
|---|---|---|
| F1 | Report an issue (photo, category, description, map pin) | Input to the whole system |
| F2 | Public map + feed with filters (category, status, area) | Transparency; makes the demo visual |
| F3 | Upvote a report | Community prioritization; gives admin a priority signal |
| F4 | Duplicate detection (same category within 50 m) | Reduces noise; suggests upvoting instead of a new report |
| F5 | Report detail page with status timeline | Trust: citizens see progress |
| F6 | My Reports page | Citizens track what they submitted |
| F7 | In-app notifications (status change + worker assignment) | Closes the loop with the citizen and the assigned worker |
| F8 | Admin dashboard (list, filters, sort by upvotes/severity) | Efficient triage |
| F9 | Admin actions: change status, assign department, add note, upload resolved photo | Resolution workflow |
| F10 | Admin analytics (counts, resolution rate, avg fix time, category breakdown, hotspot heatmap, department performance) | Decision support + "wow" for judges |
| F11 | AI auto-categorization and severity suggestion from photo + text | "Wow" feature; speeds up reporting (optional-but-planned, Phase 8) |
| F12 | Public City Health page | Accountability; strong judge-facing story |
| F13 | Assign Task workflow (Phase 7.5): admin creates a task against a report, sets priority + due date | Bridges reporting and resolution |
| F14 | Worker dashboard + submission upload (Phase 7.6) | Field teams see their tasks in-app and submit proof |
| F15 | Submission review (Phase 7.5): admin approves or requests changes with grade + remarks | Closes the loop end to end |
| F16 | Incomplete view (Phase 7.5): reports still awaiting action, with aging indicators | Nothing silently falls through |
| F17 | Admin Analytics page (Phase 7.5): KPIs + department performance + hotspot map | Same data, judge-friendly story |

## 8. Functional Requirements

**Reporting**
- FR1. A logged-in citizen can submit a report with: title, description, category, 1–3 photos, and a location (map pin or "use my location").
- FR2. Location is stored as a geographic point; a readable area/address label is stored alongside it.
- FR3. Before submission, the system checks for existing open reports of the same category within 50 m and offers "Upvote instead".
- FR4. New reports start with status `reported`.
- FR5. If AI categorization is enabled, the form pre-fills a suggested category and severity that the user can override.

**Browsing**
- FR6. Anyone can view the public map and list, filter by category and status, and sort by newest / most upvoted.
- FR7. Any report detail shows photos, status timeline, upvote count, and comments.

**Engagement**
- FR8. A logged-in user can upvote a report once (toggle on/off).
- FR9. A logged-in user can comment on a report.

**Admin**
- FR10. Admin can view all reports in a table with filters and bulk-safe single actions.
- FR11. Admin can change status: `reported → in_progress → resolved` (or `rejected` with a reason).
- FR12. Admin can assign a department.
- FR13. Admin can upload an "after" photo when resolving.
- FR14. Every status change is recorded in status history and creates a notification for the reporter.
- FR15. Admin can delete abusive comments and reports.
- FR18 (Phase 7.5). Admin can create tasks against reports — pick report, department, worker, priority, due date.
- FR19 (Phase 7.5). Admin can review submissions: approve (which resolves the report and notifies the citizen) or request changes with remarks.
- FR20 (Phase 7.5). Admin can see incomplete reports with days-pending aging.
- FR21 (Phase 7.5). Admin can list Clerk users with the `worker` role as assignment targets.
- FR22 (Phase 7.6). Workers can view their own assigned tasks and submit resolution photos + details.

**Analytics**
- FR16. Admin analytics and the public City Health page show: total reports, resolved %, average time to resolve, reports per category, and top upvoted open issues.
- FR17. Admin sees a heatmap of report density.

## 9. Non-Functional Requirements
- **Performance:** map and list load in under 3 s on a mid-range phone on 4G; paginate lists (20 per page).
- **Security:** all writes require a verified Clerk token; admin routes enforced on the backend; secrets only in server env.
- **Reliability:** backend `/health` endpoint; graceful error messages if the free-tier server is waking up.
- **Usability:** mobile-first, works on screens from 360 px wide; report submission in under 60 seconds.
- **Accessibility:** keyboard navigable, sufficient contrast, alt text on images, labels on all inputs.
- **Maintainability:** follows `rules.md`; docs kept in sync.
- **Cost:** everything runs on free tiers.

## 10. Pages / Screens

**Public**
- `/` Landing + live stats + CTA
- `/map` Public map with filters
- `/reports` Feed/list
- `/reports/[id]` Report detail
- `/city-health` Public stats page
- `/sign-in`, `/sign-up` (Clerk)

**Citizen (logged in)**
- `/report/new` Report form
- `/my-reports` Own reports
- `/notifications` Notification list
- `/profile` Basic profile (Clerk-managed)

**Worker (Phase 7.6)**
- `/worker/tasks` Assigned tasks + submission upload

**Admin**
- `/admin` Dashboard (KPIs + charts)
- `/admin/reports` Manage reports table
- `/admin/reports/[id]` Manage a single report
- `/admin/tasks` Assign Task (form + filterable list)
- `/admin/submissions` Review submissions
- `/admin/incomplete` Aging view of open reports
- `/admin/analytics` Insights page
- `/admin/heatmap` Hotspot map
- `/admin/departments` Manage departments (simple list)

## 11. User Journeys

**Citizen reports an issue**
1. Opens the site → taps "Report an issue".
2. Signs in (if needed).
3. Uploads a photo, pin auto-set to current location, picks category (AI may suggest).
4. Duplicate check runs → either upvotes existing or submits new.
5. Sees the report page with status `Reported`.
6. Later receives a notification: "In progress" → "Resolved" with the after photo.

**Admin resolves an issue (direct path)**
1. Signs in → `/admin`.
2. Sorts open reports by upvotes/severity.
3. Opens a report → assigns department → sets `In progress`.
4. After the fix → uploads an after photo → sets `Resolved`.
5. Citizen is notified automatically.

**Admin resolves an issue (task → worker → submission path, Phase 7.5/7.6)**
1. Admin opens `/admin/tasks`, picks a report, department, and a worker account, sets priority + due date → creates the task.
2. Worker signs in → `/worker/tasks` → sees the task → uploads a resolution photo + details → submits.
3. Admin opens `/admin/submissions` → reviews the submission (before/after photos + details) → approves.
4. Approval atomically: closes the task, attaches the after photo to the report, marks the report `Resolved`, and fires the citizen's notification.
5. Citizen receives the notification and sees the after photo on the report detail page.

**Judge / guest**
1. Scans QR → lands on the map.
2. Browses reports and City Health page.
3. Optionally signs up and files a report.

## 12. Authentication Requirements
- Provider: **Clerk** (email + Google sign-in).
- Frontend gets a session token; every API call to protected routes sends `Authorization: Bearer <token>`.
- Backend verifies the token with Clerk's Express SDK.
- Role stored in Clerk `publicMetadata.role` (`"worker"` or `"admin"`; absent = citizen) and exposed in the session token claims.
- Guests may only use read-only public endpoints.
- Routes are guarded in `middleware.js`: citizen pages, `/worker(.*)`, and `/admin(.*)` each check the token and role before render.

## 13. Admin Requirements
- Admin accounts are created by setting `role: "admin"` in the Clerk dashboard (no self-service admin signup).
- Worker accounts are created by setting `role: "worker"` in the Clerk dashboard.
- All admin API routes are protected by `requireAdmin`; worker routes by `requireWorker`.
- Admin UI routes are hidden for non-admins, but the backend check is the real protection.
- Admin can file reports via `/report/new` (transparency — no privileged queue); on submit, redirected to the admin management view.
- Admin commenting on their own report does NOT get the "Official" badge — that badge is reserved for responses on someone else's report.

## 14. API Requirements
Detailed in `architecture.md`. Summary:
- REST JSON API, versioned under `/api/v1`.
- Public read endpoints, authenticated citizen endpoints, worker-only endpoints, admin-only endpoints.
- Consistent error format and pagination.
- Signed upload URL endpoint for image uploads.

## 15. Notifications
- In-app notifications only (stored in DB, shown via bell icon and `/notifications`).
- Triggered by: status change, admin note on own report, resolved with after photo (including resolution via approved submission), **and a worker assignment** (`POST /admin/tasks` with `assignedToId` inserts a notification for that worker).
- Worker taps the bell → `/notifications` → `/worker/tasks`. Citizen taps → the related report.

## 16. Integrations
| Integration | Purpose |
|---|---|
| Clerk | Authentication + roles (citizen / worker / admin) |
| Supabase (Postgres + PostGIS + Storage) | Database and image storage |
| Leaflet + OpenStreetMap tiles | Maps (no API key) |
| Nominatim (OSM) reverse geocoding | Human-readable area label from coordinates |
| LLM vision API (Claude or Gemini) | Optional AI categorization (called from the backend only) |

## 17. Future Features (post-hackathon)
- Email / WhatsApp / push notifications
- Multi-city / ward-level admin scoping
- Marathi / Hindi UI and voice input
- Public API for open data
- Progressive Web App install + offline draft reports
- Worker mobile app with offline photo capture

## 18. Out of Scope (v1)
- Payments or donations
- Real-time chat
- Native mobile apps
- Multi-tenant city management
- Email notifications
- Complex SLA / escalation rules
- Social sharing integrations
- Worker schedule/roster management
