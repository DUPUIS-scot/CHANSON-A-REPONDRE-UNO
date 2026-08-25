import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('laboratory entry is bounded on iPhone and event-routed elsewhere', () {
    final bootstrap = File('web/flutter_bootstrap.js').readAsStringSync();
    final overlay = File('web/card_castle/castle_navigation_overlay.js').readAsStringSync();
    final resilience = File('web/card_castle/castle_ios_laboratory_resilience_v62.js').readAsStringSync();
    final eventBridge = File('web/card_castle/castle_laboratory_event_bridge_v69.js').readAsStringSync();
    final navigationCore = File('web/card_castle/castle_navigation_overlay_core.js').readAsStringSync();
    final sharedLoader = File('web/card_castle/castle_shared_transition_loader_v64.js').readAsStringSync();
    final bridge = File('web/card_castle/castle_bureau_video_bridge.js').readAsStringSync();
    final medallion = File('web/card_castle/castle_laboratory_medallion_button.js').readAsStringSync();
    final resetView = File('web/card_castle/castle_laboratory_entry_reset_v70.js').readAsStringSync();

    expect(bootstrap, contains("const castleRuntimeRevision = '73';"));
    expect(bootstrap, contains("url.searchParams.set('v', buildId || castleRuntimeRevision)"));
    expect(bootstrap, contains('card_castle/card_castle_fast.html'));
    expect(bootstrap, contains('optimized = url.href'));

    final sharedImport = overlay.indexOf('castle_shared_transition_loader_v64.js?v=72');
    final resilienceImport = overlay.indexOf('castle_ios_laboratory_resilience_v62.js?v=65');
    final coreImport = overlay.indexOf('castle_navigation_overlay_core.js?v=72');
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

    expect(navigationCore, contains('window.__castleOpenLaboratory ??= switchToLaboratory'));
    expect(navigationCore, contains('window.__castleRestoreInteriorFromLaboratory ??= restoreInterior'));

    expect(resetView, contains("laboratoryStartingView = 'reset-identical-v70'"));
    expect(resetView, contains("laboratory-entry-v70"));
    expect(resetView, contains("reset-button-v70"));

    expect(bridge, contains(r'const SCREEN_NAME = /^VideoScreen_(Left|Right)$/i'));
    expect(bridge, contains('window.__castleBureauVideoPrime = primeFromGesture'));
    expect(bridge, contains('PRIME_WINDOW_MS = 60000'));
    expect(bridge, contains('keepPrimedDuringEntry()'));
    expect(bridge, contains('texture.needsUpdate = true'));
    expect(bridge, contains("bureauVideoPlayback = 'playing-loop-v72'"));
    expect(medallion, contains('window.__castleBureauVideoPrime?.()'));
    expect(overlay, contains("castle_bureau_video_bridge.js?v=74"));
    expect(overlay, isNot(contains('castle_bureau_video_refresh_v70.js')));
    expect(overlay, contains("castle_visual_regression_v55.js?v=70"));

    final mutedBeforeSrc = bridge.indexOf('video.muted = true;');
    final srcAssignment = bridge.indexOf('video.src = VIDEO_URL;');
    expect(mutedBeforeSrc, greaterThanOrEqualTo(0));
    expect(srcAssignment, greaterThan(mutedBeforeSrc));
  });
}
