import 'dart:ui';

import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uno_chanson_2/app.dart';
import 'package:uno_chanson_2/core/app_router.dart';

void main() {
  testWidgets('core experiences remain usable at the acceptance viewports', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({
      'home_experience_settings':
          '{"skipIntro":true,"backgroundMode":"defaultMode"}',
    });
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetDevicePixelRatio);
    addTearDown(tester.view.resetPhysicalSize);

    await tester.pumpWidget(
      const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
    );
    await tester.pump(const Duration(seconds: 2));

    const viewports = <Size>[
      Size(360, 800),
      Size(390, 844),
      Size(768, 1024),
      Size(1024, 768),
      Size(1440, 900),
      Size(1920, 1080),
    ];
    const routes = <String>[
      AppRoutes.play,
      AppRoutes.home,
      AppRoutes.search,
      AppRoutes.settings,
    ];

    for (final route in routes) {
      AppRouter.router.go(route);
      for (final viewport in viewports) {
        tester.view.physicalSize = viewport;
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 350));
        final exception = tester.takeException();
        expect(
          exception,
          isNull,
          reason: '$route at ${viewport.width} x ${viewport.height}',
        );
      }
    }
  });
}
