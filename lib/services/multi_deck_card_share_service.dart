import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

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
  static const socialPreviewShareCountKey = 'social_preview_share_count';

  static Future<void> _incrementShareCount() async {
    final preferences = await SharedPreferences.getInstance();
    final current = preferences.getInt(socialPreviewShareCountKey) ?? 0;
    await preferences.setInt(socialPreviewShareCountKey, current + 1);
  }

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

  static Uri publicImageUrlFor({
    required CardImageModel card,
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
    final root = base.pathSegments.where((segment) => segment.isNotEmpty);
    final imageSegments = card.imagePath
        .split('/')
        .where((segment) => segment.isNotEmpty);
    return base.replace(
      pathSegments: [...root, ...imageSegments],
      query: null,
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

    // Keep the raw card asset available for the native image attachment, but do
    // not put that asset URL in the message. The canonical share URL is the
    // single public link and carries the social preview metadata for every deck.
    final result = await nativeShare(
      title: title,
      text: title,
      url: url,
      imagePath: card.imagePath,
    );
    if (result == NativeShareResult.shared) {
      await _incrementShareCount();
      return CardShareResult.shared;
    }
    if (result == NativeShareResult.cancelled) return CardShareResult.cancelled;
    try {
      await copyLink('$title\n$url');
      await _incrementShareCount();
      return CardShareResult.copied;
    } on Object {
      return CardShareResult.failed;
    }
  }

  static Future<void> _copyLink(String value) =>
      Clipboard.setData(ClipboardData(text: value));
}
