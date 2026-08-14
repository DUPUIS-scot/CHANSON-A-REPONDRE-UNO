import '../models/card_image_model.dart';
import '../models/deck_model.dart';
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

  static Future<CardShareResult> share({
    required CardImageModel card,
    required Deck deck,
    Uri? applicationUri,
  }) => MultiDeckCardShareService.share(
    card: card,
    deck: deck,
    applicationUri: applicationUri,
  );
}
