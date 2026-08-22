import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('castle jester gatekeeper is injected without replacing castle scene', () {
    final bootstrap = File('web/flutter_bootstrap.js').readAsStringSync();
    final overlay = File('web/card_castle/castle_jester_overlay.js').readAsStringSync();
    final controller = File('web/card_castle/castle_jester_gatekeeper.js').readAsStringSync();
    final visualRegression =
        File('web/card_castle/castle_visual_regression_v55.js').readAsStringSync();

    expect(bootstrap, contains('castle_jester_overlay.js'));
    expect(overlay, contains('castle_jester_rigged.glb'));
    expect(
      overlay,
      contains("castleEntranceTrigger='rigged-jester-single-click'"),
    );
    expect(overlay, contains("dataset.castleJesterGesture='single-click'"));
    expect(
      overlay,
      contains("window.dispatchEvent(new CustomEvent('castleJesterEnter'))"),
    );
    expect(controller, contains("dataset.castleJesterState='looping'"));
    expect(controller, contains('onEnterRequested?.()'));

    expect(
      overlay,
      contains("castleJesterRotationOwner='castle-jester-overlay-v70'"),
    );
    expect(overlay, contains("castle_jester_gatekeeper.js?v=60"));
    expect(overlay, contains("castleJesterFacing='camera-front-v70'"));
    expect(overlay, contains('Math.atan2(c.x-p.x,c.z-p.z)'));
    expect(overlay, isNot(contains('Math.atan2(c.x-p.x,c.z-p.z)+Math.PI')));
    expect(
      controller,
      isNot(contains('this.root.rotation.y=BASE_ROTATION+.42*present')),
    );
    expect(visualRegression, isNot(contains('jester.rotation.y')));
    expect(visualRegression, isNot(contains('faceExteriorJesterToCamera')));
  });
}
