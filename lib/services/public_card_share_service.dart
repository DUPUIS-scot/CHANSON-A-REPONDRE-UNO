import 'package:flutter/services.dart';

import 'native_share.dart';

enum CardShareResult { shared, copied }

abstract final class PublicCardShareService {
  static Uri urlFor(String cardId, {Uri? applicationUri}) {
    final base = applicationUri ?? Uri.base;
    return base.replace(query: null, fragment: '/cards/$cardId');
  }

  static Future<CardShareResult> share({
    required String cardId,
    String title = 'Chanson a Repondre UNO card',
  }) async {
    final url = urlFor(cardId).toString();
    if (await sharePublicCard(title: title, url: url)) {
      return CardShareResult.shared;
    }
    await Clipboard.setData(ClipboardData(text: url));
    return CardShareResult.copied;
  }
}
