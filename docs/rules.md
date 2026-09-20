# rules.md — Civic Fix

> Rules every developer and AI must follow. If a rule must change, update this file first and note it in `memory.md`.

---

## 0. Golden Rules
1. Docs are the source of truth: `PRD.md`, `architecture.md`, `database.md`, `design.md`, `phases.md`, `memory.md`.
2. Do not build anything that is not in the PRD without documenting it first.
3. Finish the core loop (Report → Upvote → Admin resolve → Notify) before any "wow" feature.
4. Do not break working code. Change only what the task requires.

## 1. Coding Standards

**DO**
- Use modern JavaScript (ES modules, `async/await`, `const`/`let`).
- Keep functions small and single-purpose.
- Handle every promise rejection.
- Prefer early returns over deep nesting.
- Comment *why*, not *what*.

**DON'T**
- Use `var`, callbacks pyramids, or `console.log` left in committed code (use a logger util in the server).
- Leave dead code or commented-out blocks.
- Copy-paste logic; extract it.

## 2. Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| React components | PascalCase file | `ReportCard.jsx` |
| Route folders | kebab-case | `city-health` |
| Next.js route files | framework names | `page.jsx`, `layout.jsx` |
| JS files (server) | camelCase | `reportService.js` |
| Variables / functions | camelCase | `getNearbyDuplicates` |
| Constants | UPPER_SNAKE | `MAX_IMAGES` |
| DB tables / columns | snake_case, plural tables | `status_history`, `created_at` |
| API paths | kebab-case, plural nouns | `/api/v1/reports` |
| Env vars | UPPER_SNAKE | `SUPABASE_URL` |
| Git branches | `type/short-name` | `feat/report-form` |

## 3. Folder Conventions
- Follow the structure in `architecture.md` exactly.
- **DO** put reusable UI in `client/src/components/ui`; feature components in the matching feature folder.
- **DO** keep all backend DB access in `server/src/services`.
- **DON'T** create new top-level folders without documenting them.
- **DON'T** import server code from client or vice versa.

## 4. Component Conventions (React / Next.js)
**DO**
- One component per file; props declared at the top.
- Reuse components from `ui/` (Button, Card, Input, Badge, Modal, Toast, Skeleton).
- Keep components under ~200 lines; split when larger.
- Default to server components; add `'use client'` only when state, effects, or browser APIs are needed.
- Provide loading, empty, and error states for every data-driven component.

**DON'T**
- Create a second version of an existing component (no `Button2`, `NewCard`).
- Put fetch calls scattered in components; use `lib/api.js`.
- Hardcode colors, spacing, or fonts; use design tokens (`design.md`).

## 5. API Conventions
**DO**
- Prefix all routes with `/api/v1` (except `/health`).
- Use plural nouns and proper HTTP verbs/status codes.
- Return the standard envelope: `{ data, meta }` or `{ error: { code, message, details } }`.
- Paginate all list endpoints (default 20, max 100).
- Validate every request body/query with Zod.

**DON'T**
- Return raw database errors or stack traces to clients.
- Accept `user_id`, `role`, or `reporter_id` from the request body.
- Add endpoints not listed in `architecture.md` without updating it.

## 6. Database Conventions
**DO**
- Change schema only via numbered SQL files in `server/sql/` and update `database.md`.
- Use foreign keys, checks, and indexes as defined.
- Use transactions or DB functions for multi-table writes.

**DON'T**
- Edit `upvote_count` manually (trigger owns it; `003_seed.sql` is the one documented exception).
- Store duplicated data (e.g., category name inside reports).
- Run destructive SQL on the production DB without a backup of the seed and schema.

## 7. Security Rules
**DO**
- Verify the Clerk token on every protected route.
- Enforce roles on the backend with `requireAdmin`.
- Sanitize and length-limit all text input.
- Restrict CORS to the known client origin(s).
- Use rate limiting (global + stricter on `POST /reports`, `/comments`, `/ai/classify`).
- Restrict uploads to JPEG/PNG/WebP, max 5 MB, max 3 per report.
- Keep RLS enabled with no public policies.

**DON'T**
- Hardcode secrets, tokens, or keys anywhere in code or docs.
- Expose `SUPABASE_SERVICE_ROLE_KEY`, `CLERK_SECRET_KEY`, or AI keys to the browser. (`CLERK_SECRET_KEY` also lives on Vercel for Next.js middleware: server-side only, never `NEXT_PUBLIC_`.)
- Import Supabase or query the database from Next.js code; the frontend only calls Express.
- Trust frontend role checks as protection.
- Render user text as raw HTML (no `dangerouslySetInnerHTML` with user content).

## 8. Authentication Rules
- Clerk is the only auth system. Do not enable Supabase Auth.
- Role source: `sessionClaims.metadata.role`. Anything other than `"admin"` = citizen.
- Admin accounts are created manually in the Clerk dashboard.
- Create a `profiles` row lazily on the first authenticated write.

## 9. Environment Variable Rules
**DO**
- Commit `.env.example` files with placeholder values only.
- Use the `NEXT_PUBLIC_` prefix only for values safe for browsers (Next.js convention).
- Load and validate env vars at server startup; fail fast if missing.

**DON'T**
- Commit `.env` files.
- Log env values.
- Reuse the same key for different purposes.

## 10. Error Handling Rules
**DO**
- Use a central `errorHandler` middleware and a custom `AppError(code, status, message)`.
- Wrap async controllers in `asyncHandler`.
- Show friendly toasts on the client; keep technical detail in server logs.
- Handle "server waking up" (Render cold start) with a visible retry/loading message.

**DON'T**
- Swallow errors silently.
- Show raw error JSON to users.

## 11. Validation Rules
- Server validation is mandatory; client validation is for UX only.
- Coordinates: lat −90..90, lng −180..180.
- Title 5–120 chars, description ≤ 2000, comment 1–500.
- Enum values must match `database.md`.

## 12. Responsive Design Rules
- Mobile-first; base styles for 360 px, then `sm`, `md`, `lg`.
- Tap targets ≥ 44 px.
- Tables become cards or scroll horizontally on small screens.
- Maps must have an explicit height and work with touch.

## 13. Accessibility Rules
- Every input has a visible label.
- Images have meaningful `alt` text.
- Keyboard focus is visible and logical; modals trap focus and close on Esc.
- Color is never the only status indicator (badges include text).
- Meet WCAG AA contrast for text.

## 14. Git / GitHub Rules
**DO**
- Small, focused commits with clear messages: `feat: add report form`, `fix: cors header`.
- Work in feature branches; merge into `main` only when the phase check passes.
- Tag the working state at the end of each phase (`phase-3-done`).

**DON'T**
- Commit secrets, `node_modules`, build output, or `.env`.
- Force-push `main`.
- Leave `main` broken before a demo.

## 15. Dependency Rules
**DO**
- Prefer built-ins and existing dependencies first.
- Pin major versions; commit lockfiles.
- Approved core deps — client: `next`, `react`, `react-dom`, `@clerk/nextjs`, `leaflet`, `react-leaflet`, `leaflet.heat`, `chart.js`, `react-chartjs-2`, `tailwindcss` (3.4), `postcss`, `autoprefixer`; server: `express`, `cors`, `helmet`, `@clerk/express`, `@supabase/supabase-js`, `zod`, `express-rate-limit`, `dotenv`.

**DON'T**
- Install a library for something achievable in a few lines.
- Add heavy UI kits or state libraries.
- Add a dependency without recording it in `memory.md` (Important Decisions).

## 16. Performance Rules
- Paginate lists; never return all reports except the capped map endpoint (max 1000 points).
- Use indexes as defined; check `EXPLAIN` for slow queries.
- Lazy-load Leaflet and Chart.js with `next/dynamic` (`ssr: false`) only on pages that use them.
- Use `next/image` for remote images and `next/font` for fonts.
- Compress images on the client before upload (target ≤ 1 MB, max width 1600 px).
- Use skeleton loaders instead of blocking spinners.

## 17. Testing Rules
- Every phase ends with a manual test of its completion criteria.
- Test API endpoints with a REST client collection (Thunder Client/Postman/`.http` files) saved in `server/`.
- Minimum manual test matrix before demo: guest, citizen, admin × desktop, mobile.
- Test on the deployed URLs, not just localhost.
- Fix bugs in the current phase before starting the next.

## 18. Documentation Rules
- After each meaningful change: update `memory.md`, tick `phases.md`.
- Update `architecture.md`, `database.md`, `design.md`, or this file whenever the corresponding thing changes.
- If two docs conflict: identify the conflict, decide the correct approach, update docs, then continue.

## 19. AI-Assistant Rules
- Read the relevant docs before implementing anything.
- Do not change the tech stack, schema, or design system without documenting it.
- Provide complete files that are ready to paste (no partial diffs) unless asked otherwise.
- Do not rewrite working files unnecessarily.
