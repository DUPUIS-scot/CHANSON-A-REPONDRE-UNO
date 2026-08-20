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
  Timer? _iosResumeGuardTimer;
  int _selectedIndex = 0;
  bool _active = false;
  bool _isPlaying = false;
  bool _shouldResumePlaying = false;
  bool _playerRouteMounted = false;
  bool _castleLoadSuspended = false;
  bool _resumeAfterCastleLoad = false;
  bool _iosCastleResumePending = false;
  bool _iosResumeRequiresGesture = false;
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
  bool get isIosCastleResumePending => _iosCastleResumePending;
  bool get iosResumeRequiresGesture => _iosResumeRequiresGesture;
  double get resumeSeconds => _resumeSeconds;
  VideoItem? get selectedVideo =>
      _videos.isEmpty ? null : _videos[_selectedIndex];

  bool get _canCreateEmbeddedPlayer => kIsWeb;
  bool get _isIosWeb => kIsWeb && defaultTargetPlatform == TargetPlatform.iOS;

  YoutubePlayerController _createController() {
    return YoutubePlayerController.fromVideoId(
      videoId: _videos[_selectedIndex].videoId,
      autoPlay: false,
      params: const YoutubePlayerParams(
        showControls: true,
        showFullscreenButton: true,
        enableKeyboard: true,
        playsInline: true,
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
      if (!_castleLoadSuspended && !_iosCastleResumePending) {
        _shouldResumePlaying = _isPlaying;
      }
    }

    // Keep the controller and iframe alive off-route. Castle startup can pause
    // decoding temporarily without destroying the selected track or position.
    notifyListeners();
  }

  Future<void> suspendForCastleLoad() async {
    if (_castleLoadSuspended) return;
    _iosResumeGuardTimer?.cancel();
    _iosResumeGuardTimer = null;
    _iosCastleResumePending = false;
    _iosResumeRequiresGesture = false;
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

  Future<void> resumeAfterCastleLoad({bool isIos = false}) async {
    if (!_castleLoadSuspended) return;
    final guardIosResume = isIos || _isIosWeb;
    _castleLoadSuspended = false;
    final shouldResume =
        _resumeAfterCastleLoad && _active && _shouldResumePlaying;
    _resumeAfterCastleLoad = false;
    final controller = _controller;

    _iosResumeGuardTimer?.cancel();
    _iosResumeGuardTimer = null;
    _iosCastleResumePending =
        guardIosResume && shouldResume && controller != null;
    _iosResumeRequiresGesture = false;
    notifyListeners();

    if (!shouldResume || controller == null) return;
    try {
      await controller.playVideo();
    } catch (_) {
      if (guardIosResume) {
        _markIosResumeRequiresGesture();
      }
      return;
    }

    if (!guardIosResume) return;
    _iosResumeGuardTimer = Timer(const Duration(milliseconds: 2200), () {
      _iosResumeGuardTimer = null;
      if (!_active || _isPlaying || !_shouldResumePlaying) {
        final changed = _iosCastleResumePending || _iosResumeRequiresGesture;
        _iosCastleResumePending = false;
        _iosResumeRequiresGesture = false;
        if (changed) notifyListeners();
        return;
      }
      _markIosResumeRequiresGesture();
    });
  }

  void _markIosResumeRequiresGesture() {
    _iosResumeGuardTimer?.cancel();
    _iosResumeGuardTimer = null;
    _iosCastleResumePending = false;
    if (!_active) {
      _iosResumeRequiresGesture = false;
      _shouldResumePlaying = false;
      notifyListeners();
      return;
    }
    _iosResumeRequiresGesture = true;
    _shouldResumePlaying = false;
    notifyListeners();
  }

  void _onPlayerValue(YoutubePlayerValue value) {
    var changed = false;
    final playing = value.playerState == PlayerState.playing;

    if (_isPlaying != playing) {
      _isPlaying = playing;
      changed = true;
    }
    if (playing && (_iosCastleResumePending || _iosResumeRequiresGesture)) {
      _iosResumeGuardTimer?.cancel();
      _iosResumeGuardTimer = null;
      _iosCastleResumePending = false;
      _iosResumeRequiresGesture = false;
      changed = true;
    }
    if (!_castleLoadSuspended && !_iosCastleResumePending) {
      if (playing && !_shouldResumePlaying) {
        _shouldResumePlaying = true;
        changed = true;
      } else if (!playing &&
          !_iosResumeRequiresGesture &&
          _shouldResumePlaying) {
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

    _iosResumeGuardTimer?.cancel();
    _iosResumeGuardTimer = null;
    _iosCastleResumePending = false;
    _iosResumeRequiresGesture = false;
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

    if (_iosCastleResumePending) {
      _iosResumeGuardTimer?.cancel();
      _iosResumeGuardTimer = null;
      _iosCastleResumePending = false;
      _shouldResumePlaying = false;
      notifyListeners();
      if (controller != null) {
        try {
          await controller.pauseVideo();
        } catch (_) {}
      }
      return;
    }

    if (_iosResumeRequiresGesture) {
      _iosResumeRequiresGesture = false;
      _shouldResumePlaying = true;
      notifyListeners();
      if (controller == null) return;
      try {
        await controller.playVideo();
      } catch (_) {
        _iosResumeRequiresGesture = true;
        _shouldResumePlaying = false;
        notifyListeners();
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
    _iosResumeGuardTimer?.cancel();
    _iosResumeGuardTimer = null;
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
    _iosCastleResumePending = false;
    _iosResumeRequiresGesture = false;
    _resumeSeconds = 0;
    notifyListeners();
  }

  @override
  void dispose() {
    _iosResumeGuardTimer?.cancel();
    unawaited(_playerSubscription?.cancel());
    unawaited(_controller?.close());
    super.dispose();
  }
}