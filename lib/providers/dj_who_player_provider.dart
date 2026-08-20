import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:youtube_player_iframe/youtube_player_iframe.dart';

import '../data/dj_who_videos.dart';
import '../models/video_item.dart';

class DjWhoPlayerProvider extends ChangeNotifier {
  DjWhoPlayerProvider()
    : _videos = djWhoVideos
          .where((video) => video.hasValidVideoId)
          .toList(growable: false);

  final List<VideoItem> _videos;
  YoutubePlayerController? _controller;
  StreamSubscription<YoutubePlayerValue>? _playerSubscription;
  int _selectedIndex = 0;
  bool _active = false;
  bool _isPlaying = false;
  bool _shouldResumePlaying = false;
  bool _playerRouteMounted = false;
  bool _castleLoadSuspended = false;
  bool _resumeAfterCastleLoad = false;
  bool _advancing = false;
  double _resumeSeconds = 0;

  List<VideoItem> get videos => _videos;
  YoutubePlayerController? get controller => _controller;
  int get selectedIndex => _selectedIndex;
  bool get isActive => _active;
  bool get isPlaying => _controller != null
      ? (_isPlaying ||
            (_castleLoadSuspended &&
                _resumeAfterCastleLoad &&
                _shouldResumePlaying))
      : _shouldResumePlaying;
  bool get hasMountedPlayer => _controller != null;
  bool get isPlayerRouteMounted => _playerRouteMounted;
  bool get isCastleLoadSuspended => _castleLoadSuspended;
  bool get willResumeAfterCastleLoad =>
      _castleLoadSuspended && _resumeAfterCastleLoad && _shouldResumePlaying;
  double get resumeSeconds => _resumeSeconds;
  VideoItem? get selectedVideo =>
      _videos.isEmpty ? null : _videos[_selectedIndex];

  bool get _canCreateEmbeddedPlayer => kIsWeb;

  YoutubePlayerController _createController() {
    return YoutubePlayerController.fromVideoId(
      videoId: _videos[_selectedIndex].videoId,
      autoPlay: false,
      params: const YoutubePlayerParams(
        showControls: true,
        showFullscreenButton: true,
        enableKeyboard: true,
        strictRelatedVideos: true,
        interfaceLanguage: 'fr',
      ),
    );
  }

  Future<void> enterPlayerRoute() async {
    if (_videos.isEmpty) return;
    _playerRouteMounted = true;

    if (!_canCreateEmbeddedPlayer) {
      notifyListeners();
      return;
    }

    if (_controller == null) {
      _controller = _createController();
      _playerSubscription = _controller!.stream.listen(_onPlayerValue);

      final resumeAt = _resumeSeconds;
      final videoId = _videos[_selectedIndex].videoId;
      if (_shouldResumePlaying) {
        await _controller!.loadVideoById(
          videoId: videoId,
          startSeconds: resumeAt > 0 ? resumeAt : null,
        );
      } else if (resumeAt > 0) {
        await _controller!.cueVideoById(
          videoId: videoId,
          startSeconds: resumeAt,
        );
      }
    }

    notifyListeners();
  }

  Future<void> leavePlayerRoute() async {
    if (!_playerRouteMounted) return;
    _playerRouteMounted = false;

    final controller = _controller;
    if (controller != null) {
      try {
        _resumeSeconds = await controller.currentTime;
      } catch (_) {
        // Keep the last known position if the player is between frames.
      }
      if (!_castleLoadSuspended) {
        _shouldResumePlaying = _isPlaying;
      }
    }

    // Keep the controller and iframe alive off-route. Castle startup can pause
    // decoding temporarily without destroying the selected track or position.
    notifyListeners();
  }

  Future<void> suspendForCastleLoad() async {
    if (_castleLoadSuspended) return;
    _castleLoadSuspended = true;
    _resumeAfterCastleLoad =
        _active && (_isPlaying || _shouldResumePlaying);
    if (_resumeAfterCastleLoad) {
      _shouldResumePlaying = true;
    }

    final controller = _controller;
    if (controller != null) {
      try {
        _resumeSeconds = await controller.currentTime;
      } catch (_) {
        // Keep the latest known position if the iframe is transitioning.
      }
      try {
        await controller.pauseVideo();
      } catch (_) {
        // Castle mount can briefly recompose the platform view on mobile.
      }
    }
    notifyListeners();
  }

  Future<void> resumeAfterCastleLoad() async {
    if (!_castleLoadSuspended) return;
    _castleLoadSuspended = false;
    final shouldResume =
        _resumeAfterCastleLoad && _active && _shouldResumePlaying;
    _resumeAfterCastleLoad = false;
    final controller = _controller;
    notifyListeners();

    if (!shouldResume || controller == null) return;
    try {
      await controller.playVideo();
    } catch (_) {
      // Leaving the Castle or a final iframe composition can briefly race the
      // media surface. The user's playback intent remains preserved.
    }
  }

  void _onPlayerValue(YoutubePlayerValue value) {
    var changed = false;
    final playing = value.playerState == PlayerState.playing;

    if (_isPlaying != playing) {
      _isPlaying = playing;
      changed = true;
    }
    if (!_castleLoadSuspended) {
      if (playing && !_shouldResumePlaying) {
        _shouldResumePlaying = true;
        changed = true;
      } else if (!playing && _shouldResumePlaying) {
        _shouldResumePlaying = false;
        changed = true;
      }
    }
    if (playing && !_active) {
      _active = true;
      changed = true;
    }
    if (changed) notifyListeners();

    if (value.playerState != PlayerState.ended ||
        _advancing ||
        _videos.length < 2) {
      return;
    }

    _advancing = true;
    unawaited(
      next().whenComplete(() {
        _advancing = false;
      }),
    );
  }

  Future<void> selectVideo(int index) async {
    if (index < 0 || index >= _videos.length) return;

    _selectedIndex = index;
    _active = true;
    _resumeSeconds = 0;
    _shouldResumePlaying = true;
    if (_castleLoadSuspended) {
      _resumeAfterCastleLoad = true;
    }
    notifyListeners();

    final controller = _controller;
    if (controller != null) {
      if (_castleLoadSuspended) {
        await controller.cueVideoById(videoId: _videos[index].videoId);
      } else {
        await controller.loadVideoById(videoId: _videos[index].videoId);
      }
    }
  }

  Future<void> previous() async {
    if (_videos.isEmpty) return;
    final previousIndex =
        (_selectedIndex - 1 + _videos.length) % _videos.length;
    await selectVideo(previousIndex);
  }

  Future<void> next() async {
    if (_videos.isEmpty) return;
    final nextIndex = (_selectedIndex + 1) % _videos.length;
    await selectVideo(nextIndex);
  }

  Future<void> togglePlayback() async {
    if (!_active) {
      _active = true;
    }

    final controller = _controller;
    if (_castleLoadSuspended) {
      final wantsResume = !(_resumeAfterCastleLoad && _shouldResumePlaying);
      _resumeAfterCastleLoad = wantsResume;
      _shouldResumePlaying = wantsResume;
      notifyListeners();
      if (!wantsResume && controller != null) {
        try {
          await controller.pauseVideo();
        } catch (_) {}
      }
      return;
    }

    if (controller == null) {
      _shouldResumePlaying = !_shouldResumePlaying;
      notifyListeners();
      return;
    }

    if (_isPlaying || _shouldResumePlaying) {
      _shouldResumePlaying = false;
      notifyListeners();
      await controller.pauseVideo();
      return;
    }

    _shouldResumePlaying = true;
    notifyListeners();
    await controller.playVideo();
  }

  Future<void> stopAndDismiss() async {
    final controller = _controller;
    if (controller != null) {
      try {
        await controller.stopVideo();
      } catch (_) {
        // The hidden player may be transitioning between route hosts.
      }
      await _playerSubscription?.cancel();
      _playerSubscription = null;
      await controller.close();
      _controller = null;
    }

    _active = false;
    _isPlaying = false;
    _shouldResumePlaying = false;
    _castleLoadSuspended = false;
    _resumeAfterCastleLoad = false;
    _resumeSeconds = 0;
    notifyListeners();
  }

  @override
  void dispose() {
    unawaited(_playerSubscription?.cancel());
    unawaited(_controller?.close());
    super.dispose();
  }
}
