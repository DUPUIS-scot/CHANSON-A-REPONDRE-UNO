import 'dart:convert';
import 'dart:io';

import 'package:uno_chanson_2/core/app_constants.dart';
import 'package:uno_chanson_2/services/card_share_identity.dart';

const _defaultPublicBase =
    'https://dupuis-scot.github.io/CHANSON-A-REPONDRE-UNO/';
const _imageExtensions = ['.png', '.jpg', '.jpeg', '.webp'];

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
  final root = publicBase.pathSegments.where((s) => s.isNotEmpty);
  final shareUrl = publicBase.replace(
    pathSegments: [...root, 'share', shareSlug, ''],
  );
  final deepLink = publicBase.replace(fragment: '/cards/$cardId');
  final socialImagePath = previewImagePath ?? imagePath;
  final imageUrl = publicBase.replace(
    pathSegments: [
      ...root,
      'assets',
      if (previewImagePath == null) 'assets',
      ...socialImagePath.split('/'),
    ],
  );
  final mime = _imageMimeType(socialImagePath);
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
  final t = _html(title);
  final id = _html(cardId);
  final share = _html(shareUrl.toString());
  final deep = _html(deepLink.toString());
  final image = _html(imageUrl.toString());
  final type = _html(mime);
  final text = _html(transcription?.trim() ?? '');
  final description = _html('Open $title.');
  final deepJson = jsonEncode(deepLink.toString());
  return '''<!doctype html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>$t</title><meta name="description" content="$description"><meta name="card-id" content="$id"><meta property="og:type" content="website"><meta property="og:site_name" content="Chanson à Répondre"><meta property="og:title" content="$t"><meta property="og:description" content="$description"><meta property="og:image" content="$image"><meta property="og:image:url" content="$image"><meta property="og:image:secure_url" content="$image"><meta property="og:image:type" content="$type"><meta property="og:image:alt" content="$t">$dimensions<meta property="og:url" content="$share"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="$t"><meta name="twitter:description" content="$description"><meta name="twitter:image" content="$image"><meta name="twitter:image:alt" content="$t"><link rel="canonical" href="$share"></head><body><main><h1>$t</h1><p>Card ID: <span id="card-id">$id</span></p><figure><img id="card-image" src="$image" alt="$t" style="max-width:min(100%,600px);height:auto"></figure><section><h2>Card transcription</h2><pre id="card-transcription" style="white-space:pre-wrap">${text.isEmpty ? 'No static transcription is embedded for this card yet. Use the card image above or the in-app transcription.' : text}</pre></section><p><a href="$deep">Open this card in Chanson à Répondre</a></p></main><script>window.location.replace($deepJson);</script></body></html>''';
}

String buildLegacyRedirectHtml({
  required Uri publicBase,
  required String legacySlug,
  required String canonicalSlug,
  required String title,
  required String imagePath,
}) {
  final root = publicBase.pathSegments.where((s) => s.isNotEmpty);
  final canonical = publicBase.replace(
    pathSegments: [...root, 'share', canonicalSlug, ''],
  );
  final image = publicBase.replace(
    pathSegments: [...root, 'assets', 'assets', ...imagePath.split('/')],
  );
  final c = _html(canonical.toString());
  final i = _html(image.toString());
  final t = _html(title);
  final json = jsonEncode(canonical.toString());
  return '''<!doctype html><html><head><meta charset="UTF-8"><title>$t</title><meta property="og:title" content="$t"><meta property="og:image" content="$i"><meta property="og:url" content="$c"><link rel="canonical" href="$c"></head><body><a href="$c">Open canonical card link</a><script>window.location.replace($json);</script></body></html>''';
}

Future<void> main(List<String> arguments) async {
  final options = _parseOptions(arguments);
  final catalog = options['catalog'] ?? AppConstants.cardsAsset;
  final brio = options['brio'] ?? AppConstants.brioDeckAsset;
  final build = options['build-dir'] ?? 'build/web';
  final base = Uri.parse(options['public-base'] ?? _defaultPublicBase);

  final cards = <_ShareCard>[
    ...await _loadUno(catalog),
    ...await _loadBrio(brio),
    ..._loadHp(),
  ];
  final slugs = cards
      .map(
        (card) => CardShareIdentity.canonicalSlugFor(
          cardId: card.id,
          deckId: card.deckId,
        ),
      )
      .toSet();
  if (cards.length < 101 || slugs.length != cards.length) {
    throw FormatException(
      'Built-in cards must include the base decks and unique share slugs; '
      'found ${cards.length} cards and ${slugs.length} slugs.',
    );
  }

  final root = Directory('$build/share');
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
    final page = File('${root.path}/$slug/index.html');
    await page.parent.create(recursive: true);
    await page.writeAsString(
      buildCanonicalShareHtml(
        publicBase: base,
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
    final legacy = CardShareIdentity.legacySlugFor(
      cardId: card.id,
      deckId: card.deckId,
    );
    if (legacy != null && legacy != slug) {
      final legacyPage = File('${root.path}/$legacy/index.html');
      await legacyPage.parent.create(recursive: true);
      await legacyPage.writeAsString(
        buildLegacyRedirectHtml(
          publicBase: base,
          legacySlug: legacy,
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
  final decoded = jsonDecode(await File(path).readAsString())
      as Map<String, dynamic>;
  final deck = (decoded['decks'] as List)
      .whereType<Map<String, dynamic>>()
      .firstWhere((entry) => entry['id'] == AppConstants.productionDeckId);
  final cards = (deck['cards'] as List)
      .whereType<Map<String, dynamic>>()
      .map(
        (card) => _ShareCard(
          id: card['id'] ?? '',
          deckId: AppConstants.productionDeckId,
          deckName: deck['name'] ?? 'Chanson à répondre UNO',
          imagePath: _assetRelative((card['path'] ?? card['image']) ?? ''),
          transcription: _shareTranscriptionFromJson(card),
          imageWidth: (card['imageWidth'] as num?)?.toInt(),
          imageHeight: (card['imageHeight'] as num?)?.toInt(),
        ),
      )
      .toList();
  if (cards.length < 84) {
    throw const FormatException('Expected at least 84 UNO cards.');
  }

  final known = cards.map((card) => 'assets/${card.imagePath}').toSet();
  final extras = _imageFiles('assets/cards/final_import')
      .where((file) => !known.contains(file.path.replaceAll('\\', '/')))
      .toList();
  for (final file in extras) {
    final number = cards.length + 1;
    cards.add(
      _ShareCard(
        id: 'final-84-${number.toString().padLeft(2, '0')}',
        deckId: AppConstants.productionDeckId,
        deckName: deck['name'] ?? 'Chanson à répondre UNO',
        imagePath: _assetRelative(file.path),
      ),
    );
  }
  return cards;
}

Future<List<_ShareCard>> _loadBrio(String path) async {
  final decoded = jsonDecode(await File(path).readAsString())
      as Map<String, dynamic>;
  final cards = (decoded['cards'] as List)
      .whereType<Map<String, dynamic>>()
      .map((card) {
        final id = card['id'] as String? ?? '';
        final slug = CardShareIdentity.canonicalSlugFor(
          cardId: id,
          deckId: AppConstants.brioDeckId,
        );
        return _ShareCard(
          id: id,
          deckId: AppConstants.brioDeckId,
          deckName: decoded['name'] ?? 'Chanson à répondre BRIO',
          imagePath: _assetRelative((card['path'] ?? card['image']) ?? ''),
          previewImagePath: 'share-previews/$slug.jpg',
          transcription: _shareTranscriptionFromJson(card),
          imageWidth: 600,
          imageHeight: 900,
        );
      })
      .toList();
  if (cards.length < 16) {
    throw const FormatException('Expected at least 16 BRIO cards.');
  }

  final known = cards.map((card) => 'assets/${card.imagePath}').toSet();
  final extras = _imageFiles('assets/decks/chanson_a_repondre_brio/cards')
      .where((file) => !known.contains(file.path.replaceAll('\\', '/')))
      .toList();
  for (final file in extras) {
    final number = cards.length + 1;
    final id = 'brio-${number.toString().padLeft(3, '0')}';
    final slug = CardShareIdentity.canonicalSlugFor(
      cardId: id,
      deckId: AppConstants.brioDeckId,
    );
    cards.add(
      _ShareCard(
        id: id,
        deckId: AppConstants.brioDeckId,
        deckName: decoded['name'] ?? 'Chanson à répondre BRIO',
        imagePath: _assetRelative(file.path),
        previewImagePath: 'share-previews/$slug.jpg',
        imageWidth: 600,
        imageHeight: 900,
      ),
    );
  }
  return cards;
}

List<_ShareCard> _loadHp() {
  final files = _imageFiles('assets/hp')
      .where((file) {
        final name = file.uri.pathSegments.last.toLowerCase();
        return name != 'verso.png' && name != 'work_in_progress_ribbon.webp';
      })
      .toList();
  if (files.isEmpty) {
    throw const FormatException('Expected at least one HP card.');
  }
  return [
    for (var index = 0; index < files.length; index++)
      _ShareCard(
        id: 'hp-${(index + 1).toString().padLeft(3, '0')}',
        deckId: AppConstants.hpDeckId,
        deckName: 'Chanson à répondre HP',
        imagePath: _assetRelative(files[index].path),
        previewImagePath:
            'share-previews/HP-${(index + 1).toString().padLeft(3, '0')}.jpg',
        imageWidth: 600,
        imageHeight: 900,
      ),
  ];
}

List<File> _imageFiles(String directory) {
  final root = Directory(directory);
  if (!root.existsSync()) return const [];
  final files = root
      .listSync(recursive: false)
      .whereType<File>()
      .where((file) {
        final lower = file.path.toLowerCase();
        return _imageExtensions.any(lower.endsWith);
      })
      .toList()
    ..sort(
      (a, b) => a.path.toLowerCase().compareTo(b.path.toLowerCase()),
    );
  return files;
}

String _assetRelative(String path) {
  final normalized = path.replaceAll('\\', '/');
  return normalized.startsWith('assets/')
      ? normalized.substring('assets/'.length)
      : normalized;
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
  final lower = path.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
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
