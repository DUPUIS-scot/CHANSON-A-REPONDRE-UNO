import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uno_chanson_2/app.dart';
import 'package:uno_chanson_2/core/app_constants.dart';
import 'package:uno_chanson_2/core/app_router.dart';
import 'package:uno_chanson_2/widgets/stored_image.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const categoryLabels = [
    'CLASSIQUE',
    'ART CONTEMPORAIN',
    'CYBERPUNK',
    'POÉSIE',
    'SAUVAGE',
  ];

  testWidgets('BRIO Search category choices render the BRIO card verso', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    SharedPreferences.setMockInitialValues({
      'active_deck': jsonEncode(AppConstants.brioDeckId),
    });

    await tester.pumpWidget(
      const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
    );
    await tester.pump(const Duration(seconds: 2));
    AppRouter.router.go(AppRoutes.search);
    await tester.pumpAndSettle();

    for (final label in categoryLabels) {
      final button = find.byKey(ValueKey('search-category-$label'));
      expect(button, findsOneWidget);
      final image = tester.widget<StoredImage>(
        find.descendant(of: button, matching: find.byType(StoredImage)),
      );
      expect(
        image.source,
        'assets/decks/chanson_a_repondre_brio/card_back.jpeg',
      );
    }
  });

  testWidgets('production Search keeps category-specific verso artwork', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    SharedPreferences.setMockInitialValues({
      'active_deck': jsonEncode(AppConstants.productionDeckId),
    });

    await tester.pumpWidget(
      const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
    );
    await tester.pump(const Duration(seconds: 2));
    AppRouter.router.go(AppRoutes.search);
    await tester.pumpAndSettle();

    final sources = <String>{};
    for (final label in categoryLabels) {
      final button = find.byKey(ValueKey('search-category-$label'));
      final image = tester.widget<StoredImage>(
        find.descendant(of: button, matching: find.byType(StoredImage)),
      );
      sources.add(image.source);
    }

    expect(sources, hasLength(5));
    expect(sources.every((source) => source.startsWith('assets/cards/category_versos/')), isTrue);
  });
}
