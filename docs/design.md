# design.md — Civic Fix

> Source of truth for HOW the app looks and behaves.
> Do not introduce new colors, fonts, or styles outside this file. If something is missing, add it here first.

---

## 1. Design Philosophy

- **Trustworthy and civic:** feels like a modern public-service product, not a toy.
- **Clear over clever:** the reporting flow should take under 60 seconds.
- **Map-first:** location is the heart of the app; maps and status colors carry meaning.
- **Mobile-first:** most citizens will use a phone.
- **Consistent:** one color system, one type scale, one spacing scale.

## 2. Color Palette

### Brand

| Token | Hex | Use |
|---|---|---|
| `primary-600` | `#0F766E` | Primary buttons, links, active nav (civic teal) |
| `primary-700` | `#115E59` | Primary hover |
| `primary-50` | `#F0FDFA` | Subtle primary backgrounds |
| `secondary-600` | `#1E293B` | Headings, sidebar, dark surfaces (slate) |
| `accent-500` | `#F59E0B` | Highlights, upvote active, CTAs on dark |

### Status (also used on map markers)

| Status | Color | Hex | Badge text |
|---|---|---|---|
| Reported | Amber | `#F59E0B` | Reported |
| In progress | Blue | `#2563EB` | In progress |
| Resolved | Green | `#16A34A` | Resolved |
| Rejected | Gray | `#6B7280` | Rejected |

Status badges always include text (never color alone).

### Semantic

| Token | Hex |
|---|---|
| `success` | `#16A34A` |
| `warning` | `#D97706` |
| `danger` | `#DC2626` |
| `info` | `#2563EB` |

### Neutrals

| Token | Hex | Use |
|---|---|---|
| `bg` | `#F8FAFC` | Page background |
| `surface` | `#FFFFFF` | Cards, inputs, modals |
| `border` | `#E2E8F0` | Borders, dividers |
| `text` | `#0F172A` | Primary text |
| `text-muted` | `#475569` | Secondary text |
| `text-subtle` | `#94A3B8` | Placeholders, hints |

Contrast: body text on `bg`/`surface` must meet WCAG AA.

## 3. Typography

- **Headings:** `Space Grotesk` (600/700)
- **Body / UI:** `DM Sans` (400/500/600)
- **Fallback stack:** `system-ui, -apple-system, "Segoe UI", sans-serif`
- Load with `next/font/google` (`display: 'swap'`), exposed as CSS variables `--font-heading` and `--font-body`.

| Style | Size / line-height | Weight | Font |
|---|---|---|---|
| Display (landing hero) | 48 / 56 (mobile 36 / 44) | 700 | Space Grotesk |
| H1 | 32 / 40 (mobile 28 / 36) | 700 | Space Grotesk |
| H2 | 24 / 32 | 600 | Space Grotesk |
| H3 | 20 / 28 | 600 | Space Grotesk |
| Body | 16 / 24 | 400 | DM Sans |
| Body small | 14 / 20 | 400 | DM Sans |
| Caption | 12 / 16 | 500 | DM Sans |
| Button | 14–16 / 20 | 600 | DM Sans |

## 4. Spacing System

Base unit 4 px (Tailwind default scale). Allowed steps: 4, 8, 12, 16, 24, 32, 48, 64.

- Card padding: 16 (mobile) / 24 (desktop)
- Section vertical spacing: 48–64
- Form field gap: 16

## 5. Border Radius

| Token | Value | Use |
|---|---|---|
| `radius-sm` | 6 px | Badges, small chips |
| `radius-md` | 10 px | Inputs, buttons |
| `radius-lg` | 16 px | Cards, modals |
| `radius-full` | 9999 px | Avatars, pills |

## 6. Shadows

| Token | Value | Use |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(15,23,42,.06)` | Cards at rest |
| `shadow-md` | `0 4px 12px rgba(15,23,42,.10)` | Hover cards, dropdowns |
| `shadow-lg` | `0 12px 32px rgba(15,23,42,.16)` | Modals, popovers |

## 7. Components

### Buttons

- **Primary:** `primary-600` bg, white text; hover `primary-700`; radius-md; height 44 px min.
- **Secondary:** white bg, `border` border, `text` text; hover `bg`.
- **Accent:** `accent-500` bg, `secondary-600` text (used sparingly, e.g., "Report an issue" FAB).
- **Danger:** `danger` bg, white text; confirm dialogs required.
- **Ghost:** transparent; hover `primary-50`.
- **Disabled:** 50% opacity, `cursor-not-allowed`.
- **Loading:** spinner replaces label; width stays fixed.
- **With icon:** leading icon 16 px, gap 8 px. Used by role-specific topbar CTAs (`Admin Panel` shield, `My Tasks` clipboard).

### Cards

White surface, `border`, radius-lg, shadow-sm; hover: shadow-md (only when clickable).

`ReportCard`: image thumbnail (16:9), status badge top-left, title (H3, 2-line clamp with `min-h` so rows align), category + area (caption), upvote count and time ago.

`ChartCard`: optional `href` prop turns the title into a link (arrow slides right on hover) — used on the admin dashboard to route each panel to its full page.

### Inputs & Forms

- Height 44 px, radius-md, `border` border, white bg.
- Focus: 2 px `primary-600` ring, no outline removal without replacement.
- Label above field (14/500). Helper text below (12, `text-muted`). Error text below in `danger` with icon.
- Required fields marked with `*`.
- Forms are single-column; the report form is a step wizard on mobile.
- All form controls carry `suppressHydrationWarning` (browser-extension false positive, memory.md D32).

### Navbar (role-aware)

- Height 64 px, white, bottom `border`.
- Left: logo + name. Center: `Home`, `Map`, `City Health`, `About`, then a signed-in `My Reports` link.
- Right side varies by Clerk `publicMetadata.role`:
  - **Guest:** `Sign In` (secondary) + `Report an Issue` (primary).
  - **Citizen:** `Report an Issue` (primary) + bell + avatar.
  - **Worker:** `My Tasks` (primary, teal, clipboard icon) + bell + avatar. No `Report an Issue` in the desktop topbar.
  - **Admin:** `Admin Panel` (primary, teal, shield icon) + bell + avatar. No `Report an Issue` in the desktop topbar.
- Mobile: collapses to a menu drawer. Drawer keeps `Report an Issue` for everyone (worker/admin can still file from mobile). Floating `Report an Issue` FAB (bottom-right, `accent-500`) is hidden for admins only.

### Admin topbar (`AdminTopbar`)

- Height 64 px, sticky, sits above `main` inside `(admin)/admin/layout.jsx`.
- Left: search input (`max-w-sm`, routes to `/admin/reports?search=<q>` on Enter).
- Right: refresh button (hard reload), bell (routes to `/notifications`), profile button (avatar + name + role + chevron → opens Clerk user-profile modal), dedicated logout button (Clerk `SignOutButton`).
- All four action buttons carry `suppressHydrationWarning`.

### Sidebar (admin)

- Width 256 px (desktop), `secondary-600` bg, white text, active item `primary-600` bg.
- Nav in two groups: **Operations** (Dashboard, Reports, Assign Task, Submissions, Incomplete) and **Insights** (Analytics, Heatmap, Departments).
- No profile block at the bottom — the admin's identity + logout live in the topbar.
- Mobile: collapses to a top bar with a drawer that includes a compact `Log out` button.

### Tables (admin)

- Sticky header, zebra rows off, row hover `bg`.
- Reports: thumbnail, title, category, status, severity, upvotes, department, created.
- Tasks: title, issue, department, assigned-to, priority, due, status, action.
- Submissions: submission id, task/report, assigned person, submitted, resolution indicator, status, action.
- Incomplete: report, category, department, assigned-to, days-pending (color-coded), last update, priority, action.
- Mobile: horizontal scroll or card view.

### Modals

- Centered, max-width 480 px, radius-lg, shadow-lg, overlay `rgba(15,23,42,.5)`.
- Focus trap; close on Esc and overlay click (except destructive confirms).
- `SubmissionReviewModal`: side-by-side before/after photos + grade + remarks + two decisions.

### Badges

- Pill shape, radius-full, 12/600 text, tinted bg (10% of the status color) + solid text/border of the status color.
- Tone map: `neutral` (default), `info`, `success`, `warning`, `danger`.

### Icons

- Lucide icons, 20 px default (16 px in badges, 24 px in nav). Stroke 1.75–2. Category icons are defined in `categories.icon`.

### Toasts

- Bottom-center (mobile) / top-right (desktop), auto-dismiss 4 s, color by semantic type, `aria-live="polite"`.

## 8. States

### Loading

- Skeleton blocks matching the layout (cards, table rows, chart placeholders). No full-screen spinners except the first app boot.
- Cold-start message if the API takes > 5 s: "Waking up the server, hang tight…"

### Empty

- Illustration/icon + one-line explanation + a primary action (e.g., "No reports yet. Be the first to report an issue.").

### Error

- Inline card with icon, short message, and "Try again" button. Form errors appear next to fields.

### Hover / Focus / Active

- Hover: subtle darken or shadow lift (150 ms).
- Focus: visible ring (`primary-600`, 2 px, offset 2 px).
- Active/pressed: scale 0.98 for buttons.

## 9. Maps

- Base tiles: OpenStreetMap standard.
- Markers: circle pins colored by status; size scales slightly with upvotes (max 1.5×).
- Clusters when zoomed out; popup shows thumbnail, title, status badge, upvotes, "View details".
- Heatmap gradient: teal → amber → red (low → high density).
- Map height: 70 vh on `/map`, 320 px in forms, 400 px in admin panels.

## 10. Charts (Chart.js)

- Use status colors for status charts and `primary-600` / `accent-500` / `secondary-600` for categorical series.
- Always show a legend or direct labels; no chart without a title.

## 11. Animations

- Durations: 150 ms (micro), 250 ms (panels), 400 ms (page/hero).
- Easing: `ease-out`.
- Allowed: fade, slide-up (8–16 px), scale on press, number count-up on stat cards.
- Respect `prefers-reduced-motion`: disable non-essential animation.

## 12. Responsive Breakpoints

| Name | Min width | Notes |
|---|---|---|
| base | 0 | 360 px target, single column |
| `sm` | 640 px | Two-column cards |
| `md` | 768 px | Sidebar visible, tables |
| `lg` | 1024 px | Three-column feed, full admin layout |
| `xl` | 1280 px | Page shells go edge-to-edge (no max-width cap); gutters widen via `PAGE_PADDING` |
| `2xl` | 1536 px | Gutters widen again |

Public browse/dashboard shells (Navbar, Footer, `/`, `/map`, `/reports`, `/my-reports`, `/city-health`) are full-width with responsive horizontal padding (`client/src/lib/utils/layout.js`'s `PAGE_PADDING`: `px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24`) rather than a fixed centered max-width (memory.md D42, superseding the earlier "max content width 1200 px, centered" rule). Single-column reading/form pages (`/report/new`, `/reports/[id]`, `/notifications`, `/sign-in`, `/sign-up`), the worker dashboard, and the admin panel keep a narrower cap — edge-to-edge text and form fields on an ultrawide monitor hurts readability more than it helps. Report grids (`LatestReports`, `/reports`, `/my-reports`) use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.

## 13. Mobile Design Rules

- Minimum tap target 44 × 44 px.
- Floating "Report an issue" button (bottom-right, `accent-500`) on public pages — hidden for admins.
- Bottom-safe spacing for iOS/Android gesture bars.
- Camera/file input opens the camera directly (`accept="image/*" capture="environment"` as an option).
- Avoid hover-only interactions.
- Keep the map usable with one hand: controls at the bottom half of the screen.

## 14. Tailwind Token Mapping (reference)

Tailwind 3.4 (so this config format applies as written); `content: ['./src/**/*.{js,jsx}']`.

```js
// tailwind.config.js (theme.extend)
colors: {
  primary: { 50:'#F0FDFA', 600:'#0F766E', 700:'#115E59' },
  secondary: { 600:'#1E293B' },
  accent: { 500:'#F59E0B' },
  status: { reported:'#F59E0B', progress:'#2563EB', resolved:'#16A34A', rejected:'#6B7280' },
  bg:'#F8FAFC', surface:'#FFFFFF', border:'#E2E8F0',
  ink:{ DEFAULT:'#0F172A', muted:'#475569', subtle:'#94A3B8' }
},
fontFamily: {
  heading:['var(--font-heading)','system-ui','sans-serif'],
  body:['var(--font-body)','system-ui','sans-serif']
},
success:'#16A34A', warning:'#D97706', danger:'#DC2626', info:'#2563EB', // inside colors
borderRadius: { sm:'6px', md:'10px', lg:'16px' },
boxShadow: {
  sm:'0 1px 2px rgba(15,23,42,.06)',
  md:'0 4px 12px rgba(15,23,42,.10)',
  lg:'0 12px 32px rgba(15,23,42,.16)'
}
```

## 15. Do / Don't

**DO** reuse tokens and components; keep status colors consistent everywhere (map, badge, chart).

**DON'T** add new hex values, new fonts, or one-off shadows; don't use color alone to convey status.
