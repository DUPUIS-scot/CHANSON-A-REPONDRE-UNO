import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('every Castle JavaScript module parses successfully', () {
    final modules = Directory('web/card_castle')
        .listSync()
        .whereType<File>()
        .where((file) => file.path.endsWith('.js'))
        .toList()
      ..sort((a, b) => a.path.compareTo(b.path));

    expect(modules, isNotEmpty);
    for (final module in modules) {
      final result = Process.runSync(
        'node',
        ['--check', module.path],
        stdoutEncoding: systemEncoding,
        stderrEncoding: systemEncoding,
      );
      expect(
        result.exitCode,
        0,
        reason: '${module.path} failed JavaScript syntax validation:\n'
            '${result.stderr}',
      );
    }
  });
}
