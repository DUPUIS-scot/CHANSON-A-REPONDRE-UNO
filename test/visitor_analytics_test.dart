import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uno_chanson_2/models/visitor_stats.dart';
import 'package:uno_chanson_2/screens/settings_screen.dart';
import 'package:uno_chanson_2/services/local_storage_service.dart';
import 'package:uno_chanson_2/services/visitor_analytics_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('visitor analytics service', () {
    setUp(() => SharedPreferences.setMockInitialValues({}));

    test('generates one anonymous ID and reuses it', () async {
      final service = VisitorAnalyticsService(storage: LocalStorageService());

      final first = await service.anonymousVisitorId();
      final second = await service.anonymousVisitorId();

      expect(first, isNotEmpty);
      expect(second, first);
    });

    test('reuses an existing anonymous ID', () async {
      SharedPreferences.setMockInitialValues({
        'flutter.${VisitorAnalyticsService.visitorIdStorageKey}':
            '"5ddf8f09-1e68-4af0-9c9d-3e35b3481628"',
      });
      final service = VisitorAnalyticsService(storage: LocalStorageService());

      expect(
        await service.anonymousVisitorId(),
        '5ddf8f09-1e68-4af0-9c9d-3e35b3481628',
      );
    });

    test('records only once per UTC day in one application flow', () async {
      var calls = 0;
      final service = VisitorAnalyticsService(
        storage: LocalStorageService(),
        rpc: (function, parameters) async {
          expect(function, 'record_app_visit');
          expect(parameters['p_visitor_key'], isA<String>());
          calls++;
        },
      );

      final day = DateTime.utc(2026, 8, 13, 23, 30);
      await service.recordVisit(now: day);
      await service.recordVisit(now: day.add(const Duration(minutes: 20)));

      expect(calls, 1);
    });

    test('parses aggregate 7, 90 and 365 day counts', () async {
      final service = VisitorAnalyticsService(
        storage: LocalStorageService(),
        rpc: (function, parameters) async => [
          {
            'visitors_7_days': 1234,
            'visitors_90_days': '5678',
            'visitors_365_days': 12345.0,
          },
        ],
      );

      final stats = await service.getStats();
      expect(stats.sevenDays, 1234);
      expect(stats.ninetyDays, 5678);
      expect(stats.oneYear, 12345);
    });

    test('unconfigured environments do not record or require a network', () async {
      final service = VisitorAnalyticsService(storage: LocalStorageService());
      await service.recordVisit();
      expect(service.available, isFalse);
      expect(service.getStats(), throwsStateError);
    });

    test('migration exposes only secured aggregate RPC access', () {
      final migration = File(
        'supabase/migrations/20260813000000_app_visitor_analytics.sql',
      ).readAsStringSync();
      expect(migration, contains('primary key (visitor_key, visit_date)'));
      expect(migration, contains('enable row level security'));
      expect(migration, contains('count(distinct visitor_key)'));
      expect(migration, contains('security definer'));
      expect(migration, contains('revoke all on table public.app_visitors'));
    });
  });

  group('visitor statistics UI', () {
    test('Settings config starts Visitor section collapsed', () {
      final source = File('lib/screens/settings_screen.dart').readAsStringSync();
      expect(
        RegExp(
          r"title: 'VISITORS',[\s\S]*?initiallyExpanded: false,",
        ).hasMatch(source),
        isTrue,
      );
    });

    testWidgets('shows all periods and formatted shared totals', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: VisitorStatsPanel(
              stats: VisitorStats(
                sevenDays: 1234,
                ninetyDays: 5678,
                oneYear: 12345,
              ),
              loading: false,
            ),
          ),
        ),
      );

      expect(find.text('7 DAYS'), findsOneWidget);
      expect(find.text('90 DAYS'), findsOneWidget);
      expect(find.text('1 YEAR'), findsOneWidget);
      expect(find.text('1,234'), findsOneWidget);
      expect(find.text('5,678'), findsOneWidget);
      expect(find.text('12,345'), findsOneWidget);
    });

    testWidgets('loading and unavailable states are safe at 390 by 844', (
      tester,
    ) async {
      await tester.binding.setSurfaceSize(const Size(390, 844));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: VisitorStatsPanel(stats: null, loading: true),
          ),
        ),
      );
      expect(find.text('—'), findsNWidgets(3));
      expect(tester.takeException(), isNull);

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: VisitorStatsPanel(stats: null, loading: false),
          ),
        ),
      );
      expect(find.text('Visitor statistics unavailable'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  });
}
