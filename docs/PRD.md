# PRD.md — Civic Fix

> Source of truth for WHAT we are building.
> Event: BUILD-X (intercollegiate full stack web development, A.C.E.S. Forum, Dept. of Computer Engineering). Theme: **CITY**.

---

## 1. Project Name
**Civic Fix**

## 2. Project Overview
Civic Fix is a public web platform where any citizen can report a city problem (pothole, garbage, broken streetlight, water leak, etc.) with a photo and a map pin. The community upvotes reports so the most important ones rise to the top. A city/admin team manages every report from an admin panel, assigns it, updates its status, and proves resolution with an "after" photo. Everything is transparent through a public map and a City Health page.

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
- **Judges / visitors** (demo): browse the public map and stats without logging in.

## 6. User Roles

| Role | How obtained | Can do |
|---|---|---|
| Guest | No login | View public map, feed, report details, City Health page |
| Citizen | Sign up via Clerk | Everything a guest can + create reports, upvote, comment, see own reports, receive notifications |
| Admin | Clerk `publicMetadata.role = "admin"` set manually in the Clerk dashboard | Everything a citizen can + admin panel: manage all reports, assign departments, change status, add resolution photo, moderate comments, view analytics |

No field-worker role in v1 (see Out of Scope).

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
| F7 | In-app notifications on status change | Closes the loop with the citizen |
| F8 | Admin dashboard (list, filters, sort by upvotes/severity) | Efficient triage |
| F9 | Admin actions: change status, assign department, add note, upload resolved photo | Resolution workflow |
| F10 | Admin analytics (counts, resolution rate, avg fix time, category breakdown, hotspot heatmap) | Decision support + "wow" for judges |
| F11 | AI auto-categorization and severity suggestion from photo + text | "Wow" feature; speeds up reporting (optional-but-planned, Phase 8) |
| F12 | Public City Health page | Accountability; strong judge-facing story |

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

**Admin**
- `/admin` Dashboard (KPIs + charts)
- `/admin/reports` Manage reports table
- `/admin/reports/[id]` Manage a single report
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

**Admin resolves an issue**
1. Signs in → `/admin`.
2. Sorts open reports by upvotes/severity.
3. Opens a report → assigns department → sets `In progress`.
4. After the fix → uploads an after photo → sets `Resolved`.
5. Citizen is notified automatically.

**Judge / guest**
1. Scans QR → lands on the map.
2. Browses reports and City Health page.
3. Optionally signs up and files a report.

## 12. Authentication Requirements
- Provider: **Clerk** (email + Google sign-in).
- Frontend gets a session token; every API call to protected routes sends `Authorization: Bearer <token>`.
- Backend verifies the token with Clerk's Express SDK.
- Role stored in Clerk `publicMetadata.role` (`"admin"` or absent = citizen) and exposed in the session token claims.
- Guests may only use read-only public endpoints.

## 13. Admin Requirements
- Admin accounts are created by setting `role: "admin"` in the Clerk dashboard (no self-service admin signup).
- All admin API routes are protected by `requireAdmin` middleware.
- Admin UI routes are hidden for non-admins, but the backend check is the real protection.

## 14. API Requirements
Detailed in `architecture.md`. Summary:
- REST JSON API, versioned under `/api/v1`.
- Public read endpoints, authenticated citizen endpoints, admin-only endpoints.
- Consistent error format and pagination.
- Signed upload URL endpoint for image uploads.

## 15. Notifications
- In-app notifications only (stored in DB, shown via bell icon and `/notifications`).
- Triggered by: status change, admin note on own report, resolved with after photo.

## 16. Integrations
| Integration | Purpose |
|---|---|
| Clerk | Authentication + roles |
| Supabase (Postgres + PostGIS + Storage) | Database and image storage |
| Leaflet + OpenStreetMap tiles | Maps (no API key) |
| Nominatim (OSM) reverse geocoding | Human-readable area label from coordinates |
| LLM vision API (Claude or Gemini) | Optional AI categorization (called from the backend only) |

## 17. Future Features (post-hackathon)
- Email / WhatsApp / push notifications
- Field-worker role with assigned task list
- Multi-city / ward-level admin scoping
- Marathi / Hindi UI and voice input
- Public API for open data
- Progressive Web App install + offline draft reports

## 18. Out of Scope (v1)
- Payments or donations
- Real-time chat
- Native mobile apps
- Multi-tenant city management
- Field-worker accounts
- Email notifications
- Complex SLA / escalation rules
- Social sharing integrations
