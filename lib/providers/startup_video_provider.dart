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
  bool muted = false;
  bool _resumeAfterLifecycle = false;
  String? error;

  bool get isImported => false;
  String get currentFileName => 'Bundled startup video';

  Future<void> initialize() async {
    source = await _storage.resolve();
    await _loadSource(source);
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

  Future<void> toggleMuted() async {
    muted = !muted;
    await controller?.setVolume(muted ? 0 : 1);
    notifyListeners();
  }

  Future<void> replay() async {
    final video = controller;
    if (video?.value.isInitialized != true) return;
    hasStarted = true;
    await video!.seekTo(Duration.zero);
    await video.play();
    notifyListeners();
  }

  Future<void> _loadSource(StartupVideoSource next) async {
    loading = true;
    error = null;
    notifyListeners();
    final nextController = VideoPlayerController.asset(
      (next as AssetStartupVideoSource).assetPath,
    );
    try {
      await nextController.initialize();
      await nextController.setLooping(true);
      await nextController.setVolume(1);
      await nextController.pause();
      final previous = controller;
      controller = nextController;
      source = next;
      hasStarted = false;
      muted = false;
      loading = false;
      await previous?.dispose();
      notifyListeners();
    } on Object {
      await nextController.dispose();
      loading = false;
      error = 'Unable to load the startup video.';
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
