import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('deployment includes every authored Lubiak environment module', () {
    final pubspec = File('pubspec.yaml').readAsStringSync();
    final workflow = File('.github/workflows/deploy-pages.yml').readAsStringSync();

    expect(
      pubspec,
      contains('assets/models/textured-glb-comparison/lubiak-assets/'),
    );
    expect(
      workflow,
      contains('cp "$modules"/*.glb "$deployed_modules/"'),
      reason: 'Deployment must explicitly package the nested Lubiak modules',
    );

    for (final module in <String>[
      'freak street.glb',
      'avenue.glb',
      'roof top.glb',
      'palace.glb',
      'circus.glb',
      'district.glb',
      'card room.glb',
      'dragon lair.glb',
    ]) {
      expect(
        File(
          'assets/models/textured-glb-comparison/lubiak-assets/$module',
        ).existsSync(),
        isTrue,
        reason: 'Missing authored Lubiak module: $module',
      );
      expect(workflow, contains(module));
    }
  });
}
