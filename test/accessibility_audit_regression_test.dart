import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:uno_chanson_2/models/card_image_model.dart';
import 'package:uno_chanson_2/widgets/card_selection_dialog.dart';
import 'package:uno_chanson_2/widgets/home_navigation_button.dart';
import 'package:uno_chanson_2/widgets/player_hand.dart';

CardImageModel _card({
  String title = 'Prompt card',
  String question = 'What story does this image suggest?',
}) =>
    CardImageModel(
      id: 'card-1',
      deckId: 'deck-1',
      title: title,
      path: 'missing.png',
      category: 'SAUVAGE',
      colour: 'green',
      importedAt: DateTime(2026),
      question: question,
    );

void main() {
  testWidgets('play hand exposes the card prompt in semantics', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      MaterialApp(
        home: SizedBox(
          width: 600,
          height: 360,
          child: PlayerHand(
            cards: [_card()],
            selectedCardId: null,
            isPlayable: (_) => true,
            onSelectionChanged: (_) {},
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(
      find.bySemanticsLabel(
        RegExp('What story does this image suggest\\?'),
      ),
      findsOneWidget,
    );
    semantics.dispose();
  });

  testWidgets('journal card picker identifies each checkbox', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CardSelectionDialog(
            cards: [_card(question: '')],
            initiallySelectedIds: const {},
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(
      find.bySemanticsLabel('Prompt card, SAUVAGE'),
      findsOneWidget,
    );
    expect(find.text('Prompt card'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('home navigation has a single accessible label', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: HomeNavigationButton(showDjWho: false),
        ),
      ),
    );

    expect(
      find.bySemanticsLabel('Return to Home'),
      findsOneWidget,
    );
    semantics.dispose();
  });
}
