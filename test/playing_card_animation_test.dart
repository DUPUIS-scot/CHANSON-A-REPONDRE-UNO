import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uno_chanson_2/data/card_categories.dart';
import 'package:uno_chanson_2/models/card_image_model.dart';
import 'package:uno_chanson_2/models/deck_model.dart';
import 'package:uno_chanson_2/providers/game_provider.dart';
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
                backImagePath: 'assets/images/card_back.png',
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
      4,
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
          ),
        ),
      ),
    );
    expect(find.byType(FlippablePlayingCard), findsNWidgets(4));
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
              backImagePath: '',
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
    expect(
      tester.widget<AspectRatio>(find.byType(AspectRatio)).aspectRatio,
      closeTo(2 / 3, .0001),
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
      expect(player.hand, hasLength(5));
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

  test('playing and drawing never grow the active hand beyond five', () async {
    SharedPreferences.setMockInitialValues({});
    final cards = List.generate(
      20,
      (index) => CardImageModel(
        id: 'fixed-hand-$index',
        deckId: 'deck',
        title: 'Internal title $index',
        path: 'assets/images/card_back.png',
        category: 'SAUVAGE',
        colour: 'black',
        importedAt: DateTime(2026),
      ),
    );
    final game = GameProvider(GameStorageService(LocalStorageService()));
    addTearDown(game.dispose);
    expect(
      await game.start(Deck(id: 'deck', name: 'Deck', cards: cards)),
      isTrue,
    );

    final playedCard = game.state!.players.first.hand.first;
    final drawCount = game.state!.drawPile.length;
    expect(await game.play(playedCard), isTrue);

    expect(game.state!.players.first.hand, hasLength(5));
    expect(game.state!.discardPile.last.id, playedCard.id);
    expect(game.state!.topCard.id, playedCard.id);
    expect(game.state!.drawPile, hasLength(drawCount - 1));

    final currentPlayer = game.state!.currentPlayerIndex;
    await game.draw();
    expect(game.state!.players[currentPlayer].hand, hasLength(5));
  });
}
