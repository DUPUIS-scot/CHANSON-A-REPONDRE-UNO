import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Search Castle fast loader keeps platform-specific staged loading', () {
    final bootstrap = File('web/flutter_bootstrap.js').readAsStringSync();
    final fastLoader = File(
      'web/card_castle/card_castle_fast.html',
    ).readAsStringSync();

    expect(bootstrap, contains("'card_castle/card_castle_fast.html'"));
    expect(bootstrap, contains('requestIdleCallback'));
    expect(bootstrap, contains('castle-interior-draco-bridge'));
    expect(bootstrap, contains('castle-jester-gatekeeper-bridge'));

    expect(fastLoader, contains('const isIOS='));
    expect(fastLoader, contains('const textureConcurrency=isIOS?1'));
    expect(fastLoader, contains('const xSamples=isIOS?8'));
    expect(fastLoader, contains('const ySamples=isIOS?4:7'));
    expect(fastLoader, contains('const zSamples=isIOS?5'));
    expect(fastLoader, contains('const interiorIdleTimeout=isIOS?14000:3500'));
    expect(fastLoader, contains('const interiorFallbackDelay=isIOS?9000:1600'));
    expect(fastLoader, contains('DRACOLoader'));
    expect(fastLoader, contains('setWorkerLimit("+(isIOS?1:2)+")'));
    expect(fastLoader, contains("requestIdleCallback(preloadInterior"));
    expect(fastLoader, contains("setInteriorStartingView()"));
    expect(fastLoader, contains("interiorStartingView='construction-panel-staircase-throne'"));
    expect(fastLoader, contains('castle_exterior_ground.jpg'));
    expect(fastLoader, contains('castle_exterior_atmosphere.jpg'));
    expect(fastLoader, contains("ios-draco-js-v22"));
    expect(fastLoader, contains("ios-uncompressed-fallback-v22"));
    expect(fastLoader, contains("searchParams.set('iosLegacy','1')"));
  });
}
