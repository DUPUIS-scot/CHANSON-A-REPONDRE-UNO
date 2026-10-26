import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('mobile Bandcamp player stays clear of iOS safe areas', () {
    final page = File('web/lubiak/index.html').readAsStringSync();

    expect(
      page,
      contains(
        '#bandcamp{'
        'left:max(12px,calc(env(safe-area-inset-left) + 12px))!important;'
        'bottom:max(12px,calc(env(safe-area-inset-bottom) + 12px))!important}',
      ),
    );
    expect(
      page,
      contains(
        'https://bandcamp.com/EmbeddedPlayer/album=3240607156/'
        'size=small/bgcol=ffffff/linkcol=0687f5/track=4156153332/'
        'transparent=true/',
      ),
    );
  });
}
