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
  return '''<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${htmlEscape.convert(pageTitle)}</title>
  <meta property="og:title" content="${htmlEscape.convert(pageTitle)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${htmlEscape.convert(shareUrl.toString())}">
  <meta property="og:image" content="${htmlEscape.convert(imageUrl.toString())}">
${dimensions.toString().trimRight()}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${htmlEscape.convert(pageTitle)}">
  <meta name="twitter:image" content="${htmlEscape.convert(imageUrl.toString())}">
  <meta http-equiv="refresh" content="0; url=${htmlEscape.convert(deepLink.toString())}">
  <link rel="canonical" href="${htmlEscape.convert(deepLink.toString())}">
</head>
<body>
  <p><a href="${htmlEscape.convert(deepLink.toString())}">${htmlEscape.convert(pageTitle)}</a></p>
</body>
</html>
''';
}

Future<void> main(List<String> args) async {
  final outputRoot = Directory(args.isNotEmpty ? args.first : 'build/web');
  final cards = await _loadUnoCards();
  final brioCards = await _loadBrioCards();
  final publicBase = Uri.parse(AppConstants.publicWebBaseUrl);
  for (final card in cards) {
    await _writePage(
      outputRoot: outputRoot,
      publicBase: publicBase,
      cardId: card.id,
      shareSlug: CardShareIdentity.shareSlugFor(card),
      title: CardShareIdentity.shareTitleFor(card),
      imagePath: card.imagePath,
    );
  }
  for (final card in brioCards) {
    await _writePage(
      outputRoot: outputRoot,
      publicBase: publicBase,
      cardId: card.id,
      shareSlug: CardShareIdentity.shareSlugFor(card),
      title: CardShareIdentity.shareTitleFor(card),
      imagePath: card.imagePath,
    );
  }
}

Future<void> _writePage({
  required Directory outputRoot,
  required Uri publicBase,
  required String cardId,
  required String shareSlug,
  required String title,
  required String imagePath,
}) async {
  final output = Directory('${outputRoot.path}/share/$shareSlug');
  await output.create(recursive: true);
  final file = File('${output.path}/index.html');
  await file.writeAsString(
    buildCardShareHtml(
      publicBase: publicBase,
      cardId: cardId,
      shareSlug: shareSlug,
      title: title,
      imagePath: imagePath,
    ),
  );
}

Future<List<_ShareCard>> _loadUnoCards() async {
  final file = File('assets/json/cards.json');
  final decoded = jsonDecode(await file.readAsString()) as List<dynamic>;
  return decoded
      .cast<Map<String, dynamic>>()
      .map(
        (item) => _ShareCard(
          id: item['id'] as String,
          title: item['title'] as String? ?? '',
          deckId: item['deckId'] as String? ?? CardShareIdentity.unoDeckId,
          imagePath: item['path'] as String,
        ),
      )
      .toList(growable: false);
}

Future<List<_ShareCard>> _loadBrioCards() async {
  final file = File('assets/decks/chanson_a_repondre_brio/deck.json');
  final decoded = jsonDecode(await file.readAsString()) as Map<String, dynamic>;
  final deckId = decoded['id'] as String? ?? CardShareIdentity.brioDeckId;
  final cards = (decoded['cards'] as List<dynamic>).cast<Map<String, dynamic>>();
  return cards
      .map(
        (item) => _ShareCard(
          id: item['id'] as String,
          title: item['title'] as String? ?? '',
          deckId: deckId,
          imagePath: item['path'] as String,
        ),
      )
      .toList(growable: false);
}

class _ShareCard implements CardShareIdentitySource {
  const _ShareCard({
    required this.id,
    required this.title,
    required this.deckId,
    required this.imagePath,
  });

  @override
  final String id;
  @override
  final String title;
  @override
  final String deckId;
  final String imagePath;
}
