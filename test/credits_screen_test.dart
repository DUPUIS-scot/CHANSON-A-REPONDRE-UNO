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

  testWidgets('curtain opens and reveals home links and visit card sharing', (
    tester,
  ) async {
    await tester.pumpWidget(const MaterialApp(home: CreditsScreen()));

    var credits = tester.widget<AnimatedOpacity>(
      find.byKey(const ValueKey('credits-content')),
    );
    expect(credits.opacity, 0);
    expect(
      find.byKey(const ValueKey('credits-curtain-open-surface')),
      findsOneWidget,
    );
    expect(find.byKey(const ValueKey('credits-curtain-left')), findsNothing);
    expect(find.byKey(const ValueKey('credits-curtain-right')), findsNothing);
    expect(find.byIcon(Icons.play_arrow), findsNothing);

    await tester.pump(const Duration(seconds: 2));
    credits = tester.widget<AnimatedOpacity>(
      find.byKey(const ValueKey('credits-content')),
    );
    expect(credits.opacity, 0);

    await tester.tap(
      find.byKey(const ValueKey('credits-curtain-open-surface')),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 700));
    await tester.pumpAndSettle();

    credits = tester.widget<AnimatedOpacity>(
      find.byKey(const ValueKey('credits-content')),
    );
    expect(credits.opacity, 1);
    expect(find.text('Version: 3.7.3+1'), findsOneWidget);
    expect(find.text('BACK TO SETTINGS'), findsNothing);
    expect(find.byKey(const ValueKey('credits-uno-home')), findsOneWidget);
    expect(find.byKey(const ValueKey('credits-website-home')), findsOneWidget);
    expect(
      find.byKey(const ValueKey('credits-share-visit-card')),
      findsOneWidget,
    );
    expect(find.text('SHARE VISIT CARD'), findsOneWidget);

    await tester.tapAt(const Offset(10, 300));
    await tester.pumpAndSettle();
    credits = tester.widget<AnimatedOpacity>(
      find.byKey(const ValueKey('credits-content')),
    );
    expect(credits.opacity, 0);
  });
}
