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
- **Accent:** `accent-500` bg, `secondary-600` text (used sparingly, e.g., "Report an issue").
- **Danger:** `danger` bg, white text; confirm dialogs required.
- **Ghost:** transparent; hover `primary-50`.
- **Disabled:** 50% opacity, `cursor-not-allowed`.
- **Loading:** spinner replaces label; width stays fixed.

### Cards
White surface, `border`, radius-lg, shadow-sm; hover: shadow-md (only when clickable).
`ReportCard`: image thumbnail (16:9), status badge top-left, title (H3), category + area (caption), upvote count and time ago.

### Inputs & Forms
- Height 44 px, radius-md, `border` border, white bg.
- Focus: 2 px `primary-600` ring, no outline removal without replacement.
- Label above field (14/500). Helper text below (12, `text-muted`). Error text below in `danger` with icon.
- Required fields marked with `*`.
- Forms are single-column; the report form is a step wizard on mobile.

### Navbar
- Height 64 px, white, bottom `border`.
- Left: logo + name. Center/right: Map, Reports, City Health, primary CTA "Report an issue".
- Right: notification bell (with unread dot) + Clerk user button, or Sign in.
- Mobile: collapses to a menu drawer; the "Report an issue" CTA stays visible as a floating action button.

### Sidebar (admin)
- Width 256 px (desktop), `secondary-600` bg, white text, active item `primary-600` bg.
- Mobile: collapses to a top bar with a drawer.

### Tables (admin)
- Sticky header, zebra rows off, row hover `bg`.
- Columns: thumbnail, title, category, status, upvotes, severity, department, created.
- Mobile: horizontal scroll or card view.

### Modals
- Centered, max-width 480 px, radius-lg, shadow-lg, overlay `rgba(15,23,42,.5)`.
- Focus trap; close on Esc and overlay click (except destructive confirms).

### Badges
- Pill shape, radius-full, 12/600 text, tinted bg (10% of the status color) + solid text/border of the status color.

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
| `xl` | 1280 px | Max content width 1200 px, centered |

## 13. Mobile Design Rules
- Minimum tap target 44 × 44 px.
- Floating "Report an issue" button (bottom-right, `accent-500`) on public pages.
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
success:'#16A34A', warning:'#D97706', danger:'#DC2626', info:'#2563EB',   // inside colors
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
