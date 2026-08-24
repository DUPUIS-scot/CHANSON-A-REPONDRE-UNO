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
    final jesterGatekeeper = File(
      'web/card_castle/castle_jester_gatekeeper.js',
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
    expect(fastLoader, contains('window.DRACOLoader=DRACOLoader'));
    expect(fastLoader, contains('window.__castleSharedDraco'));
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
    expect(fastLoader, contains('legacyCardTextureConcurrency'));
    expect(fastLoader, contains('const legacyLimit=0'));
    expect(fastLoader, isNot(contains('String(isAndroid?0:4)')));
    expect(fastLoader, contains('baseExteriorView'));
    expect(fastLoader, contains('iosExteriorView'));
    expect(fastLoader, contains('ios-portrait-balanced-v39'));
    expect(fastLoader, contains('directVersion'));
    expect(fastLoader, contains('directSuffix'));
    expect(fastLoader, contains('castle_environment_direct.js'));
    expect(fastLoader, contains('castle_ios_uno_preview_fix.js'));
    expect(fastLoader, contains('castle_cards_direct.js'));
    expect(fastLoader, contains('ios-draco-direct-v40'));
    expect(fastLoader, contains('android-draco-mobile-v41-staged-cards'));
    expect(fastLoader, contains('windows-draco-direct-v40'));
    expect(fastLoader, contains('jester-timeout'));
    expect(fastLoader, contains('jester-failed'));
    expect(fastLoader, contains('renderer-failed'));
    expect(fastLoader, contains('90000'));
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
    expect(directCards, contains('function postJesterStageReady()'));
    expect(
      directCards,
      contains("directCardsStage = 'waiting-for-environment-and-jester'"),
    );
    expect(directCards, contains("environment === 'ready'"));
    expect(directCards, contains("jester === 'ready'"));
    expect(directCards, contains("fallback === 'jester-timeout'"));
    expect(directCards, contains('const isAndroid = /Android/i'));
    expect(directCards, contains('isAndroid ? 2'));
    expect(directCards, contains('directCardTextureConcurrency'));
    expect(directCards, contains("sceneMode==='exterior'"));
    expect(
      directCards,
      contains("directCardPreviewMode = 'rampart-textures-v40-staged'"),
    );
    expect(directCards, isNot(contains('const xSamples = isIOS ?')));

    expect(jesterOverlay, contains('rotateExistingCardAnchorsWithCastle'));
    expect(jesterOverlay, contains('pivot=castleRoot.getWorldPosition'));
    expect(jesterOverlay, contains('worldPosition=mesh.getWorldPosition'));
    expect(
      jesterOverlay,
      contains('.sub(pivot).applyQuaternion(turn).add(pivot)'),
    );
    expect(jesterOverlay, contains('parent.worldToLocal(worldPosition)'));
    expect(
      jesterOverlay,
      contains('parentWorldQuaternion.invert().multiply(worldQuaternion)'),
    );
    expect(
      jesterOverlay,
      contains("castleAnchorAlignment='cards-follow-castle-pivot-270deg-v41'"),
    );
    expect(
      jesterOverlay,
      isNot(contains('mesh.position.applyAxisAngle(axis,angle)')),
    );

    expect(jesterGatekeeper, contains('const SharedDRACOLoader=window.DRACOLoader'));
    expect(jesterGatekeeper, contains("setDecoderConfig({type:isIOS?'js':'wasm'})"));
    expect(jesterGatekeeper, contains('setWorkerLimit(isMobile?1:2)'));
    expect(jesterGatekeeper, contains('www.gstatic.com/draco/versioned/decoders/1.5.7/'));
    expect(jesterGatekeeper, isNot(contains('unpkg.com')));
    expect(jesterGatekeeper, contains("castleJesterDraco=isIOS?'shared-js-worker-1'"));

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
