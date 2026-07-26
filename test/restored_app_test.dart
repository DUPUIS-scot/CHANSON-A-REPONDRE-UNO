import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uno_chanson_2/core/app_constants.dart';
import 'package:uno_chanson_2/core/app_router.dart';
import 'package:uno_chanson_2/models/card_image_model.dart';
import 'package:uno_chanson_2/models/deck_model.dart';
import 'package:uno_chanson_2/providers/deck_provider.dart';
import 'package:uno_chanson_2/services/deck_import_service.dart';
import 'package:uno_chanson_2/services/local_storage_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('restored app integration', () {
    test(
      'keeps a valid selected deck while installing permanent 84 cards',
      () async {
        final custom = Deck(
          id: 'custom-deck',
          name: 'Custom deck',
          cards: [_card('custom-card', 'custom-deck')],
        );
        SharedPreferences.setMockInitialValues({
          'decks': jsonEncode([custom.toJson()]),
          'active_deck': jsonEncode(custom.id),
        });
        final storage = LocalStorageService();
        final provider = DeckProvider(storage, DeckImportService(storage));
        addTearDown(provider.dispose);

        await provider.load();

        expect(provider.activeDeckId, custom.id);
        expect(provider.decks.first.id, AppConstants.productionDeckId);
        expect(
          provider.decks.first.cards,
          hasLength(AppConstants.productionDeckSize),
        );
        expect(
          provider.decks.first.cards.map((card) => card.id).toSet(),
          hasLength(AppConstants.productionDeckSize),
        );
      },
    );

    test(
      'permanent deck cannot be renamed, deleted, or replaced by bad id',
      () async {
        SharedPreferences.setMockInitialValues({});
        final storage = LocalStorageService();
        final provider = DeckProvider(storage, DeckImportService(storage));
        addTearDown(provider.dispose);
        await provider.load();

        await provider.rename(AppConstants.productionDeckId, 'Changed');
        await provider.delete(AppConstants.productionDeckId);
        await provider.select('missing-deck');

        expect(provider.decks, hasLength(1));
        expect(provider.activeDeckId, AppConstants.productionDeckId);
        expect(provider.decks.single.name, isNot('Changed'));
        expect(
          provider.decks.single.cards,
          hasLength(AppConstants.productionDeckSize),
        );
      },
    );

    test(
      'restored routes and local Search castle entrypoint remain present',
      () {
        expect([
          AppRoutes.home,
          AppRoutes.play,
          AppRoutes.decks,
          AppRoutes.cards,
          AppRoutes.search,
          AppRoutes.journal,
          AppRoutes.aiChat,
          AppRoutes.rules,
          AppRoutes.settings,
          AppRoutes.profile,
          AppRoutes.djWhoVideos,
        ], everyElement(startsWith('/')));
        expect(AppRoutes.deck('custom-deck'), '/deck/custom-deck');
        expect(AppRoutes.cardAlias('final-84-01'), '/card/final-84-01');

        final castle = File(
          'web/card_castle/card_castle.html',
        ).readAsStringSync();
        expect(castle, contains('../vendor/three.min.js'));
        expect(castle, isNot(contains('unpkg.com')));
        expect(castle, contains('cardLongPressed'));
        expect(castle, contains('cardSelected'));
        expect(castle, contains("data.type==='focusCard'"));
        expect(castle, contains('down.panning'));
        expect(castle, contains('document.body.dataset.cardCount'));
      },
    );
  });
}

CardImageModel _card(String id, String deckId) => CardImageModel(
  id: id,
  deckId: deckId,
  title: 'Custom card',
  path: 'assets/cards/custom.png',
  category: 'Classique',
  colour: 'red',
  importedAt: DateTime(2026),
);
