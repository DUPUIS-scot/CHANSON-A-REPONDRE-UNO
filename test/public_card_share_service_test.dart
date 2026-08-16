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

  test('UNO share title is normalized and filename metadata is ignored', () async {
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
    String? receivedUrl;
    String? receivedImage;
    final result = await MultiDeckCardShareService.share(
      card: card,
      deck: deck,
      applicationUri: deployed,
      nativeShare:
          ({required title, required text, required url, imagePath}) async {
            receivedTitle = title;
            receivedUrl = url;
            receivedImage = imagePath;
            return NativeShareResult.shared;
          },
      copyLink: (_) async {},
    );
    expect(result, CardShareResult.shared);
    expect(receivedTitle, 'Chanson à répondre UNO — Carte 001');
    expect(receivedUrl, endsWith('/share/UNO-001/'));
    expect(receivedImage, 'assets/cards/final_import/example.png');
  });

  test('BRIO shares canonical uppercase link with image attachment', () async {
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
    String? receivedUrl;
    String? receivedImage;
    final result = await MultiDeckCardShareService.share(
      card: card,
      deck: deck,
      applicationUri: deployed,
      nativeShare:
          ({required title, required text, required url, imagePath}) async {
            receivedTitle = title;
            receivedUrl = url;
            receivedImage = imagePath;
            return NativeShareResult.shared;
          },
      copyLink: (_) async {},
    );
    expect(result, CardShareResult.shared);
    expect(receivedTitle, 'Chanson à répondre BRIO — Carte 001');
    expect(receivedUrl, endsWith('/share/BRIO-001/'));
    expect(
      receivedImage,
      'assets/decks/chanson_a_repondre_brio/cards/001.jpeg',
    );
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
