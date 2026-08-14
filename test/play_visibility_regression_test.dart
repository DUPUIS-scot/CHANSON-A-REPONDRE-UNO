import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uno_chanson_2/app.dart';
import 'package:uno_chanson_2/core/app_router.dart';
import 'package:uno_chanson_2/data/card_categories.dart';
import 'package:uno_chanson_2/models/card_image_model.dart';
import 'package:uno_chanson_2/models/deck_model.dart';
import 'package:uno_chanson_2/providers/game_provider.dart';
import 'package:uno_chanson_2/screens/play_screen.dart';
import 'package:uno_chanson_2/widgets/player_hand.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Play piles stay fully visible above the five-card hand', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});
    AppRouter.router.go(AppRoutes.play);
    tester.view.devicePixelRatio = 1;
    tester.view.physicalSize = const Size(390, 844);
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    await tester.pumpWidget(
      const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
    );
    await tester.pumpAndSettle();
    final context = tester.element(find.byType(PlayScreen));
    final deck = Deck(
      id: 'visibility-deck',
      name: 'Visibility deck',
      cards: List.generate(20, (index) {
        final category = cardCategoryAt(index);
        return CardImageModel(
          id: 'visibility-card-$index',
          deckId: 'visibility-deck',
          title: 'Card $index',
          path: 'assets/images/card_back.png',
          category: category.label,
          colour: category.colour,
          importedAt: DateTime(2026),
        );
      }),
    );
    expect(await context.read<GameProvider>().start(deck), isTrue);
    await tester.pumpAndSettle();

    for (final size in const [
      Size(320, 568),
      Size(390, 844),
      Size(768, 1024),
      Size(1440, 1000),
    ]) {
      tester.view.physicalSize = size;
      await tester.pumpAndSettle();

      final handRect = tester.getRect(find.byType(PlayerHand));
      final drawRect = tester.getRect(find.byKey(const Key('draw-pile-left')));
      final discardRect = tester.getRect(
        find.byKey(const Key('discard-pile-right')),
      );

      expect(drawRect.top, greaterThanOrEqualTo(0), reason: 'viewport $size');
      expect(discardRect.top, greaterThanOrEqualTo(0), reason: 'viewport $size');
      expect(drawRect.bottom, lessThanOrEqualTo(handRect.top + 4), reason: 'viewport $size');
      expect(discardRect.bottom, lessThanOrEqualTo(handRect.top + 4), reason: 'viewport $size');
      expect(tester.takeException(), isNull, reason: 'viewport $size');
    }

    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(seconds: 1));
  });
}
