import 'package:flutter/services.dart';

import '../models/card_image_model.dart';
import '../models/deck_model.dart';
import 'card_share_identity.dart';
import 'card_share_result.dart';
import 'native_share.dart';
import 'native_share_result.dart';

typedef MultiDeckNativeSharer =
    Future<NativeShareResult> Function({
      required String title,
      required String text,
      required String url,
      String? imagePath,
    });
typedef MultiDeckLinkCopier = Future<void> Function(String value);

abstract final class MultiDeckCardShareService {
  static Uri shareUrlFor({
    required String cardId,
    required String deckId,
    Uri? applicationUri,
  }) {
    final source = applicationUri ?? Uri.base;
    final base = Uri(
      scheme: source.scheme,
      userInfo: source.userInfo,
      host: source.host,
      port: source.hasPort ? source.port : null,
      path: source.path,
    );
    final segments = base.pathSegments.where((value) => value.isNotEmpty);
    final slug = CardShareIdentity.canonicalSlugFor(
      cardId: cardId,
      deckId: deckId,
    );
    return base.replace(
      pathSegments: [...segments, 'share', slug, ''],
      fragment: null,
    );
  }

  static Future<CardShareResult> share({
    required CardImageModel card,
    required Deck deck,
    Uri? applicationUri,
    MultiDeckNativeSharer nativeShare = sharePublicCard,
    MultiDeckLinkCopier copyLink = _copyLink,
  }) async {
    final title = CardShareIdentity.titleFor(
      cardId: card.id,
      deckId: deck.id,
      deckName: deck.name,
      cardDisplayTitle: card.displayTitle,
    );
    final url = shareUrlFor(
      cardId: card.id,
      deckId: deck.id,
      applicationUri: applicationUri,
    ).toString();
    final result = await nativeShare(
      title: title,
      text: title,
      url: url,
      imagePath: card.imagePath,
    );
    if (result == NativeShareResult.shared) return CardShareResult.shared;
    if (result == NativeShareResult.cancelled) return CardShareResult.cancelled;
    try {
      await copyLink(url);
      return CardShareResult.copied;
    } on Object {
      return CardShareResult.failed;
    }
  }

  static Future<void> _copyLink(String value) =>
      Clipboard.setData(ClipboardData(text: value));
}
