import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:uno_chanson_2/screens/evel_bungee_screen.dart';
import 'package:uno_chanson_2/widgets/home_navigation_button.dart';

void main() {
  Future<void> pumpScreen(WidgetTester tester, Size size) async {
    await tester.binding.setSurfaceSize(size);
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(const MaterialApp(home: EvelBungeeScreen()));
    await tester.pump();
  }

  testWidgets(
    'shared navigation stays clear of the desktop instruction panel',
    (tester) async {
      await pumpScreen(tester, const Size(1280, 720));

      final navigation = find.byKey(const ValueKey('evel-bungee-navigation'));
      expect(navigation, findsOneWidget);
      expect(find.byType(HomeNavigationButton), findsOneWidget);
      expect(find.byTooltip('Return to Home'), findsOneWidget);
      expect(find.byTooltip('Open DJ WHO Videos'), findsOneWidget);

      final bounds = tester.getRect(navigation);
      expect(bounds.right, 1268);
      expect(bounds.top, 12);
      expect(bounds.left, greaterThan(350));
    },
  );

  testWidgets('shared navigation sits below the mobile instruction panel', (
    tester,
  ) async {
    await pumpScreen(tester, const Size(390, 844));

    final navigation = find.byKey(const ValueKey('evel-bungee-navigation'));
    final bounds = tester.getRect(navigation);

    expect(bounds.left, 12);
    expect(bounds.top, 199);
    expect(bounds.bottom, lessThan(844));
  });
}
