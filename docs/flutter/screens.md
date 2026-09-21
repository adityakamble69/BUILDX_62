# screens.md — Civic Fix Flutter App

> Every screen in the app: purpose, widgets used, navigation, and mobile-specific notes.

---

## Navigation Structure

```
Bottom Nav Bar (Public)
├── 🗺  Map          → /map
├── 📋  Reports      → /reports
├── 🏙  City Health  → /city-health
└── ➕  Report Issue → /report/new  (requires auth)

Top Right Actions
├── 🔔 Notifications  → /notifications  (auth)
└── 👤 Profile / Sign In

Admin Drawer (role = admin only)
├── Dashboard     → /admin
├── Reports       → /admin/reports
├── Heatmap       → /admin/heatmap
└── Departments   → /admin/departments
```

---

## Public Screens

### 1. Home Screen (`/`)

**Purpose:** Landing page with live stats and CTAs.

**Widgets:**
- Hero banner with app name and tagline
- `StatsRow` — 3 cards: Total Reports, Resolved %, Avg Fix Time (from `GET /api/v1/stats/public`)
- `LatestReportsList` — 4 most recent reports (horizontal scroll)
- `CTAButton` — "Report an Issue" (accent color, floating bottom-right on mobile)
- Map preview thumbnail linking to `/map`

**Notes:**
- Stats animate in with a count-up effect on first load
- Skeleton loader while fetching

---

### 2. Map Screen (`/map`)

**Purpose:** Interactive map showing all open reports as colored pins.

**Widgets:**
- `FlutterMap` with OSM tiles
- `MarkerLayer` — circle markers colored by status:
  - Amber `#F59E0B` = Reported
  - Blue `#2563EB` = In Progress
  - Green `#16A34A` = Resolved
- `MarkerClusterLayer` (when zoomed out)
- Filter bottom sheet: Category, Status dropdowns
- Locate-me FAB (bottom-right)
- Popup on tap: thumbnail + title + status badge + "View details" button → `/reports/:id`

**Data:** `GET /api/v1/reports/map` (up to 1 000 lightweight points)

**Notes:**
- Map height fills screen minus app bar and bottom nav
- Rejected reports are hidden (server filters them)
- Cluster taps zoom in; single pin tap opens popup

---

### 3. Reports Screen (`/reports`)

**Purpose:** Paginated, filterable feed of all reports.

**Widgets:**
- `FilterBar` — Category, Status, Sort (Newest / Most Upvoted) chips
- `ListView.builder` of `ReportCard`
- `ReportCard`:
  - 16:9 thumbnail (or placeholder icon)
  - Status badge (top-left overlay)
  - Title, category + area (caption), time ago
  - Upvote count + thumbs-up icon
- `PaginationLoader` — `CircularProgressIndicator` at list bottom triggers next page fetch
- Pull-to-refresh

**Data:** `GET /api/v1/reports?page=N&pageSize=20&category=X&status=Y&sort=Z`

---

### 4. Report Detail Screen (`/reports/:id`)

**Purpose:** Full detail of one report + status timeline + comments.

**Widgets:**
- `ImageCarousel` — swipeable photos (before / after)
- `StatusBadge` + title + description
- Info row: category, area, severity (1–5 dots), created date
- `UpvoteButton` — shows count; toggles on tap (auth required)
- `StatusTimeline` — vertical list of status_history rows with icons and timestamps
- `CommentList` — list of comments, admin comments have an "Official Response" badge
- `AddCommentField` (auth required) — text input + send button
- `ResolvedAfterPhoto` — if resolved, shows the after photo prominently

**Data:**
- `GET /api/v1/reports/:id`
- `POST /api/v1/reports/:id/upvote` (auth)
- `GET /api/v1/reports/:id/comments`
- `POST /api/v1/reports/:id/comments` (auth)

---

### 5. City Health Screen (`/city-health`)

**Purpose:** Public accountability dashboard — stats + charts.

**Widgets:**
- KPI cards: Total, Resolved %, Avg fix time (hours), In Progress count
- `CategoryBarChart` — reports per category (fl_chart BarChart)
- `TopUpvotedList` — top 5 open reports by upvote count
- Refresh button

**Data:** `GET /api/v1/stats/public`, `GET /api/v1/stats/categories`

---

## Citizen Screens (Auth Required)

### 6. New Report Wizard (`/report/new`)

**Purpose:** Step-by-step report submission: Photo → Location → Details → Review.

**Steps:**

**Step 1 — Photos**
- `ImagePickerGrid` — up to 3 slots; tap to pick from camera or gallery
- At least 1 photo required
- Thumbnails shown with remove button

**Step 2 — Location**
- `FlutterMap` in `pick-location` mode — tap to place pin
- `LocateMeButton` — sets pin to current GPS location
- `AddressField` — auto-filled by reverse geocoding (Nominatim), editable
- Duplicate detection: if same category + open report within 50 m → shows `DuplicateWarningCard` with "Upvote instead" button

**Step 3 — Details**
- `CategoryPicker` — grid of category chips (pothole, garbage, streetlight, etc.)
- `SeveritySlider` — 1 (minor) to 5 (critical)
- Title field (required, max 120 chars)
- Description field (optional, max 1 000 chars)
- AI suggestion chip (if backend AI enabled): pre-fills category + severity with override option

**Step 4 — Review**
- Summary of all fields
- Photo thumbnails
- Map preview of pin location
- "Submit Report" button → POST /api/v1/reports
- Loading state with spinner; success → navigate to `/reports/:id`

**Stepper widget:** `Stepper` or custom `StepIndicator` at top (4 steps, current highlighted in primary teal)

---

### 7. My Reports Screen (`/my-reports`)

**Purpose:** Citizen sees all their submitted reports.

**Widgets:**
- Same `ReportCard` as the public feed
- Empty state: "You haven't filed any reports yet. Tap + to get started."
- Pull-to-refresh, pagination

**Data:** `GET /api/v1/me/reports?page=N&pageSize=20` (auth)

---

### 8. Notifications Screen (`/notifications`)

**Purpose:** In-app notification list (status changes on citizen's reports).

**Widgets:**
- `NotificationTile`:
  - Bell icon (amber = unread, gray = read)
  - Message text ("Your report is now In Progress")
  - Time ago
  - Tap → navigate to `/reports/:id`
- "Mark all read" button (top-right)
- Empty state: "No notifications yet."

**Data:**
- `GET /api/v1/me/notifications?page=N`
- `POST /api/v1/me/notifications/read` (marks all read)

---

### 9. Sign In / Sign Up Screens

**Purpose:** Clerk-hosted auth in a WebView.

**Widget:** `WebViewWidget` loading the Clerk hosted sign-in/sign-up URL.

On completion, Clerk redirects to `civicfix://auth?token=<JWT>` — the app intercepts the deep link, stores the token, and pops back to the originating screen.

---

## Admin Screens (role = admin)

### 10. Admin Dashboard (`/admin`)

**Purpose:** KPI overview + charts for the admin.

**Widgets:**
- KPI row: Total, Reported, In Progress, Resolved, Rejected
- `ResolutionRateCard` — resolved % + avg fix time
- `ReportsTrendChart` — line chart, reports created vs resolved per day (last 7 / 30 days)
- `CategoryBreakdownChart` — horizontal bar chart
- `DepartmentBreakdownList` — reports per department

**Data:** `GET /api/v1/admin/stats?trendDays=7`

---

### 11. Admin Reports Screen (`/admin/reports`)

**Purpose:** Full paginated table of all reports with filters and actions.

**Widgets:**
- Filter bar: Category, Status, Department, Sort
- `DataTable` / `ListView` of `AdminReportRow`:
  - Thumbnail, title, status badge, category, department, upvotes, severity, created date
  - Tap → `/admin/reports/:id`
- Pagination (page controls bottom)

**Data:** `GET /api/v1/admin/reports?page=N&...`

---

### 12. Admin Report Detail (`/admin/reports/:id`)

**Purpose:** Admin manages a single report.

**Widgets:**
- Full report info (same as public detail + reporter name)
- `StatusChangeDropdown` + Note field + Confirm button
- `DepartmentAssignDropdown`
- `ResolutionImagePicker` — upload an "after" photo
- Comment list with delete buttons (admin can delete any comment)
- Delete report button (danger, confirm dialog)

**Data:**
- `GET /api/v1/reports/:id`
- `PATCH /api/v1/admin/reports/:id/status`
- `PATCH /api/v1/admin/reports/:id/assign`
- `POST /api/v1/admin/reports/:id/resolution-image`
- `DELETE /api/v1/admin/reports/:id`
- `DELETE /api/v1/admin/comments/:id`

---

### 13. Admin Heatmap Screen (`/admin/heatmap`)

**Purpose:** Report density heatmap for hotspot identification.

**Widgets:**
- `FlutterMap` with a custom heatmap layer (using `flutter_map_heatmap` or custom painter)
- Gradient: teal → amber → red (low → high density)
- Legend overlay

**Data:** `GET /api/v1/admin/heatmap` → `[{ lat, lng, severity }]`

---

### 14. Admin Departments Screen (`/admin/departments`)

**Purpose:** Manage the list of city departments.

**Widgets:**
- `DepartmentList` — each row: name, active toggle, edit/delete icons
- FAB → "Add Department" dialog
- Inline edit name field

**Data:** `GET/POST/PATCH/DELETE /api/v1/admin/departments`
