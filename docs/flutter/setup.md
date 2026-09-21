# setup.md — Civic Fix Flutter App

> Complete project setup guide: installing Flutter, creating the app, configuring env, and running on device/emulator.

---

## 1. Prerequisites

| Tool | Minimum version | Install |
|---|---|---|
| Flutter SDK | 3.19.x | https://docs.flutter.dev/get-started/install |
| Dart | 3.3.x (bundled with Flutter) | — |
| Android Studio | Hedgehog (2023.1.1) or newer | For Android emulator + SDK |
| Xcode | 15.x (macOS only) | For iOS simulator |
| VS Code | Any recent | With Flutter + Dart extensions |
| Node.js | 18.x or 20.x | To run the backend Express server |

Run `flutter doctor` and fix every issue before continuing.

---

## 2. Create the Flutter Project

```bash
# From the civic-fix root folder
flutter create mobile --org com.civicfix --platforms android,ios

cd mobile
```

This creates `civic-fix/mobile/` — the Flutter app lives here.

---

## 3. Dependencies (`pubspec.yaml`)

Add these under `dependencies:` in `mobile/pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter

  # Networking
  dio: ^5.4.0                    # HTTP client with interceptors
  retrofit: ^4.1.0               # Type-safe API client generator
  json_annotation: ^4.8.1

  # State management
  flutter_riverpod: ^2.5.1
  riverpod_annotation: ^2.3.5

  # Auth (Clerk)
  webview_flutter: ^4.7.0        # For Clerk Hosted Sign-in UI
  flutter_secure_storage: ^9.0.0 # Persist JWT token securely

  # Maps
  flutter_map: ^6.1.0
  latlong2: ^0.9.1

  # Image handling
  image_picker: ^1.1.1
  cached_network_image: ^3.3.1

  # Location
  geolocator: ^11.0.0
  geocoding: ^3.0.0

  # UI helpers
  intl: ^0.19.0                  # Date formatting
  timeago: ^3.6.1                # "3 hours ago"
  shimmer: ^3.0.0                # Skeleton loaders
  fluttertoast: ^8.2.4           # Toast messages
  go_router: ^13.2.0             # Declarative routing

  # Config
  flutter_dotenv: ^5.1.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
  build_runner: ^2.4.8
  retrofit_generator: ^8.1.0
  json_serializable: ^6.7.1
  riverpod_generator: ^2.3.9
```

Run:
```bash
flutter pub get
```

---

## 4. Environment Configuration

Create `mobile/.env` (never commit this file):

```env
# Backend API (Express server)
API_BASE_URL=http://10.0.2.2:4111   # Android emulator → localhost
# API_BASE_URL=http://localhost:4111  # iOS simulator

# Clerk
CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_SIGN_IN_URL=https://communal-jaguar-379.clerk.accounts.dev/sign-in
CLERK_SIGN_UP_URL=https://communal-jaguar-379.clerk.accounts.dev/sign-up

# Supabase Storage (for image URL building only — no direct DB access from Flutter)
SUPABASE_URL=https://ftppllnshydnsjmssond.supabase.co
SUPABASE_STORAGE_BUCKET=report-images
```

> **Note:** Flutter talks **only** to the Express API (`API_BASE_URL`). It never calls Supabase directly — all data goes through the backend, which holds the Supabase service role key.

Add to `mobile/pubspec.yaml` under `flutter:`:
```yaml
flutter:
  assets:
    - .env
```

Load in `main.dart`:
```dart
import 'package:flutter_dotenv/flutter_dotenv.dart';

Future<void> main() async {
  await dotenv.load(fileName: '.env');
  runApp(const ProviderScope(child: CivicFixApp()));
}
```

---

## 5. Android Setup

**`mobile/android/app/src/main/AndroidManifest.xml`** — add permissions:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

Minimum SDK: `minSdkVersion 21` (Android 5.0).

---

## 6. iOS Setup

**`mobile/ios/Runner/Info.plist`** — add keys:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Civic Fix uses your location to pin report on the map.</string>
<key>NSCameraUsageDescription</key>
<string>Civic Fix needs camera access to upload issue photos.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Civic Fix needs photo library access to attach images.</string>
```

Minimum deployment target: **iOS 13.0**.

---

## 7. Running the App

```bash
# List connected devices / emulators
flutter devices

# Run on a specific device
flutter run -d emulator-5554       # Android
flutter run -d iPhone-15           # iOS simulator

# Run with release optimisations (for demo)
flutter run --release
```

**Backend must be running:**
```bash
# In civic-fix/server
npm run dev
```

---

## 8. Build for Demo / Distribution

```bash
# Android APK (sideload on device for demo)
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk

# Android App Bundle (for Play Store)
flutter build appbundle --release

# iOS (requires macOS + Xcode)
flutter build ipa --release
```

---

## 9. Folder Structure

```
mobile/
├── lib/
│   ├── main.dart
│   ├── app.dart                  # MaterialApp + GoRouter setup
│   ├── core/
│   │   ├── api/                  # Dio client, interceptors, Retrofit service
│   │   ├── auth/                 # Clerk token management, auth provider
│   │   ├── models/               # JSON-serialisable data classes
│   │   └── utils/                # Helpers (imageUrl, timeAgo, etc.)
│   ├── features/
│   │   ├── map/                  # Map screen + markers
│   │   ├── reports/              # Report list, detail, new report wizard
│   │   ├── my_reports/           # Citizen's own reports
│   │   ├── notifications/        # Notification list
│   │   ├── city_health/          # Public stats screen
│   │   ├── admin/                # Admin panel screens
│   │   └── auth/                 # Sign-in/up WebView wrapper
│   └── shared/
│       ├── widgets/              # Reusable UI components
│       └── theme/                # Colors, text styles, spacing
├── test/
├── android/
├── ios/
├── .env                          # ← never commit
├── .env.example
└── pubspec.yaml
```
