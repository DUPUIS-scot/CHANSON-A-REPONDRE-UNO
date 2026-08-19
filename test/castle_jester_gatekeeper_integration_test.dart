import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('castle jester gatekeeper is injected without replacing castle scene', () {
    final bootstrap = File('web/flutter_bootstrap.js').readAsStringSync();
    final overlay = File('web/card_castle/castle_jester_overlay.js').readAsStringSync();
    final controller = File('web/card_castle/castle_jester_gatekeeper.js').readAsStringSync();

    expect(bootstrap, contains('castle_jester_overlay.js'));
    expect(overlay, contains('castle_jester_rigged.glb'));
    expect(
      overlay,
      contains("castleEntranceTrigger='rigged-jester-single-click'"),
    );
    expect(overlay, contains("dataset.castleJesterGesture='single-click'"));
    expect(overlay, contains("window.dispatchEvent(new CustomEvent('castleJesterEnter'))"));
    expect(controller, contains("dataset.castleJesterState='looping'"));
    expect(controller, contains('onEnterRequested?.()'));
  });
}
