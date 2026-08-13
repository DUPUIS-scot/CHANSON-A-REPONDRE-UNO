import 'package:flutter/services.dart';

import 'native_share.dart';
import 'native_share_result.dart';

enum CardShareResult { shared, cancelled, copied, failed }

typedef NativeCardSharer =
    Future<NativeShareResult> Function({
      required String title,
      required String text,
      required String url,
      String? imagePath,
    });
typedef CardLinkCopier = Future<void> Function(String value);

abstract final class PublicCardShareService {
  static const title = 'Chanson à Répondre UNO';
  static const text = 'Chanson à Répondre UNO — share a card';

  static Uri deepLinkFor(String cardId, {Uri? applicationUri}) {
    final base = _cleanBase(applicationUri ?? Uri.base);
    return base.replace(fragment: '/cards/$cardId');
  }

  static Uri urlFor(String cardId, {Uri? applicationUri}) =>
      deepLinkFor(cardId, applicationUri: applicationUri);

  static Uri shareUrlFor(String cardId, {Uri? applicationUri}) {
    final base = _cleanBase(applicationUri ?? Uri.base);
    final baseSegments = base.pathSegments.where((value) => value.isNotEmpty);
    return base.replace(
      pathSegments: [...baseSegments, 'share', cardId, ''],
      fragment: null,
    );
  }

  static Uri _cleanBase(Uri source) => Uri(
    scheme: source.scheme,
    userInfo: source.userInfo,
    host: source.host,
    port: source.hasPort ? source.port : null,
    path: source.path,
  );

  static Future<CardShareResult> share({
    required String cardId,
    required String imagePath,
    Uri? applicationUri,
    NativeCardSharer nativeShare = sharePublicCard,
    CardLinkCopier copyLink = _copyLink,
  }) async {
    final url = shareUrlFor(cardId, applicationUri: applicationUri).toString();
    final nativeResult = await nativeShare(
      title: title,
      text: text,
      url: url,
      imagePath: imagePath,
    );
    if (nativeResult == NativeShareResult.shared) {
      return CardShareResult.shared;
    }
    if (nativeResult == NativeShareResult.cancelled) {
      return CardShareResult.cancelled;
    }
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
