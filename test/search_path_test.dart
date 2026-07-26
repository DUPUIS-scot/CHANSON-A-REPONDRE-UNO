import 'package:flutter_test/flutter_test.dart';
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
