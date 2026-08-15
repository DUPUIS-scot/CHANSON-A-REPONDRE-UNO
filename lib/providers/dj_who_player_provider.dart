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
  bool _advancing = false;
  double _resumeSeconds = 0;

  List<VideoItem> get videos => _videos;
  YoutubePlayerController? get controller => _controller;
  int get selectedIndex => _selectedIndex;
  bool get isActive => _active;
  bool get isPlaying => _playerRouteMounted ? _isPlaying : _shouldResumePlaying;
  bool get hasMountedPlayer => _playerRouteMounted && _controller != null;
  double get resumeSeconds => _resumeSeconds;
  VideoItem? get selectedVideo =>
      _videos.isEmpty ? null : _videos[_selectedIndex];

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

    if (_controller == null) {
      _controller = _createController();
      _playerSubscription = _controller!.stream.listen(_onPlayerValue);
    }

    final controller = _controller!;
    final resumeAt = _resumeSeconds;
    final shouldPlay = _shouldResumePlaying;

    if (resumeAt > 0) {
      await controller.seekTo(seconds: resumeAt, allowSeekAhead: true);
    }
    if (shouldPlay) {
      await controller.playVideo();
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
        // Keep the last known resume position if the iframe is already gone.
      }
      _shouldResumePlaying = _isPlaying;
      _isPlaying = false;
      await _playerSubscription?.cancel();
      _playerSubscription = null;
      await controller.close();
      _controller = null;
    }
    notifyListeners();
  }

  void _onPlayerValue(YoutubePlayerValue value) {
    var changed = false;
    final playing = value.playerState == PlayerState.playing;

    if (_isPlaying != playing) {
      _isPlaying = playing;
      _shouldResumePlaying = playing;
      changed = true;
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
    notifyListeners();

    final controller = _controller;
    if (_playerRouteMounted && controller != null) {
      await controller.loadVideoById(videoId: _videos[index].videoId);
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
    if (!_playerRouteMounted || controller == null) {
      _shouldResumePlaying = !_shouldResumePlaying;
      notifyListeners();
      return;
    }

    if (_isPlaying) {
      await controller.pauseVideo();
      _shouldResumePlaying = false;
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
        // The route may be disappearing while the stop request is sent.
      }
    }

    _active = false;
    _isPlaying = false;
    _shouldResumePlaying = false;
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
