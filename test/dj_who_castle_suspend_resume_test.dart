import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('DJ WHO suspends for Castle loading and resumes only after ready', () {
    final provider = File(
      'lib/providers/dj_who_player_provider.dart',
    ).readAsStringSync();
    final castleView = File(
      'lib/widgets/webgl_card_castle_view_web.dart',
    ).readAsStringSync();
    final environment = File(
      'web/card_castle/castle_environment_direct.js',
    ).readAsStringSync();

    expect(provider, contains('suspendForCastleLoad'));
    expect(provider, contains('await controller.pauseVideo()'));
    expect(provider, contains('resumeAfterCastleLoad'));
    expect(provider, contains('await controller.playVideo()'));
    expect(provider, contains('controller.cueVideoById'));
    expect(provider, isNot(contains('ensureCastlePlaybackContinuity')));

    expect(castleView, contains('player.suspendForCastleLoad()'));
    expect(castleView, contains("case 'castleLoadingComplete':"));
    expect(castleView, contains('player.resumeAfterCastleLoad()'));
    expect(castleView, isNot(contains('Timer.periodic')));
    expect(castleView, isNot(contains('ensureCastlePlaybackContinuity')));

    expect(environment, contains("type: 'castleLoadingComplete'"));
    expect(environment, contains("classList.contains('is-done')"));
    expect(environment, contains('window.parent.postMessage'));
  });
}
