import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:uno_chanson_2/screens/rules_screen.dart';
import 'package:uno_chanson_2/widgets/game_status_panel.dart';
import 'package:uno_chanson_2/widgets/home_navigation_button.dart';
import 'package:uno_chanson_2/widgets/rule_option_tile.dart';

void main() {
  testWidgets('rules is a compact documentation screen on mobile', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 800));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(const MaterialApp(home: RulesScreen()));

    expect(find.text('RULES'), findsOneWidget);
    expect(find.text('HOW TO PLAY'), findsOneWidget);
    expect(find.text('CARD CATEGORIES'), findsOneWidget);
    expect(find.text('Each player starts with 5 cards.'), findsOneWidget);
    expect(find.byType(HomeNavigationButton), findsOneWidget);

    for (final category in const [
      'CLASSIQUE',
      'ART CONTEMPORAIN',
      'CYBERPUNK',
      'POÉSIE',
      'SAUVAGE',
    ]) {
      await tester.scrollUntilVisible(
        find.text(category),
        200,
        scrollable: find.byType(Scrollable),
      );
      expect(find.text(category), findsOneWidget);
    }

    await tester.scrollUntilVisible(
      find.text('BASIC CARD INTERACTION'),
      300,
      scrollable: find.byType(Scrollable),
    );
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
}
