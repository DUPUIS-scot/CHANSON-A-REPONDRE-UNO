import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('laboratory video has one owner and all entry gestures are primed', () {
    final bridge = File('web/card_castle/castle_bureau_video_bridge.js').readAsStringSync();
    final medallion = File('web/card_castle/castle_laboratory_medallion_button.js').readAsStringSync();
    final regression = File('web/card_castle/castle_regression_hotfix.js').readAsStringSync();
    final visual = File('web/card_castle/castle_visual_regression_v55.js').readAsStringSync();
    final overlay = File('web/card_castle/castle_navigation_overlay.js').readAsStringSync();

    expect(bridge, contains("bureauVideoOwner='castle-bureau-video-bridge-v61'"));
    expect(bridge, contains('window.__castleBureauVideoPrime=primeFromGesture'));
    expect(bridge, contains("#bureau-of-ai, #laboratory-medallion-button"));
    expect(bridge, contains('document.body.appendChild(video)'));
    expect(bridge, contains("bureauVideoPlayback='playing-loop-v61'"));
    expect(medallion, contains("host.addEventListener('pointerdown',primeVideo"));
    expect(medallion, contains('window.__castleBureauVideoPrime?.()'));
    expect(medallion, contains("bureauVideoGestureSource='laboratory-medallion-v61'"));

    expect(regression, isNot(contains('bureau_screen_loop.mp4')));
    expect(regression, isNot(contains('new THREE.VideoTexture')));
    expect(regression, isNot(contains('bindLaboratoryVideo')));
    expect(visual, contains('window.__castleBureauVideoPlay?.()'));
    expect(visual, isNot(contains("document.querySelectorAll('video')")));

    expect(overlay, contains("castle_laboratory_medallion_button.js?v=61"));
    expect(overlay, contains("castle_bureau_video_bridge.js?v=61"));
  });
}
