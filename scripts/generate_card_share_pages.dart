import 'dart:convert';
import 'dart:io';

import 'package:uno_chanson_2/core/app_constants.dart';
import 'package:uno_chanson_2/services/card_share_identity.dart';

String buildCardShareHtml({
  required Uri publicBase,
  required String cardId,
  String? shareSlug,
  String? title,
  required String imagePath,
  int? imageWidth,
  int? imageHeight,
}) {
  final slug = shareSlug ?? cardId;
  final pageTitle = title ?? 'Chanson à répondre — Carte';
  final root = publicBase.pathSegments.where((item) => item.isNotEmpty);
  final shareUrl = publicBase.replace(pathSegments: [...root, 'share', slug, '']);
  final deepLink = publicBase.replace(fragment: '/cards/$cardId');
  final imageUrl = publicBase.replace(
    pathSegments: [...root, 'assets', ...imagePath.split('/')],
  );
  final dimensions = StringBuffer();
  if (imageWidth != null && imageWidth > 0) {
    dimensions.writeln('  <meta property="og:image:width" content="$imageWidth">');
  }
  if (imageHeight != null && imageHeight > 0) {
    dimensions.writeln('  <meta property="og:image:height" content="$imageHeight">');
  }
  final t = _html(pageTitle);
  final s = _html(shareUrl.toString());
  final i = _html(imageUrl.toString());
  final d = _html(deepLink.toString());
  return '''<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>$t</title>
  <meta property="og:type" content="website">
  <meta property="og:title" content="$t">
  <meta property="og:image" content="$i">
${dimensions.toString()}  <meta property="og:url" content="$s">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="$t">
  <meta name="twitter:image" content="$i">
  <link rel="canonical" href="$s">
  <meta http-equiv="refresh" content="0; url=$d">
</head>
<body><p><a href="$d">Open this card</a></p></body>
</html>
''';
}

String buildCompatibilityRedirectHtml({
  required Uri publicBase,
  required String legacySlug,
  required String canonicalSlug,
  required String title,
  required String imagePath,
}) {
  final root = publicBase.pathSegments.where((item) => item.isNotEmpty);
  final canonical = publicBase.replace(
    pathSegments: [...root, 'share', canonicalSlug, ''],
  );
  final image = publicBase.replace(
    pathSegments: [...root, 'assets', ...imagePath.split('/')],
  );
  final t = _html(title);
  final legacy = _html(legacySlug);
  final c = _html(canonical.toString());
  final i = _html(image.toString());
  return '''<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>$t</title>
  <meta name="legacy-card-id" content="$legacy">
  <meta property="og:type" content="website">
  <meta property="og:title" content="$t">
  <meta property="og:image" content="$i">
  <meta property="og:url" content="$c">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="$t">
  <meta name="twitter:image" content="$i">
  <link rel="canonical" href="$c">
  <meta http-equiv="refresh" content="0; url=$c">
</head>
<body><p><a href="$c">Open the canonical card link</a></p></body>
</html>
''';
}

String _html(String value) => value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

Future<void> main(List<String> arguments) async {
  final options = _options(arguments);
  final buildPath = options['build-dir'] ?? 'build/web';
  final publicBase = Uri.parse(
    options['public-base'] ??
        'https://dupuis-scot.github.io/CHANSON-A-REPONDRE-UNO/',
  );
  final cards = <_ShareCard>[
    ...await _loadUno(options['catalog'] ?? AppConstants.cardsAsset),
    ...await _loadBrio(options['brio'] ?? AppConstants.brioDeckAsset),
  ];
  final slugs = cards
      .map((card) => CardShareIdentity.canonicalSlugFor(
            cardId: card.id,
            deckId: card.deckId,
          ))
      .toSet();
  if (cards.length != 100 || slugs.length != 100) {
    throw const FormatException('Expected 100 unique canonical share cards.');
  }
  final root = Directory('$buildPath/share');
  await root.create(recursive: true);
  var legacyCount = 0;
  for (final card in cards) {
    final slug = CardShareIdentity.canonicalSlugFor(
      cardId: card.id,
      deckId: card.deckId,
    );
    final title = CardShareIdentity.titleFor(
      cardId: card.id,
      deckId: card.deckId,
      deckName: card.deckName,
    );
    final canonical = File('${root.path}/$slug/index.html');
    await canonical.parent.create(recursive: true);
    await canonical.writeAsString(buildCardShareHtml(
      publicBase: publicBase,
      cardId: card.id,
      shareSlug: slug,
      title: title,
      imagePath: card.imagePath,
      imageWidth: card.imageWidth,
      imageHeight: card.imageHeight,
    ));
    final legacySlug = CardShareIdentity.legacySlugFor(
      cardId: card.id,
      deckId: card.deckId,
    );
    if (legacySlug != null && legacySlug != slug) {
      final legacy = File('${root.path}/$legacySlug/index.html');
      await legacy.parent.create(recursive: true);
      await legacy.writeAsString(buildCompatibilityRedirectHtml(
        publicBase: publicBase,
        legacySlug: legacySlug,
        canonicalSlug: slug,
        title: title,
        imagePath: card.imagePath,
      ));
      legacyCount++;
    }
  }
  stdout.writeln(
    'Generated ${cards.length} canonical share pages and $legacyCount legacy redirects.',
  );
}

Future<List<_ShareCard>> _loadUno(String path) async {
  final root = jsonDecode(await File(path).readAsString()) as Map<String, dynamic>;
  final deck = (root['decks'] as List<dynamic>)
      .whereType<Map<String, dynamic>>()
      .firstWhere((item) => item['id'] == AppConstants.productionDeckId);
  final cards = (deck['cards'] as List<dynamic>)
      .whereType<Map<String, dynamic>>()
      .map((card) => _ShareCard(
            id: card['id'] as String? ?? '',
            deckId: AppConstants.productionDeckId,
            deckName: deck['name'] as String? ?? 'Chanson à répondre UNO',
            imagePath: (card['path'] ?? card['image']) as String? ?? '',
            imageWidth: (card['imageWidth'] as num?)?.toInt(),
            imageHeight: (card['imageHeight'] as num?)?.toInt(),
          ))
      .toList(growable: false);
  if (cards.length != 84 || cards.map((card) => card.id).toSet().length != 84) {
    throw const FormatException('Expected 84 unique UNO cards.');
  }
  return cards;
}

Future<List<_ShareCard>> _loadBrio(String path) async {
  final deck = jsonDecode(await File(path).readAsString()) as Map<String, dynamic>;
  if (deck['id'] != AppConstants.brioDeckId) {
    throw const FormatException('Unexpected BRIO deck id.');
  }
  final cards = (deck['cards'] as List<dynamic>)
      .whereType<Map<String, dynamic>>()
      .map((card) => _ShareCard(
            id: card['id'] as String? ?? '',
            deckId: AppConstants.brioDeckId,
            deckName: deck['name'] as String? ?? 'Chanson à répondre BRIO',
            imagePath: (card['path'] ?? card['image']) as String? ?? '',
            imageWidth: (card['imageWidth'] as num?)?.toInt(),
            imageHeight: (card['imageHeight'] as num?)?.toInt(),
          ))
      .toList(growable: false);
  if (cards.length != 16 || cards.map((card) => card.id).toSet().length != 16) {
    throw const FormatException('Expected 16 unique BRIO cards.');
  }
  return cards;
}

Map<String, String> _options(List<String> arguments) {
  final result = <String, String>{};
  for (var i = 0; i < arguments.length; i += 2) {
    if (i + 1 >= arguments.length || !arguments[i].startsWith('--')) {
      throw const FormatException('Options must be --name value pairs.');
    }
    result[arguments[i].substring(2)] = arguments[i + 1];
  }
  return result;
}

class _ShareCard {
  const _ShareCard({
    required this.id,
    required this.deckId,
    required this.deckName,
    required this.imagePath,
    this.imageWidth,
    this.imageHeight,
  });
  final String id;
  final String deckId;
  final String deckName;
  final String imagePath;
  final int? imageWidth;
  final int? imageHeight;
}
