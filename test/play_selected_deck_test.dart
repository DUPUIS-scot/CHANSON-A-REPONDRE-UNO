import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uno_chanson_2/core/app_constants.dart';
import 'package:uno_chanson_2/data/card_categories.dart';
import 'package:uno_chanson_2/models/card_image_model.dart';
import 'package:uno_chanson_2/providers/deck_provider.dart';
import 'package:uno_chanson_2/providers/game_provider.dart';
import 'package:uno_chanson_2/services/deck_import_service.dart';
import 'package:uno_chanson_2/services/game_storage_service.dart';
import 'package:uno_chanson_2/services/local_storage_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Future<(DeckProvider, GameProvider)> loadProviders() async {
    SharedPreferences.setMockInitialValues({});
    final storage = LocalStorageService();
    final decks = DeckProvider(storage, DeckImportService(storage));
    final game = GameProvider(GameStorageService(storage));
    await decks.load();
    return (decks, game);
  }

  test('selected BRIO deck supplies every card in the Play hand', () async {
    final (decks, game) = await loadProviders();
    addTearDown(decks.dispose);
    addTearDown(game.dispose);

    await decks.select(AppConstants.brioDeckId);
    final selectedDeck = decks.activeDeck!;
    expect(await game.start(selectedDeck), isTrue);

    final state = game.state!;
    expect(state.deckId, AppConstants.brioDeckId);
    expect(state.players.first.hand, hasLength(5));
    expect(
      state.players.first.hand,
      everyElement(
        predicate<CardImageModel>(
          (card) => card.deckId == AppConstants.brioDeckId,
        ),
      ),
    );
    expect(
      state.players.first.hand.map((card) => card.category),
      everyElement(predicate<String>(isKnownCardCategory)),
    );
    expect(selectedDeck.hasExplicitCategories, isTrue);
    expect(
      selectedDeck.cardBack,
      'assets/decks/chanson_a_repondre_brio/card_back.jpeg',
    );
  });

  test('production Play hand keeps its category-specific versos', () async {
    final (decks, game) = await loadProviders();
    addTearDown(decks.dispose);
    addTearDown(game.dispose);

    await decks.select(AppConstants.productionDeckId);
    final selectedDeck = decks.activeDeck!;
    expect(await game.start(selectedDeck), isTrue);

    expect(selectedDeck.hasExplicitCategories, isTrue);
    for (final card in game.state!.players.first.hand) {
      expect(card.deckId, AppConstants.productionDeckId);
      expect(isKnownCardCategory(card.category), isTrue);
      expect(
        cardCategoryFor(card.category).versoAsset,
        startsWith('assets/cards/category_versos/'),
      );
    }
  });

  test('Play resyncs stale game state to the selected deck', () {
    final source = File('lib/screens/play_screen.dart').readAsStringSync();

    expect(source, contains('final activeDeck = decks.activeDeck;'));
    expect(source, contains('state.deckId != activeDeck.id'));
    expect(source, contains('await liveGame.start(liveDeck);'));
    expect(source, contains('!deck.hasExplicitCategories'));
    expect(source, contains('cardCategoryFor(card.category).versoAsset'));
    expect(source, contains('backImagePath: handBackImagePath'));
  });
}
