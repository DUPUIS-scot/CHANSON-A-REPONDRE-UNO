import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('iOS castle journey preloads and uses one spatial laboratory authority', () {
    final bootstrap = File('web/flutter_bootstrap.js').readAsStringSync();
    final fastLoader = File('web/card_castle/card_castle_fast.html').readAsStringSync();
    final overlay = File('web/card_castle/castle_navigation_overlay.js').readAsStringSync();
    final resilience = File('web/card_castle/castle_ios_laboratory_resilience_v62.js').readAsStringSync();
    final journey = File('web/card_castle/castle_journey_stability_v79.js').readAsStringSync();
    final eventBridge = File('web/card_castle/castle_laboratory_event_bridge_v69.js').readAsStringSync();
    final navigationCore = File('web/card_castle/castle_navigation_overlay_core.js').readAsStringSync();
    final sharedLoader = File('web/card_castle/castle_shared_transition_loader_v64.js').readAsStringSync();
    final bridge = File('web/card_castle/castle_bureau_video_bridge.js').readAsStringSync();
    final medallion = File('web/card_castle/castle_laboratory_medallion_button.js').readAsStringSync();
    final uiPatch = File('web/card_castle/castle_bright_lab_ui_patch.js').readAsStringSync();

    expect(bootstrap, contains("const castleRuntimeRevision = '80';"));
    expect(bootstrap, contains("url.searchParams.set('v', buildId || castleRuntimeRevision)"));
    expect(bootstrap, contains('card_castle/card_castle_fast.html'));

    expect(fastLoader, contains("ios-staged-idle-v80"));
    expect(fastLoader, contains("ios-preloading-v80"));
    expect(fastLoader, contains('window.__castlePreloadInterior'));
    expect(fastLoader, contains("castleInteriorPreloaded"));
    expect(fastLoader, contains("requestIdleCallback"));
    expect(fastLoader, contains("iosCastleStaging=\"interior-idle-v80\""));
    expect(fastLoader, contains("document.body.dataset.exteriorEnvironment===\"ready\""));

    expect(overlay, contains('castle_ios_laboratory_resilience_v62.js?v=80'));
    expect(overlay, contains('castle_journey_stability_v79.js?v=80'));

    expect(resilience, contains('FETCH_TIMEOUT_MS = 16000'));
    expect(resilience, contains('PARSE_TIMEOUT_MS = 14000'));
    expect(resilience, contains('laboratory_interior_book_videos.glb'));
    expect(resilience, contains('window.__castlePlatformStabilityV54Installed = true'));
    expect(resilience, contains("iosLaboratoryOwner='ios-resilience-v80'"));
    expect(resilience, contains("window.addEventListener('castleInteriorPreloaded',scheduleWarmup)"));
    expect(resilience, contains("attributeFilter:['data-scene-mode','data-interior-ready']"));
    expect(resilience, contains("document.body.dataset.interiorReady==='true'"));
    expect(resilience, contains('new AbortController()'));
    expect(resilience, contains('loader.parseAsync(buffer,basePath)'));
    expect(resilience, contains('window.__castleOpenLaboratory=openLaboratory'));
    expect(resilience, contains("iosLaboratoryStage='retry-available-v80'"));
    expect(resilience, contains("window.__castleShowSceneLoader?.('LABORATORY LOADING')"));
    expect(resilience, contains('window.__castleSetSceneLoaderProgress?.(100)'));
    expect(resilience, contains('window.__castleHideSceneLoader?.()'));

    expect(journey, contains('deterministic journey authority v80'));
    expect(journey, contains('const TAP_SLOP_PX=5'));
    expect(journey, contains('raycaster.intersectObject(runtime.interiorRoot,true)'));
    expect(journey, contains("window.__castleOpenLaboratory==='function'"));
    expect(journey, contains("castleIOSPassageAuthority='journey-v80-single-spatial'"));
    expect(journey, contains("enter('ios-spatial-hit')"));

    expect(eventBridge, contains("window.addEventListener('castle-open-laboratory'"));
    expect(navigationCore, contains('LABORATORY_LOAD_TIMEOUT_MS = 26000'));
    expect(navigationCore, contains("castleNavigationControls = 'single-authority-v76'"));
    expect(sharedLoader, contains("show('INTERIOR LOADING')"));
    expect(sharedLoader, contains('scene-loader-fill'));
    expect(uiPatch, contains("window.__castleRestoreInteriorFromLaboratory?.()"));

    expect(bridge, contains(r'const BOOK_NAME = /^VideoBookPage_(Left|Right)$/i'));
    expect(bridge, contains(r'const MIRROR_NAME = /^VideoScreen_(Left|Right)$/i'));
    expect(bridge, contains('../assets/assets/videos/bureau_screen_loop.mp4'));
    expect(bridge, contains('../assets/assets/videos/0830(1).mp4'));
    expect(bridge, contains('window.__castleBureauVideoPrime'));
    expect(medallion, contains('window.__castleBureauVideoPrime?.()'));
  });
}
