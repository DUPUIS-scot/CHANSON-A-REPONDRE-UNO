import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uno_chanson_2/models/card_image_model.dart';
import 'package:uno_chanson_2/providers/deck_provider.dart';
import 'package:uno_chanson_2/screens/card_browser_screen.dart';
import 'package:uno_chanson_2/screens/card_fullscreen_screen.dart';
import 'package:uno_chanson_2/services/deck_import_service.dart';
import 'package:uno_chanson_2/services/local_storage_service.dart';
import 'package:uno_chanson_2/services/public_card_share_service.dart';
import 'package:uno_chanson_2/widgets/browse_hand_card.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Browse Share targets the currently selected permanent card', (
    tester,
  ) async {
    final decks = await _decks();
    addTearDown(decks.dispose);
    CardImageModel? shared;
    await tester.pumpWidget(
      ChangeNotifierProvider.value(
        value: decks,
        child: MaterialApp(
          home: CardBrowserScreen(
            shareCard: (card) async {
              shared = card;
              return CardShareResult.shared;
            },
          ),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 250));
    await tester.pumpAndSettle();

    final cards = find.byType(BrowseHandCard);
    expect(cards, findsNWidgets(5));
    final selected = tester.widget<BrowseHandCard>(cards.at(1)).card;
    await tester.tap(cards.at(1));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Share'));
    await tester.pump();

    expect(shared?.id, selected.id);
    expect(shared?.imagePath, selected.imagePath);
  });

  testWidgets('fullscreen swipe shares the card currently on screen', (
    tester,
  ) async {
    final decks = await _decks();
    addTearDown(decks.dispose);
    final cards = decks.cards;
    CardImageModel? shared;
    await tester.pumpWidget(
      ChangeNotifierProvider.value(
        value: decks,
        child: MaterialApp(
          home: CardFullscreenScreen(
            cardId: cards.first.id,
            shareCard: (card) async {
              shared = card;
              return CardShareResult.shared;
            },
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.drag(find.byType(PageView), const Offset(-600, 0));
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('Share card'));
    await tester.pump();

    expect(shared?.id, cards[1].id);
    expect(shared?.imagePath, cards[1].imagePath);
  });
}

Future<DeckProvider> _decks() async {
  SharedPreferences.setMockInitialValues({});
  final storage = LocalStorageService();
  final decks = DeckProvider(storage, DeckImportService(storage));
  await decks.load();
  return decks;
}
