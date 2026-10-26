import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('circus has one clear two-way control and a stable exterior return', () {
    final runtime = File('web/lubiak/lubiak.js').readAsStringSync();

    expect(runtime, contains('LUBIAK_CIRCUS_ACCESS_BUTTON_V2'));
    expect(runtime, contains("inside?'EXIT':'CIRCUS'"));
    expect(runtime, contains("if(worldMode==='circus') exitCircus();"));
    expect(runtime, contains('else enterCircus();'));
    expect(runtime, contains('circusGateArmed = false;'));
    expect(runtime, contains('if (distance > 14) circusGateArmed = true;'));
    expect(runtime, contains('if (distance < 8 && p.y < 9) enterCircus();'));
    expect(runtime, isNot(contains('else if (p.z > 21.2)')));
  });

  test('Kathmandu panorama remains the exterior background after transitions', () {
    final page = File('web/lubiak/index.html').readAsStringSync();
    final runtime = File('web/lubiak/lubiak.js').readAsStringSync();

    expect(page, contains("url('assets/lubiak-kathmandu-360.jpg')"));
    expect(runtime, contains("'assets/lubiak-kathmandu-360.jpg'"));
    expect(
      'scene.background=exteriorBackgroundTexture;'
          .allMatches(runtime)
          .length,
      greaterThanOrEqualTo(1),
    );
    expect(runtime, contains('scene.background = exteriorBackgroundTexture;'));
    expect(runtime, contains('scene.environment = exteriorBackgroundTexture;'));
  });
}
