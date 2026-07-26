import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../services/local_storage_service.dart';

enum BackgroundMode { sauvage, staticPng }

class BackgroundProvider extends ChangeNotifier {
  BackgroundProvider(this._storage);
  final LocalStorageService _storage;
  static const _key = 'background_settings';

  BackgroundMode mode = BackgroundMode.sauvage;
  String currentFilename = 'home_background.mp4';
  double darkOverlay = .28;
  bool muteVideo = true;

  String get videoPath => 'assets/videos/home_background.mp4';
  String get imagePath => 'assets/images/home_background.png';

  Future<void> load() async {
    try {
      final source = await _storage.read(_key);
      if (source != null) {
        final map = jsonDecode(source) as Map<String, dynamic>;
        mode = map['mode'] == BackgroundMode.staticPng.name
            ? BackgroundMode.staticPng
            : BackgroundMode.sauvage;
        darkOverlay = ((map['overlay'] as num?)?.toDouble() ?? .28).clamp(
          0,
          .6,
        );
        muteVideo = map['muteVideo'] as bool? ?? true;
      }
    } on Object {
      // Defaults recover from corrupt preferences.
    }
    currentFilename = mode == BackgroundMode.sauvage
        ? 'home_background.mp4'
        : 'home_background.png';
    notifyListeners();
  }

  Future<void> setMode(BackgroundMode value) async {
    mode = value;
    currentFilename = value == BackgroundMode.sauvage
        ? 'home_background.mp4'
        : 'home_background.png';
    await _persist();
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
      'mode': mode.name,
      'filename': currentFilename,
      'overlay': darkOverlay,
      'muteVideo': muteVideo,
    });
    notifyListeners();
  }
}
