import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

abstract final class AppTheme {
  // Core palette. Route widgets should use these tokens instead of inventing
  // local surfaces so the theatrical identity remains consistent.
  static const gold = Color(0xFFD9A51D);
  static const brightGold = Color(0xFFFFD76A);
  static const parchment = Color(0xFFF4E4BC);
  static const leather = Color(0xFF24170F);
  static const darkLeather = Color(0xFF100C08);
  static const burgundy = Color(0xFF711F17);
  static const forest = Color(0xFF244A2E);
  static const ink = Color(0xFF0A0907);
  static const moon = Color(0xFFDCEEFF);
  static const moonMuted = Color(0xFF9EB4C5);
  static const castleSurface = Color(0xFF101820);
  static const elevatedSurface = Color(0xFF2E2016);
  static const subtleBorder = Color(0x668B6B24);

  static const overlaySoft = .38;
  static const overlayStrong = .72;
  static const overlayModal = .88;

  static const radiusSmall = 8.0;
  static const radiusMedium = 12.0;
  static const radiusLarge = 16.0;

  static const spaceXs = 4.0;
  static const spaceSm = 8.0;
  static const spaceMd = 16.0;
  static const spaceLg = 24.0;
  static const spaceXl = 32.0;

  static const minTouchTarget = 48.0;
  static const iconSmall = 20.0;
  static const iconMedium = 24.0;
  static const iconLarge = 40.0;

  static const compactBreakpoint = 480.0;
  static const tabletBreakpoint = 768.0;
  static const desktopBreakpoint = 1024.0;
  static const wideBreakpoint = 1440.0;
  static const maxContentWidth = 1240.0;

  static bool isCompact(double width) => width < compactBreakpoint;
  static bool isTablet(double width) => width >= tabletBreakpoint;
  static bool isDesktop(double width) => width >= desktopBreakpoint;

  static ThemeData get dark {
    const colorScheme = ColorScheme.dark(
      primary: gold,
      onPrimary: ink,
      secondary: burgundy,
      onSecondary: Colors.white,
      surface: leather,
      onSurface: parchment,
      error: Color(0xFFFF6B5F),
      onError: ink,
      outline: Color(0xFF8B6B24),
    );

    final baseTextTheme = Typography.material2021().white;
    final textTheme = baseTextTheme.copyWith(
      displaySmall: baseTextTheme.displaySmall?.copyWith(
        color: brightGold,
        fontWeight: FontWeight.w800,
      ),
      headlineMedium: baseTextTheme.headlineMedium?.copyWith(
        color: brightGold,
        fontWeight: FontWeight.w800,
      ),
      headlineSmall: baseTextTheme.headlineSmall?.copyWith(
        color: brightGold,
        fontWeight: FontWeight.w700,
      ),
      titleLarge: baseTextTheme.titleLarge?.copyWith(
        color: parchment,
        fontWeight: FontWeight.w700,
      ),
      titleMedium: baseTextTheme.titleMedium?.copyWith(
        color: parchment,
        fontWeight: FontWeight.w700,
      ),
      bodyLarge: baseTextTheme.bodyLarge?.copyWith(color: parchment),
      bodyMedium: baseTextTheme.bodyMedium?.copyWith(color: parchment),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: Colors.transparent,
      canvasColor: darkLeather,
      textTheme: textTheme,
      splashFactory: InkRipple.splashFactory,
      appBarTheme: const AppBarTheme(
        centerTitle: false,
        backgroundColor: Color(0xCC100C08),
        foregroundColor: parchment,
        surfaceTintColor: Colors.transparent,
      ),
      cardTheme: CardThemeData(
        color: leather.withValues(alpha: 0.96),
        elevation: 3,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusMedium),
          side: const BorderSide(color: subtleBorder),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: ink.withValues(alpha: 0.7),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMedium),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMedium),
          borderSide: const BorderSide(color: Color(0x998B6B24)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMedium),
          borderSide: const BorderSide(color: brightGold, width: 2),
        ),
      ),
      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(
          minimumSize: const Size.square(minTouchTarget),
          focusColor: brightGold.withValues(alpha: .18),
          hoverColor: brightGold.withValues(alpha: .10),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(minTouchTarget, minTouchTarget),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusMedium),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(minTouchTarget, minTouchTarget),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusMedium),
          ),
        ),
      ),
      focusColor: brightGold.withValues(alpha: .18),
      hoverColor: brightGold.withValues(alpha: .10),
      snackBarTheme: const SnackBarThemeData(
        backgroundColor: leather,
        contentTextStyle: TextStyle(color: parchment),
        behavior: SnackBarBehavior.floating,
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: leather,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: FadeForwardsPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
          TargetPlatform.macOS: CupertinoPageTransitionsBuilder(),
          TargetPlatform.windows: FadeForwardsPageTransitionsBuilder(),
          TargetPlatform.linux: FadeForwardsPageTransitionsBuilder(),
        },
      ),
    );
  }

  static ThemeData get light => dark.copyWith(
    brightness: Brightness.light,
    scaffoldBackgroundColor: Colors.transparent,
    colorScheme: ColorScheme.fromSeed(
      seedColor: gold,
      brightness: Brightness.light,
      primary: const Color(0xFF765400),
      secondary: burgundy,
    ),
  );
}
