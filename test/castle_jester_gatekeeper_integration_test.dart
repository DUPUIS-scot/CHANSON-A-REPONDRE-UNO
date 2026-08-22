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
      contains("castleEntranceTrigger = 'rigged-jester-single-click'"),
    );
    expect(overlay, contains("dataset.castleJesterGesture = 'single-click'"));
    expect(
      overlay,
      contains("window.dispatchEvent(new CustomEvent('castleJesterEnter'))"),
    );
    expect(controller, contains("dataset.castleJesterState='looping'"));
    expect(controller, contains('onEnterRequested?.()'));

    // Exterior idle Y rotation has exactly one runtime owner. The controller
    // may rotate only during the intentional click/step-aside transition.
    expect(
      overlay,
      contains("castleJesterRotationOwner = 'castle-jester-overlay-v60'"),
    );
    expect(overlay, contains('gatekeeper.root.rotation.y ='));
    expect(
      controller,
      isNot(contains('this.root.rotation.y=BASE_ROTATION+.42*present')),
    );
    expect(visualRegression, isNot(contains('jester.rotation.y')));
    expect(visualRegression, isNot(contains('faceExteriorJesterToCamera')));
  });
}
