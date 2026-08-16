import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:uno_chanson_2/models/browse_hand_preview_args.dart';
import 'package:uno_chanson_2/models/card_image_model.dart';
import 'package:uno_chanson_2/screens/browse_hand_fullscreen_screen.dart';
import 'package:uno_chanson_2/widgets/fullscreen_browse_card.dart';
import 'package:uno_chanson_2/widgets/fullscreen_card_toolbar.dart';
import 'package:uno_chanson_2/widgets/stored_image.dart';

void main() {
  testWidgets('fullscreen card is laid out below the category toolbar', (
    tester,
  ) async {
    final card = CardImageModel(
      id: 'card-1',
      deckId: 'deck',
      title: 'Test card',
      path: 'assets/images/card_back.png',
      category: 'Classique',
      colour: 'red',
      importedAt: DateTime(2026),
    );
    final args = BrowseHandPreviewArgs(
      cards: [card],
      initialIndex: 0,
      deckId: 'deck',
      deckName: 'Deck',
    );

    await tester.pumpWidget(
      MaterialApp(home: BrowseHandFullscreenScreen(args: args)),
    );
    await tester.pump();

    final toolbarRect = tester.getRect(find.byType(FullscreenCardToolbar));
    final cardRect = tester.getRect(find.byType(FullscreenBrowseCard));

    expect(cardRect.top, greaterThanOrEqualTo(toolbarRect.bottom));
    expect(cardRect.overlaps(toolbarRect), isFalse);

    final image = tester.widget<StoredImage>(find.byType(StoredImage));
    expect(image.fit, BoxFit.contain);
  });
}
