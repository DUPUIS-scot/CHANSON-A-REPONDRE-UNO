import 'dart:convert';

import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

import '../models/visitor_stats.dart';
import 'local_storage_service.dart';

typedef VisitorAnalyticsRpc = Future<dynamic> Function(
  String function,
  Map<String, dynamic> parameters,
);

class VisitorAnalyticsService {
  VisitorAnalyticsService({
    required this.storage,
    SupabaseClient? client,
    VisitorAnalyticsRpc? rpc,
    this._uuid = const Uuid(),
  }) : _rpc = rpc ??
           (client == null
               ? null
               : (function, parameters) =>
                     client.rpc(function, params: parameters));

  static const visitorIdStorageKey = 'anonymous_visitor_id_v1';

  final LocalStorageService storage;
  final VisitorAnalyticsRpc? _rpc;
  final Uuid _uuid;
  String? _recordedUtcDay;

  bool get available => _rpc != null;

  Future<String> anonymousVisitorId() async {
    final encoded = await storage.read(visitorIdStorageKey);
    if (encoded != null) {
      try {
        final existing = jsonDecode(encoded);
        if (existing is String && existing.isNotEmpty) return existing;
      } on FormatException {
        // Replace malformed legacy storage with a fresh anonymous identifier.
      }
    }
    final generated = _uuid.v4();
    await storage.write(visitorIdStorageKey, generated);
    return generated;
  }

  Future<void> recordVisit({DateTime? now}) async {
    final rpc = _rpc;
    if (rpc == null) return;
    final utcDay = (now ?? DateTime.now()).toUtc().toIso8601String().substring(
      0,
      10,
    );
    if (_recordedUtcDay == utcDay) return;
    final visitorId = await anonymousVisitorId();
    await rpc('record_app_visit', {'p_visitor_key': visitorId});
    _recordedUtcDay = utcDay;
  }

  Future<VisitorStats> getStats() async {
    final rpc = _rpc;
    if (rpc == null) throw StateError('Visitor analytics unavailable');
    final response = await rpc('get_app_visitor_stats', const {});
    final row = response is List
        ? (response.isEmpty ? null : response.first)
        : response;
    if (row is! Map) throw const FormatException('Invalid visitor statistics');
    return VisitorStats(
      sevenDays: _integer(row['visitors_7_days']),
      ninetyDays: _integer(row['visitors_90_days']),
      oneYear: _integer(row['visitors_365_days']),
    );
  }

  int _integer(Object? value) {
    if (value is num) return value.toInt();
    return int.parse(value.toString());
  }
}
