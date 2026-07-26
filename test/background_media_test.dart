import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uno_chanson_2/providers/background_provider.dart';
import 'package:uno_chanson_2/providers/settings_provider.dart';
import 'package:uno_chanson_2/services/background_import_service.dart';
import 'package:uno_chanson_2/services/local_storage_service.dart';
import 'package:uno_chanson_2/widgets/background_widget.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('PNG background loads with cover fit', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: BackgroundWidget(type: BackgroundType.image)),
    );
    await tester.pump();
    final image = tester.widget<Image>(find.byType(Image).first);
    expect(image.fit, BoxFit.cover);
    expect(
      (image.image as AssetImage).assetName,
      BackgroundProvider.defaultImageAsset,
    );
    expect(tester.takeException(), isNull);
  });

  testWidgets('missing PNG displays a safe placeholder', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: BackgroundWidget(
          type: BackgroundType.image,
          imagePath: 'assets/images/missing.png',
          fallbackImagePath: 'assets/images/also_missing.png',
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.byIcon(Icons.image_not_supported_outlined), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('unsupported video uses PNG with a friendly error', (
    tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: BackgroundWidget(
          type: BackgroundType.video,
          videoPath: 'assets/videos/background.avi',
        ),
      ),
    );
    await tester.pump();
    expect(find.textContaining('Unsupported video format'), findsOneWidget);
    expect(find.byType(Image), findsOneWidget);
  });

  test('background selection switches and persists after restart', () async {
    SharedPreferences.setMockInitialValues({});
    final storage = LocalStorageService();
    final first = SettingsProvider(storage);
    await first.load();
    expect(first.backgroundType, 'IMAGE');
    await first.update(background: 'MP4');
    expect(first.backgroundType, 'MP4');

    final restored = SettingsProvider(storage);
    await restored.load();
    expect(restored.backgroundType, 'MP4');
  });

  test('fresh background provider starts with Edinburgh image', () async {
    SharedPreferences.setMockInitialValues({});
    final background = BackgroundProvider(
      LocalStorageService(),
      BackgroundImportService(),
    );
    addTearDown(background.dispose);

    await background.load();

    expect(background.type, BackgroundMediaType.image);
    expect(background.imagePath, BackgroundProvider.defaultImageAsset);
    expect(background.videoPath, BackgroundProvider.defaultVideoAsset);
    expect(background.currentFilename, BackgroundProvider.defaultImageLabel);
  });

  test('saved video preference still wins over fresh default', () async {
    SharedPreferences.setMockInitialValues({
      'background_settings':
          '{"type":"video","path":null,"filename":"legacy","overlay":0.28,"muteVideo":true}',
    });
    final background = BackgroundProvider(
      LocalStorageService(),
      BackgroundImportService(),
    );
    addTearDown(background.dispose);

    await background.load();

    expect(background.type, BackgroundMediaType.video);
    expect(background.videoPath, BackgroundProvider.defaultVideoAsset);
    expect(background.currentFilename, BackgroundProvider.defaultVideoLabel);
  });
}
