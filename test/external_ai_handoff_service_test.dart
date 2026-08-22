import 'package:flutter_test/flutter_test.dart';
import 'package:uno_chanson_2/core/app_constants.dart';
import 'package:uno_chanson_2/models/card_image_model.dart';
import 'package:uno_chanson_2/models/deck_model.dart';
import 'package:uno_chanson_2/services/multi_deck_card_share_service.dart';
import 'package:uno_chanson_2/services/native_share_result.dart';
import 'package:uno_chanson_2/services/public_card_share_service.dart';

void main() {
  final deployed = Uri.parse(
    'https://dupuis-scot.github.io/CHANSON-A-REPONDRE-UNO/'
    '?v=965c218#/cards?focus=old-card',
  );

  test('UNO deep link keeps internal id while public URL uses UNO-XXX', () {
    expect(
      PublicCardShareService.deepLinkFor(
        'final-84-23',
        applicationUri: deployed,
      ).toString(),
      'https://dupuis-scot.github.io/CHANSON-A-REPONDRE-UNO/#/cards/final-84-23',
    );
    expect(
      PublicCardShareService.shareUrlFor(
        cardId: 'final-84-23',
        deckId: AppConstants.productionDeckId,
        applicationUri: deployed,
      ).toString(),
      'https://dupuis-scot.github.io/CHANSON-A-REPONDRE-UNO/share/UNO-023/',
    );
  });

  test('BRIO public URL uses uppercase BRIO-XXX', () {
    expect(
      PublicCardShareService.shareUrlFor(
        cardId: 'brio-007',
        deckId: AppConstants.brioDeckId,
        applicationUri: deployed,
      ).toString(),
      'https://dupuis-scot.github.io/CHANSON-A-REPONDRE-UNO/share/BRIO-007/',
    );
  });

  test('HP public URL uses uppercase HP-XXX', () {
    expect(
      PublicCardShareService.shareUrlFor(
        cardId: 'hp-001',
        deckId: AppConstants.hpDeckId,
        applicationUri: deployed,
      ).toString(),
      'https://dupuis-scot.github.io/CHANSON-A-REPONDRE-UNO/share/HP-001/',
    );
  });

  test('direct public BRIO image URL uses the real JPEG asset without duplicate assets segment', () {
    final card = _card(
      id: 'brio-005',
      deckId: AppConstants.brioDeckId,
      title: 'BRIO 005',
      path: 'assets/decks/chanson_a_repondre_brio/cards/005.jpeg',
    );
    expect(
      PublicCardShareService.publicImageUrlFor(
        card: card,
        applicationUri: deployed,
      ).toString(),
      'https://dupuis-scot.github.io/CHANSON-A-REPONDRE-UNO/assets/decks/chanson_a_repondre_brio/cards/005.jpeg',
    );
  });

  test('direct public image URL works for any deck and preserves the real extension', () {
    for (final entry in <({String id, String deckId, String path})>[
      (
        id: 'custom-001',
        deckId: 'custom-jpg-deck',
        path: 'assets/decks/custom/cards/card-001.jpg',
      ),
      (
        id: 'custom-002',
        deckId: 'custom-png-deck',
        path: 'assets/decks/custom/cards/card-002.png',
      ),
      (
        id: 'custom-003',
        deckId: 'custom-webp-deck',
        path: 'assets/decks/custom/cards/card-003.webp',
      ),
      (
        id: 'custom-004',
        deckId: 'custom-jpeg-deck',
        path: 'assets/decks/custom/cards/card-004.jpeg',
      ),
    ]) {
      final card = _card(
        id: entry.id,
        deckId: entry.deckId,
        title: entry.id,
        path: entry.path,
      );
      final imageUrl = PublicCardShareService.publicImageUrlFor(
        card: card,
        applicationUri: deployed,
      ).toString();
      expect(imageUrl, endsWith('/${entry.path}'));
      expect(imageUrl, isNot(contains('/assets/assets/')));
    }
  });

  test('UNO share exposes one canonical link and keeps image attachment', () async {
    final card = _card(
      id: 'final-84-01',
      deckId: AppConstants.productionDeckId,
      title: 'ChatGPT Image Apr 15, 2026, 09_14_58 PM',
      path: 'assets/cards/final_import/example.png',
    );
    final deck = Deck(
      id: AppConstants.productionDeckId,
      name: 'CHANSON A REPONDRE UNO',
      cards: [card],
    );
    String? receivedTitle;
    String? receivedText;
    String? receivedUrl;
    String? receivedImage;
    final result = await MultiDeckCardShareService.share(
      card: card,
      deck: deck,
      applicationUri: deployed,
      nativeShare:
          ({required title, required text, required url, imagePath}) async {
            receivedTitle = title;
            receivedText = text;
            receivedUrl = url;
            receivedImage = imagePath;
            return NativeShareResult.shared;
          },
      copyLink: (_) async {},
    );
    expect(result, CardShareResult.shared);
    expect(receivedTitle, 'Chanson à répondre UNO — Carte 001');
    expect(receivedText, 'Chanson à répondre UNO — Carte 001');
    expect(receivedUrl, endsWith('/share/UNO-001/'));
    expect(receivedText, isNot(contains('/assets/')));
    expect(receivedText, isNot(contains('https://')));
    expect(receivedImage, 'assets/cards/final_import/example.png');
  });

  test('BRIO share exposes one canonical link and keeps image attachment', () async {
    final card = _card(
      id: 'brio-001',
      deckId: AppConstants.brioDeckId,
      title: 'BRIO 001',
      path: 'assets/decks/chanson_a_repondre_brio/cards/001.jpeg',
    );
    final deck = Deck(
      id: AppConstants.brioDeckId,
      name: 'Chanson à répondre BRIO',
      cards: [card],
    );
    String? receivedTitle;
    String? receivedText;
    String? receivedUrl;
    String? receivedImage;
    final result = await MultiDeckCardShareService.share(
      card: card,
      deck: deck,
      applicationUri: deployed,
      nativeShare:
          ({required title, required text, required url, imagePath}) async {
            receivedTitle = title;
            receivedText = text;
            receivedUrl = url;
            receivedImage = imagePath;
            return NativeShareResult.shared;
          },
      copyLink: (_) async {},
    );
    expect(result, CardShareResult.shared);
    expect(receivedTitle, 'Chanson à répondre BRIO — Carte 001');
    expect(receivedText, 'Chanson à répondre BRIO — Carte 001');
    expect(receivedUrl, endsWith('/share/BRIO-001/'));
    expect(receivedText, isNot(contains('/assets/')));
    expect(receivedText, isNot(contains('https://')));
    expect(
      receivedImage,
      'assets/decks/chanson_a_repondre_brio/cards/001.jpeg',
    );
  });

  test('HP share exposes one canonical link and keeps image attachment', () async {
    final card = _card(
      id: 'hp-001',
      deckId: AppConstants.hpDeckId,
      title: 'HP 001',
      path: 'assets/hp/card.png',
    );
    final deck = Deck(
      id: AppConstants.hpDeckId,
      name: 'Chanson à répondre HP',
      cards: [card],
    );
    String? receivedText;
    String? receivedUrl;
    final result = await MultiDeckCardShareService.share(
      card: card,
      deck: deck,
      applicationUri: deployed,
      nativeShare:
          ({required title, required text, required url, imagePath}) async {
            receivedText = text;
            receivedUrl = url;
            return NativeShareResult.shared;
          },
      copyLink: (_) async {},
    );
    expect(result, CardShareResult.shared);
    expect(receivedText, 'Chanson à répondre HP — Carte 001');
    expect(receivedUrl, endsWith('/share/HP-001/'));
    expect(receivedText, isNot(contains('/assets/')));
    expect(receivedText, isNot(contains('https://')));
  });

  test('share fallback copies title and only the canonical link', () async {
    final card = _card(
      id: 'brio-011',
      deckId: AppConstants.brioDeckId,
      title: 'BRIO 011',
      path: 'assets/decks/chanson_a_repondre_brio/cards/011.jpeg',
    );
    final deck = Deck(
      id: AppConstants.brioDeckId,
      name: 'Chanson à répondre BRIO',
      cards: [card],
    );
    String? copied;
    final result = await MultiDeckCardShareService.share(
      card: card,
      deck: deck,
      applicationUri: deployed,
      nativeShare:
          ({required title, required text, required url, imagePath}) async =>
              NativeShareResult.unavailable,
      copyLink: (value) async => copied = value,
    );
    expect(result, CardShareResult.copied);
    expect(copied, contains('Chanson à répondre BRIO — Carte 011'));
    expect(copied, contains('/share/BRIO-011/'));
    expect(copied, isNot(contains('/assets/')));
  });

  test('any deck share keeps raw asset out of public message text', () async {
    final card = _card(
      id: 'guest-042',
      deckId: 'guest-deck',
      title: 'Guest Card 42',
      path: 'assets/decks/guest/cards/42.jpg',
    );
    final deck = Deck(
      id: 'guest-deck',
      name: 'Guest Deck',
      cards: [card],
    );
    String? receivedText;
    String? receivedUrl;
    String? receivedImage;
    final result = await MultiDeckCardShareService.share(
      card: card,
      deck: deck,
      applicationUri: deployed,
      nativeShare:
          ({required title, required text, required url, imagePath}) async {
            receivedText = text;
            receivedUrl = url;
            receivedImage = imagePath;
            return NativeShareResult.shared;
          },
      copyLink: (_) async {},
    );
    expect(result, CardShareResult.shared);
    expect(receivedUrl, contains('/share/'));
    expect(receivedText, isNot(contains('/assets/')));
    expect(receivedText, isNot(contains('https://')));
    expect(receivedImage, card.imagePath);
  });
}

CardImageModel _card({
  required String id,
  required String deckId,
  required String title,
  required String path,
}) => CardImageModel(
  id: id,
  deckId: deckId,
  title: title,
  path: path,
  category: 'Permanent',
  colour: 'gold',
  importedAt: DateTime.utc(2026, 8, 14),
);
