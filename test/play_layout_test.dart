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
import 'package:uno_chanson_2/widgets/flippable_playing_card.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Play theatre fits phone, tablet, and desktop viewports', (
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
      id: 'layout-deck',
      name: 'Layout deck',
      cards: List.generate(20, (index) {
        final category = cardCategoryAt(index);
        return CardImageModel(
          id: 'layout-card-$index',
          deckId: 'layout-deck',
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
      // The hand intentionally enters from the draw-pile side. Validate the
      // stable stage geometry after that deal/reflow animation has completed.
      await tester.pumpAndSettle();

      expect(find.text('HOME'), findsOneWidget);
      expect(find.text('DJ WHO'), findsOneWidget);
      expect(find.text('OPPONENT'), findsNothing);
      expect(find.text('RULES PILE'), findsOneWidget);
      expect(find.text('PLAY CARD'), findsOneWidget);
      expect(find.text('CANCEL'), findsNothing);
      expect(find.byKey(const Key('played-card-recto')), findsOneWidget);
      expect(find.byType(FlippablePlayingCard), findsNWidgets(5));
      expect(tester.takeException(), isNull, reason: 'viewport $size');

      for (final card in find.byType(FlippablePlayingCard).evaluate()) {
        final rect = tester.getRect(find.byWidget(card.widget));
        expect(rect.left, greaterThanOrEqualTo(0), reason: 'viewport $size');
        expect(rect.right, lessThanOrEqualTo(size.width), reason: 'viewport $size');
        expect(rect.bottom, lessThanOrEqualTo(size.height), reason: 'viewport $size');
      }
    }

    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(seconds: 1));
  });
}
