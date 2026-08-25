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

  test('several UNO cards produce canonical titles and compact preview metadata', () {
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
        previewImagePath: 'share-previews/$slug.jpg',
        imageWidth: 600,
        imageHeight: 900,
      );
      final imageUrl = base.replace(
        pathSegments: ['CHANSON-A-REPONDRE-UNO', 'assets', 'share-previews', '$slug.jpg'],
      );

      expect(slug, startsWith('UNO-'));
      expect(title, startsWith('Chanson à répondre UNO — Carte '));
      expect(html, contains('<meta property="og:title"'));
      expect(html, contains('<meta property="og:url"'));
      expect(html, contains('<meta property="og:image"'));
      expect(html, contains('<meta property="og:image:url"'));
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

  test('BRIO card uses compact crawler preview metadata', () {
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
    final previewPath = 'share-previews/$slug.jpg';
    final html = buildCanonicalShareHtml(
      publicBase: base,
      cardId: id,
      shareSlug: slug,
      title: title,
      imagePath: path,
      previewImagePath: previewPath,
      imageWidth: 600,
      imageHeight: 900,
    );
    final previewUrl = base.replace(
      pathSegments: ['CHANSON-A-REPONDRE-UNO', 'assets', ...previewPath.split('/')],
    );

    expect(slug, 'BRIO-001');
    expect(title, 'Chanson à répondre BRIO — Carte 001');
    expect(html, contains('/share/BRIO-001/'));
    expect(html, contains(previewUrl.toString()));
    expect(html, isNot(contains('/assets/$path')));
    expect(html, contains('property="og:image:url"'));
    expect(html, contains('property="og:image:secure_url"'));
    expect(html, contains('property="og:image:type" content="image/jpeg"'));
    expect(html, contains('property="og:image:width" content="600"'));
    expect(html, contains('property="og:image:height" content="900"'));
    expect(html, contains('property="og:image:alt"'));
    expect(html, contains('name="twitter:image:alt"'));
    expect(html, contains('#/cards/brio-001'));
    expect(html, contains('window.location.replace('));
    expect(html, isNot(contains('http-equiv="refresh"')));
  });

  test('every bundled deck card exposes its exact thumbnail metadata', () {
    final catalog =
        jsonDecode(File(AppConstants.cardsAsset).readAsStringSync())
            as Map<String, dynamic>;
    final unoDeck = (catalog['decks'] as List<dynamic>)
        .whereType<Map<String, dynamic>>()
        .firstWhere((item) => item['id'] == AppConstants.productionDeckId);
    final brioDeck =
        jsonDecode(File(AppConstants.brioDeckAsset).readAsStringSync())
            as Map<String, dynamic>;
    final hpCards = Directory('assets/hp')
        .listSync(recursive: false)
        .whereType<File>()
        .where((file) {
          final name = file.uri.pathSegments.last.toLowerCase();
          return const ['.png', '.jpg', '.jpeg', '.webp'].any(
                (extension) => name.endsWith(extension),
              ) &&
              name != 'verso.png' &&
              name != 'work_in_progress_ribbon.webp';
        })
        .toList()
      ..sort((a, b) => a.path.toLowerCase().compareTo(b.path.toLowerCase()));

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
      final previewPath = 'share-previews/$slug.jpg';
      final html = buildCanonicalShareHtml(
        publicBase: base,
        cardId: id,
        shareSlug: slug,
        title: title,
        imagePath: path,
        previewImagePath: previewPath,
        imageWidth: 600,
        imageHeight: 900,
      );
      final imageUrl = base.replace(
        pathSegments: [
          'CHANSON-A-REPONDRE-UNO',
          'assets',
          ...previewPath.split('/'),
        ],
      );

      expect(html, contains('property="og:image" content="$imageUrl"'));
      expect(html, contains('property="og:image:url" content="$imageUrl"'));
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

    for (var index = 0; index < hpCards.length; index++) {
      final file = hpCards[index];
      expectThumbnail(
        card: {
          'id': 'hp-${(index + 1).toString().padLeft(3, '0')}',
          'path': file.path.substring('assets/'.length),
        },
        deckId: AppConstants.hpDeckId,
        deckName: 'Chanson à répondre HP',
      );
    }

    expect(
      checked,
      (unoDeck['cards'] as List<dynamic>).length +
          (brioDeck['cards'] as List<dynamic>).length +
          hpCards.length,
    );
  });
}
