import 'dart:io';

import 'package:flutter/widgets.dart';
import 'package:video_player/video_player.dart';

import '../features/startup_media/startup_video_source.dart';
import '../features/startup_media/startup_video_storage.dart';

class StartupVideoProvider extends ChangeNotifier with WidgetsBindingObserver {
  StartupVideoProvider(this._storage) {
    WidgetsBinding.instance.addObserver(this);
  }

  final StartupVideoStorage _storage;
  VideoPlayerController? controller;
  StartupVideoSource source = const AssetStartupVideoSource(
    StartupVideoStorage.bundledAsset,
  );
  bool loading = true;
  bool hasStarted = false;
  bool importing = false;
  bool _resumeAfterLifecycle = false;
  String? error;

  bool get isImported => source is FileStartupVideoSource;
  String get currentFileName => switch (source) {
    AssetStartupVideoSource() => 'Bundled startup video',
    FileStartupVideoSource() => 'Saved startup video',
  };

  Future<void> initialize() async {
    source = await _storage.resolve();
    await _loadSource(source, allowFallback: true);
  }

  Future<void> importVideo(String sourcePath) async {
    if (importing) return;
    importing = true;
    error = null;
    notifyListeners();
    try {
      final imported = await _storage.importVideo(File(sourcePath));
      await _loadSource(FileStartupVideoSource(imported));
    } on Object catch (exception) {
      error = '$exception';
      rethrow;
    } finally {
      importing = false;
      notifyListeners();
    }
  }

  Future<void> restoreDefault() async {
    await pause();
    await _storage.restoreDefault();
    await _loadSource(
      const AssetStartupVideoSource(StartupVideoStorage.bundledAsset),
    );
  }

  Future<void> play() async {
    final video = controller;
    if (video?.value.isInitialized != true) return;
    hasStarted = true;
    await video!.play();
    notifyListeners();
  }

  Future<void> pause() async {
    await controller?.pause();
    notifyListeners();
  }

  Future<void> toggle() async =>
      controller?.value.isPlaying == true ? pause() : play();

  Future<void> _loadSource(
    StartupVideoSource next, {
    bool allowFallback = false,
  }) async {
    loading = true;
    error = null;
    notifyListeners();
    final nextController = switch (next) {
      AssetStartupVideoSource(:final assetPath) => VideoPlayerController.asset(
        assetPath,
      ),
      FileStartupVideoSource(:final file) => VideoPlayerController.file(file),
    };
    try {
      await nextController.initialize();
      await nextController.setLooping(true);
      await nextController.setVolume(1);
      await nextController.pause();
      final previous = controller;
      controller = nextController;
      source = next;
      hasStarted = false;
      loading = false;
      await previous?.dispose();
      notifyListeners();
    } on Object {
      await nextController.dispose();
      if (allowFallback && next is FileStartupVideoSource) {
        await _storage.restoreDefault();
        await _loadSource(
          const AssetStartupVideoSource(StartupVideoStorage.bundledAsset),
        );
        error =
            'The saved startup video was unavailable. '
            'The bundled startup video was restored.';
      } else {
        loading = false;
        error = 'Unable to load the selected startup video.';
      }
      notifyListeners();
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      if (_resumeAfterLifecycle) play();
      _resumeAfterLifecycle = false;
      return;
    }
    if (state == AppLifecycleState.inactive ||
        state == AppLifecycleState.paused ||
        state == AppLifecycleState.detached) {
      _resumeAfterLifecycle = controller?.value.isPlaying ?? false;
      controller?.pause();
      notifyListeners();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    controller?.dispose();
    super.dispose();
  }
}
