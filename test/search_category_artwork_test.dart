import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uno_chanson_2/app.dart';
import 'package:uno_chanson_2/core/app_constants.dart';
import 'package:uno_chanson_2/core/app_router.dart';
import 'package:uno_chanson_2/providers/deck_provider.dart';
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

  Future<DeckProvider> readyDeckProvider(WidgetTester tester) async {
    for (var attempt = 0; attempt < 100; attempt++) {
      final materialApp = find.byType(MaterialApp);
      if (materialApp.evaluate().isNotEmpty) {
        final provider = tester.element(materialApp.last).read<DeckProvider>();
        if (!provider.loading) return provider;
      }
      await tester.pump(const Duration(milliseconds: 50));
    }
    throw TestFailure('DeckProvider did not finish loading.');
  }

  testWidgets('selecting BRIO makes Search category choices use BRIO verso', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(
      const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
    );

    final decks = await readyDeckProvider(tester);
    await decks.select(AppConstants.brioDeckId);
    await tester.pump();
    expect(decks.activeDeckId, AppConstants.brioDeckId);
    expect(decks.activeDeck?.hasExplicitCategories, isFalse);

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
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(
      const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
    );

    final decks = await readyDeckProvider(tester);
    await decks.select(AppConstants.productionDeckId);
    await tester.pump();
    expect(decks.activeDeckId, AppConstants.productionDeckId);
    expect(decks.activeDeck?.hasExplicitCategories, isTrue);

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
    expect(
      sources.every(
        (source) => source.startsWith('assets/cards/category_versos/'),
      ),
      isTrue,
    );
  });
}
