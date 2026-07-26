import '../../services/local_storage_service.dart';
import 'startup_video_source.dart';

class StartupVideoStorage {
  StartupVideoStorage(this._storage);

  static const bundledAsset = 'assets/videos/startup_video.mp4';
  static const preferenceKey = 'startup_video_preferences';
  final LocalStorageService _storage;

  Future<StartupVideoSource> resolve() async {
    await _storage.remove(preferenceKey);
    return const AssetStartupVideoSource(bundledAsset);
  }

  Future<void> restoreDefault() async {
    await _storage.remove(preferenceKey);
  }
}
