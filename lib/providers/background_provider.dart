import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../services/background_import_service.dart';
import '../services/local_storage_service.dart';

class BackgroundProvider extends ChangeNotifier {
  BackgroundProvider(this._storage, this._importService);
  final LocalStorageService _storage;
  final BackgroundImportService _importService;
  static const _key = 'background_settings';
  static const defaultImageAsset = 'assets/images/default_background.png';
  static const defaultVideoAsset = 'assets/videos/home_background.mp4';
  static const defaultImageLabel = 'Default Edinburgh image';
  static const defaultVideoLabel = 'Bundled SAUVAGE video';

  BackgroundMediaType type = BackgroundMediaType.image;
  String? importedPath;
  String currentFilename = defaultImageLabel;
  double darkOverlay = .28;
  bool muteVideo = true;

  String get imagePath =>
      type == BackgroundMediaType.image && importedPath != null
      ? importedPath!
      : defaultImageAsset;
  String get videoPath =>
      type == BackgroundMediaType.video && importedPath != null
      ? importedPath!
      : defaultVideoAsset;

  Future<void> load() async {
    try {
      final source = await _storage.read(_key);
      if (source != null) {
        final map = jsonDecode(source) as Map<String, dynamic>;
        type = map['type'] == 'video'
            ? BackgroundMediaType.video
            : BackgroundMediaType.image;
        importedPath = map['path'] as String?;
        currentFilename = _labelFor(type, importedPath);
        darkOverlay = ((map['overlay'] as num?)?.toDouble() ?? .28).clamp(
          0,
          .6,
        );
        muteVideo = map['muteVideo'] as bool? ?? true;
      }
    } on Object {
      // Defaults recover from corrupt preferences.
    }
    notifyListeners();
  }

  Future<void> useImport(PendingBackgroundImport pending) async {
    final previous = importedPath;
    final path = await _importService.save(pending);
    type = pending.type;
    importedPath = path;
    currentFilename = pending.type == BackgroundMediaType.video
        ? 'Saved background video'
        : 'Saved background image';
    await _persist();
    if (previous != path) await _importService.deleteIfManaged(previous);
  }

  Future<void> restoreDefault() async {
    final previous = importedPath;
    type = BackgroundMediaType.image;
    importedPath = null;
    currentFilename = defaultImageLabel;
    await _persist();
    await _importService.deleteIfManaged(previous);
  }

  Future<void> useSauvageVideo() async {
    final previous = importedPath;
    type = BackgroundMediaType.video;
    importedPath = null;
    currentFilename = defaultVideoLabel;
    await _persist();
    await _importService.deleteIfManaged(previous);
  }

  Future<void> setOverlay(double value) async {
    darkOverlay = value.clamp(0, .6);
    await _persist();
  }

  Future<void> setMuteVideo(bool value) async {
    muteVideo = value;
    await _persist();
  }

  Future<void> _persist() async {
    await _storage.write(_key, {
      'type': type.name,
      'path': importedPath,
      'filename': currentFilename,
      'overlay': darkOverlay,
      'muteVideo': muteVideo,
    });
    notifyListeners();
  }

  String _labelFor(BackgroundMediaType mediaType, String? path) {
    if (path != null) {
      return mediaType == BackgroundMediaType.video
          ? 'Saved background video'
          : 'Saved background image';
    }
    return mediaType == BackgroundMediaType.video
        ? defaultVideoLabel
        : defaultImageLabel;
  }
}
