import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:uno_chanson_2/core/app_constants.dart';
import 'package:uno_chanson_2/services/card_share_identity.dart';

import '../scripts/generate_multideck_share_pages.dart';

void main() {
  final base = Uri.parse(
    'https://dupuis-scot.github.io/CHANSON-A-REPONDRE-UNO/',
  );

  test('several UNO cards produce canonical titles and exact recto metadata', () {
    final catalog =
        jsonDecode(File(AppConstants.cardsAsset).readAsStringSync())
            as Map<String, dynamic>;
    final deck = (catalog['decks'] as List<dynamic>)
        .whereType<Map<String, dynamic>>()
        .firstWhere((item) => item['id'] == AppConstants.productionDeckId);
    final cards = deck['cards'] as List<dynamic>;

    for (final index in [0, 17, 34, 51, 68]) {
      final card = cards[index] as Map<String, dynamic>;
      final id = card['id'] as String;
      final path = card['path'] as String;
      final slug = CardShareIdentity.canonicalSlugFor(
        cardId: id,
        deckId: AppConstants.productionDeckId,
      );
      final title = CardShareIdentity.titleFor(
        cardId: id,
        deckId: AppConstants.productionDeckId,
        deckName: deck['name'] as String,
      );
      final html = buildCanonicalShareHtml(
        publicBase: base,
        cardId: id,
        shareSlug: slug,
        title: title,
        imagePath: path,
        imageWidth: (card['imageWidth'] as num?)?.toInt(),
        imageHeight: (card['imageHeight'] as num?)?.toInt(),
      );
      final imageUrl = base.replace(
        pathSegments: ['CHANSON-A-REPONDRE-UNO', 'assets', ...path.split('/')],
      );

      expect(slug, startsWith('UNO-'));
      expect(title, startsWith('Chanson à répondre UNO — Carte '));
      expect(html, contains('<meta property="og:title"'));
      expect(html, contains('<meta property="og:url"'));
      expect(html, contains('<meta property="og:image"'));
      expect(html, contains('<meta property="og:image:secure_url"'));
      expect(html, contains('<meta property="og:image:type"'));
      expect(html, contains('<meta property="og:image:alt"'));
      expect(html, contains('<meta name="twitter:image"'));
      expect(html, contains('<meta name="twitter:image:alt"'));
      expect(html, contains(imageUrl.toString()));
      expect(html, contains('/share/$slug/'));
      expect(html, contains('#/cards/$id'));
      expect(html, contains('window.location.replace('));
      expect(html, isNot(contains('http-equiv="refresh"')));
    }
  });

  test('BRIO card produces BRIO title, canonical URL, and exact image', () {
    final deck =
        jsonDecode(File(AppConstants.brioDeckAsset).readAsStringSync())
            as Map<String, dynamic>;
    final card = (deck['cards'] as List<dynamic>).first as Map<String, dynamic>;
    final id = card['id'] as String;
    final path = card['image'] as String;
    final slug = CardShareIdentity.canonicalSlugFor(
      cardId: id,
      deckId: AppConstants.brioDeckId,
    );
    final title = CardShareIdentity.titleFor(
      cardId: id,
      deckId: AppConstants.brioDeckId,
      deckName: deck['name'] as String,
    );
    final html = buildCanonicalShareHtml(
      publicBase: base,
      cardId: id,
      shareSlug: slug,
      title: title,
      imagePath: path,
    );

    expect(slug, 'brio-001');
    expect(title, 'Chanson à répondre BRIO — Carte 001');
    expect(html, contains('/share/brio-001/'));
    expect(html, contains('/assets/$path'));
    expect(html, contains('property="og:image:secure_url"'));
    expect(html, contains('property="og:image:type" content="image/jpeg"'));
    expect(html, contains('property="og:image:alt"'));
    expect(html, contains('name="twitter:image:alt"'));
    expect(html, contains('#/cards/brio-001'));
    expect(html, contains('window.location.replace('));
    expect(html, isNot(contains('http-equiv="refresh"')));
  });

  test('all 100 built-in card links expose their exact thumbnail metadata', () {
    final catalog =
        jsonDecode(File(AppConstants.cardsAsset).readAsStringSync())
            as Map<String, dynamic>;
    final unoDeck = (catalog['decks'] as List<dynamic>)
        .whereType<Map<String, dynamic>>()
        .firstWhere((item) => item['id'] == AppConstants.productionDeckId);
    final brioDeck =
        jsonDecode(File(AppConstants.brioDeckAsset).readAsStringSync())
            as Map<String, dynamic>;

    var checked = 0;

    void expectThumbnail({
      required Map<String, dynamic> card,
      required String deckId,
      required String deckName,
    }) {
      final id = card['id'] as String;
      final path = (card['path'] ?? card['image']) as String;
      final slug = CardShareIdentity.canonicalSlugFor(
        cardId: id,
        deckId: deckId,
      );
      final title = CardShareIdentity.titleFor(
        cardId: id,
        deckId: deckId,
        deckName: deckName,
      );
      final html = buildCanonicalShareHtml(
        publicBase: base,
        cardId: id,
        shareSlug: slug,
        title: title,
        imagePath: path,
        imageWidth: (card['imageWidth'] as num?)?.toInt(),
        imageHeight: (card['imageHeight'] as num?)?.toInt(),
      );
      final imageUrl = base.replace(
        pathSegments: ['CHANSON-A-REPONDRE-UNO', 'assets', ...path.split('/')],
      );

      expect(html, contains('property="og:image" content="$imageUrl"'));
      expect(
        html,
        contains('property="og:image:secure_url" content="$imageUrl"'),
      );
      expect(html, contains('property="og:image:type" content="image/'));
      expect(html, contains('property="og:image:alt" content="$title"'));
      expect(html, contains('name="twitter:card" content="summary_large_image"'));
      expect(html, contains('name="twitter:image" content="$imageUrl"'));
      expect(html, contains('name="twitter:image:alt" content="$title"'));
      expect(html, contains('/share/$slug/'));
      checked++;
    }

    for (final card in (unoDeck['cards'] as List<dynamic>)
        .whereType<Map<String, dynamic>>()) {
      expectThumbnail(
        card: card,
        deckId: AppConstants.productionDeckId,
        deckName: unoDeck['name'] as String,
      );
    }
    for (final card in (brioDeck['cards'] as List<dynamic>)
        .whereType<Map<String, dynamic>>()) {
      expectThumbnail(
        card: card,
        deckId: AppConstants.brioDeckId,
        deckName: brioDeck['name'] as String,
      );
    }

    expect(checked, 100);
  });
}
