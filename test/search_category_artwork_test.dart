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
    expect(
      searchSource,
      contains('categoryArtworkOverride: categoryArtworkOverride'),
    );
    expect(searchSource, contains('artworkSource:'));
    expect(
      searchSource,
      contains('categoryArtworkOverride ?? category.versoAsset'),
    );
  }

  CardImageModel card(String id, String category) => CardImageModel(
    id: id,
    deckId: 'test-deck',
    title: id,
    path: '$id.png',
    category: category,
    colour: 'gold',
    importedAt: DateTime.utc(2026),
  );

  test('Search categories are exactly the unique categories in the active deck', () {
    final deck = Deck(
      id: 'test-deck',
      name: 'Test deck',
      cards: [
        card('1', 'CLASSIQUE'),
        card('2', 'POÉSIE'),
        card('3', 'CLASSIQUE'),
      ],
    );

    expect(
      searchCategoriesForDeck(deck).map((category) => category.label).toList(),
      ['CLASSIQUE', 'POÉSIE'],
    );
  });

  test('built-in decks expose only category buttons they contain', () async {
    final decks = await loadDecks();
    addTearDown(decks.dispose);

    for (final deckId in const [
      AppConstants.productionDeckId,
      AppConstants.brioDeckId,
      AppConstants.hpDeckId,
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

  test('BRIO Search uses category-specific verso artwork', () async {
    final decks = await loadDecks();
    addTearDown(decks.dispose);
    await decks.select(AppConstants.brioDeckId);

    final activeDeck = decks.activeDeck!;
    expect(activeDeck.id, AppConstants.brioDeckId);
    expect(activeDeck.hasExplicitCategories, isTrue);
    expect(
      activeDeck.cardBack,
      'assets/decks/chanson_a_repondre_brio/card_back.jpeg',
    );

    expectSearchArtworkResolver(
      File('lib/screens/search_screen.dart').readAsStringSync(),
    );
  });

  test('HP Search uses category-specific verso artwork', () async {
    final decks = await loadDecks();
    addTearDown(decks.dispose);
    await decks.select(AppConstants.hpDeckId);

    final activeDeck = decks.activeDeck!;
    expect(activeDeck.id, AppConstants.hpDeckId);
    expect(activeDeck.hasExplicitCategories, isTrue);
    expect(activeDeck.cardBack, AppConstants.hpDeckCover);

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

  test('zero or one category uses one dedicated centered verso screen', () {
    final source = File('lib/screens/search_screen.dart').readAsStringSync();
    expect(source, contains('final singleEntry = categories.length <= 1;'));
    expect(source, contains('if (singleEntry) {'));
    expect(source, contains('final category = categories.firstOrNull;'));
    expect(source, contains('deckVersoArtwork: deckVersoArtwork'));
    expect(source, contains('onUncategorizedSelected:'));
    expect(source, contains("ValueKey('search-single-category-screen')"));
    expect(source, contains("keyValue: category?.label ?? 'deck-verso'"));
    expect(source, contains('child: Center('));
  });

  test('zero categories open the whole active deck from the verso card', () {
    final source = File('lib/screens/search_screen.dart').readAsStringSync();
    expect(
      source,
      contains('(categories.isEmpty || categories.length > 1)'),
    );
    expect(
      source,
      contains('categories.isEmpty && permanentCards.isNotEmpty'),
    );
    expect(source, contains('? _openAllCategories'));
    expect(source, contains("key: ValueKey('search-verso-\${widget.keyValue}')"));
  });

  test('multiple categories restore ALL CATEGORIES castle entry', () {
    final source = File('lib/screens/search_screen.dart').readAsStringSync();
    expect(source, contains("ValueKey('search-all-categories')"));
    expect(source, contains('onAllCategoriesSelected'));
    expect(source, contains('void _openAllCategories()'));
    expect(source, contains('categories.length > 1 ? _openAllCategories : null'));
    expect(source, contains('category ?? searchAllCategoriesLabel'));
  });

  test('web cache buster reaches the compiled Flutter entrypoint', () {
    final bootstrap = File('web/flutter_bootstrap.js').readAsStringSync();
    final index = File('web/index.html').readAsStringSync();

    expect(bootstrap, contains("const buildId = searchParams.get('v')"));
    expect(bootstrap, contains('build.mainJsPath ='));
    expect(index, contains('{{flutter_bootstrap_js}}'));
  });
}
