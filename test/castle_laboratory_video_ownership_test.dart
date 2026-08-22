import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('laboratory video has one owner and Safari-safe playback', () {
    final bridge = File('web/card_castle/castle_bureau_video_bridge.js').readAsStringSync();
    final medallion = File('web/card_castle/castle_laboratory_medallion_button.js').readAsStringSync();
    final regression = File('web/card_castle/castle_regression_hotfix.js').readAsStringSync();
    final visual = File('web/card_castle/castle_visual_regression_v55.js').readAsStringSync();
    final overlay = File('web/card_castle/castle_navigation_overlay.js').readAsStringSync();
    final sharedLoader = File('web/card_castle/castle_shared_transition_loader_v64.js').readAsStringSync();
    expect(bridge, contains("bureauVideoOwner = 'castle-bureau-video-bridge-v62'"));
    expect(bridge, contains('window.__castleBureauVideoPrime = primeFromGesture'));
    expect(bridge, contains('VideoScreen_(Left|Right)'));
    expect(bridge, contains('texture.needsUpdate = true'));
    expect(medallion, contains("host.addEventListener('pointerdown',primeVideo"));
    expect(medallion, contains("typeof window.__castleOpenLaboratory==='function'"));
    expect(medallion, contains('window.__castleOpenLaboratory()'));
    expect(regression, isNot(contains('new THREE.VideoTexture')));
    expect(visual, contains('window.__castleBureauVideoPlay?.()'));
    expect(overlay, contains("castle_shared_transition_loader_v64.js?v=65"));
    expect(overlay, contains("castle_ios_laboratory_resilience_v62.js?v=65"));
    expect(overlay, contains("castle_laboratory_medallion_button.js?v=66"));
    expect(overlay, contains("castle_bureau_video_bridge.js?v=62"));
    expect(sharedLoader, contains('castle_jester_loading_bar.png'));
    expect(sharedLoader, contains('scene-loader-fill'));
    expect(sharedLoader, contains('scene-loader-percent'));
  });
}
