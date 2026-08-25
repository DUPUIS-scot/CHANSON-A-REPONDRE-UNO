import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  // Keep the cache-busted video bridge and laboratory-facing orientation module paired.
  test('laboratory video has one owner and starts only from mirror click', () {
    final bridge = File('web/card_castle/castle_bureau_video_bridge.js').readAsStringSync();
    final medallion = File('web/card_castle/castle_laboratory_medallion_button.js').readAsStringSync();
    final regression = File('web/card_castle/castle_regression_hotfix.js').readAsStringSync();
    final visual = File('web/card_castle/castle_visual_regression_v55.js').readAsStringSync();
    final overlay = File('web/card_castle/castle_navigation_overlay.js').readAsStringSync();
    final videoOrientation = File('web/card_castle/castle_video_surface_invert_v71.js').readAsStringSync();
    final sharedLoader = File('web/card_castle/castle_shared_transition_loader_v64.js').readAsStringSync();
    final resetView = File('web/card_castle/castle_laboratory_entry_reset_v70.js').readAsStringSync();

    expect(bridge, contains("bureauVideoOwner = 'castle-bureau-video-bridge-v73'"));
    expect(bridge, contains(r'const SCREEN_NAME = /^VideoScreen_(Left|Right)$/i'));
    expect(bridge, contains('window.__castleBureauVideoPrime = primeFromGesture'));
    expect(bridge, contains('raycaster.intersectObjects([...boundMeshes], false)'));
    expect(bridge, contains("bureauVideoInteraction = 'mirror-click-v73'"));
    expect(bridge, contains("attemptPlay('mirror-click')"));
    expect(bridge, contains("bureauVideoPlayback = 'paused-awaiting-mirror-click-v73'"));
    expect(bridge, contains("bureauVideoPlayback = 'playing-loop-v73'"));
    expect(bridge, contains('video.autoplay = false'));
    expect(bridge, contains('const CLICK_SLOP_TOUCH_PX = 18'));
    expect(bridge, contains('const HIT_TOLERANCE_PX = 10'));
    expect(bridge, contains('!mirrorHit(event.clientX, event.clientY) && !mirrorHit(down.x, down.y)'));
    expect(bridge, isNot(contains("window.addEventListener('click', gestureResume")));
    expect(bridge, contains('texture.needsUpdate = true'));
    expect(medallion, contains("host.addEventListener('pointerdown',primeVideo"));
    expect(medallion, contains('window.__castleBureauVideoPrime?.()'));
    expect(medallion, contains("typeof window.__castleOpenLaboratory==='function'"));
    expect(medallion, contains('window.__castleOpenLaboratory()'));
    expect(regression, isNot(contains('new THREE.VideoTexture')));
    expect(visual, contains('window.__castleBureauVideoPlay?.()'));
    expect(overlay, contains("castle_shared_transition_loader_v64.js?v=73"));
    expect(overlay, contains("castle_ios_laboratory_resilience_v62.js?v=65"));
    expect(overlay, contains("castle_laboratory_medallion_button.js?v=66"));
    expect(overlay, contains("castle_bureau_video_bridge.js?v=76"));
    expect(overlay, contains("castle_video_surface_invert_v71.js?v=74"));
    expect(videoOrientation, contains("bureauVideoSurfaceOrientation = 'laboratory-facing'"));
    expect(videoOrientation, contains('object.rotation.y -= Math.PI'));
    expect(overlay, isNot(contains('castle_bureau_video_refresh_v70.js')));
    expect(overlay, contains("castle_laboratory_entry_reset_v70.js?v=70"));
    expect(resetView, contains("laboratoryStartingView = 'reset-identical-v70'"));
    expect(resetView, contains("#castle-reset"));
    expect(sharedLoader, contains('castle_jester_loading_bar.png'));
    expect(sharedLoader, contains('scene-loader-fill'));
    expect(sharedLoader, contains('scene-loader-percent'));
    expect(sharedLoader, contains("root.style.pointerEvents='none'"));
    expect(sharedLoader, contains("root.style.pointerEvents='auto'"));
    expect(sharedLoader, contains('data-interior-ready'));
    expect(sharedLoader, contains('data-laboratory-ready'));
    expect(sharedLoader, contains('interior-visible-v68'));
    expect(sharedLoader, contains('laboratory-visible-v68'));
  });
}
