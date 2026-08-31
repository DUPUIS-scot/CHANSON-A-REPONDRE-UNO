import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('laboratory entry is bounded on iPhone and event-routed elsewhere', () {
    final bootstrap = File('web/flutter_bootstrap.js').readAsStringSync();
    final overlay = File('web/card_castle/castle_navigation_overlay.js').readAsStringSync();
    final resilience = File('web/card_castle/castle_ios_laboratory_resilience_v62.js').readAsStringSync();
    final eventBridge = File('web/card_castle/castle_laboratory_event_bridge_v69.js').readAsStringSync();
    final navigationCore = File('web/card_castle/castle_navigation_overlay_core.js').readAsStringSync();
    final castle = File('web/card_castle/card_castle.html').readAsStringSync();
    final sharedLoader = File('web/card_castle/castle_shared_transition_loader_v64.js').readAsStringSync();
    final bridge = File('web/card_castle/castle_bureau_video_bridge.js').readAsStringSync();
    final medallion = File('web/card_castle/castle_laboratory_medallion_button.js').readAsStringSync();
    final resetView = File('web/card_castle/castle_laboratory_entry_reset_v70.js').readAsStringSync();
    final uiPatch = File('web/card_castle/castle_bright_lab_ui_patch.js').readAsStringSync();

    expect(bootstrap, contains("const castleRuntimeRevision = '76';"));
    expect(bootstrap, contains("url.searchParams.set('v', buildId || castleRuntimeRevision)"));
    expect(bootstrap, contains('card_castle/card_castle_fast.html'));
    expect(bootstrap, contains('optimized = url.href'));

    final sharedImport = overlay.indexOf('castle_shared_transition_loader_v64.js?v=74');
    final resilienceImport = overlay.indexOf('castle_ios_laboratory_resilience_v62.js?v=66');
    final coreImport = overlay.indexOf('castle_navigation_overlay_core.js?v=74');
    final eventBridgeImport = overlay.indexOf('castle_laboratory_event_bridge_v69.js?v=69');
    expect(sharedImport, greaterThanOrEqualTo(0));
    expect(resilienceImport, greaterThan(sharedImport));
    expect(coreImport, greaterThan(resilienceImport));
    expect(eventBridgeImport, greaterThan(coreImport));

    expect(resilience, contains('FETCH_TIMEOUT_MS = 16000'));
    expect(resilience, contains('PARSE_TIMEOUT_MS = 14000'));
    expect(resilience, contains('new AbortController()'));
    expect(resilience, contains('loader.parseAsync(buffer,basePath)'));
    expect(resilience, contains('window.__castleOpenLaboratory=openLaboratory'));
    expect(resilience, contains("document.addEventListener('click',interceptClick,true)"));
    expect(resilience, contains("iosLaboratoryStage='retry-available-v62'"));
    expect(resilience, contains("window.__castleShowSceneLoader?.('LABORATORY LOADING')"));
    expect(resilience, contains('window.__castleSetSceneLoaderProgress?.(100)'));
    expect(resilience, contains('window.__castleHideSceneLoader?.()'));

    expect(eventBridge, contains("window.addEventListener('castle-open-laboratory'"));
    expect(eventBridge, contains("typeof window.__castleOpenLaboratory === 'function'"));
    expect(eventBridge, contains("document.getElementById('bureau-of-ai')"));
    expect(eventBridge, contains("button.dispatchEvent(new MouseEvent('click'"));
    expect(eventBridge, contains("laboratoryEntryOwner = 'core-event-bridge-v69'"));

    expect(sharedLoader, contains('castle_jester_loading_bar.png'));
    expect(sharedLoader, contains("show('INTERIOR LOADING')"));
    expect(sharedLoader, contains('scene-loader-fill'));
    expect(sharedLoader, contains('scene-loader-percent'));
    expect(sharedLoader, isNot(contains("runtime.switchToInterior()")));
    expect(sharedLoader, contains("interior-ready-awaiting-video-v72"));
    expect(sharedLoader, contains("laboratory-visible-v68"));
    expect(sharedLoader, contains("35000"));
    expect(sharedLoader, contains("interior-retry-v74"));

    expect(castle, contains('INTERIOR_LOAD_TIMEOUT_MS=26000'));
    expect(castle, contains("interior-load-slow-v75"));
    expect(castle, contains("delete document.body.dataset.interiorLoadSlow"));
    expect(castle, isNot(contains("setTimeout(()=>finishError(new Error('interior-load-timeout")));
    expect(castle, contains("state.interiorLoadPromise=null"));
    expect(castle, contains("dataset.interiorProgress"));

    expect(navigationCore, contains('LABORATORY_LOAD_TIMEOUT_MS = 26000'));
    expect(navigationCore, contains("laboratory-load-timeout-v74"));
    expect(navigationCore, contains("dataset.laboratoryProgress"));
    expect(navigationCore, contains('window.__castleOpenLaboratory ??= switchToLaboratory'));
    expect(navigationCore, contains('window.__castleRestoreInteriorFromLaboratory ??= restoreInterior'));
    expect(navigationCore, contains("castleNavigationControls = 'single-authority-v76'"));
    expect(navigationCore, contains("button.setAttribute('aria-hidden', 'true')"));
    expect(navigationCore, contains('restoreExterior();'));
    expect(resilience, contains("'#bureau-of-ai, #laboratory-medallion-button, #laboratory-back-interior'"));
    expect(resilience, isNot(contains("#return-exterior')){event.preventDefault")));
    expect(uiPatch, contains("window.__castleRestoreInteriorFromLaboratory?.()"));
    expect(uiPatch, contains("label.textContent='LABORATOIRE'"));
    expect(uiPatch, contains("bureau.style.display='none'"));

    expect(resetView, contains("laboratoryStartingView = 'reset-identical-v70'"));
    expect(resetView, contains("laboratory-entry-v70"));
    expect(resetView, contains("reset-button-v70"));

    expect(bridge, contains(r'const SCREEN_NAME = /^VideoScreen_(Left|Right)$/i'));
    expect(bridge, contains("bureauVideoContract = 'VideoScreen_Left|VideoScreen_Right'"));
    expect(bridge, contains("../assets/videos/0830(1).mp4"));
    expect(bridge, contains('window.__castleBureauVideoPrime = primeFromGesture'));
    expect(bridge, contains('raycaster.intersectObjects([...boundMeshes], false)'));
    expect(bridge, contains("bureauVideoInteraction = 'mirror-click-v80'"));
    expect(bridge, contains("attemptPlay('mirror-click')"));
    expect(bridge, contains("bureauVideoPlayback = 'playing-loop-v80'"));
    expect(bridge, contains("attemptPlay('laboratory-autoplay')"));
    expect(bridge, contains('video.autoplay = true'));
    expect(bridge, contains('texture.needsUpdate = true'));
    expect(bridge, contains('polygonOffset: true'));
    expect(bridge, contains("window.addEventListener('pointerup', onPointerUp, {passive: true, capture: true})"));
    expect(medallion, contains('window.__castleBureauVideoPrime?.()'));
    expect(overlay, contains("castle_bureau_video_bridge.js?v=80"));
    expect(overlay, isNot(contains('castle_bureau_video_refresh_v70.js')));
    expect(overlay, contains("castle_visual_regression_v55.js?v=70"));

    final mutedBeforeSource = bridge.indexOf('video.muted = true;');
    final sourceAssignment = bridge.indexOf('video.src = VIDEO_URL;');
    expect(mutedBeforeSource, greaterThanOrEqualTo(0));
    expect(sourceAssignment, greaterThan(mutedBeforeSource));
  });
}
