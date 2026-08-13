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

    testWidgets('Search exposes only the five category selectors and castle', (
      tester,
    ) async {
      SharedPreferences.setMockInitialValues({});
      await tester.pumpWidget(
        const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
      );
      await tester.pump(const Duration(seconds: 2));
      AppRouter.router.go(AppRoutes.search);
      await tester.pumpAndSettle();

      expect(find.byType(TextField), findsNothing);
      expect(find.text('DJ WHO'), findsNothing);
      expect(find.byIcon(Icons.home_rounded), findsNothing);
      expect(find.byType(SegmentedButton), findsNothing);
      expect(find.byIcon(Icons.grid_view_rounded), findsNothing);
      expect(find.byIcon(Icons.view_list_rounded), findsNothing);
      expect(find.byType(ChoiceChip), findsNWidgets(5));
      expect(find.text('TOUTES'), findsNothing);
      for (final category in const [
        'CLASSIQUE',
        'ART CONTEMPORAIN',
        'CYBERPUNK',
        'POÉSIE',
        'SAUVAGE',
      ]) {
        expect(find.text(category), findsOneWidget);
      }
    });

    test('castle uses the local authoritative GLB with 84 anchors', () {
      final castle = File(
        'web/card_castle/card_castle.html',
      ).readAsStringSync();
      final searchScreen = File(
        'lib/screens/search_screen.dart',
      ).readAsStringSync();
      final castleBridge = File(
        'lib/widgets/webgl_card_castle_view_web.dart',
      ).readAsStringSync();
      expect(castle, contains("emit('cardLongPressed',{cardId})"));
      expect(castle, contains('const LONG_PRESS_MS=600'));
      expect(castle, contains("dataset.longPressState='detected'"));
      expect(castle, contains('down?.suppressNavigation'));
      expect(castle, isNot(contains('performance.now()-down.t>520')));
      expect(castle, isNot(contains("emit('djWhoRequested')")));
      expect(castle, contains('assets/assets/models/search_castle.glb'));
      expect(castle, contains("from '../vendor/GLTFLoader.js'"));
      expect(castle, contains('new THREE.FogExp2'));
      expect(castle, contains("dataset.atmosphere='scottish-cinematic-night'"));
      expect(castle, contains('THREE.PCFSoftShadowMap'));
      expect(castle, contains('buildCloudTexture()'));
      expect(castle, contains('new THREE.PointLight(0xffa34d'));
      expect(castle, contains('new THREE.DirectionalLight(0xcbdff0,9.6)'));
      expect(castle, contains('addArchitecturalSpot'));
      expect(castle, contains('dataset.warmLightCount'));
      expect(castle, contains('function categoryAccent'));
      expect(castle, contains('deriveSurfaceAnchors(84)'));
      expect(castle, contains('card.rectoUrl'));
      expect(castle, contains('card.isMatch===false'));
      expect(castleBridge, contains("'isMatch': widget.matchingCardIds"));
      expect(castleBridge, contains("'metadata':"));
      expect(castleBridge, isNot(contains("'title': card.displayTitle")));
      expect(
        castleBridge,
        contains('final Future<void> Function(String) onCardOpened'),
      );
      expect(castleBridge, contains('_setCardOverlayMode(true)'));
      expect(castleBridge, contains("visibility = active ? 'hidden' : ''"));
      expect(castleBridge, contains('widget.onCardOpened(id)).whenComplete'));
      expect(
        castleBridge,
        contains('event.origin != html.window.location.origin'),
      );
      expect(
        castleBridge,
        isNot(contains('event.source != iframe.contentWindow')),
      );
      expect(castle, contains('id="exit-fullscreen"'));
      expect(castle, isNot(contains('id="castle-category"')));
      expect(castle, isNot(contains('id="focused-summary"')));
      expect(castle, isNot(contains('id="previous-card"')));
      expect(castle, isNot(contains('id="next-card"')));
      expect(castle, isNot(contains('id="castle-home"')));
      expect(castle, isNot(contains('id="castle-dj-who"')));
      expect(castle, contains('id="castle-reset"'));
      expect(searchScreen, isNot(contains('_SearchViewMode')));
      expect(searchScreen, isNot(contains('SegmentedButton')));
      expect(searchScreen, isNot(contains('_SearchCardTile')));
      expect(searchScreen, isNot(contains('_SearchListRow')));
      expect(castle, isNot(contains('id="hint"')));
      expect(castle, isNot(contains('#hint')));
      expect(searchScreen, isNot(contains('5 CARTES ACTIVES')));
      expect(searchScreen, isNot(contains('Rechercher une carte')));
      expect(searchScreen, isNot(contains("label: const Text('DJ WHO')")));
      expect(searchScreen, contains(': _buildCastle(results)'));
      expect(
        searchScreen,
        contains('matchingCardIds: cards.map((card) => card.id).toSet()'),
      );
      expect(searchScreen, contains('discoveredCardIds'));
      expect(searchScreen, contains('permanentCards.length'));
      expect(searchScreen, contains('_castleCardViewerOpen'));
      expect(searchScreen, contains('_CastleCardFullscreen(card: card)'));
      expect(searchScreen, contains('source: card.imagePath'));
      expect(searchScreen, isNot(contains('card.displayTitle')));
      expect(
        searchScreen,
        contains(r"label: '${card.category}, front of card'"),
      );
      expect(castle, isNot(contains('focused-title')));
      expect(castle, isNot(contains('card?.title')));
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
