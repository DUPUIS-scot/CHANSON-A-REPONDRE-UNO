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
    final directCards = File(
      'web/card_castle/castle_cards_direct.js',
    ).readAsStringSync();
    final jesterOverlay = File(
      'web/card_castle/castle_jester_overlay.js',
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
    expect(fastLoader, contains('const isAndroid=/Android/i'));
    expect(fastLoader, contains('const isMobile=isIOS||isAndroid'));
    expect(fastLoader, contains('const isWindows='));
    expect(fastLoader, contains('DRACOLoader'));
    expect(fastLoader, contains('dracoLoader.setWorkerLimit'));
    expect(fastLoader, contains('isMobile?1:2'));
    expect(fastLoader, contains('pixelRatioCap=isIOS?1.1:1.15'));
    expect(fastLoader, contains("atmosphere.highQuality=false"));
    expect(fastLoader, contains("windows-deferred-after-jester"));
    expect(fastLoader, contains("deferred-until-entrance"));
    expect(fastLoader, contains('window.__castlePreloadInterior'));
    expect(fastLoader, contains('inlineJesterScript'));
    expect(
      fastLoader,
      contains("source=source.replace(inlineJesterScript,'')"),
    );
    expect(fastLoader, contains('baseExteriorView'));
    expect(fastLoader, contains('iosExteriorView'));
    expect(fastLoader, contains('ios-portrait-balanced-v39'));
    expect(fastLoader, contains('directVersion'));
    expect(fastLoader, contains('directSuffix'));
    expect(fastLoader, contains('castle_environment_direct.js'));
    expect(fastLoader, contains('castle_ios_uno_preview_fix.js'));
    expect(fastLoader, contains('castle_cards_direct.js'));
    expect(fastLoader, contains('ios-draco-direct-v39'));
    expect(fastLoader, contains('android-draco-mobile-v39'));
    expect(fastLoader, contains('windows-draco-direct-v39'));
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

    expect(directCards, contains('const xSamples = 18;'));
    expect(directCards, contains('const ySamples = 7;'));
    expect(directCards, contains('const zSamples = 11;'));
    expect(
      directCards,
      contains("surfaceAnchorMode = 'direct-raycast-desktop-density-v39'"),
    );
    expect(directCards, contains('const concurrency = isIOS ? 1'));
    expect(directCards, isNot(contains('const xSamples = isIOS ?')));

    expect(jesterOverlay, contains('rotateExistingCardAnchorsWithCastle'));
    expect(jesterOverlay, contains('mesh.position.applyAxisAngle(axis,angle)'));
    expect(jesterOverlay, contains('mesh.quaternion.premultiply(turn)'));
    expect(
      jesterOverlay,
      contains("castleAnchorAlignment='cards-follow-castle-270deg-v40'"),
    );

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
