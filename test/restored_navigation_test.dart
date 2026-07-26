import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:uno_chanson_2/core/app_router.dart';
import 'package:uno_chanson_2/widgets/app_bottom_navigation.dart';

void main() {
  testWidgets('main navigation restores decks, Play, journal, and More paths', (
    tester,
  ) async {
    final router = GoRouter(
      initialLocation: AppRoutes.home,
      routes: [
        GoRoute(
          path: AppRoutes.home,
          builder: (_, _) => const Scaffold(
            body: Text('Home route'),
            bottomNavigationBar: AppBottomNavigation(),
          ),
        ),
        for (final route in [
          AppRoutes.decks,
          AppRoutes.play,
          AppRoutes.journal,
          AppRoutes.search,
          AppRoutes.aiChat,
          AppRoutes.rules,
          AppRoutes.settings,
          AppRoutes.profile,
        ])
          GoRoute(
            path: route,
            builder: (_, _) => Scaffold(body: Text('$route route')),
          ),
      ],
    );
    addTearDown(router.dispose);
    await tester.pumpWidget(MaterialApp.router(routerConfig: router));

    await tester.tap(find.text('DECKS'));
    await tester.pumpAndSettle();
    expect(router.state.uri.path, AppRoutes.decks);

    router.go(AppRoutes.home);
    await tester.pumpAndSettle();
    await tester.tap(find.text('PLAY'));
    await tester.pumpAndSettle();
    expect(router.state.uri.path, AppRoutes.play);

    router.go(AppRoutes.home);
    await tester.pumpAndSettle();
    await tester.tap(find.text('JOURNAL'));
    await tester.pumpAndSettle();
    expect(router.state.uri.path, AppRoutes.journal);

    router.go(AppRoutes.home);
    await tester.pumpAndSettle();
    await tester.tap(find.text('PLUS'));
    await tester.pumpAndSettle();
    expect(find.text('Search'), findsOneWidget);
    expect(find.text('AI Chat'), findsOneWidget);
    expect(find.text('Rules'), findsOneWidget);
    expect(find.text('Settings'), findsOneWidget);
    expect(find.text('Profile'), findsOneWidget);

    await tester.tap(find.text('Search'));
    await tester.pumpAndSettle();
    expect(router.state.uri.path, AppRoutes.search);
  });
}
