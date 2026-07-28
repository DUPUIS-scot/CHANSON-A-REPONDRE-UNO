import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uno_chanson_2/app.dart';
import 'package:uno_chanson_2/core/app_router.dart';
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

    testWidgets('Search exposes the castle only and preserves query state', (
      tester,
    ) async {
      SharedPreferences.setMockInitialValues({});
      await tester.pumpWidget(
        const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
      );
      await tester.pump(const Duration(seconds: 2));
      AppRouter.router.go(AppRoutes.search);
      await tester.pumpAndSettle();

      expect(find.text('DJ WHO'), findsOneWidget);
      expect(find.byType(SegmentedButton), findsNothing);
      expect(find.byIcon(Icons.grid_view_rounded), findsNothing);
      expect(find.byIcon(Icons.view_list_rounded), findsNothing);

      await tester.enterText(find.byType(TextField), 'lumiere');
      await tester.pump(const Duration(milliseconds: 300));
      expect(
        tester.widget<TextField>(find.byType(TextField)).controller?.text,
        'lumiere',
      );
    });

    test('castle keeps interaction while using the Edinburgh backdrop', () {
      final castle = File(
        'web/card_castle/card_castle.html',
      ).readAsStringSync();
      final searchScreen = File(
        'lib/screens/search_screen.dart',
      ).readAsStringSync();
      final backdrop = File('assets/images/search_castle_background.png');
      expect(castle, contains("emit('cardLongPressed',{cardId})"));
      expect(castle, contains("emit('djWhoRequested')"));
      expect(castle, contains('search_castle_background.png'));
      expect(castle, contains('new THREE.FogExp2'));
      expect(castle, contains('buildSaltireFlag'));
      expect(castle, contains('bridgeLantern'));
      expect(castle, contains('updateVisibleCards'));
      expect(castle, contains('id="exit-fullscreen"'));
      expect(castle, isNot(contains('id="castle-category"')));
      expect(castle, isNot(contains('id="focused-summary"')));
      expect(castle, isNot(contains('id="previous-card"')));
      expect(castle, isNot(contains('id="next-card"')));
      expect(castle, isNot(contains('id="castle-home"')));
      expect(searchScreen, isNot(contains('_SearchViewMode')));
      expect(searchScreen, isNot(contains('SegmentedButton')));
      expect(searchScreen, isNot(contains('_SearchCardTile')));
      expect(searchScreen, isNot(contains('_SearchListRow')));
      expect(backdrop.existsSync(), isTrue);
      expect(backdrop.lengthSync(), 2709365);
      expect(castle, isNot(contains('id="hint"')));
      expect(castle, isNot(contains('#hint')));
    });
  });
}

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
