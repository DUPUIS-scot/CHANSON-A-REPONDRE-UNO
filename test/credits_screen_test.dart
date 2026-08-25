import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:uno_chanson_2/screens/credits_screen.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    PackageInfo.setMockInitialValues(
      appName: 'Chanson à Répondre UNO',
      packageName: 'uno_chanson_2',
      version: '3.7.3',
      buildNumber: '1',
      buildSignature: '',
    );
  });

  testWidgets('curtain stays closed until tapped, then reveals dynamic credits', (
    tester,
  ) async {
    await tester.pumpWidget(const MaterialApp(home: CreditsScreen()));

    var credits = tester.widget<AnimatedOpacity>(
      find.byKey(const ValueKey('credits-content')),
    );
    expect(credits.opacity, 0);
    expect(find.byKey(const ValueKey('open-credits-curtain')), findsOneWidget);
    expect(find.byIcon(Icons.play_arrow), findsNothing);

    // Entry remains theatrically closed until the curtain itself is tapped.
    await tester.pump(const Duration(seconds: 2));
    credits = tester.widget<AnimatedOpacity>(
      find.byKey(const ValueKey('credits-content')),
    );
    expect(credits.opacity, 0);

    await tester.tap(find.byKey(const ValueKey('open-credits-curtain')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 1150));
    await tester.pumpAndSettle();

    credits = tester.widget<AnimatedOpacity>(
      find.byKey(const ValueKey('credits-content')),
    );
    expect(credits.opacity, 1);
    expect(find.text('Version: 3.7.3+1'), findsOneWidget);
    expect(find.text('BACK TO SETTINGS'), findsOneWidget);
  });
}
