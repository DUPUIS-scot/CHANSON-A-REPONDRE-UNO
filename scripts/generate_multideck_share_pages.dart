import 'dart:convert';
import 'dart:io';

import 'package:uno_chanson_2/core/app_constants.dart';
import 'package:uno_chanson_2/services/card_share_identity.dart';

const _defaultPublicBase =
    'https://dupuis-scot.github.io/CHANSON-A-REPONDRE-UNO/';

String buildCanonicalShareHtml({
  required Uri publicBase,
  required String cardId,
  required String shareSlug,
  required String title,
  required String imagePath,
  String? previewImagePath,
  String? transcription,
  int? imageWidth,
  int? imageHeight,
}) {
  final root = publicBase.pathSegments.where((segment) => segment.isNotEmpty);
  final shareUrl = publicBase.replace(
    pathSegments: [...root, 'share', shareSlug, ''],
  );
  final deepLink = publicBase.replace(fragment: '/cards/$cardId');
  final socialImagePath = previewImagePath ?? imagePath;
  final imageUrl = publicBase.replace(
    pathSegments: [...root, 'assets', ...socialImagePath.split('/')],
  );
  final imageMimeType = _imageMimeType(socialImagePath);
  final dimensions = StringBuffer();
  if (imageWidth != null && imageWidth > 0) {
    dimensions.writeln(
      '  <meta property="og:image:width" content="$imageWidth">',
    );
  }
  if (imageHeight != null && imageHeight > 0) {
    dimensions.writeln(
      '  <meta property="og:image:height" content="$imageHeight">',
    );
  }
  final normalizedTranscription = transcription?.trim() ?? '';
  final escapedTitle = _html(title);
  final escapedCardId = _html(cardId);
  final escapedShareUrl = _html(shareUrl.toString());
  final escapedDeepLink = _html(deepLink.toString());
  final escapedImageUrl = _html(imageUrl.toString());
  final escapedImageMimeType = _html(imageMimeType);
  final escapedTranscription = _html(normalizedTranscription);
  final description = 'Open $title.';
  final escapedDescription = _html(description);
  final deepLinkJson = jsonEncode(deepLink.toString());

  return '''<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>$escapedTitle</title>
  <meta name="description" content="$escapedDescription">
  <meta name="card-id" content="$escapedCardId">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Chanson à Répondre">
  <meta property="og:title" content="$escapedTitle">
  <meta property="og:description" content="$escapedDescription">
  <meta property="og:image" content="$escapedImageUrl">
  <meta property="og:image:url" content="$escapedImageUrl">
  <meta property="og:image:secure_url" content="$escapedImageUrl">
  <meta property="og:image:type" content="$escapedImageMimeType">
  <meta property="og:image:alt" content="$escapedTitle">
${dimensions.toString()}  <meta property="og:url" content="$escapedShareUrl">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="$escapedTitle">
  <meta name="twitter:description" content="$escapedDescription">
  <meta name="twitter:image" content="$escapedImageUrl">
  <meta name="twitter:image:alt" content="$escapedTitle">
  <link rel="canonical" href="$escapedShareUrl">
</head>
<body>
  <main>
    <h1>$escapedTitle</h1>
    <p>Card ID: <span id="card-id">$escapedCardId</span></p>
    <figure>
      <img id="card-image" src="$escapedImageUrl" alt="$escapedTitle" style="max-width: min(100%, 600px); height: auto;">
    </figure>
    <section aria-labelledby="transcription-heading">
      <h2 id="transcription-heading">Card transcription</h2>
      <pre id="card-transcription" style="white-space: pre-wrap;">${escapedTranscription.isEmpty ? 'No static transcription is embedded for this card yet. Use the card image above or the in-app transcription.' : escapedTranscription}</pre>
    </section>
    <p><a href="$escapedDeepLink">Open this card in Chanson à Répondre</a></p>
  </main>
  <script>window.location.replace($deepLinkJson);</script>
</body>
</html>
''';
}

String buildLegacyRedirectHtml({
  required Uri publicBase,
  required String legacySlug,
  required String canonicalSlug,
  required String title,
  required String imagePath,
}) {
  final root = publicBase.pathSegments.where((segment) => segment.isNotEmpty);
  final canonicalUrl = publicBase.replace(
    pathSegments: [...root, 'share', canonicalSlug, ''],
  );
  final imageUrl = publicBase.replace(
    pathSegments: [...root, 'assets', ...imagePath.split('/')],
  );
  final imageMimeType = _imageMimeType(imagePath);
  final escapedTitle = _html(title);
  final escapedLegacy = _html(legacySlug);
  final escapedCanonical = _html(canonicalUrl.toString());
  final escapedImage = _html(imageUrl.toString());
  final escapedImageMimeType = _html(imageMimeType);
  final canonicalUrlJson = jsonEncode(canonicalUrl.toString());

  return '''<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>$escapedTitle</title>
  <meta name="legacy-card-id" content="$escapedLegacy">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Chanson à Répondre">
  <meta property="og:title" content="$escapedTitle">
  <meta property="og:description" content="${_html('Open $title.')}">
  <meta property="og:image" content="$escapedImage">
  <meta property="og:image:url" content="$escapedImage">
  <meta property="og:image:secure_url" content="$escapedImage">
  <meta property="og:image:type" content="$escapedImageMimeType">
  <meta property="og:image:alt" content="$escapedTitle">
  <meta property="og:url" content="$escapedCanonical">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="$escapedTitle">
  <meta name="twitter:description" content="${_html('Open $title.')}">
  <meta name="twitter:image" content="$escapedImage">
  <meta name="twitter:image:alt" content="$escapedTitle">
  <link rel="canonical" href="$escapedCanonical">
</head>
<body>
  <p><a href="$escapedCanonical">Open the canonical card link</a></p>
  <script>window.location.replace($canonicalUrlJson);</script>
</body>
</html>
''';
}

Future<void> main(List<String> arguments) async {
  final options = _parseOptions(arguments);
  final catalogPath = options['catalog'] ?? AppConstants.cardsAsset;
  final brioPath = options['brio'] ?? AppConstants.brioDeckAsset;
  final buildPath = options['build-dir'] ?? 'build/web';
  final publicBase = Uri.parse(options['public-base'] ?? _defaultPublicBase);

  final cards = <_ShareCard>[
    ...await _loadUno(catalogPath),
    ...await _loadBrio(brioPath),
  ];
  final slugs = cards
      .map(
        (card) => CardShareIdentity.canonicalSlugFor(
          cardId: card.id,
          deckId: card.deckId,
        ),
      )
      .toSet();
  if (cards.length != 100 || slugs.length != 100) {
    throw FormatException(
      'Expected 100 built-in cards with unique canonical share slugs; '
      'found ${cards.length} cards and ${slugs.length} slugs.',
    );
  }

  final shareRoot = Directory('$buildPath/share');
  await shareRoot.create(recursive: true);
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
    if (card.imagePath.isEmpty) {
      throw FormatException('Missing image path for ${card.id}.');
    }

    final canonicalPage = File('${shareRoot.path}/$slug/index.html');
    await canonicalPage.parent.create(recursive: true);
    await canonicalPage.writeAsString(
      buildCanonicalShareHtml(
        publicBase: publicBase,
        cardId: card.id,
        shareSlug: slug,
        title: title,
        imagePath: card.imagePath,
        previewImagePath: card.previewImagePath,
        transcription: card.transcription,
        imageWidth: card.imageWidth,
        imageHeight: card.imageHeight,
      ),
    );

    final legacySlug = CardShareIdentity.legacySlugFor(
      cardId: card.id,
      deckId: card.deckId,
    );
    if (legacySlug != null && legacySlug != slug) {
      final legacyPage = File('${shareRoot.path}/$legacySlug/index.html');
      await legacyPage.parent.create(recursive: true);
      await legacyPage.writeAsString(
        buildLegacyRedirectHtml(
          publicBase: publicBase,
          legacySlug: legacySlug,
          canonicalSlug: slug,
          title: title,
          imagePath: card.imagePath,
        ),
      );
      legacyCount++;
    }
  }

  stdout.writeln(
    'Generated ${cards.length} canonical share pages and '
    '$legacyCount legacy redirects.',
  );
}

Future<List<_ShareCard>> _loadUno(String path) async {
  final decoded = jsonDecode(await File(path).readAsString());
  if (decoded is! Map<String, dynamic>) {
    throw const FormatException('The UNO card catalog must be an object.');
  }
  final rawDecks = decoded['decks'];
  if (rawDecks is! List<dynamic>) {
    throw const FormatException('The UNO card catalog has no decks list.');
  }
  final deck = rawDecks.whereType<Map<String, dynamic>>().firstWhere(
    (item) => item['id'] == AppConstants.productionDeckId,
  );
  final rawCards = deck['cards'];
  if (rawCards is! List<dynamic>) {
    throw const FormatException('The UNO deck has no cards list.');
  }
  final cards = rawCards.whereType<Map<String, dynamic>>().map((card) {
    return _ShareCard(
      id: card['id'] as String? ?? '',
      deckId: AppConstants.productionDeckId,
      deckName: deck['name'] as String? ?? 'Chanson à répondre UNO',
      imagePath: (card['path'] ?? card['image']) as String? ?? '',
      transcription: _shareTranscriptionFromJson(card),
      imageWidth: (card['imageWidth'] as num?)?.toInt(),
      imageHeight: (card['imageHeight'] as num?)?.toInt(),
    );
  }).toList(growable: false);
  if (cards.length != 84 || cards.map((card) => card.id).toSet().length != 84) {
    throw const FormatException('Expected 84 unique UNO cards.');
  }
  return cards;
}

Future<List<_ShareCard>> _loadBrio(String path) async {
  final decoded = jsonDecode(await File(path).readAsString());
  if (decoded is! Map<String, dynamic> ||
      decoded['id'] != AppConstants.brioDeckId) {
    throw const FormatException('Unexpected BRIO deck manifest.');
  }
  final rawCards = decoded['cards'];
  if (rawCards is! List<dynamic>) {
    throw const FormatException('The BRIO deck has no cards list.');
  }
  final cards = rawCards.whereType<Map<String, dynamic>>().map((card) {
    final id = card['id'] as String? ?? '';
    final slug = CardShareIdentity.canonicalSlugFor(
      cardId: id,
      deckId: AppConstants.brioDeckId,
    );
    return _ShareCard(
      id: id,
      deckId: AppConstants.brioDeckId,
      deckName: decoded['name'] as String? ?? 'Chanson à répondre BRIO',
      imagePath: (card['path'] ?? card['image']) as String? ?? '',
      previewImagePath: 'share-previews/$slug.jpg',
      transcription: _shareTranscriptionFromJson(card),
      imageWidth: 600,
      imageHeight: 900,
    );
  }).toList(growable: false);
  if (cards.length != 16 || cards.map((card) => card.id).toSet().length != 16) {
    throw const FormatException('Expected 16 unique BRIO cards.');
  }
  return cards;
}

String? _shareTranscriptionFromJson(Map<String, dynamic> card) {
  for (final key in const ['cleanedTranscription', 'transcription']) {
    final value = card[key];
    if (value is String && value.trim().isNotEmpty) return value.trim();
  }
  final parts = <String>[];
  for (final key in const ['question', 'answer']) {
    final value = card[key];
    if (value is String && value.trim().isNotEmpty) parts.add(value.trim());
  }
  return parts.isEmpty ? null : parts.join('\n\n');
}

Map<String, String> _parseOptions(List<String> arguments) {
  final result = <String, String>{};
  for (var index = 0; index < arguments.length; index += 2) {
    if (index + 1 >= arguments.length || !arguments[index].startsWith('--')) {
      throw const FormatException('Options must be --name value pairs.');
    }
    result[arguments[index].substring(2)] = arguments[index + 1];
  }
  return result;
}

String _imageMimeType(String path) {
  final normalized = path.toLowerCase();
  if (normalized.endsWith('.png')) return 'image/png';
  if (normalized.endsWith('.webp')) return 'image/webp';
  if (normalized.endsWith('.gif')) return 'image/gif';
  if (normalized.endsWith('.jpg') || normalized.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  return 'image/jpeg';
}

String _html(String value) => value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

class _ShareCard {
  const _ShareCard({
    required this.id,
    required this.deckId,
    required this.deckName,
    required this.imagePath,
    this.previewImagePath,
    this.transcription,
    this.imageWidth,
    this.imageHeight,
  });

  final String id;
  final String deckId;
  final String deckName;
  final String imagePath;
  final String? previewImagePath;
  final String? transcription;
  final int? imageWidth;
  final int? imageHeight;
}
