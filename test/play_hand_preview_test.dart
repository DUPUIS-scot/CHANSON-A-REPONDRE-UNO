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
  testWidgets('tap selects while long press reveals only the held card', (
    tester,
  ) async {
    final cards = List.generate(5, card);
    CardImageModel? selected;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SizedBox(
            height: 240,
            child: PlayerHand(
              cards: cards,
              selectedCardId: null,
              isPlayable: (_) => true,
              onSelectionChanged: (value) => selected = value,
            ),
          ),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 500));
    final third = find.byType(FlippablePlayingCard).at(2);
    final thirdCard = tester.widget<FlippablePlayingCard>(third);
    thirdCard.onTap();
    expect(selected?.id, 'card-2');
    expect(thirdCard.isFaceUp, isFalse);
    thirdCard.onLongPress!();
    await tester.pump(const Duration(milliseconds: 450));
    final updated = tester.widgetList<FlippablePlayingCard>(
      find.byType(FlippablePlayingCard),
    );
    expect(updated.elementAt(2).isFaceUp, isTrue);
    expect(updated.where((card) => card.isFaceUp), hasLength(1));
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
