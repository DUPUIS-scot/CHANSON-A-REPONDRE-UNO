import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:uno_chanson_2/core/app_constants.dart';
import 'package:uno_chanson_2/models/card_image_model.dart';
import 'package:uno_chanson_2/models/deck_model.dart';
import 'package:uno_chanson_2/providers/card_browser_provider.dart';
import 'package:uno_chanson_2/services/search_service.dart';

void main() {
  group('Search path', () {
    final cards = [
      _card(
        'final-84-02',
        title: 'ChatGPT Image Apr 13, 2026, 06_25_54 PM',
        category: 'Poésie',
        question: 'Où va la lumière ?',
        transcription: 'Une ville après la pluie',
        tags: const ['nuit'],
      ),
      _card(
        'final-84-03',
        title: 'Océan intérieur',
        category: 'Sauvage',
        question: 'Quel rivage vous appelle ?',
      ),
    ];
    final deck = Deck(id: 'deck', name: 'Permanent', cards: cards);

    test('searches question, transcription, tags and combines category', () {
      final search = SearchService();

      expect(
        search.cards(decks: [deck], query: 'lumière').single.id,
        'final-84-02',
      );
      expect(
        search.cards(decks: [deck], query: 'pluie').single.id,
        'final-84-02',
      );
      expect(
        search
            .cards(decks: [deck], query: 'rivage', category: 'POÉSIE')
            .isEmpty,
        isTrue,
      );
      expect(
        search
            .cards(decks: [deck], query: 'nuit', category: 'POÉSIE')
            .single
            .id,
        'final-84-02',
      );
    });

    test('filename-like metadata is replaced by a stable display title', () {
      expect(cards.first.displayTitle, 'Carte 02');
      expect(cards.last.displayTitle, 'Océan intérieur');
    });

    test('View in Castle focus keeps the requested card selected', () {
      final browser = CardBrowserProvider();
      addTearDown(browser.dispose);
      browser.initializeForDeck('deck', cards);
      browser.focusCard('final-84-03', category: 'Sauvage');

      expect(browser.categoryFilter, 'Sauvage');
      expect(browser.selectedCardId, 'final-84-03');
      expect(browser.visibleHand.first.id, 'final-84-03');
    });

    test('null category still returns the complete collection in the service', () {
      final allCards = List.generate(
        84,
        (index) => _card(
          'final-84-${(index + 1).toString().padLeft(2, '0')}',
          title: 'Card ${index + 1}',
          category: const [
            'CLASSIQUE',
            'SAUVAGE',
            'POÉSIE',
            'CYBERPUNK',
            'ART CONTEMPORAIN',
          ][index % 5],
        ),
      );
      final result = SearchService().cards(
        decks: [Deck(id: 'permanent', name: 'Permanent', cards: allCards)],
        category: null,
      );

      expect(result, hasLength(84));
      expect(result.map((card) => card.category).toSet(), hasLength(5));
    });

    test('Search source keeps active-deck category entry into existing castle', () {
      final searchScreen = File(
        'lib/screens/search_screen.dart',
      ).readAsStringSync();
      final castle = File(
        'web/card_castle/card_castle.html',
      ).readAsStringSync();
      final castleBridge = File(
        'lib/widgets/webgl_card_castle_view_web.dart',
      ).readAsStringSync();

      expect(searchScreen, contains('searchCategoriesForDeck(activeDeck)'));
      expect(searchScreen, contains('deck.cards'));
      expect(searchScreen, contains('.map((card) => card.category)'));
      expect(searchScreen, contains('.toSet()'));
      expect(searchScreen, contains('category ?? searchAllCategoriesLabel'));
      expect(searchScreen, contains("ValueKey('search-all-categories')"));
      expect(searchScreen, contains('onAllCategoriesSelected'));
      expect(
        searchScreen,
        contains('categoryArtworkOverride ?? category.versoAsset'),
      );
      expect(searchScreen, contains('final activeDeck = provider.activeDeck;'));
      expect(
        searchScreen,
        contains('activeDeck != null ? [activeDeck] : <Deck>[];'),
      );
      expect(searchScreen, contains('onCategoriesRequested: _leaveCastle'));
      expect(
        searchScreen,
        contains('matchingCardIds: cards.map((card) => card.id).toSet()'),
      );

      expect(castle, contains('id="back-to-categories"'));
      expect(castle, contains("emit('categoriesRequested')"));
      expect(castle, contains('assets/assets/models/search_castle.glb'));
      expect(castle, contains('deriveSurfaceAnchors(84)'));
      expect(castleBridge, contains("case 'categoriesRequested':"));
      expect(castleBridge, contains('widget.onCategoriesRequested()'));
    });

    test('one-category deck keeps exactly one verso Castle entry', () {
      final searchScreen = File(
        'lib/screens/search_screen.dart',
      ).readAsStringSync();

      expect(searchScreen, contains('final singleEntry = categories.length <= 1;'));
      expect(searchScreen, contains('final category = categories.firstOrNull;'));
      expect(searchScreen, contains("ValueKey('search-single-category-screen')"));
      expect(searchScreen, contains('_VersoEntryButton('));
      expect(
        searchScreen,
        contains('? () => onCategorySelected(category.label)'),
      );
    });

    test('closing a Castle card fullscreen preserves the Castle underneath', () {
      final searchScreen = File(
        'lib/screens/search_screen.dart',
      ).readAsStringSync();

      expect(searchScreen, contains('Future<void> _openCastleCardFullscreen'));
      expect(searchScreen, contains('await showGeneralDialog<void>('));
      expect(
        searchScreen,
        contains('pageBuilder: (_, _, _) => _CastleCardFullscreen(card: card)'),
      );
      expect(
        searchScreen,
        isNot(contains('await context.push(AppRoutes.cardAlias(card.id));\n    } finally')),
      );
      expect(searchScreen, contains('onCardOpened: (id) async'));
      expect(
        searchScreen,
        contains('await _openCastleCardFullscreen(card)'),
      );
    });

    test('castle card source keeps selected built-in decks isolated', () {
      final productionDeck = Deck(
        id: AppConstants.productionDeckId,
        name: 'Production',
        cards: [
          _builtInCard('production-card', AppConstants.productionDeckId),
        ],
      );
      final brioDeck = Deck(
        id: AppConstants.brioDeckId,
        name: 'BRIO',
        cards: [_builtInCard('brio-card', AppConstants.brioDeckId)],
      );
      final search = SearchService();

      final productionCards = search.cards(
        decks: [productionDeck],
        category: null,
      );
      final brioCards = search.cards(decks: [brioDeck], category: null);

      expect(productionCards.map((card) => card.id), ['production-card']);
      expect(
        productionCards.every(
          (card) => card.deckId == AppConstants.productionDeckId,
        ),
        isTrue,
      );
      expect(brioCards.map((card) => card.id), ['brio-card']);
      expect(
        brioCards.every((card) => card.deckId == AppConstants.brioDeckId),
        isTrue,
      );
    });
  });
}

CardImageModel _builtInCard(String id, String deckId) => CardImageModel(
  id: id,
  deckId: deckId,
  title: id,
  path: 'assets/cards/permanent.png',
  category: 'CLASSIQUE',
  colour: 'gold',
  importedAt: DateTime(2026),
);

CardImageModel _card(
  String id, {
  required String title,
  required String category,
  String question = '',
  String? transcription,
  List<String> tags = const [],
}) => CardImageModel(
  id: id,
  deckId: 'deck',
  title: title,
  path: 'assets/cards/permanent.png',
  category: category,
  colour: 'gold',
  importedAt: DateTime(2026),
  question: question,
  transcription: transcription,
  tags: tags,
);