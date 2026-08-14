import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  const siteUrl = 'https://www.chanson-a-repondre-uno.scot/';
  const imageUrl =
      'https://www.chanson-a-repondre-uno.scot/'
      'social/chanson-a-repondre-uno-share.png';

  test('main page explicitly uses the official custom-domain preview', () {
    final html = File('web/index.html').readAsStringSync();

    expect(html, contains('property="og:image"'));
    expect(html, contains('property="og:image:secure_url"'));
    expect(html, contains('name="twitter:image"'));
    expect(RegExp(RegExp.escape(imageUrl)).allMatches(html), hasLength(3));
    expect(html, contains('property="og:url"\n    content="$siteUrl"'));
    expect(html, contains('<link rel="canonical" href="$siteUrl">'));
    expect(html, contains('property="og:image:width" content="1200"'));
    expect(html, contains('property="og:image:height" content="630"'));
    expect(
      html,
      isNot(
        anyOf(
          contains('githubassets'),
          contains('githubusercontent'),
          contains('avatars.github'),
        ),
      ),
    );
  });

  test('official social preview is a 1200 by 630 PNG', () {
    final bytes = File(
      'web/social/chanson-a-repondre-uno-share.png',
    ).readAsBytesSync();

    expect(bytes.sublist(0, 8), [137, 80, 78, 71, 13, 10, 26, 10]);
    expect(ascii.decode(bytes.sublist(12, 16)), 'IHDR');
    expect(_uint32(bytes, 16), 1200);
    expect(_uint32(bytes, 20), 630);
  });
}

int _uint32(List<int> bytes, int offset) =>
    (bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3];
