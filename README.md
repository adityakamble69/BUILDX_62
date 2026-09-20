# Civic Fix

Report city problems with a photo and a map pin, upvote the ones that matter, and watch admins resolve them.
Built for BUILD-X (theme: CITY). Flow: **Report → Prioritize → Assign → Resolve → Notify**.

**Stack:** Next.js 15 (App Router) + Tailwind · Node.js/Express · Supabase (Postgres + PostGIS + Storage) · Clerk · Vercel + Render.

All planning lives in [`docs/`](docs): `PRD.md`, `architecture.md`, `database.md`, `design.md`, `rules.md`, `phases.md`, `memory.md`. Read them before changing anything.

## Run locally

```bash
# 1) API (http://localhost:4000)
cd server
cp .env.example .env
npm install
npm run dev

# 2) Web app (http://localhost:3000), in a second terminal
cd client
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000. The "Server connection" card should show **Connected**.

## Phase 1 checklist (manual steps)

1. **GitHub:** create repo `civic-fix`, push this folder.
2. **Supabase:** new project, then SQL editor: `create extension if not exists postgis; create extension if not exists pgcrypto;`
3. **Clerk:** new application, enable Email + Google. Sessions → Customize session token → `{ "metadata": "{{user.public_metadata}}" }`.
4. **Render** (Web Service): root directory `server`, build `npm install`, start `node src/index.js`, health check path `/health`.
   Env: `NODE_ENV=production`, `CLIENT_ORIGIN=https://<your-vercel-domain>` (set after step 5, then redeploy).
5. **Vercel:** import repo, root directory `client`, framework Next.js.
   Env: `NEXT_PUBLIC_API_URL=https://<your-render-service>.onrender.com`.
6. **Uptime pinger:** UptimeRobot or cron-job.org hitting `https://<render-url>/health` every 5 minutes (Render free tier sleeps).
7. **Verify:** the deployed client shows **Connected**.
8. Tick the boxes in `docs/phases.md`, update `docs/memory.md`, tag `phase-1-done`.

## Phase 2: database and seed data

Run in the Supabase dashboard (SQL editor), in this order, from `server/sql/`:

1. Enable extensions first: Database -> Extensions -> `postgis` and `pgcrypto` (or `create extension` in the editor).
2. `001_schema.sql`: tables, indexes, triggers, RLS (no public policies), and the `report-images` bucket.
3. `002_functions.sql`: duplicate check, status change, stats/map/heatmap functions.
4. `003_seed.sql`: 80 demo reports around Nagpur (safe to re-run; it only replaces `user_seed_*` rows).
5. Storage -> `report-images` -> Upload folder: upload `server/sql/seed-images/` and name the folder `seed` (so paths look like `seed/before-pothole-1.jpg`).
6. `sanity_checks.sql`: run one numbered block at a time and compare with the expected values in the comments.

Never commit `.env` files or real keys.
