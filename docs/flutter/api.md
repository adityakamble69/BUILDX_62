# api.md — Civic Fix Flutter API Integration

> Every endpoint the Flutter app calls, grouped by feature. Base URL is `API_BASE_URL` from `.env`.
> All protected endpoints require `Authorization: Bearer <clerk-session-token>` header.

---

## Retrofit Service Interface

```dart
@RestApi()
abstract class ApiService {
  factory ApiService(Dio dio, {String baseUrl}) = _ApiService;

  // — Public —
  @GET('/api/v1/stats/public')
  Future<PublicStats> getPublicStats();

  @GET('/api/v1/categories')
  Future<List<Category>> getCategories();

  @GET('/api/v1/reports')
  Future<PagedResponse<Report>> listReports(@Queries() Map<String, dynamic> params);

  @GET('/api/v1/reports/map')
  Future<List<MapPoint>> getMapPoints(@Queries() Map<String, dynamic> params);

  @GET('/api/v1/reports/nearby-duplicates')
  Future<List<NearbyDuplicate>> getNearbyDuplicates(@Queries() Map<String, dynamic> params);

  @GET('/api/v1/reports/{id}')
  Future<ReportDetail> getReportById(@Path('id') String id);

  // — Citizen (auth) —
  @POST('/api/v1/reports')
  Future<ReportDetail> createReport(@Body() CreateReportRequest body);

  @POST('/api/v1/reports/{id}/upvote')
  Future<UpvoteResponse> toggleUpvote(@Path('id') String id);

  @GET('/api/v1/reports/{id}/comments')
  Future<List<Comment>> getComments(@Path('id') String id);

  @POST('/api/v1/reports/{id}/comments')
  Future<Comment> addComment(@Path('id') String id, @Body() AddCommentRequest body);

  @DELETE('/api/v1/comments/{id}')
  Future<void> deleteOwnComment(@Path('id') String id);

  @GET('/api/v1/me/reports')
  Future<PagedResponse<Report>> getMyReports(@Queries() Map<String, dynamic> params);

  @GET('/api/v1/me/notifications')
  Future<PagedResponse<Notification>> getNotifications(@Queries() Map<String, dynamic> params);

  @POST('/api/v1/me/notifications/read')
  Future<void> markAllNotificationsRead();

  @POST('/api/v1/uploads/sign')
  Future<SignedUploadResponse> signUpload(@Body() SignUploadRequest body);

  // — Admin (auth + role=admin) —
  @GET('/api/v1/admin/reports')
  Future<PagedResponse<Report>> listAdminReports(@Queries() Map<String, dynamic> params);

  @PATCH('/api/v1/admin/reports/{id}/status')
  Future<void> changeReportStatus(@Path('id') String id, @Body() ChangeStatusRequest body);

  @PATCH('/api/v1/admin/reports/{id}/assign')
  Future<void> assignDepartment(@Path('id') String id, @Body() AssignDepartmentRequest body);

  @POST('/api/v1/admin/reports/{id}/resolution-image')
  Future<void> addResolutionImage(@Path('id') String id, @Body() ResolutionImageRequest body);

  @DELETE('/api/v1/admin/reports/{id}')
  Future<void> deleteReport(@Path('id') String id);

  @DELETE('/api/v1/admin/comments/{id}')
  Future<void> adminDeleteComment(@Path('id') String id);

  @GET('/api/v1/admin/stats')
  Future<AdminStats> getAdminStats(@Queries() Map<String, dynamic> params);

  @GET('/api/v1/admin/heatmap')
  Future<List<HeatmapPoint>> getHeatmapPoints();

  @GET('/api/v1/admin/departments')
  Future<List<Department>> getDepartments();

  @POST('/api/v1/admin/departments')
  Future<Department> createDepartment(@Body() DepartmentRequest body);

  @PATCH('/api/v1/admin/departments/{id}')
  Future<Department> updateDepartment(@Path('id') int id, @Body() DepartmentUpdateRequest body);

  @DELETE('/api/v1/admin/departments/{id}')
  Future<void> deleteDepartment(@Path('id') int id);
}
```

---

## Endpoint Reference

### Public Endpoints (no auth)

#### `GET /api/v1/stats/public`
Live KPI stats for the Home and City Health screens.

**Response:**
```json
{
  "data": {
    "total": 80,
    "resolved": 24,
    "in_progress": 20,
    "resolved_pct": 30.0,
    "avg_hours_to_resolve": 115.4
  }
}
```

---

#### `GET /api/v1/categories`
All active categories with icon slug.

**Response:**
```json
{
  "data": [
    { "id": 1, "slug": "pothole", "name": "Pothole", "icon": "road" },
    { "id": 2, "slug": "garbage", "name": "Garbage", "icon": "trash" }
  ]
}
```

---

#### `GET /api/v1/reports`
Paginated report feed.

**Query params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | int | 1 | Page number |
| `pageSize` | int | 20 | Max 100 |
| `category` | string | — | Category slug |
| `status` | enum | — | `reported`, `in_progress`, `resolved` |
| `sort` | enum | `newest` | `newest` or `upvotes` |

**Response:**
```json
{
  "data": [ { "id": "...", "title": "...", "status": "reported", ... } ],
  "meta": { "page": 1, "pageSize": 20, "total": 80 }
}
```

---

#### `GET /api/v1/reports/map`
Lightweight map points (max 1 000, no rejected).

**Query params:** `category` (slug), `status`

**Response:**
```json
{
  "data": [
    { "id": "...", "title": "...", "status": "reported", "category_id": 1,
      "upvote_count": 5, "lat": 21.14, "lng": 79.08 }
  ]
}
```

---

#### `GET /api/v1/reports/nearby-duplicates`
Check for open reports of the same category within radius metres.

**Query params:** `lat`, `lng`, `category` (slug), `radius` (metres, default 50)

**Response:**
```json
{
  "data": [
    { "id": "...", "title": "...", "upvote_count": 3, "distance_m": 12.5 }
  ]
}
```

---

#### `GET /api/v1/reports/:id`
Full report detail including comments, status history, images.

**Response:**
```json
{
  "data": {
    "id": "...",
    "title": "Deep pothole near bus stop",
    "description": "...",
    "status": "in_progress",
    "severity": 4,
    "area_name": "Dharampeth, Nagpur",
    "upvote_count": 12,
    "lat": 21.14,
    "lng": 79.08,
    "created_at": "2026-09-01T10:00:00Z",
    "resolved_at": null,
    "reject_reason": null,
    "category": { "id": 1, "slug": "pothole", "name": "Pothole", "icon": "road" },
    "department": { "id": 2, "name": "Roads" },
    "images": [
      { "id": "...", "storage_path": "seed/before-pothole-1.jpg", "kind": "before", "created_at": "..." }
    ],
    "reporter": { "id": "user_...", "display_name": "Aditya", "avatar_url": null },
    "comments": [ { "id": "...", "body": "...", "is_admin": false, "created_at": "...", "author": {...} } ],
    "statusHistory": [ { "from_status": null, "to_status": "reported", "created_at": "..." } ],
    "viewerHasUpvoted": false
  }
}
```

---

### Citizen Endpoints (auth required)

#### `POST /api/v1/reports`
Submit a new report.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "title": "Deep pothole near bus stop",
  "description": "Large pothole, two-wheelers swerve into traffic.",
  "category": "pothole",
  "severity": 4,
  "lat": 21.1248,
  "lng": 79.0577,
  "areaName": "Dharampeth, Nagpur",
  "imagePaths": ["uploads/user123/abc.jpg"],
  "aiCategory": "pothole",
  "aiSeverity": 4
}
```

**Response:** Full `ReportDetail` (same as GET /reports/:id)

---

#### `POST /api/v1/uploads/sign`
Get a signed upload URL from Supabase Storage.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{ "mimeType": "image/jpeg", "fileSize": 204800 }
```

**Response:**
```json
{
  "data": {
    "signedUrl": "https://...supabase.co/storage/v1/object/sign/...",
    "storagePath": "uploads/user123/uuid.jpg"
  }
}
```

After receiving this, the Flutter app uploads the image bytes:
```dart
await dio.put(signedUrl,
  data: imageBytes,
  options: Options(headers: {'Content-Type': mimeType}),
);
```

---

#### `POST /api/v1/reports/:id/upvote`
Toggle upvote on a report (on if not upvoted, off if already upvoted).

**Response:**
```json
{ "data": { "upvoted": true, "upvoteCount": 13 } }
```

---

#### `POST /api/v1/reports/:id/comments`
Add a comment to a report.

**Body:** `{ "body": "Is this fixed yet?" }`

**Response:** The new `Comment` object.

---

#### `DELETE /api/v1/comments/:id`
Delete the authenticated user's own comment.

---

#### `GET /api/v1/me/reports`
The authenticated citizen's own reports. Same pagination as public feed.

---

#### `GET /api/v1/me/notifications`
The citizen's notification list. Query: `page`, `pageSize`.

---

#### `POST /api/v1/me/notifications/read`
Mark all notifications as read.

---

### Admin Endpoints (auth + admin role)

#### `GET /api/v1/admin/reports`
All reports including rejected, with reporter name. Same pagination + extra filters.

**Extra query params:** `department` (int id), `sort` also accepts `severity`.

---

#### `PATCH /api/v1/admin/reports/:id/status`

**Body:**
```json
{ "status": "in_progress", "note": "Crew dispatched" }
```

---

#### `PATCH /api/v1/admin/reports/:id/assign`

**Body:**
```json
{ "departmentId": 2 }
```

---

#### `POST /api/v1/admin/reports/:id/resolution-image`

**Body:**
```json
{ "storagePath": "uploads/admin/after-photo.jpg" }
```

---

#### `GET /api/v1/admin/stats`

**Query:** `trendDays` (int, 1–90, default 7)

**Response:**
```json
{
  "data": {
    "total": 80, "reported": 33, "in_progress": 20,
    "resolved": 24, "rejected": 3,
    "resolved_pct": 30.0, "avg_hours_to_resolve": 115.4,
    "trend": [ { "day": "2026-09-14", "reported": 4, "in_progress": 2, "resolved": 1 } ],
    "byCategory": [ { "slug": "pothole", "name": "Pothole", "total": 22 } ],
    "byDepartment": [ { "department_id": 1, "name": "Roads", "total": 30 } ]
  }
}
```

---

#### `GET /api/v1/admin/heatmap`

**Response:**
```json
{ "data": [ { "lat": 21.14, "lng": 79.08, "severity": 4 } ] }
```

---

## Error Response Format

All errors follow this structure:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Report not found"
  }
}
```

| HTTP Status | Code | When |
|---|---|---|
| 400 | `BAD_REQUEST` | Malformed JSON |
| 401 | `UNAUTHORIZED` | No / invalid Clerk token |
| 403 | `FORBIDDEN` | Valid token but wrong role (e.g., citizen on admin route) |
| 404 | `NOT_FOUND` | Resource doesn't exist |
| 409 | `CONFLICT` | Duplicate (e.g., already upvoted) |
| 422 | `VALIDATION_ERROR` | Zod schema failed |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

Handle in Dart:
```dart
try {
  final report = await apiService.getReportById(id);
} on DioException catch (e) {
  final body = e.response?.data as Map<String, dynamic>?;
  final code = body?['error']?['code'] ?? 'UNKNOWN';
  final msg  = body?['error']?['message'] ?? 'Something went wrong';
  throw AppException(code: code, message: msg, statusCode: e.response?.statusCode);
}
```

---

## Image URL Helper

```dart
String getImageUrl(String storagePath) {
  final base = dotenv.get('SUPABASE_URL');
  final bucket = dotenv.get('SUPABASE_STORAGE_BUCKET');
  return '$base/storage/v1/object/public/$bucket/$storagePath';
}
```
