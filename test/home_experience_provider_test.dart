import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uno_chanson_2/providers/home_experience_provider.dart';
import 'package:uno_chanson_2/providers/background_provider.dart';
import 'package:uno_chanson_2/services/background_import_service.dart';
import 'package:uno_chanson_2/services/local_storage_service.dart';

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  test('starts in paused video intro with closed curtains', () async {
    final provider = HomeExperienceProvider(LocalStorageService());
    await provider.initialize();
    expect(provider.stage, HomeStage.videoIntro);
    expect(provider.curtainProgress, 0);
    expect(provider.videoPlaying, isFalse);
    expect(provider.homeInteractive, isFalse);
  });

  test('Home becomes interactive only when sufficiently open', () {
    final provider = HomeExperienceProvider(LocalStorageService());
    provider.setCurtainProgress(.94);
    expect(provider.homeInteractive, isFalse);
    provider.setCurtainProgress(.95);
    expect(provider.stage, HomeStage.home);
    expect(provider.curtainProgress, 1);
    expect(provider.homeInteractive, isTrue);
  });

  test('playback and close reset the intro safely', () {
    final provider = HomeExperienceProvider(LocalStorageService());
    provider.playVideo();
    expect(provider.videoPlaying, isTrue);
    provider.enterHome();
    expect(provider.videoPlaying, isFalse);
    provider.closeCurtains();
    expect(provider.targetOpen, isFalse);
    provider.finishTransition(false);
    expect(provider.stage, HomeStage.videoIntro);
    expect(provider.curtainProgress, 0);
  });

  test('Home background mode defaults and persists independently', () async {
    final storage = LocalStorageService();
    final first = HomeExperienceProvider(storage);
    await first.initialize();
    expect(first.backgroundMode, HomeBackgroundMode.defaultMode);

    await first.setBackgroundMode(HomeBackgroundMode.sauvage);

    final restored = HomeExperienceProvider(storage);
    await restored.initialize();
    expect(restored.backgroundMode, HomeBackgroundMode.sauvage);

    final globalBackground = BackgroundProvider(
      storage,
      BackgroundImportService(),
    );
    addTearDown(globalBackground.dispose);
    await globalBackground.load();
    expect(globalBackground.type, BackgroundMediaType.image);
    expect(globalBackground.imagePath, BackgroundProvider.defaultImageAsset);
  });
}
