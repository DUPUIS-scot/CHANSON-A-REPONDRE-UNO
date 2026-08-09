import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../services/local_storage_service.dart';

enum HomeStage { videoIntro, curtainOpening, home }

enum HomeBackgroundMode { defaultMode, sauvage }

class HomeExperienceProvider extends ChangeNotifier {
  HomeExperienceProvider(this._storage);
  final LocalStorageService _storage;
  static const _key = 'home_experience_settings';

  HomeStage stage = HomeStage.videoIntro;
  double curtainProgress = 0;
  bool videoPlaying = false;
  bool rotationEnabled = true;
  bool reverseRotation = false;
  bool isTransitioning = false;
  bool targetOpen = false;
  bool autoOpenAfterPlayback = false;
  bool skipIntroOnStartup = false;
  HomeBackgroundMode backgroundMode = HomeBackgroundMode.defaultMode;
  int orientationResetToken = 0;

  bool get homeInteractive => curtainProgress >= .95 && stage == HomeStage.home;

  Future<void> initialize() async {
    try {
      final source = await _storage.read(_key);
      if (source != null) {
        final map = jsonDecode(source) as Map<String, dynamic>;
        autoOpenAfterPlayback = map['autoOpen'] as bool? ?? false;
        skipIntroOnStartup = map['skipIntro'] as bool? ?? false;
        backgroundMode =
            map['backgroundMode'] == HomeBackgroundMode.sauvage.name
            ? HomeBackgroundMode.sauvage
            : HomeBackgroundMode.defaultMode;
      }
    } on Object {
      // Invalid preferences safely use the intro defaults.
    }
    if (skipIntroOnStartup) {
      curtainProgress = 1;
      stage = HomeStage.home;
    }
    notifyListeners();
  }

  void playVideo() {
    videoPlaying = true;
    notifyListeners();
    if (autoOpenAfterPlayback) {
      Future<void>.delayed(const Duration(seconds: 2), () {
        if (videoPlaying && stage == HomeStage.videoIntro) openCurtains();
      });
    }
  }

  void pauseVideo() {
    videoPlaying = false;
    notifyListeners();
  }

  void toggleVideo() => videoPlaying ? pauseVideo() : playVideo();

  void startCurtainOpening() {
    stage = HomeStage.curtainOpening;
    isTransitioning = true;
    notifyListeners();
  }

  void setCurtainProgress(double value) {
    curtainProgress = value.clamp(0, 1);
    if (curtainProgress > 0 && curtainProgress < .95) {
      stage = HomeStage.curtainOpening;
    } else if (curtainProgress >= .95) {
      enterHome();
      return;
    } else if (curtainProgress <= .01) {
      stage = HomeStage.videoIntro;
    }
    notifyListeners();
  }

  void completeCurtainDrag(double velocity) {
    if (velocity.abs() > 500) {
      velocity > 0 ? openCurtains() : closeCurtains();
    } else {
      curtainProgress >= .5 ? openCurtains() : closeCurtains();
    }
  }

  void openCurtains() {
    targetOpen = true;
    stage = HomeStage.curtainOpening;
    isTransitioning = true;
    notifyListeners();
  }

  void closeCurtains() {
    targetOpen = false;
    stage = HomeStage.curtainOpening;
    isTransitioning = true;
    notifyListeners();
  }

  void enterHome() {
    curtainProgress = 1;
    stage = HomeStage.home;
    videoPlaying = false;
    isTransitioning = false;
    notifyListeners();
  }

  void returnToVideoIntro() {
    curtainProgress = 0;
    stage = HomeStage.videoIntro;
    isTransitioning = false;
    notifyListeners();
  }

  void finishTransition(bool opened) =>
      opened ? enterHome() : returnToVideoIntro();

  void toggleRotation() {
    rotationEnabled = !rotationEnabled;
    notifyListeners();
  }

  void reverseRotationDirection() {
    reverseRotation = !reverseRotation;
    notifyListeners();
  }

  void resetVideoOrientation() {
    orientationResetToken++;
    notifyListeners();
  }

  Future<void> setAutoOpen(bool value) async {
    autoOpenAfterPlayback = value;
    await _persist();
  }

  Future<void> setSkipIntro(bool value) async {
    skipIntroOnStartup = value;
    await _persist();
  }

  Future<void> setBackgroundMode(HomeBackgroundMode value) async {
    backgroundMode = value;
    await _persist();
  }

  Future<void> _persist() async {
    await _storage.write(_key, {
      'autoOpen': autoOpenAfterPlayback,
      'skipIntro': skipIntroOnStartup,
      'backgroundMode': backgroundMode.name,
    });
    notifyListeners();
  }
}
