import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uno_chanson_2/app.dart';
import 'package:uno_chanson_2/core/app_router.dart';
import 'package:uno_chanson_2/widgets/home_navigation_button.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    AppRouter.router.go(AppRoutes.play);
  });

  testWidgets('Play uses official logo and theatrical labelled navigation', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(360, 800);
    tester.view.devicePixelRatio = 1;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    await tester.pumpWidget(
      const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
    );
    await tester.pumpAndSettle();

    final navigation = tester.widget<HomeNavigationButton>(
      find.byType(HomeNavigationButton),
    );
    expect(navigation.confirmActiveGame, isTrue);
    expect(navigation.showDjWho, isTrue);
    expect(navigation.theatricalSplit, isTrue);
    expect(find.byTooltip('Return to Home'), findsOneWidget);
    expect(find.byTooltip('Open DJ WHO Videos'), findsOneWidget);
    expect(find.text('HOME'), findsOneWidget);
    expect(find.text('DJ WHO'), findsOneWidget);

    expect(find.text('CHANSON A REPONDRE UNO'), findsNothing);
    expect(find.byKey(const Key('play-header-logo')), findsOneWidget);
    expect(find.byKey(const Key('play-launcher-logo')), findsOneWidget);
    expect(find.bySemanticsLabel('Chanson à Répondre UNO'), findsOneWidget);

    for (final key in const [
      Key('play-header-logo'),
      Key('play-launcher-logo'),
    ]) {
      final image = tester.widget<Image>(
        find.descendant(of: find.byKey(key), matching: find.byType(Image)),
      );
      expect(image.image, isA<AssetImage>());
      expect(
        (image.image as AssetImage).assetName,
        'assets/images/app_logo.png',
      );
      expect(image.fit, BoxFit.contain);
    }

    expect(tester.getCenter(find.byKey(const Key('play-header-logo'))).dx, 180);
    expect(tester.takeException(), isNull);

    tester.view.physicalSize = const Size(768, 1024);
    await tester.pump();
    expect(find.text('HOME'), findsOneWidget);
    expect(find.text('DJ WHO'), findsOneWidget);
    expect(tester.getCenter(find.byKey(const Key('play-header-logo'))).dx, 384);
    expect(tester.takeException(), isNull);

    await tester.tap(find.byTooltip('Open DJ WHO Videos'));
    expect(AppRouter.router.state.uri.path, AppRoutes.djWhoVideos);
    AppRouter.router.go(AppRoutes.play);
    await tester.pump(const Duration(seconds: 1));
  });
}
