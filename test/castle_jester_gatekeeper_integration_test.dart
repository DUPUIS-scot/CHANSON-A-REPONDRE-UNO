import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('castle jester gatekeeper is injected without replacing castle scene', () {
    final bootstrap = File('web/flutter_bootstrap.js').readAsStringSync();
    final overlay = File('web/card_castle/castle_jester_overlay.js').readAsStringSync();
    final controller = File('web/card_castle/castle_jester_gatekeeper.js').readAsStringSync();
    final fastLoader = File('web/card_castle/card_castle_fast.html').readAsStringSync();
    final interiorOrientation =
        File('web/card_castle/castle_interior_jester_orientation.js').readAsStringSync();
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
      contains("castleJesterRotationOwner='castle-jester-overlay-v71'"),
    );
    expect(overlay, contains("castle_jester_gatekeeper.js?v=60"));
    expect(overlay, contains("castleJesterFacing='camera-front-axis-offset-v71'"));
    expect(overlay, contains('const JESTER_AXIS_OFFSET=Math.PI*.5'));
    expect(
      overlay,
      contains('Math.atan2(c.x-p.x,c.z-p.z)+JESTER_AXIS_OFFSET'),
    );
    expect(overlay, contains('function findPortalAnchor(castleRoot)'));
    expect(overlay, contains("castleJesterPortalAnchor=anchor.label"));
    expect(
      controller,
      isNot(contains('this.root.rotation.y=BASE_ROTATION+.42*present')),
    );
    expect(visualRegression, isNot(contains('jester.rotation.y')));
    expect(visualRegression, isNot(contains('faceExteriorJesterToCamera')));

    expect(fastLoader, contains("interiorRoot.rotation.y=Math.PI*2.5;"));
    expect(fastLoader, isNot(contains('interiorRoot.rotation.y=Math.PI*3.5')));
    expect(fastLoader, contains('castle_interior_jester_orientation.js'));
    expect(interiorOrientation, contains("track?.name?.endsWith('.position')"));
    expect(interiorOrientation, contains("track?.name?.endsWith('.quaternion')"));
    expect(interiorOrientation, contains('q.multiply(correction).normalize()'));
    expect(interiorOrientation, isNot(contains("values[i + 2] =")));
  });
}
