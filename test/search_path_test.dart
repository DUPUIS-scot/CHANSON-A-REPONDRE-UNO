import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uno_chanson_2/app.dart';
import 'package:uno_chanson_2/core/app_constants.dart';
import 'package:uno_chanson_2/core/app_router.dart';
import 'package:uno_chanson_2/models/card_image_model.dart';
import 'package:uno_chanson_2/models/deck_model.dart';
import 'package:uno_chanson_2/providers/card_browser_provider.dart';
import 'package:uno_chanson_2/providers/deck_provider.dart';
import 'package:uno_chanson_2/screens/search_screen.dart';
import 'package:uno_chanson_2/services/search_service.dart';
import 'package:uno_chanson_2/widgets/webgl_card_castle_view.dart';

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

    testWidgets('Search separates category selection from the castle', (
      tester,
    ) async {
      await tester.binding.setSurfaceSize(const Size(390, 844));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      SharedPreferences.setMockInitialValues({});
      await tester.pumpWidget(
        const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
      );
      await tester.pump(const Duration(seconds: 2));
      AppRouter.router.go(AppRoutes.search);
      await tester.pumpAndSettle();

      expect(find.byType(TextField), findsNothing);
      expect(find.byKey(const ValueKey('search-entry-navigation')), findsOne);
      expect(find.byKey(const ValueKey('search-home-button')), findsOne);
      expect(find.byKey(const ValueKey('search-dj-who-button')), findsOne);
      final homeRect = tester.getRect(
        find.byKey(const ValueKey('search-home-button')),
      );
      final djWhoRect = tester.getRect(
        find.byKey(const ValueKey('search-dj-who-button')),
      );
      expect(homeRect.top, djWhoRect.top);
      expect(homeRect.right, lessThan(djWhoRect.left));
      expect(djWhoRect.right, lessThanOrEqualTo(378));
      expect(find.text('ALL CATEGORIES'), findsOneWidget);
      expect(
        find.byKey(const ValueKey('search-all-categories')),
        findsOneWidget,
      );
      for (final category in const [
        'CLASSIQUE',
        'ART CONTEMPORAIN',
        'CYBERPUNK',
        'POÉSIE',
        'SAUVAGE',
      ]) {
        expect(
          find.byKey(ValueKey('search-category-$category')),
          findsOneWidget,
        );
      }

      final homeIcon = tester.widget<IconButton>(
        find.byKey(const ValueKey('search-home-button')),
      );
      expect(homeIcon.tooltip, 'Home');
      expect(find.text('HOME'), findsNothing);
      expect(
        find.descendant(
          of: find.byKey(const ValueKey('search-dj-who-button')),
          matching: find.byType(Image),
        ),
        findsOneWidget,
      );

      tester
          .widget<TextButton>(
            find.byKey(const ValueKey('search-all-categories')),
          )
          .onPressed!();
      await tester.pump(const Duration(milliseconds: 500));
      expect(
        find.byKey(const ValueKey('castle-back-to-categories')),
        findsOneWidget,
      );
      expect(find.text('ALL CATEGORIES'), findsNothing);
      final preferences = await SharedPreferences.getInstance();
      final persisted =
          jsonDecode(preferences.getString('search_path_state_v1')!)
              as Map<String, dynamic>;
      expect(persisted['castleActive'], isTrue);
      expect(persisted['category'], isNull);
      await tester.tap(find.byKey(const ValueKey('castle-back-to-categories')));
      await tester.pump(const Duration(milliseconds: 500));
      expect(find.text('ALL CATEGORIES'), findsOneWidget);

      await tester.tap(find.byKey(const ValueKey('search-home-button')));
      await tester.pump(const Duration(seconds: 1));
      expect(AppRouter.router.state.uri.path, AppRoutes.home);

      AppRouter.router.go(AppRoutes.search);
      await tester.pump();
      await tester.pump(const Duration(seconds: 1));
      await tester.tap(find.byKey(const ValueKey('search-dj-who-button')));
      expect(AppRouter.router.state.uri.path, AppRoutes.djWhoVideos);

      AppRouter.router.go(AppRoutes.search);
      await tester.pump();
      await tester.pump(const Duration(seconds: 1));
      for (final category in const [
        'CLASSIQUE',
        'ART CONTEMPORAIN',
        'CYBERPUNK',
        'POÉSIE',
        'SAUVAGE',
      ]) {
        tester
            .widget<InkWell>(find.byKey(ValueKey('search-category-$category')))
            .onTap!();
        await tester.pump(const Duration(milliseconds: 500));
        expect(
          find.byKey(const ValueKey('search-entry-navigation')),
          findsNothing,
        );
        expect(find.byKey(const ValueKey('search-home-button')), findsNothing);
        expect(
          find.byKey(const ValueKey('search-dj-who-button')),
          findsNothing,
        );
        expect(
          find.byKey(const ValueKey('castle-back-to-categories')),
          findsOne,
        );

        await tester.tap(
          find.byKey(const ValueKey('castle-back-to-categories')),
        );
        await tester.pump(const Duration(milliseconds: 500));
        expect(find.byKey(const ValueKey('search-entry-navigation')), findsOne);
        expect(find.byKey(ValueKey('search-category-$category')), findsOne);
      }
    });

    testWidgets('old category-based Search state restores without crashing', (
      tester,
    ) async {
      await tester.binding.setSurfaceSize(const Size(390, 844));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      SharedPreferences.setMockInitialValues({
        'flutter.search_path_state_v1':
            '{"category":"CLASSIQUE","selectedCardId":"final-84-01",'
            '"discoveredCardIds":["final-84-01"],"shuffleSeed":4}',
      });
      await tester.pumpWidget(
        const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
      );
      await tester.pump(const Duration(seconds: 2));
      AppRouter.router.go(AppRoutes.search);
      await tester.pump();
      await tester.pump(const Duration(seconds: 2));

      expect(tester.takeException(), isNull);
      expect(
        find.byKey(const ValueKey('castle-back-to-categories')),
        findsOneWidget,
      );
    });

    test('null category returns the complete permanent-style collection', () {
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
      final runtimeVerification = File(
        'scripts/verify_dealer_web.mjs',
      ).readAsStringSync();
      expect(castle, contains("emit('cardLongPressed',{cardId})"));
      expect(castle, contains('id="back-to-categories"'));
      expect(castle, contains("emit('categoriesRequested')"));
      expect(castle, contains('await exitCastleFullscreen()'));
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
      expect(castle, contains('dataset.activeCategory=activeCategory'));
      expect(castle, contains('dataset.cardCategories='));
      expect(castleBridge, contains("'isMatch': widget.matchingCardIds"));
      expect(castleBridge, contains("'metadata':"));
      expect(castleBridge, isNot(contains("'title': card.displayTitle")));
      expect(
        castleBridge,
        contains('final Future<void> Function(String) onCardOpened'),
      );
      expect(
        castleBridge,
        contains('final VoidCallback onCategoriesRequested'),
      );
      expect(castleBridge, contains("case 'categoriesRequested':"));
      expect(castleBridge, contains('widget.onCategoriesRequested()'));
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
      expect(searchScreen, contains("tooltip: 'Home'"));
      expect(searchScreen, contains("label: 'DJ WHO'"));
      expect(searchScreen, isNot(contains("child: const Text('HOME')")));
      expect(searchScreen, contains('category.versoAsset'));
      expect(
        searchScreen,
        contains("assets/images/search_castle_background.png"),
      );
      expect(searchScreen, contains('bool _castleActive = false'));
      expect(searchScreen, contains('category ?? searchAllCategoriesLabel'));
      expect(searchScreen, contains("'castleActive': _castleActive"));
      expect(searchScreen, contains("'category': _category"));
      expect(
        searchScreen,
        contains('matchingCardIds: cards.map((card) => card.id).toSet()'),
      );
      expect(searchScreen, contains('discoveredCardIds'));
      expect(searchScreen, contains('_castleCardViewerOpen'));
      expect(searchScreen, contains('onCategoriesRequested: _leaveCastle'));
      expect(searchScreen, contains('_CastleCardFullscreen(card: card)'));
      expect(searchScreen, contains('source: card.imagePath'));
      expect(searchScreen, isNot(contains('card.displayTitle')));
      expect(
        runtimeVerification,
        contains("getElementById('back-to-categories')?.click()"),
      );
      expect(
        runtimeVerification,
        contains('the iframe CATEGORIES control to restore'),
      );
      expect(
        searchScreen,
        contains(r"label: '${card.category}, front of card'"),
      );
      expect(castle, isNot(contains('focused-title')));
      expect(castle, isNot(contains('card?.title')));
    });

    testWidgets(
      'castle uses only production-deck cards when production deck is active',
      (tester) async {
        await tester.binding.setSurfaceSize(const Size(390, 844));
        addTearDown(() => tester.binding.setSurfaceSize(null));
        SharedPreferences.setMockInitialValues({});
        await tester.pumpWidget(
          const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
        );
        await tester.pump(const Duration(seconds: 2));
        AppRouter.router.go(AppRoutes.search);
        await tester.pumpAndSettle();
        await _ensureDecksLoaded(tester);

        tester
            .widget<TextButton>(
              find.byKey(const ValueKey('search-all-categories')),
            )
            .onPressed!();
        await _pumpUntilCastle(tester);

        expect(find.byType(WebGlCardCastleView), findsOneWidget);
        final castle = tester.widget<WebGlCardCastleView>(
          find.byType(WebGlCardCastleView),
        );
        expect(castle.cards, isNotEmpty);
        expect(
          castle.cards.every(
            (card) => card.deckId == AppConstants.productionDeckId,
          ),
          isTrue,
          reason: 'All cards should belong to the production deck',
        );
      },
    );

    testWidgets(
      'castle uses only BRIO-deck cards when BRIO deck is active',
      (tester) async {
        await tester.binding.setSurfaceSize(const Size(390, 844));
        addTearDown(() => tester.binding.setSurfaceSize(null));
        SharedPreferences.setMockInitialValues({
          'flutter.active_deck': jsonEncode(AppConstants.brioDeckId),
        });
        await tester.pumpWidget(
          const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
        );
        await tester.pump(const Duration(seconds: 2));
        AppRouter.router.go(AppRoutes.search);
        await tester.pumpAndSettle();
        await _ensureDecksLoaded(tester);

        tester
            .widget<TextButton>(
              find.byKey(const ValueKey('search-all-categories')),
            )
            .onPressed!();
        await _pumpUntilCastle(tester);

        expect(find.byType(WebGlCardCastleView), findsOneWidget);
        final castle = tester.widget<WebGlCardCastleView>(
          find.byType(WebGlCardCastleView),
        );
        expect(castle.cards, isNotEmpty);
        expect(
          castle.cards.every(
            (card) => card.deckId == AppConstants.brioDeckId,
          ),
          isTrue,
          reason: 'All cards should belong to the BRIO deck',
        );
      },
    );
  });
}

Future<void> _ensureDecksLoaded(WidgetTester tester) async {
  final context = tester.element(find.byType(SearchScreen));
  final decks = context.read<DeckProvider>();
  if (decks.loading || decks.activeDeck == null) {
    await tester.runAsync(() => decks.load());
    await tester.pumpAndSettle();
  }
}

Future<void> _pumpUntilCastle(WidgetTester tester) async {
  for (
    var attempt = 0;
    attempt < 80 && find.byType(WebGlCardCastleView).evaluate().isEmpty;
    attempt++
  ) {
    await tester.pump(const Duration(milliseconds: 100));
  }
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
