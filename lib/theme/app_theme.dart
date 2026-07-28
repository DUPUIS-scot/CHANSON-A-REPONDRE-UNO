import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

abstract final class AppTheme {
  static const gold = Color(0xFFD9A51D);
  static const brightGold = Color(0xFFFFD76A);
  static const parchment = Color(0xFFF4E4BC);
  static const leather = Color(0xFF24170F);
  static const darkLeather = Color(0xFF100C08);
  static const burgundy = Color(0xFF711F17);
  static const forest = Color(0xFF244A2E);
  static const ink = Color(0xFF0A0907);

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
        elevation: 2,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: const BorderSide(color: Color(0x668B6B24)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: ink.withValues(alpha: 0.7),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0x998B6B24)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: brightGold, width: 1.5),
        ),
      ),
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
