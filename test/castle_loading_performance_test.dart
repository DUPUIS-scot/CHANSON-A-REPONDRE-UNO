import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Search Castle fast loader uses exterior-first staged loading', () {
    final bootstrap = File('web/flutter_bootstrap.js').readAsStringSync();
    final fastLoader = File(
      'web/card_castle/card_castle_fast.html',
    ).readAsStringSync();
    expect(bootstrap, contains("'card_castle/card_castle_fast.html'"));
    expect(bootstrap, contains('requestIdleCallback'));
    expect(bootstrap, contains("bootstrapPerformanceMode = 'exterior-first'"));
    expect(bootstrap, isNot(contains('castle-interior-draco-bridge')));
    expect(bootstrap, contains('castle-jester-gatekeeper-bridge'));
    expect(bootstrap, contains("body?.dataset.rendererStatus === 'ready'"));
    expect(bootstrap, isNot(contains('setTimeout(injectEssentials, 2400)')));

    expect(fastLoader, contains('const isIOS='));
    expect(fastLoader, contains('const textureConcurrency=isIOS?1'));
    expect(fastLoader, contains('const xSamples=isIOS?8'));
    expect(fastLoader, contains('const ySamples=isIOS?4:7'));
    expect(fastLoader, contains('const zSamples=isIOS?5'));
    expect(fastLoader, contains('DRACOLoader'));
    expect(fastLoader, contains('setWorkerLimit("+(isIOS?1:2)+")'));
    expect(fastLoader, contains('isIOS?1.1:1.35'));
    expect(fastLoader, contains("atmosphere.highQuality=false"));
    expect(fastLoader, contains("deferred-until-entrance"));
    expect(fastLoader, isNot(contains('preloadInterior')));
    expect(fastLoader, contains('loadDeferredEnvironment'));
    expect(fastLoader, contains("requestIdleCallback(deferExterior"));
    expect(fastLoader, contains("setInteriorStartingView()"));
    expect(
      fastLoader,
      contains("interiorStartingView='construction-panel-staircase-throne'"),
    );
    expect(fastLoader, contains('castle_exterior_ground.png'));
    expect(fastLoader, contains('castle_exterior_atmosphere.png'));
    expect(fastLoader, contains("ios-draco-exterior-first-v26"));
    expect(fastLoader, contains("ios-draco-exterior-first-retry-v26"));
    expect(fastLoader, contains('window.__castleLoadState'));
    expect(fastLoader, contains('castleLoadProgress'));
    expect(fastLoader, contains('window.__castleReloadForLoadFailure'));
    expect(
      fastLoader,
      contains("stallLimit=loadState.phase==='decode'?180000:60000"),
    );
    expect(fastLoader, isNot(contains('25000')));
    expect(fastLoader, contains("searchParams.set('iosRetry','1')"));
    expect(fastLoader, isNot(contains('search_castle.glb')));
  });
}
