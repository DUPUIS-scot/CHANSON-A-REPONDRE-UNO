import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:uno_chanson_2/models/card_image_model.dart';
import 'package:uno_chanson_2/screens/play_hand_fullscreen_screen.dart';
import 'package:uno_chanson_2/widgets/flippable_playing_card.dart';
import 'package:uno_chanson_2/widgets/fullscreen_page_indicator.dart';
import 'package:uno_chanson_2/widgets/player_hand.dart';

CardImageModel card(int index) => CardImageModel(
  id: 'card-$index',
  deckId: 'deck',
  title: 'Card $index',
  path: 'missing-$index.png',
  category: 'Parole',
  colour: 'red',
  importedAt: DateTime(2026),
);

void main() {
  testWidgets('tap selects, hold toggles the face, and double-tap previews', (
    tester,
  ) async {
    final cards = List.generate(5, card);
    CardImageModel? selected;
    final revealed = <String>{};
    String? previewCardId;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SizedBox(
            height: 240,
            child: StatefulBuilder(
              builder: (context, setState) => PlayerHand(
                cards: cards,
                selectedCardId: selected?.id,
                isPlayable: (_) => true,
                onSelectionChanged: (value) => setState(() => selected = value),
                revealedCardIds: revealed,
                onRevealedChanged: (ids) => setState(() {
                  revealed
                    ..clear()
                    ..addAll(ids);
                }),
                keepRevealed: true,
                onFullscreenCard: (cardId) => previewCardId = cardId,
              ),
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    final held = find.byType(FlippablePlayingCard).last;
    await tester.longPress(held);
    await tester.pumpAndSettle();

    expect(previewCardId, isNull);
    expect(selected, isNull);
    expect(revealed, {'card-4'});
    expect(tester.widget<FlippablePlayingCard>(held).isFaceUp, isTrue);

    await tester.tap(held);
    await tester.pump(kDoubleTapTimeout + const Duration(milliseconds: 50));
    await tester.pumpAndSettle();
    expect(selected?.id, 'card-4');
    expect(revealed, {'card-4'});
    expect(tester.widget<FlippablePlayingCard>(held).isFaceUp, isTrue);

    await tester.longPress(held);
    await tester.pumpAndSettle();
    expect(previewCardId, isNull);
    expect(selected?.id, 'card-4');
    expect(revealed, isEmpty);
    expect(tester.widget<FlippablePlayingCard>(held).isFaceUp, isFalse);

    await tester.tap(held);
    await tester.pump(const Duration(milliseconds: 50));
    await tester.tap(held);
    await tester.pumpAndSettle();
    expect(previewCardId, 'card-4');
    expect(selected?.id, 'card-4');
    expect(revealed, isEmpty);
    expect(tester.widget<FlippablePlayingCard>(held).isFaceUp, isFalse);
  });

  testWidgets('desktop mouse long-click does not also trigger tap', (
    tester,
  ) async {
    var taps = 0;
    var longPresses = 0;
    await tester.pumpWidget(
      MaterialApp(
        home: Center(
          child: SizedBox(
            width: 120,
            height: 180,
            child: FlippablePlayingCard(
              frontImagePath: 'missing.png',
              category: 'CLASSIQUE',
              isFaceUp: false,
              isSelected: false,
              isPlayable: true,
              onTap: () => taps++,
              onLongPress: () => longPresses++,
            ),
          ),
        ),
      ),
    );

    final mouse = await tester.createGesture(kind: PointerDeviceKind.mouse);
    await mouse.addPointer(
      location: tester.getCenter(find.byType(FlippablePlayingCard)),
    );
    await mouse.down(tester.getCenter(find.byType(FlippablePlayingCard)));
    await tester.pump(const Duration(milliseconds: 650));
    await mouse.up();
    await tester.pump();

    expect(longPresses, 1);
    expect(taps, 0);
  });

  testWidgets('closing held-card fullscreen preserves hand order and faces', (
    tester,
  ) async {
    final cards = List.generate(5, card);
    CardImageModel? selected;
    final revealed = <String>{};
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SizedBox(
            height: 240,
            child: StatefulBuilder(
              builder: (context, setState) => PlayerHand(
                cards: cards,
                selectedCardId: selected?.id,
                isPlayable: (_) => true,
                onSelectionChanged: (value) => setState(() => selected = value),
                revealedCardIds: revealed,
                onRevealedChanged: (ids) => setState(() {
                  revealed
                    ..clear()
                    ..addAll(ids);
                }),
                keepRevealed: true,
                onFullscreenCard: (cardId) {
                  Navigator.of(context).push<void>(
                    MaterialPageRoute(
                      builder: (_) => PlayHandFullscreenScreen(
                        cards: cards,
                        faceUp: cards
                            .map((card) => revealed.contains(card.id))
                            .toList(growable: false),
                        initialIndex: cards.indexWhere(
                          (card) => card.id == cardId,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    final thirdCard = find.byType(FlippablePlayingCard).at(2);
    await tester.longPress(thirdCard);
    await tester.pumpAndSettle();
    await tester.tap(thirdCard);
    await tester.pump(kDoubleTapTimeout + const Duration(milliseconds: 50));
    await tester.pumpAndSettle();
    await tester.tap(thirdCard);
    await tester.pump(const Duration(milliseconds: 50));
    await tester.tap(thirdCard);
    await tester.pumpAndSettle();

    final preview = tester.widget<PlayHandFullscreenScreen>(
      find.byType(PlayHandFullscreenScreen),
    );
    expect(preview.cards.map((card) => card.id), [
      'card-0',
      'card-1',
      'card-2',
      'card-3',
      'card-4',
    ]);
    expect(preview.faceUp, [false, false, true, false, false]);
    expect(preview.initialIndex, 2);

    await tester.tap(find.byTooltip('Close card preview'));
    await tester.pumpAndSettle();

    final returnedCards = tester
        .widgetList<FlippablePlayingCard>(find.byType(FlippablePlayingCard))
        .toList();
    expect(returnedCards, hasLength(5));
    expect(returnedCards.map((card) => card.frontImagePath), [
      'missing-0.png',
      'missing-1.png',
      'missing-2.png',
      'missing-3.png',
      'missing-4.png',
    ]);
    expect(returnedCards.map((card) => card.isFaceUp), [
      false,
      false,
      true,
      false,
      false,
    ]);
    expect(revealed, {'card-2'});
    expect(selected?.id, 'card-2');
  });

  testWidgets('viewer starts on held card, pages, and closes with Escape', (
    tester,
  ) async {
    final cards = List.generate(3, card);
    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (context) => FilledButton(
            onPressed: () => Navigator.push<void>(
              context,
              MaterialPageRoute(
                builder: (_) => PlayHandFullscreenScreen(
                  cards: cards,
                  faceUp: const [true, true, true],
                  initialIndex: 1,
                ),
              ),
            ),
            child: const Text('OPEN'),
          ),
        ),
      ),
    );
    await tester.tap(find.text('OPEN'));
    await tester.pumpAndSettle();
    expect(find.text('Card 1'), findsNothing);
    expect(find.text('PAROLE'), findsOneWidget);
    expect(
      tester
          .widget<FullscreenPageIndicator>(find.byType(FullscreenPageIndicator))
          .current,
      2,
    );
    await tester.tap(find.byTooltip('Next card'));
    await tester.pumpAndSettle();
    expect(
      tester
          .widget<FullscreenPageIndicator>(find.byType(FullscreenPageIndicator))
          .current,
      3,
    );
    await tester.sendKeyEvent(LogicalKeyboardKey.escape);
    await tester.pumpAndSettle();
    expect(find.text('OPEN'), findsOneWidget);
  });
}
