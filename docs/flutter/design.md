# design.md — Civic Fix Flutter App

> Design tokens, typography, spacing, and component rules for the Flutter mobile app.
> Mirrors the web `docs/design.md` — keep both in sync if changing brand values.

---

## 1. Design Philosophy

- **Trustworthy and civic:** feels like a modern public-service product, not a toy.
- **Mobile-first:** most citizens use a phone — 44 px minimum tap targets, thumb-friendly controls.
- **Map-first:** location is the heart of the app; status colors and map markers carry meaning.
- **Clear over clever:** the reporting wizard must complete in under 60 seconds.
- **Consistent:** one `AppTheme`, one spacing scale, one color system across all screens.

---

## 2. Color Palette

Define once in `lib/shared/theme/app_colors.dart`:

```dart
class AppColors {
  // Brand
  static const primary       = Color(0xFF0F766E); // primary-600 — teal, buttons, active nav
  static const primaryHover  = Color(0xFF115E59); // primary-700 — hover/pressed state
  static const primarySubtle = Color(0xFFF0FDFA); // primary-50  — subtle bg, selected items

  static const secondary     = Color(0xFF1E293B); // secondary-600 — headings, sidebar, dark bg
  static const accent        = Color(0xFFF59E0B); // accent-500 — upvote active, CTA on dark

  // Status (map markers, badges, charts)
  static const reported    = Color(0xFFF59E0B); // Amber
  static const inProgress  = Color(0xFF2563EB); // Blue
  static const resolved    = Color(0xFF16A34A); // Green
  static const rejected    = Color(0xFF6B7280); // Gray

  // Semantic
  static const success = Color(0xFF16A34A);
  static const warning = Color(0xFFD97706);
  static const danger  = Color(0xFFDC2626);
  static const info    = Color(0xFF2563EB);

  // Neutrals
  static const bg          = Color(0xFFF8FAFC); // page background
  static const surface     = Color(0xFFFFFFFF); // cards, inputs, modals
  static const border      = Color(0xFFE2E8F0); // dividers, input borders
  static const text        = Color(0xFF0F172A); // primary text
  static const textMuted   = Color(0xFF475569); // secondary text
  static const textSubtle  = Color(0xFF94A3B8); // placeholders, hints
}
```

**Status helper:**
```dart
Color statusColor(String status) => switch (status) {
  'reported'    => AppColors.reported,
  'in_progress' => AppColors.inProgress,
  'resolved'    => AppColors.resolved,
  'rejected'    => AppColors.rejected,
  _             => AppColors.textSubtle,
};
```

---

## 3. Typography

Fonts: **Space Grotesk** (headings) + **DM Sans** (body/UI). Load via `google_fonts` package.

```dart
// pubspec.yaml → google_fonts: ^6.2.1

import 'package:google_fonts/google_fonts.dart';

class AppTextStyles {
  static final displayLarge = GoogleFonts.spaceGrotesk(
    fontSize: 36, fontWeight: FontWeight.w700, height: 44 / 36,
    color: AppColors.text,
  );
  static final h1 = GoogleFonts.spaceGrotesk(
    fontSize: 28, fontWeight: FontWeight.w700, height: 36 / 28,
    color: AppColors.text,
  );
  static final h2 = GoogleFonts.spaceGrotesk(
    fontSize: 24, fontWeight: FontWeight.w600, height: 32 / 24,
    color: AppColors.text,
  );
  static final h3 = GoogleFonts.spaceGrotesk(
    fontSize: 20, fontWeight: FontWeight.w600, height: 28 / 20,
    color: AppColors.text,
  );
  static final body = GoogleFonts.dmSans(
    fontSize: 16, fontWeight: FontWeight.w400, height: 24 / 16,
    color: AppColors.text,
  );
  static final bodySmall = GoogleFonts.dmSans(
    fontSize: 14, fontWeight: FontWeight.w400, height: 20 / 14,
    color: AppColors.textMuted,
  );
  static final caption = GoogleFonts.dmSans(
    fontSize: 12, fontWeight: FontWeight.w500, height: 16 / 12,
    color: AppColors.textMuted,
  );
  static final button = GoogleFonts.dmSans(
    fontSize: 15, fontWeight: FontWeight.w600, height: 20 / 15,
  );
}
```

---

## 4. Spacing System

Base unit: **4 px**. Allowed steps: 4, 8, 12, 16, 24, 32, 48, 64.

```dart
class AppSpacing {
  static const xs  = 4.0;
  static const sm  = 8.0;
  static const md  = 12.0;
  static const lg  = 16.0;
  static const xl  = 24.0;
  static const x2l = 32.0;
  static const x3l = 48.0;
  static const x4l = 64.0;

  // Common composites
  static const cardPadding     = EdgeInsets.all(lg);
  static const screenPadding   = EdgeInsets.symmetric(horizontal: lg, vertical: xl);
  static const formFieldGap    = SizedBox(height: lg);
  static const sectionGap      = SizedBox(height: x3l);
}
```

---

## 5. Border Radius

```dart
class AppRadius {
  static const sm   = BorderRadius.all(Radius.circular(6));
  static const md   = BorderRadius.all(Radius.circular(10));
  static const lg   = BorderRadius.all(Radius.circular(16));
  static const full = BorderRadius.all(Radius.circular(9999));
}
```

---

## 6. Shadows / Elevation

```dart
class AppShadows {
  static const sm = [
    BoxShadow(color: Color(0x0F0F172A), blurRadius: 2, offset: Offset(0, 1)),
  ];
  static const md = [
    BoxShadow(color: Color(0x1A0F172A), blurRadius: 12, offset: Offset(0, 4)),
  ];
  static const lg = [
    BoxShadow(color: Color(0x290F172A), blurRadius: 32, offset: Offset(0, 12)),
  ];
}
```

---

## 7. MaterialTheme Setup

Wire everything into `ThemeData` in `lib/shared/theme/app_theme.dart`:

```dart
ThemeData get appTheme => ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(
    seedColor: AppColors.primary,
    primary: AppColors.primary,
    secondary: AppColors.accent,
    surface: AppColors.surface,
    background: AppColors.bg,
    error: AppColors.danger,
  ),
  scaffoldBackgroundColor: AppColors.bg,
  textTheme: TextTheme(
    displayLarge: AppTextStyles.displayLarge,
    titleLarge:   AppTextStyles.h1,
    titleMedium:  AppTextStyles.h2,
    titleSmall:   AppTextStyles.h3,
    bodyLarge:    AppTextStyles.body,
    bodyMedium:   AppTextStyles.bodySmall,
    labelSmall:   AppTextStyles.caption,
  ),
  appBarTheme: AppBarTheme(
    backgroundColor: AppColors.surface,
    foregroundColor: AppColors.text,
    elevation: 0,
    surfaceTintColor: Colors.transparent,
    titleTextStyle: AppTextStyles.h2,
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: AppColors.primary,
      foregroundColor: Colors.white,
      minimumSize: const Size(double.infinity, 48),
      shape: RoundedRectangleBorder(borderRadius: AppRadius.md),
      textStyle: AppTextStyles.button,
    ),
  ),
  cardTheme: CardTheme(
    color: AppColors.surface,
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: AppRadius.lg,
      side: const BorderSide(color: AppColors.border),
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: AppColors.surface,
    border: OutlineInputBorder(borderRadius: AppRadius.md, borderSide: const BorderSide(color: AppColors.border)),
    focusedBorder: OutlineInputBorder(borderRadius: AppRadius.md, borderSide: BorderSide(color: AppColors.primary, width: 2)),
    contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: 14),
    labelStyle: AppTextStyles.bodySmall,
    hintStyle: AppTextStyles.bodySmall.copyWith(color: AppColors.textSubtle),
  ),
  bottomNavigationBarTheme: const BottomNavigationBarThemeData(
    backgroundColor: AppColors.surface,
    selectedItemColor: AppColors.primary,
    unselectedItemColor: AppColors.textMuted,
    type: BottomNavigationBarType.fixed,
    elevation: 8,
  ),
);
```

---

## 8. Reusable Components

### `StatusBadge`
```dart
class StatusBadge extends StatelessWidget {
  final String status;
  // Renders a colored pill with status text.
  // Colors from AppColors.statusColor(status).
  // Always shows text — never color alone (accessibility rule).
}
```

### `ReportCard`
- White `Card` with `AppRadius.lg`, `AppShadows.sm`
- 16:9 `CachedNetworkImage` thumbnail (or placeholder icon)
- `StatusBadge` overlay top-left
- Title (`AppTextStyles.h3`), category + area (`AppTextStyles.caption`), time ago, upvote count

### `AppButton`
Variants: `primary`, `secondary`, `accent`, `danger`, `ghost`.
All have: min height 48 px, `AppRadius.md`, loading state (spinner).

### `SkeletonLoader`
`Shimmer` package wrapping `Container` blocks matching the target layout.

### `ErrorCard`
Icon + short message + "Try again" `TextButton`. Used in all `AsyncValue.error` branches.

### `EmptyState`
Icon + one-line message + optional primary action button.

---

## 9. Map Style

- Tiles: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
- Markers: `CircleMarker` with `statusColor(status)` fill, white stroke
- Marker radius scales with `upvote_count`: `6 + min(upvotes / 4, 6)` px (max 12 px)
- Heatmap: custom `PolygonLayer` or `flutter_map_heatmap` with gradient teal → amber → red
- Map zoom range: 10–19; default center Nagpur: `LatLng(21.1458, 79.0882)`, zoom 13

---

## 10. Animations & Motion

| Duration | Use |
|---|---|
| 150 ms | Micro (button press scale 0.97, badge color swap) |
| 250 ms | Card lift on tap, bottom sheet open |
| 400 ms | Page transitions (slide-up 16 px + fade) |

Respect `MediaQuery.of(context).disableAnimations` — skip non-essential animations when true.

---

## 11. Accessibility Rules

- Minimum tap target: **44 × 44 px** (use `SizedBox` / `Padding` if widget is smaller)
- Every image has a `semanticsLabel`
- Status color is always paired with status text (`StatusBadge`)
- All interactive widgets have `Semantics` labels where not auto-derived
- Support system font scaling (`textScaleFactor`) — avoid hard-coding sizes in pixels

---

## 12. Do / Don't

**DO:**
- Use only colors from `AppColors`
- Use only spacing values from `AppSpacing`
- Use `AppTextStyles` for all text — no raw `TextStyle` with hard-coded values in screens
- Use `StatusBadge` everywhere status is shown — never raw text or color-only indicators

**DON'T:**
- Add new hex colors inline in widget files
- Use `Colors.blue`, `Colors.red`, etc. — use `AppColors.*`
- Create shadow or radius values not in `AppShadows` / `AppRadius`
- Hardcode strings in widgets — keep user-facing strings in a `Strings` class (i18n-ready)
