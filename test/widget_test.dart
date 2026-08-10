// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter_test/flutter_test.dart';

import 'package:uno_chanson_2/app.dart';

void main() {
  testWidgets('home screen presents the installation entrance hierarchy', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
    );

    expect(find.text('OPEN CURTAINS'), findsOneWidget);
    await tester.tap(find.text('OPEN CURTAINS'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 1300));
    await tester.pump();

    for (final label in <String>[
      'PLAY',
      'CASTLE',
      'DJ WHO',
      'Deck',
      'Journal',
      'Rules',
      'Settings',
      'About',
    ]) {
      expect(find.text(label), findsWidgets);
    }
    expect(find.text('CHOOSE DECK'), findsNothing);
    expect(find.text('BROWSE CARDS'), findsNothing);
    expect(find.text('AI CHAT'), findsNothing);
  });
}
