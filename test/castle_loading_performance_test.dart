import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Search Castle fast loader uses exterior-first staged loading', () {
    final bootstrap = File('web/flutter_bootstrap.js').readAsStringSync();
    final fastLoader = File(
      'web/card_castle/card_castle_fast.html',
    ).readAsStringSync();
    final environment = File(
      'web/card_castle/castle_environment_direct.js',
    ).readAsStringSync();
    final previewFix = File(
      'web/card_castle/castle_ios_uno_preview_fix.js',
    ).readAsStringSync();
    final navigation = File(
      'web/card_castle/castle_navigation_overlay.js',
    ).readAsStringSync();

    expect(bootstrap, contains("'card_castle/card_castle_fast.html'"));
    expect(bootstrap, contains('requestIdleCallback'));
    expect(bootstrap, contains("bootstrapPerformanceMode = 'exterior-first'"));
    expect(bootstrap, isNot(contains('castle-interior-draco-bridge')));
    expect(bootstrap, contains('castle-navigation-bridge'));
    expect(bootstrap, contains('castle_navigation_overlay.js'));
    expect(bootstrap, contains('castle-jester-gatekeeper-bridge'));
    expect(bootstrap, contains("body?.dataset.rendererStatus === 'ready'"));
    expect(bootstrap, isNot(contains('setTimeout(injectEssentials, 2400)')));

    expect(fastLoader, contains('const isIOS='));
    expect(fastLoader, contains('const isWindows='));
    expect(fastLoader, contains('DRACOLoader'));
    expect(fastLoader, contains('setWorkerLimit("+(isIOS?1:2)+")'));
    expect(fastLoader, contains("devicePixelRatio||1,1.1"));
    expect(fastLoader, contains("atmosphere.highQuality=false"));
    expect(fastLoader, contains("windows-deferred-after-jester"));
    expect(fastLoader, contains("deferred-until-entrance"));
    expect(fastLoader, contains('window.__castlePreloadInterior'));
    expect(fastLoader, contains('inlineJesterScript'));
    expect(
      fastLoader,
      contains("source=source.replace(inlineJesterScript,'')"),
    );
    expect(fastLoader, contains('directVersion'));
    expect(fastLoader, contains('directSuffix'));
    expect(fastLoader, contains('castle_environment_direct.js'));
    expect(fastLoader, contains('castle_ios_uno_preview_fix.js'));
    expect(fastLoader, contains('castle_cards_direct.js'));
    expect(fastLoader, contains('ios-draco-direct-v37'));
    expect(fastLoader, contains('windows-draco-direct-v37'));
    expect(fastLoader, isNot(contains('search_castle.glb')));

    expect(environment, contains('castle_exterior_ground.png'));
    expect(environment, contains('castle_exterior_atmosphere.png'));
    expect(environment, contains("type || '') !== 'SphereGeometry'"));
    expect(environment, contains("exteriorEnvironment = 'ready'"));

    expect(previewFix, contains('__castleUnoPreviewFixInstalled'));
    expect(previewFix, contains('__castleUnoPreviewPathFixed'));
    expect(
      previewFix,
      contains('/assets/share-previews/\$1\$2'),
    );
    expect(previewFix, isNot(contains('if (!isIOS')));

    expect(navigation, contains("addEventListener('pointerdown'"));
    expect(navigation, contains("addEventListener('pointermove'"));
    expect(navigation, contains("addEventListener('wheel'"));
    expect(navigation, contains("addEventListener('keydown'"));
    expect(navigation, contains("pinch-pan-zoom"));
    expect(navigation, contains("orbit-pan-zoom-wasd-v27"));
    expect(navigation, contains("return-exterior"));
    expect(navigation, contains("sceneMode() === 'interior'"));
    expect(navigation, isNot(contains('DRACOLoader')));
    expect(navigation, isNot(contains('.glb')));
  });
}
