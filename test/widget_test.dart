// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:uno_chanson_2/app.dart';

void main() {
  testWidgets('home screen displays every navigation option', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      const ChansonUnoApp(aiBackendUrlOverride: 'https://api.test'),
    );

    final enterButton = find.widgetWithText(FilledButton, 'ENTER');
    expect(enterButton, findsOneWidget);
    await tester.tap(enterButton);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 1300));
    await tester.pump(const Duration(milliseconds: 600));
    await tester.pump();

    expect(
      find.bySemanticsLabel('Chanson à Répondre application logo'),
      findsOneWidget,
    );
    expect(find.text('ENTER'), findsOneWidget);
    for (final label in <String>[
      'PLAY',
      'CASTLE',
      'DJ WHO',
      'DECK',
      'BROWSE',
      'JOURNAL',
      'RULES',
      'SETTINGS',
    ]) {
      // Some destinations also appear in persistent navigation.
      expect(find.text(label), findsWidgets);
    }
    expect(find.text('ABOUT'), findsNothing);
  });
}
