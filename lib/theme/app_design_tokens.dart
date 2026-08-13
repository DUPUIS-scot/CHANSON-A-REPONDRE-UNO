import 'package:flutter/material.dart';

abstract final class AppSpacing {
  static const xSmall = 4.0;
  static const small = 8.0;
  static const medium = 16.0;
  static const large = 24.0;
  static const xLarge = 32.0;
}

abstract final class AppRadius {
  static const control = 10.0;
  static const panel = 12.0;
  static const pill = 24.0;
}

abstract final class AppBreakpoints {
  static const mobile = 600.0;
  static const tablet = 1024.0;
  static const normalContent = 960.0;
  static const readingContent = 780.0;

  static double gutterFor(double width) {
    if (width >= tablet) return AppSpacing.xLarge;
    if (width >= mobile) return AppSpacing.large;
    return AppSpacing.medium;
  }
}

abstract final class AppMotion {
  static const quick = Duration(milliseconds: 150);
  static const standard = Duration(milliseconds: 180);

  static Duration responsive(BuildContext context, Duration duration) =>
      MediaQuery.disableAnimationsOf(context) ? Duration.zero : duration;
}

abstract final class AppTouchTarget {
  static const minimum = 48.0;
  static const size = Size.square(minimum);
}
