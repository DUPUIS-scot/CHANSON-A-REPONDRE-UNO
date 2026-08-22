import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('iPhone laboratory loading is bounded and owns entry before core', () {
    final bootstrap = File('web/flutter_bootstrap.js').readAsStringSync();
    final overlay = File('web/card_castle/castle_navigation_overlay.js').readAsStringSync();
    final resilience = File('web/card_castle/castle_ios_laboratory_resilience_v62.js').readAsStringSync();
    final sharedLoader = File('web/card_castle/castle_shared_transition_loader_v64.js').readAsStringSync();
    final bridge = File('web/card_castle/castle_bureau_video_bridge.js').readAsStringSync();

    expect(bootstrap, contains("const castleRuntimeRevision = '62';"));
    expect(bootstrap, contains("url.searchParams.set('v', buildId || castleRuntimeRevision)"));
    expect(bootstrap, contains('card_castle/card_castle_fast.html'));
    expect(bootstrap, contains('optimized = url.href'));

    final sharedImport = overlay.indexOf('castle_shared_transition_loader_v64.js?v=64');
    final resilienceImport = overlay.indexOf('castle_ios_laboratory_resilience_v62.js?v=64');
    final coreImport = overlay.indexOf('castle_navigation_overlay_core.js?v=62');
    expect(sharedImport, greaterThanOrEqualTo(0));
    expect(resilienceImport, greaterThan(sharedImport));
    expect(coreImport, greaterThan(resilienceImport));

    expect(resilience, contains('FETCH_TIMEOUT_MS = 16000'));
    expect(resilience, contains('PARSE_TIMEOUT_MS = 14000'));
    expect(resilience, contains('new AbortController()'));
    expect(resilience, contains('loader.parseAsync(buffer, basePath)'));
    expect(resilience, contains('window.__castleOpenLaboratory = openLaboratory'));
    expect(resilience, contains("document.addEventListener('click', interceptClick, true)"));
    expect(resilience, contains("window.addEventListener('keydown', interceptEscape, true)"));
    expect(resilience, contains("iosLaboratoryStage = 'retry-available-v62'"));

    expect(sharedLoader, contains('castle_jester_loading_bar.png'));
    expect(sharedLoader, contains("show('INTERIOR LOADING')"));
    expect(sharedLoader, contains("show('LABORATORY LOADING')"));
    expect(sharedLoader, contains("window.addEventListener('castleJesterEnter'"));
    expect(sharedLoader, contains("window.addEventListener('castle-open-laboratory'"));

    expect(bridge, contains(r'EXACT_SCREEN_NAME = /^VideoScreen_(Left|Right)$/i'));
    expect(bridge, contains('interior-trusted-gesture-v62'));
    expect(bridge, contains('texture.needsUpdate = true'));
    expect(bridge, contains("bureauVideoPlayback = 'playing-loop-v62'"));

    final mutedBeforeSrc = bridge.indexOf('video.muted = true;');
    final srcAssignment = bridge.indexOf('video.src = VIDEO_URL;');
    expect(mutedBeforeSrc, greaterThanOrEqualTo(0));
    expect(srcAssignment, greaterThan(mutedBeforeSrc));
  });
}
