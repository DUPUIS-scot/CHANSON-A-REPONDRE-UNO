import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:uno_chanson_2/screens/rules_screen.dart';
import 'package:uno_chanson_2/widgets/game_status_panel.dart';
import 'package:uno_chanson_2/widgets/rule_option_tile.dart';

void main() {
  testWidgets('rules keeps machine and documentation side by side off iOS', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(900, 800));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(const MaterialApp(home: RulesScreen()));

    expect(find.text('RULES'), findsOneWidget);
    expect(find.byKey(const ValueKey('rules-desktop-side-by-side')), findsOneWidget);
    expect(find.byKey(const ValueKey('rules-content-desktop')), findsOneWidget);
    expect(find.text('HOW TO PLAY'), findsOneWidget);
    expect(find.text('Each player starts with 5 cards.'), findsOneWidget);
    expect(find.byTooltip('Return to Home'), findsOneWidget);

    final rulesList = find.byKey(const ValueKey('rules-content-desktop'));
    expect(rulesList, findsOneWidget);

    await tester.drag(rulesList, const Offset(0, -520));
    await tester.pumpAndSettle();
    expect(find.text('CARD CATEGORIES'), findsOneWidget);

    await tester.drag(rulesList, const Offset(0, -720));
    await tester.pumpAndSettle();
    expect(find.text('BASIC CARD INTERACTION'), findsOneWidget);
    expect(find.text('Long-click / long-press'), findsOneWidget);

    expect(find.text('Live game state'), findsNothing);
    expect(find.text('Optional variations'), findsNothing);
    expect(find.byType(GameStatusPanel), findsNothing);
    expect(find.byType(RuleOptionTile), findsNothing);
    expect(find.byType(DropdownButtonFormField<Object?>), findsNothing);
    expect(find.byType(Switch), findsNothing);
    expect(tester.takeException(), isNull);
  });

  testWidgets('rules uses machine first and documentation second on iOS', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 800));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final previousPlatform = debugDefaultTargetPlatformOverride;
    debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
    try {
      await tester.pumpWidget(const MaterialApp(home: RulesScreen()));

      expect(find.byKey(const ValueKey('rules-ios-two-viewport')), findsOneWidget);
      expect(find.byKey(const ValueKey('rules-content-ios')), findsNothing);

      await tester.drag(
        find.byKey(const ValueKey('rules-ios-two-viewport')),
        const Offset(0, -700),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const ValueKey('rules-content-ios')), findsOneWidget);
      expect(find.text('HOW TO PLAY'), findsOneWidget);
      expect(find.byKey(const ValueKey('rules-ios-back-to-machine')), findsOneWidget);
      expect(tester.takeException(), isNull);
    } finally {
      debugDefaultTargetPlatformOverride = previousPlatform;
    }
  });
}
