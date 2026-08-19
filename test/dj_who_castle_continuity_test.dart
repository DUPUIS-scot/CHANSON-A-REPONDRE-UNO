import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('DJ WHO playback continuity stays wired through Castle loading', () {
    final provider = File(
      'lib/providers/dj_who_player_provider.dart',
    ).readAsStringSync();
    final persistentPlayer = File(
      'lib/widgets/persistent_dj_who_player.dart',
    ).readAsStringSync();
    final castleView = File(
      'lib/widgets/webgl_card_castle_view_web.dart',
    ).readAsStringSync();

    expect(provider, contains('_castleContinuityActive'));
    expect(provider, contains('beginCastlePlaybackContinuity'));
    expect(provider, contains('ensureCastlePlaybackContinuity'));
    expect(provider, contains('await controller.playVideo()'));
    expect(provider, contains('endCastlePlaybackContinuity'));

    expect(persistentPlayer, contains('width: 160'));
    expect(persistentPlayer, contains('height: 90'));
    expect(persistentPlayer, contains('keepAlive: true'));

    expect(castleView, contains('beginCastlePlaybackContinuity'));
    expect(castleView, contains('Timer.periodic'));
    expect(castleView, contains('ensureCastlePlaybackContinuity'));
    expect(castleView, contains('endCastlePlaybackContinuity'));
  });
}
