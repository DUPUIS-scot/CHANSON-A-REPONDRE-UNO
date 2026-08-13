import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import '../scripts/generate_card_share_pages.dart';

void main() {
  test('several permanent cards produce exact recto preview metadata', () {
    final catalog =
        jsonDecode(File('assets/json/cards.json').readAsStringSync())
            as Map<String, dynamic>;
    final cards =
        ((catalog['decks'] as List).first as Map<String, dynamic>)['cards']
            as List<dynamic>;
    final base = Uri.parse(
      'https://dupuis-scot.github.io/CHANSON-A-REPONDRE-UNO/',
    );

    for (final index in [0, 17, 34, 51, 68]) {
      final card = cards[index] as Map<String, dynamic>;
      final id = card['id'] as String;
      final path = card['path'] as String;
      final html = buildCardShareHtml(
        publicBase: base,
        cardId: id,
        imagePath: path,
        imageWidth: card['imageWidth'] as int?,
        imageHeight: card['imageHeight'] as int?,
      );
      final imageUrl = base.replace(
        pathSegments: ['CHANSON-A-REPONDRE-UNO', 'assets', ...path.split('/')],
      );

      expect(html, contains('<meta property="og:title"'));
      expect(html, contains('<meta property="og:url"'));
      expect(html, contains('<meta property="og:image"'));
      expect(html, contains('<meta name="twitter:image"'));
      expect(html, contains(imageUrl.toString()));
      expect(html, contains('#/cards/$id'));
    }
  });
}
