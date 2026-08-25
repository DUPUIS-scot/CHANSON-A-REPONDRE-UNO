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
    expect(bootstrap, contains("castleRuntimeRevision = '74'"));
    expect(overlay, contains('castle_jester_rigged.glb'));
    expect(
      overlay,
      contains("castleEntranceTrigger='rigged-jester-single-click'"),
    );
    expect(overlay, contains("castleJesterGesture='single-click-full-rig-v72'"));
    expect(
      overlay,
      contains("window.dispatchEvent(new CustomEvent('castleJesterEnter'))"),
    );
    expect(controller, contains("dataset.castleJesterState='looping'"));
    expect(controller, contains('onEnterRequested?.()'));

    expect(
      overlay,
      contains("castleJesterRotationOwner='castle-front-gate-v72'"),
    );
    expect(overlay, contains("castle_jester_gatekeeper.js?v=61"));
    expect(overlay, contains("castleJesterFacing='front-gate-outward-fixed-v72'"));
    expect(overlay, contains('const JESTER_MODEL_FORWARD_OFFSET=Math.PI*.5'));
    expect(
      overlay,
      contains('Math.atan2(outward.x,outward.z)+JESTER_MODEL_FORWARD_OFFSET'),
    );
    expect(overlay, isNot(contains('function faceCamera()')));
    expect(overlay, contains('function findPortalAnchor(castleRoot)'));
    expect(overlay, contains("castleJesterPortalAnchor=anchor.label"));
    expect(overlay, contains("castleJesterPlacement='named-portal-back-to-gate-v72'"));
    expect(controller, contains("this.hitProxy.name='castle-jester-full-rig-hit-proxy'"));
    expect(controller, contains("castleJesterHitArea='full-rig-bounds-v61'"));
    expect(controller, contains('intersectObject(this.root,true)'));
    expect(controller, contains('click(event,knownHit=false)'));
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
    expect(interiorOrientation, contains('horizontalTravel(track) < MIN_ROOT_MOTION'));
    expect(interiorOrientation, contains("track?.name?.endsWith('.quaternion')"));
    expect(interiorOrientation, contains('q.multiply(correction).normalize()'));
    expect(interiorOrientation, contains("interiorJesterOrientation = 'root-motion-yaw-180-v71'"));
  });
}
