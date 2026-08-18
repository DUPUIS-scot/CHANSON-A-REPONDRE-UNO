import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Search Castle uses staged performance loader without changing main renderer', () {
    final bootstrap = File('web/flutter_bootstrap.js').readAsStringSync();
    final fastLoader = File(
      'web/card_castle/card_castle_fast.html',
    ).readAsStringSync();
    final manifest = File(
      'web/card_castle/castle_asset_manifest.json',
    ).readAsStringSync();

    expect(
      bootstrap,
      contains("'card_castle/card_castle_fast.html'"),
    );
    expect(bootstrap, contains('requestIdleCallback'));
    expect(bootstrap, contains('castle-interior-draco-bridge'));
    expect(bootstrap, contains('castle-jester-gatekeeper-bridge'));

    expect(fastLoader, contains("document.body.dataset.interiorReady='deferred'"));
    expect(fastLoader, contains('ensureInteriorPreload()'));
    expect(fastLoader, contains('restoreCachedAnchors()'));
    expect(fastLoader, contains('persistCachedAnchors(state.surfaceAnchors)'));
    expect(fastLoader, contains('state.loadQueue.sort((a,b)=>a.priority-b.priority)'));
    expect(fastLoader, contains('state.frame<120?3:6'));
    expect(fastLoader, contains('buildDeferredAtmosphere'));
    expect(fastLoader, contains('buildDeferredArchitecturalLights'));
    expect(fastLoader, contains('renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.25))'));
    expect(fastLoader, contains('renderer.shadowMap.enabled=false'));
    expect(fastLoader, contains('enableEnhancedQuality'));

    expect(manifest, contains('search_castle_shell.glb'));
    expect(manifest, contains('search_castle_details.glb'));
    expect(manifest, contains('ktx2-basisu'));
    expect(manifest, contains('meshopt'));
  });
}
