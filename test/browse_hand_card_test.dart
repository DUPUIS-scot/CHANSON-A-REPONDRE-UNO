import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:uno_chanson_2/models/card_image_model.dart';
import 'package:uno_chanson_2/widgets/browse_hand_card.dart';

void main() {
  testWidgets('uses card aspect ratio and single tap selects and opens', (
    tester,
  ) async {
    var selected = 0;
    var opened = 0;
    final card = CardImageModel(
      id: 'card',
      deckId: 'deck',
      title: 'Natural Card',
      path: 'assets/images/card_back.png',
      category: 'Parole',
      colour: 'red',
      importedAt: DateTime(2026),
      imageWidth: 900,
      imageHeight: 1600,
    );
    await tester.pumpWidget(
      MaterialApp(
        home: Center(
          child: SizedBox(
            width: 220,
            height: 400,
            child: BrowseHandCard(
              card: card,
              position: 1,
              total: 5,
              deckName: 'Deck',
              rotationDegrees: 0,
              selected: false,
              onTap: () => selected++,
              onOpen: () => opened++,
            ),
          ),
        ),
      ),
    );
    final ratio = tester.widget<AspectRatio>(find.byType(AspectRatio));
    expect(ratio.aspectRatio, 900 / 1600);
    await tester.tap(find.byType(BrowseHandCard));
    await tester.pump();
    expect(selected, 1);
    expect(opened, 1);
  });

  testWidgets('missing image displays fallback without crashing', (
    tester,
  ) async {
    final card = CardImageModel(
      id: 'missing',
      deckId: 'deck',
      title: 'Missing',
      path: 'data:image/png;base64,not-valid-base64',
      category: 'Parole',
      colour: 'red',
      importedAt: DateTime(2026),
    );
    await tester.pumpWidget(
      MaterialApp(
        home: SizedBox(
          width: 200,
          height: 320,
          child: BrowseHandCard(
            card: card,
            position: 1,
            total: 1,
            deckName: 'Deck',
            rotationDegrees: 0,
            selected: false,
            onTap: () {},
            onOpen: () {},
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.byIcon(Icons.broken_image_outlined), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
