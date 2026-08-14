import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uno_chanson_2/core/app_constants.dart';
import 'package:uno_chanson_2/providers/deck_provider.dart';
import 'package:uno_chanson_2/screens/search_screen.dart';
import 'package:uno_chanson_2/services/deck_import_service.dart';
import 'package:uno_chanson_2/services/local_storage_service.dart';
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

  Future<({LocalStorageService storage, DeckProvider decks})>
  loadDeckHarness() async {
    SharedPreferences.setMockInitialValues({});
    final storage = LocalStorageService();
    final decks = DeckProvider(storage, DeckImportService(storage));
    await decks.load();
    return (storage: storage, decks: decks);
  }

  Future<void> pumpSearch(
    WidgetTester tester, {
    required LocalStorageService storage,
    required DeckProvider decks,
  }) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider<DeckProvider>.value(value: decks),
          Provider<LocalStorageService>.value(value: storage),
        ],
        child: const MaterialApp(home: SearchScreen()),
      ),
    );
    await tester.pumpAndSettle();
  }

  testWidgets('BRIO Search category choices render the BRIO card verso', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final harness = await loadDeckHarness();
    addTearDown(harness.decks.dispose);
    await harness.decks.select(AppConstants.brioDeckId);
    expect(harness.decks.activeDeckId, AppConstants.brioDeckId);
    expect(harness.decks.activeDeck?.hasExplicitCategories, isFalse);

    await pumpSearch(
      tester,
      storage: harness.storage,
      decks: harness.decks,
    );

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

    final harness = await loadDeckHarness();
    addTearDown(harness.decks.dispose);
    await harness.decks.select(AppConstants.productionDeckId);
    expect(harness.decks.activeDeckId, AppConstants.productionDeckId);
    expect(harness.decks.activeDeck?.hasExplicitCategories, isTrue);

    await pumpSearch(
      tester,
      storage: harness.storage,
      decks: harness.decks,
    );

    final sources = <String>{};
    for (final label in categoryLabels) {
      final button = find.byKey(ValueKey('search-category-$label'));
      expect(button, findsOneWidget);
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
