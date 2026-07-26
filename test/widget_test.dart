import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uno_chanson_2/providers/background_provider.dart';
import 'package:uno_chanson_2/providers/deck_provider.dart';
import 'package:uno_chanson_2/services/local_storage_service.dart';

void main() {
  test('permanent deck remains bundled with 67 unique cards', () {
    final deck = DeckProvider.permanentDeck;

    expect(deck.id, chansonARepondreUnoDeckId);
    expect(deck.cards, hasLength(67));
    expect(deck.cards.map((card) => card.id).toSet(), hasLength(67));
    expect(deck.cards.first.id, 'chanson-a-repondre-uno-001');
    expect(deck.cards.last.id, 'chanson-a-repondre-uno-067');
    expect(deck.cards.every((card) => !card.title.endsWith('.png')), isTrue);
  });

  test('background modes are limited to the permanent video and PNG assets', () {
    SharedPreferences.setMockInitialValues({});
    expect(
      BackgroundMode.values,
      const [BackgroundMode.sauvage, BackgroundMode.staticPng],
    );

    final provider = BackgroundProvider(LocalStorageService());
    expect(provider.mode, BackgroundMode.sauvage);
    expect(provider.videoPath, 'assets/videos/home_background.mp4');
    expect(provider.imagePath, 'assets/images/home_background.png');
    expect(provider.currentFilename, 'home_background.mp4');
  });
}
