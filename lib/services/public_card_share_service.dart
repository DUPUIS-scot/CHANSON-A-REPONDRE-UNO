import '../core/app_constants.dart';
import '../models/card_image_model.dart';
import '../models/deck_model.dart';
import 'card_share_result.dart';
import 'multi_deck_card_share_service.dart';

export 'card_share_result.dart';

abstract final class PublicCardShareService {
  static Uri deepLinkFor(String cardId, {Uri? applicationUri}) {
    final source = applicationUri ?? Uri.base;
    final base = Uri(
      scheme: source.scheme,
      userInfo: source.userInfo,
      host: source.host,
      port: source.hasPort ? source.port : null,
      path: source.path,
    );
    return base.replace(fragment: '/cards/$cardId');
  }

  static Uri urlFor(String cardId, {Uri? applicationUri}) =>
      deepLinkFor(cardId, applicationUri: applicationUri);

  static Uri shareUrlFor({
    required String cardId,
    required String deckId,
    Uri? applicationUri,
  }) => MultiDeckCardShareService.shareUrlFor(
    cardId: cardId,
    deckId: deckId,
    applicationUri: applicationUri,
  );

  static Uri publicImageUrlFor({
    required CardImageModel card,
    Uri? applicationUri,
  }) => MultiDeckCardShareService.publicImageUrlFor(
    card: card,
    applicationUri: applicationUri,
  );

  static Future<CardShareResult> share({
    CardImageModel? card,
    Deck? deck,
    String? cardId,
    String? imagePath,
    Uri? applicationUri,
  }) {
    if (card != null && deck != null) {
      return MultiDeckCardShareService.share(
        card: card,
        deck: deck,
        applicationUri: applicationUri,
      );
    }
    if (cardId == null || imagePath == null) {
      return Future.value(CardShareResult.failed);
    }
    final isBrio = cardId.startsWith('brio-');
    final deckId = isBrio
        ? AppConstants.brioDeckId
        : cardId.startsWith('final-84-')
        ? AppConstants.productionDeckId
        : 'legacy-share';
    final deckName = isBrio
        ? 'Chanson à répondre BRIO'
        : deckId == AppConstants.productionDeckId
        ? 'Chanson à répondre UNO'
        : 'Chanson à répondre';
    final fallbackCard = CardImageModel(
      id: cardId,
      deckId: deckId,
      title: '',
      path: imagePath,
      category: 'Share',
      colour: 'gold',
      importedAt: DateTime.fromMillisecondsSinceEpoch(0),
    );
    final fallbackDeck = Deck(
      id: deckId,
      name: deckName,
      cards: [fallbackCard],
    );
    return MultiDeckCardShareService.share(
      card: fallbackCard,
      deck: fallbackDeck,
      applicationUri: applicationUri,
    );
  }
}
