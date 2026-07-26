import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:uno_chanson_2/models/card_image_model.dart';
import 'package:uno_chanson_2/widgets/flippable_playing_card.dart';
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
            revealOnTap: true,
            keepRevealed: true,
          ),
        ),
      ),
    );
    expect(find.byType(FlippablePlayingCard), findsNWidgets(4));
    await tester.pump(const Duration(milliseconds: 800));
    expect(tester.takeException(), isNull);
  });
}
