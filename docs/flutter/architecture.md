# architecture.md — Civic Fix Flutter App

> How the Flutter app is structured: state management, navigation, data flow, and auth.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────┐
│              Flutter App (UI)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Screens  │  │ Widgets  │  │  Theme   │  │
│  └────┬─────┘  └──────────┘  └──────────┘  │
│       │ reads/watches                        │
│  ┌────▼─────────────────────────────────┐   │
│  │        Riverpod Providers            │   │
│  │  (AsyncNotifier / StateNotifier)     │   │
│  └────┬─────────────────────────────────┘   │
│       │ calls                                │
│  ┌────▼──────────────┐                      │
│  │  Repository Layer  │ ← pure Dart classes  │
│  └────┬──────────────┘                      │
└───────┼─────────────────────────────────────┘
        │ HTTP (Dio + Retrofit)
        ▼
┌───────────────────────────────┐
│   Express API (port 4111)     │  ← same backend as web app
│   /api/v1/...                 │
└───────────────────────────────┘
        │
        ▼
┌───────────────────────────────┐
│  Supabase (Postgres + Storage)│
└───────────────────────────────┘
```

The Flutter app **never** talks to Supabase directly. All reads and writes go through the Express REST API, which holds the Supabase service-role key.

---

## 2. State Management — Riverpod

We use **Riverpod 2.x** with code generation (`riverpod_generator`).

### Provider Types Used

| Riverpod type | Used for |
|---|---|
| `@riverpod` (FutureProvider) | One-shot async reads (report detail, stats) |
| `AsyncNotifier` | Paginated lists with refresh (report feed, admin table) |
| `Notifier` | Auth state, filter state, form state |
| `Provider` | Singleton services (Dio client, ApiService) |

### Example — Report List Provider

```dart
@riverpod
class ReportListNotifier extends _$ReportListNotifier {
  @override
  Future<ReportListState> build() => _fetch();

  Future<ReportListState> _fetch({int page = 1}) async {
    final repo = ref.read(reportRepositoryProvider);
    return repo.listReports(page: page, filters: state.filters);
  }

  Future<void> refresh() => ref.refresh(reportListNotifierProvider.future);
  Future<void> nextPage()  { /* append page */ }
  void setFilter(ReportFilters f) { /* rebuild */ }
}
```

---

## 3. Navigation — GoRouter

All routes are declared in `lib/app.dart`. Protected routes redirect to sign-in if no token exists.

```dart
final router = GoRouter(
  redirect: (context, state) {
    final isAuthed = ref.read(authProvider).isSignedIn;
    final protectedRoutes = ['/report/new', '/my-reports', '/notifications', '/admin'];
    final needsAuth = protectedRoutes.any((r) => state.matchedLocation.startsWith(r));
    if (needsAuth && !isAuthed) return '/sign-in?redirect=${state.uri}';
    return null;
  },
  routes: [
    GoRoute(path: '/',              builder: (_, __) => const HomeScreen()),
    GoRoute(path: '/map',           builder: (_, __) => const MapScreen()),
    GoRoute(path: '/reports',       builder: (_, __) => const ReportsScreen()),
    GoRoute(path: '/reports/:id',   builder: (_, s)  => ReportDetailScreen(id: s.pathParameters['id']!)),
    GoRoute(path: '/city-health',   builder: (_, __) => const CityHealthScreen()),
    GoRoute(path: '/report/new',    builder: (_, __) => const NewReportScreen()),
    GoRoute(path: '/my-reports',    builder: (_, __) => const MyReportsScreen()),
    GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
    GoRoute(path: '/sign-in',       builder: (_, __) => const SignInScreen()),
    GoRoute(path: '/sign-up',       builder: (_, __) => const SignUpScreen()),
    GoRoute(path: '/admin',         builder: (_, __) => const AdminDashboardScreen()),
    GoRoute(path: '/admin/reports', builder: (_, __) => const AdminReportsScreen()),
    GoRoute(path: '/admin/reports/:id', builder: (_, s) => AdminReportDetailScreen(id: s.pathParameters['id']!)),
    GoRoute(path: '/admin/heatmap', builder: (_, __) => const AdminHeatmapScreen()),
    GoRoute(path: '/admin/departments', builder: (_, __) => const AdminDepartmentsScreen()),
  ],
);
```

---

## 4. Data Layer — Repository Pattern

Each feature has its own repository that wraps the Retrofit API service.

```
lib/core/
├── api/
│   ├── api_client.dart         ← Dio setup + auth interceptor
│   ├── api_service.dart        ← @RestApi() Retrofit interface
│   └── api_service.g.dart      ← generated
├── models/
│   ├── report.dart             ← Report, ReportDetail
│   ├── category.dart
│   ├── department.dart
│   ├── comment.dart
│   ├── notification.dart
│   ├── stats.dart
│   └── *.g.dart                ← generated JSON serialization
└── auth/
    ├── auth_provider.dart      ← Riverpod auth state
    └── token_storage.dart      ← flutter_secure_storage wrapper
```

---

## 5. Auth Flow — Clerk

Civic Fix uses Clerk for authentication. The Flutter app uses the **Clerk Hosted Pages** approach (WebView), because the Flutter SDK has limited support compared to web.

### Flow

```
1. User taps "Sign in"
   ↓
2. WebView opens → Clerk Hosted Sign-in page
   (https://<clerk-instance>.clerk.accounts.dev/sign-in)
   ↓
3. User completes sign-in
   ↓
4. Clerk redirects to a custom deep link: civicfix://auth?token=<JWT>
   ↓
5. App intercepts deep link, extracts the session token
   ↓
6. Token stored in flutter_secure_storage
   ↓
7. Dio interceptor attaches: Authorization: Bearer <token>
   on every protected API request
   ↓
8. Express server verifies token with Clerk SDK → grants access
```

### Auth Interceptor (Dio)

```dart
class AuthInterceptor extends Interceptor {
  final TokenStorage _storage;

  @override
  Future<void> onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _storage.getToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Token expired — clear and redirect to sign-in
      await _storage.clear();
      // notify authProvider
    }
    handler.next(err);
  }
}
```

### Role Check

The Clerk session token contains `metadata.role` (set up in Clerk Dashboard → Sessions → Customize session token with `{ "metadata": "{{user.public_metadata}}" }`).

```dart
// Decode from JWT claims (use dart_jsonwebtoken or parse manually)
bool get isAdmin => sessionClaims?['metadata']?['role'] == 'admin';
```

---

## 6. Image Upload Flow

```
1. User picks image (image_picker → camera or gallery)
   ↓
2. App calls POST /api/v1/uploads/sign  (Express returns signed Supabase URL + storage path)
   ↓
3. App uploads image bytes directly to the signed Supabase Storage URL (HTTP PUT)
   ↓
4. App stores the returned storage_path string
   ↓
5. On report submit, storage_path is sent in the POST /api/v1/reports body
   ↓
6. Express calls create_report() RPC which saves the path in report_images table
```

Image display URL:
```dart
String imageUrl(String storagePath) =>
  '${dotenv.get('SUPABASE_URL')}/storage/v1/object/public/${dotenv.get('SUPABASE_STORAGE_BUCKET')}/$storagePath';
```

---

## 7. Error Handling

All API errors return a standard JSON envelope:
```json
{ "error": { "code": "NOT_FOUND", "message": "Report not found" } }
```

Dio exceptions are caught in the repository and rethrown as typed `AppException`:

```dart
class AppException implements Exception {
  final String code;
  final String message;
  final int? statusCode;
}
```

In the UI, Riverpod's `AsyncValue` handles the states:
```dart
ref.watch(reportListProvider).when(
  data:    (data)  => ReportList(reports: data),
  loading: ()      => const ReportListSkeleton(),
  error:   (e, _)  => ErrorCard(message: e.toString(), onRetry: () => ref.refresh(reportListProvider)),
);
```
