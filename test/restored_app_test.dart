import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uno_chanson_2/core/app_constants.dart';
import 'package:uno_chanson_2/core/app_router.dart';
import 'package:uno_chanson_2/models/card_image_model.dart';
import 'package:uno_chanson_2/models/deck_model.dart';
import 'package:uno_chanson_2/providers/deck_provider.dart';
import 'package:uno_chanson_2/providers/game_provider.dart';
import 'package:uno_chanson_2/services/deck_import_service.dart';
import 'package:uno_chanson_2/services/game_storage_service.dart';
import 'package:uno_chanson_2/services/local_storage_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('restored app integration', () {
    test('keeps a valid selected deck while installing permanent 84 cards', () async {
      final custom = Deck(id: 'custom-deck', name: 'Custom deck', cards: [_card('custom-card', 'custom-deck')]);
      SharedPreferences.setMockInitialValues({'decks': jsonEncode([custom.toJson()]), 'active_deck': jsonEncode(custom.id)});
      final storage = LocalStorageService();
      final provider = DeckProvider(storage, DeckImportService(storage));
      addTearDown(provider.dispose);
      await provider.load();
      expect(provider.activeDeckId, custom.id);
      expect(provider.decks.first.id, AppConstants.productionDeckId);
      expect(provider.decks.first.name, 'CHANSON A REPONDRE UNO');
      expect(provider.decks.first.cards, hasLength(AppConstants.productionDeckSize));
      expect(provider.decks.first.cards.map((card) => card.id).toSet(), hasLength(AppConstants.productionDeckSize));
      final brio = provider.decks.singleWhere((deck) => deck.id == AppConstants.brioDeckId);
      expect(brio.cards, hasLength(16));
      expect(brio.cardBack, 'assets/decks/chanson_a_repondre_brio/card_back.jpeg');
    });

    test('BRIO starts with the shared five-card game flow', () async {
      SharedPreferences.setMockInitialValues({});
      final storage = LocalStorageService();
      final decks = DeckProvider(storage, DeckImportService(storage));
      final game = GameProvider(GameStorageService(storage));
      addTearDown(decks.dispose); addTearDown(game.dispose);
      await decks.load(); await decks.select(AppConstants.brioDeckId);
      expect(await game.start(decks.activeDeck!), isTrue);
      expect(game.state?.deckId, AppConstants.brioDeckId);
      expect(game.state?.players.first.hand, hasLength(5));
      expect(game.state?.discardPile, hasLength(1));
    });

    test('played card becomes the recto-up discard top card', () async {
      SharedPreferences.setMockInitialValues({});
      final storage = LocalStorageService(); final game = GameProvider(GameStorageService(storage)); addTearDown(game.dispose);
      final cards = List.generate(12, (index) => CardImageModel(id: 'card-$index', deckId: 'test-deck', title: 'Card $index', path: 'assets/cards/card_$index.png', category: 'Classique', colour: 'red', importedAt: DateTime(2026)));
      final deck = Deck(id: 'test-deck', name: 'Test deck', cards: cards);
      expect(await game.start(deck), isTrue); final played = game.state!.players.first.hand.first;
      expect(await game.play(played), isTrue); expect(game.state!.topCard.id, played.id); expect(game.state!.discardPile.last.id, played.id); expect(game.state!.topCard.imagePath, played.imagePath);
      final discardWidget = File('lib/widgets/discard_pile_widget.dart').readAsStringSync();
      expect(discardWidget, contains("key: const Key('discard-pile-recto')")); expect(discardWidget, contains('source: topCard.imagePath'));
    });

    test('Browse filter has no card title box', () {
      final browserScreen = File('lib/screens/card_browser_screen.dart').readAsStringSync();
      expect(browserScreen, isNot(contains("labelText: 'Card title'"))); expect(browserScreen, isNot(contains('var title = browser.titleFilter')));
    });

    test('selected Browse card provides an in-app return to the focused hand', () {
      final selectedCard = File('lib/screens/browse_selected_card_screen.dart').readAsStringSync();
      expect(selectedCard, contains('Return to Browse Cards'));
      expect(selectedCard, contains('AppRoutes.browseCard(card.id, category: card.category)'));
    });

    test('permanent decks cannot be renamed, deleted, or replaced by bad id', () async {
      SharedPreferences.setMockInitialValues({});
      final storage = LocalStorageService(); final provider = DeckProvider(storage, DeckImportService(storage)); addTearDown(provider.dispose); await provider.load();
      await provider.rename(AppConstants.productionDeckId, 'Changed'); await provider.delete(AppConstants.productionDeckId);
      await provider.rename(AppConstants.brioDeckId, 'Changed BRIO'); await provider.delete(AppConstants.brioDeckId); await provider.select('missing-deck');
      expect(provider.decks, hasLength(3)); expect(provider.activeDeckId, AppConstants.productionDeckId); expect(provider.decks.first.name, isNot('Changed'));
      expect(provider.decks.singleWhere((deck) => deck.id == AppConstants.brioDeckId).name, isNot('Changed BRIO'));
      expect(provider.decks.first.cards, hasLength(AppConstants.productionDeckSize));
    });

    test('restored routes and local Search castle entrypoint remain present', () {
      expect([AppRoutes.home, AppRoutes.play, AppRoutes.decks, AppRoutes.cards, AppRoutes.search, AppRoutes.journal, AppRoutes.aiChat, AppRoutes.rules, AppRoutes.settings, AppRoutes.profile, AppRoutes.djWhoVideos], everyElement(startsWith('/')));
      expect(AppRoutes.deck('custom-deck'), '/deck/custom-deck'); expect(AppRoutes.cardAlias('final-84-01'), '/card/final-84-01');
      final castle = File('web/card_castle/card_castle.html').readAsStringSync(); final bridge = File('web/card_castle/castle_bridge_compat.js').readAsStringSync(); final directCards = File('web/card_castle/castle_cards_direct.js').readAsStringSync(); final castleHost = File('lib/widgets/webgl_card_castle_view_web.dart').readAsStringSync();
      expect(castle, contains('../vendor/three.module.js')); expect(castle, contains('assets/assets/models/textured-glb-comparison/castle_exterior.glb')); expect(castle, contains("from '../vendor/GLTFLoader.js'")); expect(castle, isNot(contains('unpkg.com'))); expect(castle, contains('LONG_PRESS_MS=600')); expect(castle, contains('longPressTimer:0')); expect(directCards, contains('cardSelected')); expect(directCards, contains("canvas.addEventListener('pointerup'")); expect(castleHost.replaceAll(RegExp(r'\s+'), ''), contains("'type':'focusCard'")); expect(castle, contains('dragging:false')); expect(castle, contains('document.body.dataset.cardCount')); expect(castle, contains('deriveSurfaceAnchors(84)')); expect(castle, contains('document.body.dataset.surfaceAnchorCount')); expect(bridge, contains("type !== 'setCards'")); expect(bridge, contains('imagePath')); expect(bridge, contains('rectoUrl'));
    });

    test('Deck and Settings expose no deck import or hand-size controls', () {
      final deckScreen = File('lib/screens/deck_selection_screen.dart').readAsStringSync(); final settingsScreen = File('lib/screens/settings_screen.dart').readAsStringSync();
      expect(deckScreen, isNot(contains('DeckImportService'))); expect(deckScreen, isNot(contains('pickPngFiles'))); expect(deckScreen, isNot(contains('Import PNG deck'))); expect(deckScreen, isNot(contains('Create deck'))); expect(settingsScreen, isNot(contains('Deck Management'))); expect(settingsScreen, isNot(contains('Default hand size')));
    });

    test('startup video viewport retains real 360-degree rotation', () {
      final viewport = File('lib/widgets/startup_video_viewport.dart').readAsStringSync(); final homeViewport = File('lib/widgets/home_3d_video_viewport.dart').readAsStringSync();
      expect(viewport, contains('rotation.value * math.pi * 2')); expect(viewport, contains('..rotateY(yaw)')); expect(viewport, contains('..rotateX(pitch)')); expect(viewport, contains('onPanUpdate: _dragUpdate')); expect(viewport, contains('VideoPlayer(controller)')); expect(viewport, contains('Transform.flip')); expect(viewport, contains('flipX: mirrored')); expect(homeViewport, contains('StartupVideoViewport'));
    });

    test('Play keeps production puppet quality internal', () {
      final playScreen = File('lib/screens/play_screen.dart').readAsStringSync(); expect(playScreen, contains('PuppetQuality.medium')); expect(playScreen, isNot(contains('PopupMenuButton<PuppetQuality>'))); expect(playScreen, isNot(contains("tooltip: '3D quality'")));
    });
  });
}

CardImageModel _card(String id, String deckId) => CardImageModel(id: id, deckId: deckId, title: 'Custom card', path: 'assets/cards/custom.png', category: 'Classique', colour: 'red', importedAt: DateTime(2026));
