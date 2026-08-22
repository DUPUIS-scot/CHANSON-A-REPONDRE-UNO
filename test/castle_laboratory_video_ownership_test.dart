import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('laboratory video has one media and material owner', () {
    final bridge =
        File('web/card_castle/castle_bureau_video_bridge.js').readAsStringSync();
    final regression =
        File('web/card_castle/castle_regression_hotfix.js').readAsStringSync();
    final visual =
        File('web/card_castle/castle_visual_regression_v55.js').readAsStringSync();
    final overlay =
        File('web/card_castle/castle_navigation_overlay.js').readAsStringSync();

    expect(bridge, contains("bureauVideoOwner = 'castle-bureau-video-bridge-v60'"));
    expect(bridge, contains('window.__castleBureauVideoPrime = primeFromGesture'));
    expect(bridge, contains("target?.closest?.('#bureau-of-ai')"));
    expect(bridge, contains('document.body.appendChild(video)'));
    expect(bridge, contains("bureauVideoPlayback = 'playing-loop-v60'"));

    // Legacy/regression helpers must not create a second media element,
    // VideoTexture, or replace the same laboratory materials.
    expect(regression, isNot(contains('bureau_screen_loop.mp4')));
    expect(regression, isNot(contains('new THREE.VideoTexture')));
    expect(regression, isNot(contains('bindLaboratoryVideo')));
    expect(visual, contains('window.__castleBureauVideoPlay?.()'));
    expect(visual, isNot(contains("document.querySelectorAll('video')")));

    // Import query revisions are part of the fix: otherwise Pages can keep the
    // previous conflicting modules in browser cache after deployment.
    expect(overlay, contains("castle_bureau_video_bridge.js?v=60"));
    expect(overlay, contains("castle_regression_hotfix.js?v=60"));
    expect(overlay, contains("castle_visual_regression_v55.js?v=60"));
  });
}
