import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uno_chanson_2/models/card_image_model.dart';
import 'package:uno_chanson_2/providers/deck_provider.dart';
import 'package:uno_chanson_2/screens/card_browser_screen.dart';
import 'package:uno_chanson_2/screens/card_fullscreen_screen.dart';
import 'package:uno_chanson_2/screens/card_transcription_screen.dart';
import 'package:uno_chanson_2/services/deck_import_service.dart';
import 'package:uno_chanson_2/services/local_storage_service.dart';
import 'package:uno_chanson_2/services/public_card_share_service.dart';
import 'package:uno_chanson_2/widgets/browse_hand_card.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Browse Share targets the currently selected permanent card', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(1440, 1000));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final decks = (await tester.runAsync(_decks))!;
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
    final selectedWidget = tester.widget<BrowseHandCard>(cards.at(1));
    final selected = selectedWidget.card;
    selectedWidget.onTap();
    await tester.pumpAndSettle();
    await tester.tap(find.text('Share'));
    await tester.pump();

    expect(shared?.id, selected.id);
    expect(shared?.imagePath, selected.imagePath);
  });

  testWidgets('Browse AI actions open the selected card jester first', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(1440, 1000));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final decks = (await tester.runAsync(_decks))!;
    addTearDown(decks.dispose);

    final router = GoRouter(
      initialLocation: '/cards',
      routes: [
        GoRoute(
          path: '/cards',
          builder: (_, _) => const CardBrowserScreen(),
          routes: [
            GoRoute(
              path: ':cardId/transcription',
              builder: (_, state) => CardTranscriptionScreen(
                cardId: state.pathParameters['cardId']!,
              ),
            ),
          ],
        ),
      ],
    );
    addTearDown(router.dispose);

    await tester.pumpWidget(
      ChangeNotifierProvider.value(
        value: decks,
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pump(const Duration(milliseconds: 250));
    await tester.pumpAndSettle();

    final cards = find.byType(BrowseHandCard);
    expect(cards, findsNWidgets(5));
    final selected = tester.widget<BrowseHandCard>(cards.first).card;
    tester.widget<BrowseHandCard>(cards.first).onTap();
    await tester.pumpAndSettle();

    expect(find.text('TRANSCRIBE CARD'), findsOneWidget);
    expect(find.text('DISCUSS WITH AI'), findsOneWidget);

    await tester.tap(find.text('TRANSCRIBE CARD'));
    await tester.pumpAndSettle();
    expect(router.state.uri.path, '/cards/${selected.id}/transcription');
    expect(find.text('TRANSCRIBE CARD'), findsOneWidget);
    expect(find.text('DISCUSS WITH AI'), findsOneWidget);
    expect(find.text('ChatGPT'), findsNothing);

    router.go('/cards');
    await tester.pumpAndSettle();

    // Returning to Browse preserves the existing CardBrowserScreen state and
    // therefore the selected card. Tapping that same card again would toggle
    // the selection off and hide both AI actions, which is not the behavior
    // this test is intended to exercise.
    expect(find.text('TRANSCRIBE CARD'), findsOneWidget);
    expect(find.text('DISCUSS WITH AI'), findsOneWidget);
    await tester.tap(find.text('DISCUSS WITH AI'));
    await tester.pumpAndSettle();
    expect(router.state.uri.path, '/cards/${selected.id}/transcription');
    expect(find.text('TRANSCRIBE CARD'), findsOneWidget);
    expect(find.text('DISCUSS WITH AI'), findsOneWidget);
    expect(find.text('ChatGPT'), findsNothing);

    final card = decks.cards.first;
    await tester.pumpWidget(
      ChangeNotifierProvider.value(
        value: decks,
        child: MaterialApp(home: CardFullscreenScreen(cardId: card.id)),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('TRANSCRIBE CARD'), findsNothing);
    expect(find.text('DISCUSS WITH AI'), findsNothing);
    expect(find.text('Ask AI a question'), findsNothing);
  });

  testWidgets('fullscreen keeps only bottom Share and targets visible card', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(1440, 1000));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final decks = (await tester.runAsync(_decks))!;
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
    expect(find.byTooltip('Share card'), findsNothing);
    expect(find.widgetWithText(FilledButton, 'Share'), findsOneWidget);

    final pageView = tester.widget<PageView>(find.byType(PageView));
    pageView.controller!.jumpToPage(1);
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(FilledButton, 'Share'));
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
