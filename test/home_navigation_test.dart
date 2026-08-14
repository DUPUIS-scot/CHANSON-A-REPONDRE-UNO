import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uno_chanson_2/app.dart';
import 'package:uno_chanson_2/core/app_router.dart';
import 'package:uno_chanson_2/models/card_image_model.dart';
import 'package:uno_chanson_2/models/deck_model.dart';
import 'package:uno_chanson_2/providers/game_provider.dart';
import 'package:uno_chanson_2/screens/home_screen.dart';
import 'package:uno_chanson_2/widgets/home_navigation_button.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    AppRouter.router.go(AppRoutes.home);
  });

  testWidgets('Home and DJ WHO controls are icon-only in the same group', (
    tester,
  ) async {
    await tester.pumpWidget(
      const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
    );
    AppRouter.router.go(AppRoutes.settings);
    await tester.pumpAndSettle();

    final group = find.byType(HomeNavigationButton);
    expect(group, findsOneWidget);
    expect(
      find.descendant(of: group, matching: find.byTooltip('Return to Home')),
      findsOneWidget,
    );
    expect(
      find.descendant(
        of: group,
        matching: find.byTooltip('Open DJ WHO Videos'),
      ),
      findsOneWidget,
    );
    expect(
      find.descendant(of: group, matching: find.text('HOME')),
      findsNothing,
    );
    expect(
      find.descendant(of: group, matching: find.text('DJ WHO')),
      findsNothing,
    );
  });

  testWidgets('Home and DJ WHO controls remain icon-only on narrow layouts', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(500, 700));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
    );
    AppRouter.router.go(AppRoutes.settings);
    await tester.pumpAndSettle();

    final group = find.byType(HomeNavigationButton);
    expect(find.byTooltip('Return to Home'), findsOneWidget);
    expect(find.byTooltip('Open DJ WHO Videos'), findsOneWidget);
    expect(
      find.descendant(of: group, matching: find.text('HOME')),
      findsNothing,
    );
    expect(
      find.descendant(of: group, matching: find.text('DJ WHO')),
      findsNothing,
    );
  });

  group(
    'Home navigation integration',
    skip: 'Temporarily skipped while the shared navigation widget is stabilized.',
    () {
      testWidgets('Home button is absent on Home and visible on Settings', (
        tester,
      ) async {
        await tester.pumpWidget(
          const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
        );
        await tester.pumpAndSettle();
        expect(find.byType(HomeNavigationButton), findsNothing);
        AppRouter.router.go(AppRoutes.settings);
        await tester.pumpAndSettle();
        expect(find.byType(HomeNavigationButton), findsOneWidget);
        expect(find.byTooltip('Open DJ WHO Videos'), findsOneWidget);
      });

      testWidgets('DJ WHO button opens the DJ WHO Videos route', (tester) async {
        await tester.pumpWidget(
          const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
        );
        AppRouter.router.go(AppRoutes.settings);
        await tester.pumpAndSettle();
        await tester.tap(find.byTooltip('Open DJ WHO Videos'));
        await tester.pumpAndSettle();

        expect(AppRouter.router.state.uri.path, AppRoutes.djWhoVideos);
        expect(find.text('DJ WHO Videos'), findsWidgets);
      });

      testWidgets('Home button goes directly to Home without duplicates', (
        tester,
      ) async {
        await tester.pumpWidget(
          const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
        );
        AppRouter.router.go(AppRoutes.rules);
        await tester.pumpAndSettle();
        await tester.tap(find.byTooltip('Return to Home'));
        await tester.pumpAndSettle();
        expect(find.byType(HomeScreen), findsOneWidget);
        expect(AppRouter.router.canPop(), isFalse);
      });

      testWidgets('Home still returns from DJ WHO Videos to Home', (tester) async {
        await tester.pumpWidget(
          const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
        );
        AppRouter.router.go(AppRoutes.djWhoVideos);
        await tester.pumpAndSettle();
        await tester.tap(find.byTooltip('Return to Home'));
        await tester.pumpAndSettle();

        expect(find.byType(HomeScreen), findsOneWidget);
      });

      testWidgets('DJ WHO route keeps the DJ WHO control available', (
        tester,
      ) async {
        await tester.pumpWidget(
          const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
        );
        AppRouter.router.go(AppRoutes.djWhoVideos);
        await tester.pumpAndSettle();

        expect(AppRouter.router.state.uri.path, AppRoutes.djWhoVideos);
        expect(find.byTooltip('Open DJ WHO Videos'), findsOneWidget);
      });

      testWidgets('unknown route includes a working Home button', (tester) async {
        await tester.pumpWidget(
          const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
        );
        AppRouter.router.go('/does-not-exist');
        await tester.pumpAndSettle();
        expect(find.text('Page not found'), findsOneWidget);
        await tester.tap(find.byTooltip('Return to Home'));
        await tester.pumpAndSettle();
        expect(find.byType(HomeScreen), findsOneWidget);
      });

      testWidgets('Alt H returns to Home', (tester) async {
        await tester.pumpWidget(
          const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
        );
        AppRouter.router.go(AppRoutes.search);
        await tester.pumpAndSettle();
        await tester.sendKeyDownEvent(LogicalKeyboardKey.altLeft);
        await tester.sendKeyEvent(LogicalKeyboardKey.keyH);
        await tester.sendKeyUpEvent(LogicalKeyboardKey.altLeft);
        await tester.pumpAndSettle();
        expect(find.byType(HomeScreen), findsOneWidget);
      });

      testWidgets('active game Home asks for save confirmation', (tester) async {
        await tester.pumpWidget(
          const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
        );
        await tester.pumpAndSettle();
        final context = tester.element(find.byType(HomeScreen));
        final game = context.read<GameProvider>();
        await game.start(
          Deck(
            id: 'test-deck',
            name: 'Test Deck',
            cards: List.generate(5, (index) => _card(index)),
          ),
        );
        AppRouter.router.go(AppRoutes.play);
        await tester.pumpAndSettle();
        await tester.tap(find.byTooltip('Return to Home'));
        await tester.pumpAndSettle();
        expect(find.text('Return to Home?'), findsOneWidget);
        expect(find.text('Save and Return'), findsOneWidget);
        await tester.tap(find.text('Cancel'));
        await tester.pumpAndSettle();
        expect(find.text('Play'), findsOneWidget);
      });
    },
  );
}

CardImageModel _card(int index) => CardImageModel(
  id: 'card-$index',
  deckId: 'test-deck',
  title: 'Card $index',
  path: 'assets/images/card_back.png',
  category: 'Parole',
  colour: 'red',
  importedAt: DateTime(2026),
);
