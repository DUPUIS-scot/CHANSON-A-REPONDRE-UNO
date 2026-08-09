import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uno_chanson_2/core/app_constants.dart';
import 'package:uno_chanson_2/data/card_categories.dart';
import 'package:uno_chanson_2/models/card_image_model.dart';
import 'package:uno_chanson_2/models/deck_model.dart';
import 'package:uno_chanson_2/providers/game_provider.dart';
import 'package:uno_chanson_2/providers/settings_provider.dart';
import 'package:uno_chanson_2/services/game_storage_service.dart';
import 'package:uno_chanson_2/services/local_storage_service.dart';
import 'package:uno_chanson_2/widgets/flippable_playing_card.dart';
import 'package:uno_chanson_2/widgets/fullscreen_hand_card.dart';
import 'package:uno_chanson_2/widgets/player_hand.dart';
import 'package:uno_chanson_2/widgets/stored_image.dart';

void main() {
  testWidgets('card flips and suppresses repeated taps while animating', (
    tester,
  ) async {
    var faceUp = false;
    var taps = 0;
    await tester.pumpWidget(
      MaterialApp(
        home: StatefulBuilder(
          builder: (context, setState) => Center(
            child: SizedBox(
              width: 120,
              height: 180,
              child: FlippablePlayingCard(
                frontImagePath: 'assets/images/card_back.png',
                category: 'Mémoire',
                isFaceUp: faceUp,
                isSelected: faceUp,
                isPlayable: true,
                semanticLabel: 'Test card face down playable',
                onTap: () {
                  taps++;
                  setState(() => faceUp = true);
                },
              ),
            ),
          ),
        ),
      ),
    );
    await tester.tap(find.byType(FlippablePlayingCard));
    await tester.pump(const Duration(milliseconds: 50));
    await tester.tap(find.byType(FlippablePlayingCard));
    await tester.pump(const Duration(milliseconds: 450));
    expect(taps, 1);
    expect(find.byType(StoredImage), findsOneWidget);
  });

  testWidgets('player hand creates one staggered card per model', (
    tester,
  ) async {
    final cards = List.generate(
      AppConstants.maxPlayerHandSize,
      (index) => CardImageModel(
        id: 'c$index',
        deckId: 'deck',
        title: 'Card $index',
        path: 'assets/images/card_back.png',
        category: 'Parole',
        colour: 'red',
        importedAt: DateTime(2026),
      ),
    );
    await tester.pumpWidget(
      MaterialApp(
        home: SizedBox(
          width: 600,
          height: 260,
          child: PlayerHand(
            cards: cards,
            selectedCardId: null,
            isPlayable: (_) => true,
            onSelectionChanged: (_) {},
            revealedCardIds: const {},
            onRevealedChanged: (_) {},
            keepRevealed: true,
          ),
        ),
      ),
    );
    expect(
      find.byType(FlippablePlayingCard),
      findsNWidgets(AppConstants.maxPlayerHandSize),
    );
    await tester.pump(const Duration(milliseconds: 800));
    expect(tester.takeException(), isNull);
  });

  testWidgets('face-down play cards use category-specific versos', (
    tester,
  ) async {
    for (final category in cardCategories) {
      await tester.pumpWidget(
        MaterialApp(
          home: SizedBox(
            width: 120,
            height: 180,
            child: FlippablePlayingCard(
              frontImagePath: 'assets/images/card_back.png',
              category: category.label,
              isFaceUp: false,
              isSelected: false,
              isPlayable: true,
              semanticLabel: '${category.label} face down',
              onTap: () {},
            ),
          ),
        ),
      );

      expect(
        find.byWidgetPredicate(
          (widget) =>
              widget is Image &&
              widget.image is AssetImage &&
              (widget.image as AssetImage).assetName == category.versoAsset,
        ),
        findsOneWidget,
      );
    }
  });

  testWidgets('permanent play artwork uses the shared 2:3 contained surface', (
    tester,
  ) async {
    final card = CardImageModel(
      id: 'ratio-card',
      deckId: 'deck',
      title: 'Ratio card',
      path: 'assets/images/card_back.png',
      category: 'CLASSIQUE',
      colour: 'red',
      importedAt: DateTime(2026),
    );

    expect(card.aspectRatio, cardAspectRatio);
    await tester.pumpWidget(
      MaterialApp(
        home: SizedBox(
          width: 120,
          child: AspectRatio(
            aspectRatio: cardAspectRatio,
            child: FlippablePlayingCard(
              frontImagePath: card.imagePath,
              category: card.category,
              isFaceUp: true,
              isSelected: false,
              isPlayable: true,
              onTap: () {},
            ),
          ),
        ),
      ),
    );

    expect(
      tester.widget<StoredImage>(find.byType(StoredImage)).fit,
      BoxFit.contain,
    );
    expect(find.byType(AspectRatio), findsOneWidget);
  });

  testWidgets('play fullscreen shows verso when down and recto when up', (
    tester,
  ) async {
    final card = CardImageModel(
      id: 'final-84-02',
      deckId: 'deck',
      title: 'Internal title',
      path: 'assets/images/card_back.png',
      category: 'SAUVAGE',
      colour: 'green',
      importedAt: DateTime(2026),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: FullscreenHandCard(
          card: card,
          position: 1,
          total: 1,
          faceUp: false,
        ),
      ),
    );
    expect(
      find.byWidgetPredicate(
        (widget) =>
            widget is Image &&
            widget.image is AssetImage &&
            (widget.image as AssetImage).assetName ==
                cardCategoryFor('SAUVAGE').versoAsset,
      ),
      findsOneWidget,
    );
    expect(find.byType(StoredImage), findsNothing);

    await tester.pumpWidget(
      MaterialApp(
        home: FullscreenHandCard(
          card: card,
          position: 1,
          total: 1,
          faceUp: true,
        ),
      ),
    );
    expect(find.byType(StoredImage), findsOneWidget);
  });

  test('new Play games deal exactly five categorized cards per hand', () async {
    SharedPreferences.setMockInitialValues({});
    final cards = List.generate(20, (index) {
      final category = cardCategoryAt(index);
      return CardImageModel(
        id: 'final-84-${(index + 1).toString().padLeft(2, '0')}',
        deckId: 'deck',
        title: 'Internal title $index',
        path: 'assets/images/card_back.png',
        category: category.label,
        colour: category.colour,
        importedAt: DateTime(2026),
      );
    });
    final game = GameProvider(GameStorageService(LocalStorageService()));
    addTearDown(game.dispose);

    final started = await game.start(
      Deck(id: 'deck', name: 'Deck', cards: cards),
    );

    expect(started, isTrue);
    expect(game.state!.players, hasLength(2));
    for (final player in game.state!.players) {
      expect(player.hand, hasLength(AppConstants.maxPlayerHandSize));
    }
    expect(
      game.state!.players.expand((player) => player.hand),
      everyElement(
        predicate<CardImageModel>((card) {
          return isKnownCardCategory(card.category);
        }),
      ),
    );
  });

  test('Play draw never grows a full hand beyond five cards', () async {
    SharedPreferences.setMockInitialValues({});
    final cards = List.generate(20, (index) {
      final category = cardCategoryAt(index);
      return CardImageModel(
        id: 'draw-cap-$index',
        deckId: 'deck',
        title: 'Card $index',
        path: 'assets/images/card_back.png',
        category: category.label,
        colour: category.colour,
        importedAt: DateTime(2026),
      );
    });
    final game = GameProvider(GameStorageService(LocalStorageService()));
    addTearDown(game.dispose);
    await game.start(Deck(id: 'deck', name: 'Deck', cards: cards));
    final drawPileLength = game.state!.drawPile.length;

    await game.draw();

    expect(
      game.state!.players.first.hand,
      hasLength(AppConstants.maxPlayerHandSize),
    );
    expect(game.state!.drawPile, hasLength(drawPileLength));
    expect(game.message, 'The Play hand already contains five cards.');
  });

  test('Settings exposes the shared fixed Play hand size', () {
    final settings = SettingsProvider(LocalStorageService());
    addTearDown(settings.dispose);

    expect(settings.maxPlayerHandSize, AppConstants.maxPlayerHandSize);
    expect(settings.maxPlayerHandSize, 5);
  });
}
