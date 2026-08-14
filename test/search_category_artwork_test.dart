import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uno_chanson_2/core/app_constants.dart';
import 'package:uno_chanson_2/data/card_categories.dart';
import 'package:uno_chanson_2/models/card_image_model.dart';
import 'package:uno_chanson_2/models/deck_model.dart';
import 'package:uno_chanson_2/providers/deck_provider.dart';
import 'package:uno_chanson_2/screens/search_screen.dart';
import 'package:uno_chanson_2/services/deck_import_service.dart';
import 'package:uno_chanson_2/services/local_storage_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Future<DeckProvider> loadDecks() async {
    SharedPreferences.setMockInitialValues({});
    final storage = LocalStorageService();
    final decks = DeckProvider(storage, DeckImportService(storage));
    await decks.load();
    return decks;
  }

  void expectSearchArtworkResolver(String searchSource) {
    expect(searchSource, contains('!activeDeck.hasExplicitCategories'));
    expect(searchSource, contains('? activeDeck.cardBack'));
    expect(searchSource, contains('categoryArtworkOverride: categoryArtworkOverride'));
    expect(searchSource, contains('artworkSource:'));
    expect(
      searchSource,
      contains('categoryArtworkOverride ?? category.versoAsset'),
    );
  }

  test('Search categories are exactly the unique categories in the active deck', () {
    final deck = Deck(
      id: 'test-deck',
      name: 'Test deck',
      cards: [
        CardImageModel(
          id: '1',
          deckId: 'test-deck',
          title: '1',
          path: '1.png',
          category: 'CLASSIQUE',
          colour: 'red',
          importedAt: DateTime.utc(2026),
        ),
        CardImageModel(
          id: '2',
          deckId: 'test-deck',
          title: '2',
          path: '2.png',
          category: 'POÉSIE',
          colour: 'yellow',
          importedAt: DateTime.utc(2026),
        ),
        CardImageModel(
          id: '3',
          deckId: 'test-deck',
          title: '3',
          path: '3.png',
          category: 'CLASSIQUE',
          colour: 'red',
          importedAt: DateTime.utc(2026),
        ),
      ],
    );

    expect(
      searchCategoriesForDeck(deck).map((category) => category.label).toList(),
      ['CLASSIQUE', 'POÉSIE'],
    );
  });

  test('both built-in decks expose only category buttons they contain', () async {
    final decks = await loadDecks();
    addTearDown(decks.dispose);

    for (final deckId in const [
      AppConstants.productionDeckId,
      AppConstants.brioDeckId,
    ]) {
      await decks.select(deckId);
      final activeDeck = decks.activeDeck!;
      final expected = activeDeck.cards
          .map((card) => card.category)
          .where(isKnownCardCategory)
          .map(normalizeCardCategoryLabel)
          .toSet();
      final actual = searchCategoriesForDeck(activeDeck)
          .map((category) => category.label)
          .toSet();

      expect(actual, expected);
      expect(actual.length, expected.length);
    }
  });

  test('BRIO Search category artwork resolves to the BRIO card verso', () async {
    final decks = await loadDecks();
    addTearDown(decks.dispose);
    await decks.select(AppConstants.brioDeckId);

    final activeDeck = decks.activeDeck!;
    expect(activeDeck.id, AppConstants.brioDeckId);
    expect(activeDeck.hasExplicitCategories, isFalse);
    expect(
      activeDeck.cardBack,
      'assets/decks/chanson_a_repondre_brio/card_back.jpeg',
    );

    expectSearchArtworkResolver(
      File('lib/screens/search_screen.dart').readAsStringSync(),
    );
  });

  test('production Search keeps category-specific verso artwork', () async {
    final decks = await loadDecks();
    addTearDown(decks.dispose);
    await decks.select(AppConstants.productionDeckId);

    final activeDeck = decks.activeDeck!;
    expect(activeDeck.id, AppConstants.productionDeckId);
    expect(activeDeck.hasExplicitCategories, isTrue);

    expectSearchArtworkResolver(
      File('lib/screens/search_screen.dart').readAsStringSync(),
    );
  });

  test('Search entry has no separate ALL CATEGORIES button', () {
    final searchSource = File('lib/screens/search_screen.dart').readAsStringSync();
    expect(searchSource, isNot(contains("ValueKey('search-all-categories')")));
    expect(searchSource, isNot(contains('onAllCategoriesSelected')));
  });

  test('web cache buster reaches the compiled Flutter entrypoint', () {
    final bootstrap = File('web/flutter_bootstrap.js').readAsStringSync();
    final index = File('web/index.html').readAsStringSync();

    expect(bootstrap, contains("const buildId = searchParams.get('v')"));
    expect(bootstrap, contains('build.mainJsPath ='));
    expect(index, contains('{{flutter_bootstrap_js}}'));
  });
}
