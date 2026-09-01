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
    await tester.binding.setSurfaceSize(const Size(390, 800));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(const MaterialApp(home: RulesScreen()));

    expect(find.text('RULES'), findsOneWidget);
    expect(find.byKey(const ValueKey('rules-desktop-side-by-side')), findsOneWidget);
    expect(find.byKey(const ValueKey('rules-content-desktop')), findsOneWidget);
    expect(find.text('HOW TO PLAY'), findsOneWidget);
    expect(find.text('Each player starts with 5 cards.'), findsOneWidget);
    expect(find.byTooltip('Return to Home'), findsOneWidget);

    final rulesList = find.byKey(const ValueKey('rules-content-desktop'));
    final rulesScroll = find.descendant(
      of: rulesList,
      matching: find.byType(Scrollable),
    );
    expect(rulesScroll, findsOneWidget);

    await tester.scrollUntilVisible(
      find.text('CARD CATEGORIES'),
      220,
      scrollable: rulesScroll,
    );
    expect(find.text('CARD CATEGORIES'), findsOneWidget);

    for (final category in const [
      'CLASSIQUE',
      'ART CONTEMPORAIN',
      'CYBERPUNK',
      'POÉSIE',
      'SAUVAGE',
    ]) {
      await tester.scrollUntilVisible(
        find.text(category),
        220,
        scrollable: rulesScroll,
      );
      expect(find.text(category), findsOneWidget);
    }

    await tester.scrollUntilVisible(
      find.text('BASIC CARD INTERACTION'),
      220,
      scrollable: rulesScroll,
    );
    expect(find.text('BASIC CARD INTERACTION'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.text('Long-click / long-press'),
      220,
      scrollable: rulesScroll,
    );
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
      debugDefaultTargetPlatformOverride = null;
    }
  });
}
