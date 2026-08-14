import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uno_chanson_2/app.dart';
import 'package:uno_chanson_2/core/app_constants.dart';
import 'package:uno_chanson_2/core/app_router.dart';
import 'package:uno_chanson_2/providers/deck_provider.dart';
import 'package:uno_chanson_2/widgets/stored_image.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const categoryLabels = [
    'CLASSIQUE',
    'ART CONTEMPORAIN',
    'CYBERPUNK',
    'POÉSIE',
    'SAUVAGE',
  ];

  testWidgets('selecting BRIO makes Search category choices use BRIO verso', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(
      const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
    );
    await tester.pump(const Duration(seconds: 2));

    AppRouter.router.go(AppRoutes.decks);
    await tester.pumpAndSettle();

    final brioLabel = find.text('CHANSON A REPONDRE BRIO');
    expect(brioLabel, findsOneWidget);
    await tester.ensureVisible(brioLabel);
    await tester.tap(brioLabel);
    await tester.pump(const Duration(milliseconds: 300));

    final deckContext = tester.element(brioLabel);
    expect(
      deckContext.read<DeckProvider>().activeDeckId,
      AppConstants.brioDeckId,
    );

    AppRouter.router.go(AppRoutes.search);
    await tester.pumpAndSettle();

    for (final label in categoryLabels) {
      final button = find.byKey(ValueKey('search-category-$label'));
      expect(button, findsOneWidget);
      final image = tester.widget<StoredImage>(
        find.descendant(of: button, matching: find.byType(StoredImage)),
      );
      expect(
        image.source,
        'assets/decks/chanson_a_repondre_brio/card_back.jpeg',
      );
    }
  });

  testWidgets('production Search keeps category-specific verso artwork', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(
      const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
    );
    await tester.pump(const Duration(seconds: 2));
    AppRouter.router.go(AppRoutes.search);
    await tester.pumpAndSettle();

    final sources = <String>{};
    for (final label in categoryLabels) {
      final button = find.byKey(ValueKey('search-category-$label'));
      final image = tester.widget<StoredImage>(
        find.descendant(of: button, matching: find.byType(StoredImage)),
      );
      sources.add(image.source);
    }

    expect(sources, hasLength(5));
    expect(
      sources.every(
        (source) => source.startsWith('assets/cards/category_versos/'),
      ),
      isTrue,
    );
  });
}
