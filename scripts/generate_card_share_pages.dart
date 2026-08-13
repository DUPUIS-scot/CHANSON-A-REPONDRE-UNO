import 'dart:convert';
import 'dart:io';

const shareTitle = 'Chanson à Répondre UNO';
const shareDescription = 'Open this Chanson à Répondre UNO card.';

String buildCardShareHtml({
  required Uri publicBase,
  required String cardId,
  required String imagePath,
  int? imageWidth,
  int? imageHeight,
}) {
  final baseSegments = publicBase.pathSegments.where((item) => item.isNotEmpty);
  final shareUrl = publicBase.replace(
    pathSegments: [...baseSegments, 'share', cardId, ''],
  );
  final deepLink = publicBase.replace(fragment: '/cards/$cardId');
  final imageUrl = publicBase.replace(
    pathSegments: [...baseSegments, 'assets', ...imagePath.split('/')],
  );
  final escapedTitle = _html(shareTitle);
  final escapedDescription = _html(shareDescription);
  final escapedShareUrl = _html(shareUrl.toString());
  final escapedImageUrl = _html(imageUrl.toString());
  final escapedDeepLink = _html(deepLink.toString());
  final redirectJson = jsonEncode(deepLink.toString());
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

  return '''<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>$escapedTitle</title>
  <meta name="description" content="$escapedDescription">
  <meta property="og:type" content="website">
  <meta property="og:title" content="$escapedTitle">
  <meta property="og:description" content="$escapedDescription">
  <meta property="og:image" content="$escapedImageUrl">
${dimensions.toString()}  <meta property="og:url" content="$escapedShareUrl">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="$escapedTitle">
  <meta name="twitter:description" content="$escapedDescription">
  <meta name="twitter:image" content="$escapedImageUrl">
  <link rel="canonical" href="$escapedShareUrl">
  <meta http-equiv="refresh" content="0; url=$escapedDeepLink">
</head>
<body>
  <p><a href="$escapedDeepLink">Open this card</a></p>
  <script>window.location.replace($redirectJson);</script>
</body>
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
  final catalogPath = options['catalog'] ?? 'assets/json/cards.json';
  final buildPath = options['build-dir'] ?? 'build/web';
  final publicBase = Uri.parse(
    options['public-base'] ??
        'https://dupuis-scot.github.io/CHANSON-A-REPONDRE-UNO/',
  );
  final decoded = jsonDecode(await File(catalogPath).readAsString());
  final decks = (decoded as Map<String, dynamic>)['decks'] as List<dynamic>;
  final cards = decks
      .whereType<Map<String, dynamic>>()
      .expand((deck) => (deck['cards'] as List<dynamic>))
      .whereType<Map<String, dynamic>>()
      .toList(growable: false);
  final cardIds = cards.map((card) => card['id']).whereType<String>().toSet();
  if (cards.length != 84 || cardIds.length != 84) {
    throw FormatException(
      'Expected exactly 84 permanent cards with unique IDs; found '
      '${cards.length} cards and ${cardIds.length} IDs.',
    );
  }
  final shareRoot = Directory('$buildPath/share');
  await shareRoot.create(recursive: true);

  for (final card in cards) {
    final id = card['id'] as String? ?? '';
    final imagePath = (card['path'] ?? card['image']) as String? ?? '';
    if (!RegExp(r'^[A-Za-z0-9._-]+$').hasMatch(id) || imagePath.isEmpty) {
      throw FormatException('Invalid share metadata for card "$id".');
    }
    final page = File('${shareRoot.path}/$id/index.html');
    await page.parent.create(recursive: true);
    await page.writeAsString(
      buildCardShareHtml(
        publicBase: publicBase,
        cardId: id,
        imagePath: imagePath,
        imageWidth: (card['imageWidth'] as num?)?.toInt(),
        imageHeight: (card['imageHeight'] as num?)?.toInt(),
      ),
    );
  }
  stdout.writeln('Generated ${cards.length} card share preview pages.');
}

Map<String, String> _options(List<String> arguments) {
  final result = <String, String>{};
  for (var index = 0; index < arguments.length; index += 2) {
    if (index + 1 >= arguments.length || !arguments[index].startsWith('--')) {
      throw const FormatException('Options must be --name value pairs.');
    }
    result[arguments[index].substring(2)] = arguments[index + 1];
  }
  return result;
}
