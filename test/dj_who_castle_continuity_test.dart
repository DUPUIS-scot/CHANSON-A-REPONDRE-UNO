import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('DJ WHO pauses for Castle load and resumes after loader completion', () {
    final provider = File(
      'lib/providers/dj_who_player_provider.dart',
    ).readAsStringSync();
    final persistentPlayer = File(
      'lib/widgets/persistent_dj_who_player.dart',
    ).readAsStringSync();
    final castleView = File(
      'lib/widgets/webgl_card_castle_view_web.dart',
    ).readAsStringSync();
    final castleLoader = File(
      'web/card_castle/card_castle_fast.html',
    ).readAsStringSync();
    final environment = File(
      'web/card_castle/castle_environment_direct.js',
    ).readAsStringSync();

    expect(provider, contains('suspendForCastleLoad'));
    expect(provider, contains('await controller.pauseVideo()'));
    expect(provider, contains('resumeAfterCastleLoad'));
    expect(provider, contains('await controller.playVideo()'));
    expect(provider, contains('controller.cueVideoById'));
    expect(provider, contains('playsInline: true'));
    expect(provider, contains('_isIosWeb'));
    expect(provider, contains('_iosCastleResumePending'));
    expect(provider, contains('_iosResumeRequiresGesture'));
    expect(provider, contains('Duration(milliseconds: 2200)'));
    expect(provider, contains('_markIosResumeRequiresGesture'));
    expect(provider, isNot(contains('ensureCastlePlaybackContinuity')));

    expect(persistentPlayer, contains('hiddenPlayerWidth'));
    expect(persistentPlayer, contains('iosWeb ? 356.0 : 160.0'));
    expect(persistentPlayer, contains('iosWeb ? 200.0 : 90.0'));
    expect(persistentPlayer, contains('keepAlive: true'));
    expect(persistentPlayer, contains('CASTLE LOADING · DJ WHO PAUSED'));
    expect(persistentPlayer, contains('CASTLE LOADING · AUTO-RESUME OFF'));
    expect(persistentPlayer, contains('RESUMING DJ WHO…'));
    expect(persistentPlayer, contains('TAP TO RESUME DJ WHO'));
    expect(persistentPlayer, contains('Resume DJ WHO on iOS'));

    expect(castleView, contains('player.suspendForCastleLoad()'));
    expect(castleView, contains("case 'castleLoadingComplete':"));
    expect(castleView, contains('player.resumeAfterCastleLoad()'));
    expect(castleView, isNot(contains('Timer.periodic')));
    expect(castleView, isNot(contains('ensureCastlePlaybackContinuity')));

    expect(castleLoader, contains('castleLoadingComplete'));
    expect(castleLoader, contains('window.parent.postMessage'));
    expect(castleLoader, contains('document.body.dataset.castleLoadingComplete'));

    // Retain the environment observer as a redundant fallback if a browser
    // misses the direct loader-completion message during iframe recomposition.
    expect(environment, contains("type: 'castleLoadingComplete'"));
    expect(environment, contains("classList.contains('is-done')"));
  });
}
