# Civic Fix — Flutter Mobile App Documentation

> This folder contains all documentation for building the **Civic Fix Flutter mobile app** — a native Android/iOS client that connects to the same Express + Supabase backend used by the web app.

---

## What is Civic Fix?

**Civic Fix** is a platform where citizens report city problems (potholes, garbage, broken streetlights, water leaks, etc.) with a photo and a map pin. The community upvotes the most important reports, and a city admin team resolves them — closing the loop with an in-app notification.

**Core loop:** Report → Prioritize → Assign → Resolve → Notify

---

## Documentation Index

| File | What it covers |
|---|---|
| [README.md](./README.md) | This file — overview & index |
| [setup.md](./setup.md) | Project setup, dependencies, env config |
| [architecture.md](./architecture.md) | App architecture, folder structure, state management |
| [screens.md](./screens.md) | All screens, navigation, and UI specs |
| [api.md](./api.md) | API integration — every endpoint the app calls |
| [design.md](./design.md) | Colors, typography, spacing, component rules |

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Flutter 3.x (Dart) | Cross-platform iOS + Android from one codebase |
| Auth | Clerk Flutter SDK / Clerk Hosted Pages | Same auth as web; role-based access via `publicMetadata` |
| API | Same Express server (`http://localhost:4111` dev / deployed URL prod) | Single source of truth |
| Maps | `flutter_map` + OpenStreetMap tiles | Free, no API key, same tile source as web |
| State | Riverpod | Testable, reactive, no boilerplate |
| Image upload | `image_picker` + `http` multipart | Direct to signed Supabase Storage URL |
| Local storage | `flutter_secure_storage` | JWT token persisted securely |

---

## Roles

| Role | How | Can do |
|---|---|---|
| Guest | No login | Public map, feed, report details, City Health |
| Citizen | Sign up via Clerk | + Create reports, upvote, comment, notifications |
| Admin | `publicMetadata.role = "admin"` in Clerk dashboard | + Admin panel, status changes, analytics |

---

## Quick Start

```bash
# 1. Clone and enter the flutter app directory
cd civic-fix/mobile

# 2. Install dependencies
flutter pub get

# 3. Copy env file and fill in values
cp .env.example .env

# 4. Run on a device or emulator
flutter run
```

See [setup.md](./setup.md) for full setup instructions.
