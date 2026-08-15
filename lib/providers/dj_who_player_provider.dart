import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:youtube_player_iframe/youtube_player_iframe.dart';

import '../data/dj_who_videos.dart';
import '../models/video_item.dart';

class DjWhoPlayerProvider extends ChangeNotifier {
  DjWhoPlayerProvider() {
    _videos = djWhoVideos
        .where((video) => video.hasValidVideoId)
        .toList(growable: false);
    if (_videos.isEmpty) return;

    _controller = YoutubePlayerController.fromVideoId(
      videoId: _videos.first.videoId,
      autoPlay: false,
      params: const YoutubePlayerParams(
        showControls: true,
        showFullscreenButton: true,
        enableKeyboard: true,
        strictRelatedVideos: true,
        interfaceLanguage: 'fr',
      ),
    );
    _playerSubscription = _controller!.stream.listen(_onPlayerValue);
  }

  late final List<VideoItem> _videos;
  YoutubePlayerController? _controller;
  StreamSubscription<YoutubePlayerValue>? _playerSubscription;
  int _selectedIndex = 0;
  bool _active = false;
  bool _isPlaying = false;
  bool _advancing = false;

  List<VideoItem> get videos => _videos;
  YoutubePlayerController? get controller => _controller;
  int get selectedIndex => _selectedIndex;
  bool get isActive => _active;
  bool get isPlaying => _isPlaying;
  VideoItem? get selectedVideo =>
      _videos.isEmpty ? null : _videos[_selectedIndex];

  void _onPlayerValue(YoutubePlayerValue value) {
    var changed = false;
    final playing = value.playerState == PlayerState.playing;

    if (_isPlaying != playing) {
      _isPlaying = playing;
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
    final controller = _controller;
    if (controller == null || index < 0 || index >= _videos.length) return;

    _selectedIndex = index;
    _active = true;
    notifyListeners();
    await controller.loadVideoById(videoId: _videos[index].videoId);
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
    final controller = _controller;
    if (controller == null) return;

    if (_isPlaying) {
      await controller.pauseVideo();
      return;
    }

    if (!_active) {
      _active = true;
      notifyListeners();
    }
    await controller.playVideo();
  }

  Future<void> stopAndDismiss() async {
    final controller = _controller;
    if (controller == null) return;

    await controller.stopVideo();
    _active = false;
    _isPlaying = false;
    notifyListeners();
  }

  @override
  void dispose() {
    unawaited(_playerSubscription?.cancel());
    unawaited(_controller?.close());
    super.dispose();
  }
}
