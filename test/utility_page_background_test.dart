import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uno_chanson_2/app.dart';
import 'package:uno_chanson_2/core/app_router.dart';
import 'package:uno_chanson_2/widgets/utility_page_background.dart';

void main() {
  test('one canonical production image has the supplied dimensions', () {
    final matches = Directory('assets')
        .listSync(recursive: true)
        .whereType<File>()
        .where((file) => file.path.endsWith('utility_background.png'))
        .toList();

    expect(matches, hasLength(1));
    expect(
      matches.single.path.replaceAll('\\', '/'),
      endsWith(UtilityPageBackground.assetPath),
    );

    final bytes = matches.single.readAsBytesSync();
    expect(bytes.sublist(0, 8), [137, 80, 78, 71, 13, 10, 26, 10]);
    expect(ascii.decode(bytes.sublist(12, 16)), 'IHDR');
    expect(_uint32(bytes, 16), 1672);
    expect(_uint32(bytes, 20), 941);
  });

  test(
    'only the five utility route screens opt into the shared background',
    () {
      for (final path in const [
        'lib/screens/deck_selection_screen.dart',
        'lib/screens/card_browser_screen.dart',
        'lib/screens/journal_screen.dart',
        'lib/screens/rules_screen.dart',
        'lib/screens/settings_screen.dart',
      ]) {
        expect(
          File(path).readAsStringSync(),
          contains('UtilityPageScaffold('),
          reason: '$path must use the utility background',
        );
      }

      for (final path in const [
        'lib/screens/home_screen.dart',
        'lib/screens/play_screen.dart',
        'lib/screens/search_screen.dart',
        'lib/screens/account_screen.dart',
      ]) {
        expect(
          File(path).readAsStringSync(),
          isNot(contains('UtilityPageScaffold(')),
          reason: '$path must retain its independent visual environment',
        );
      }
    },
  );

  testWidgets('cover background remains viewport-fixed behind mobile scroll', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    await tester.pumpWidget(
      MaterialApp(
        home: UtilityPageBackground(
          child: Scaffold(
            body: ListView(
              children: const [
                UtilityPagePanel(
                  child: SizedBox(height: 1400, child: Text('Utility page')),
                ),
              ],
            ),
          ),
        ),
      ),
    );
    await tester.pump();

    final background = tester.widget<Image>(
      find.byKey(UtilityPageBackground.backgroundKey),
    );
    expect(background.image, isA<AssetImage>());
    expect(
      (background.image as AssetImage).assetName,
      UtilityPageBackground.assetPath,
    );
    expect(background.fit, BoxFit.cover);
    expect(background.alignment, Alignment.center);

    final overlay = tester.widget<ColoredBox>(
      find.byKey(UtilityPageBackground.overlayKey),
    );
    expect(overlay.color, const Color(0x4D000000));

    final before = tester.getRect(
      find.byKey(UtilityPageBackground.backgroundKey),
    );
    await tester.drag(find.byType(Scrollable), const Offset(0, -500));
    await tester.pump();
    final after = tester.getRect(
      find.byKey(UtilityPageBackground.backgroundKey),
    );

    expect(before, after);
    expect(before, const Rect.fromLTWH(0, 0, 390, 844));
    expect(tester.takeException(), isNull);
  });

  testWidgets(
    'all five utility routes render the shared background on mobile',
    (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });
      SharedPreferences.setMockInitialValues({});

      await tester.pumpWidget(
        const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
      );
      await tester.pump(const Duration(seconds: 2));

      for (final route in const [
        AppRoutes.decks,
        AppRoutes.cards,
        AppRoutes.journal,
        AppRoutes.rules,
        AppRoutes.settings,
      ]) {
        AppRouter.router.go(route);
        await tester.pump();
        await tester.pump(const Duration(seconds: 1));
        expect(
          find.byKey(UtilityPageBackground.backgroundKey),
          findsOneWidget,
          reason: '$route must render the shared utility background',
        );
        expect(
          tester.takeException(),
          isNull,
          reason: '$route must not overflow',
        );
      }
    },
  );
}

int _uint32(List<int> bytes, int offset) =>
    (bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3];
