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
    final resetView = File('web/card_castle/castle_laboratory_entry_reset_v70.js').readAsStringSync();
    expect(bridge, contains("bureauVideoOwner = 'castle-bureau-video-bridge-v63'"));
    expect(bridge, contains(r'const SCREEN_NAME = /^VideoScreen_(Left|Right)$/i'));
    expect(bridge, contains('texture.needsUpdate = true'));
    expect(bridge, contains("bureauVideoPlayback = 'playing-loop-v63'"));
    expect(medallion, contains("host.addEventListener('pointerdown',primeVideo"));
    expect(medallion, contains("typeof window.__castleOpenLaboratory==='function'"));
    expect(medallion, contains('window.__castleOpenLaboratory()'));
    expect(regression, isNot(contains('new THREE.VideoTexture')));
    expect(visual, contains('window.__castleBureauVideoPlay?.()'));
    expect(overlay, contains("castle_shared_transition_loader_v64.js?v=68"));
    expect(overlay, contains("castle_ios_laboratory_resilience_v62.js?v=65"));
    expect(overlay, contains("castle_laboratory_medallion_button.js?v=66"));
    expect(overlay, contains("castle_bureau_video_bridge.js?v=70"));
    expect(overlay, contains("castle_laboratory_entry_reset_v70.js?v=70"));
    expect(resetView, contains("laboratoryStartingView = 'reset-identical-v70'"));
    expect(resetView, contains("#castle-reset"));
    expect(sharedLoader, contains('castle_jester_loading_bar.png'));
    expect(sharedLoader, contains('scene-loader-fill'));
    expect(sharedLoader, contains('scene-loader-percent'));
    expect(sharedLoader, contains('data-interior-ready'));
    expect(sharedLoader, contains('data-laboratory-ready'));
    expect(sharedLoader, contains('interior-visible-v68'));
    expect(sharedLoader, contains('laboratory-visible-v68'));
  });
}
