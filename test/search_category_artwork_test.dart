import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uno_chanson_2/core/app_constants.dart';
import 'package:uno_chanson_2/providers/deck_provider.dart';
import 'package:uno_chanson_2/services/deck_import_service.dart';
import 'package:uno_chanson_2/services/local_storage_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Future<DeckProvider> loadDecks() async {
    SharedPreferences.setMockInitialValues({});
    final storage = LocalStorageService();
    final decks = DeckProvider(storage, DeckImportService(storage));
    await decks.load();
    return decks;
  }

  void expectSearchArtworkResolver(String searchSource) {
    expect(searchSource, contains('!activeDeck.hasExplicitCategories'));
    expect(searchSource, contains('? activeDeck.cardBack'));
    expect(searchSource, contains('categoryArtworkOverride: categoryArtworkOverride'));
    expect(searchSource, contains('artworkSource:'));
    expect(
      searchSource,
      contains('categoryArtworkOverride ?? category.versoAsset'),
    );
  }

  test('BRIO Search category artwork resolves to the BRIO card verso', () async {
    final decks = await loadDecks();
    addTearDown(decks.dispose);
    await decks.select(AppConstants.brioDeckId);

    final activeDeck = decks.activeDeck!;
    expect(activeDeck.id, AppConstants.brioDeckId);
    expect(activeDeck.hasExplicitCategories, isFalse);
    expect(
      activeDeck.cardBack,
      'assets/decks/chanson_a_repondre_brio/card_back.jpeg',
    );

    expectSearchArtworkResolver(
      File('lib/screens/search_screen.dart').readAsStringSync(),
    );
  });

  test('production Search keeps category-specific verso artwork', () async {
    final decks = await loadDecks();
    addTearDown(decks.dispose);
    await decks.select(AppConstants.productionDeckId);

    final activeDeck = decks.activeDeck!;
    expect(activeDeck.id, AppConstants.productionDeckId);
    expect(activeDeck.hasExplicitCategories, isTrue);

    expectSearchArtworkResolver(
      File('lib/screens/search_screen.dart').readAsStringSync(),
    );
  });

  test('web cache buster reaches the compiled Flutter entrypoint', () {
    final bootstrap = File('web/flutter_bootstrap.js').readAsStringSync();
    final index = File('web/index.html').readAsStringSync();

    expect(bootstrap, contains("const buildId = searchParams.get('v')"));
    expect(bootstrap, contains('build.mainJsPath ='));
    expect(index, contains('{{flutter_bootstrap_js}}'));
  });
}
