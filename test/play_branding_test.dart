import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uno_chanson_2/app.dart';
import 'package:uno_chanson_2/core/app_router.dart';
import 'package:uno_chanson_2/widgets/dj_who_avatar.dart';
import 'package:uno_chanson_2/widgets/home_navigation_button.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    AppRouter.router.go(AppRoutes.play);
  });

  testWidgets('Play uses official logos and existing DJ WHO navigation', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(360, 800));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
    );
    await tester.pumpAndSettle();

    final navigation = tester.widget<HomeNavigationButton>(
      find.byType(HomeNavigationButton),
    );
    expect(navigation.confirmActiveGame, isTrue);
    expect(navigation.showDjWho, isTrue);
    expect(find.byType(DjWhoAvatar), findsOneWidget);
    expect(find.byTooltip('Return to Home'), findsOneWidget);
    expect(find.byTooltip('Open DJ WHO Videos'), findsOneWidget);
    expect(find.text('DJ WHO'), findsNothing);

    expect(find.text('CHANSON A REPONDRE UNO'), findsNothing);
    expect(find.byKey(const Key('play-header-logo')), findsOneWidget);
    expect(find.byKey(const Key('play-launcher-logo')), findsOneWidget);
    expect(find.bySemanticsLabel('Chanson à Répondre UNO'), findsNWidgets(2));

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

    await tester.binding.setSurfaceSize(const Size(768, 1024));
    await tester.pump();
    expect(find.text('DJ WHO'), findsOneWidget);
    expect(tester.getCenter(find.byKey(const Key('play-header-logo'))).dx, 384);
    expect(tester.takeException(), isNull);

    await tester.tap(find.byTooltip('Open DJ WHO Videos'));
    await tester.pumpAndSettle();
    expect(AppRouter.router.state.uri.path, AppRoutes.djWhoVideos);
  });
}
