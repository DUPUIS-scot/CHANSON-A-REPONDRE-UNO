import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:uno_chanson_2/models/deck_model.dart';

void main() {
  group('deck category metadata', () {
    test('infers explicit categories from legacy source JSON', () {
      final deck = Deck.fromJson({
        'id': 'legacy-explicit',
        'name': 'Legacy explicit',
        'cards': [
          {'id': 'card-1', 'category': 'Permanent'},
        ],
      });

      expect(deck.hasExplicitCategories, isTrue);
    });

    test('persisted false flag wins over synthesized card categories', () {
      final deck = Deck.fromJson({
        'id': 'implicit',
        'name': 'Implicit categories',
        'cardBack': 'assets/decks/example/card_back.png',
        'hasExplicitCategories': false,
        'cards': [
          {'id': 'card-1', 'category': 'CLASSIQUE'},
        ],
      });

      expect(deck.hasExplicitCategories, isFalse);
      expect(deck.toJson()['hasExplicitCategories'], isFalse);
    });

    test('Search falls back to active deck verso for implicit categories', () {
      final source = File('lib/screens/search_screen.dart').readAsStringSync();

      expect(source, contains('!activeDeck.hasExplicitCategories'));
      expect(source, contains('activeDeck.cardBack.isNotEmpty'));
      expect(
        source,
        contains('categoryArtworkOverride ?? category.versoAsset'),
      );
      expect(source, contains('source: widget.artworkSource'));
    });
  });
}
