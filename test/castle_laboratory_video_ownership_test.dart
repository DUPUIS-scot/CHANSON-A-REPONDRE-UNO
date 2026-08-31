import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('laboratory book pages and mirror use independent video sources', () {
    final bridge = File('web/card_castle/castle_bureau_video_bridge.js').readAsStringSync();
    final overlay = File('web/card_castle/castle_navigation_overlay.js').readAsStringSync();
    final medallion = File('web/card_castle/castle_laboratory_medallion_button.js').readAsStringSync();

    expect(bridge, contains("const VERSION = 'v82'"));
    expect(bridge, contains("BOOK_VIDEO_URL = new URL('../assets/assets/videos/bureau_screen_loop.mp4'"));
    expect(bridge, contains("MIRROR_VIDEO_URL = new URL('../assets/assets/videos/0830(1).mp4'"));
    expect(bridge, contains(r'const BOOK_NAME = /^VideoBookPage_(Left|Right)$/i'));
    expect(bridge, contains(r'const MIRROR_NAME = /^VideoScreen_(Left|Right)$/i'));
    expect(bridge, contains("expectedBooks:['VideoBookPage_Left','VideoBookPage_Right']"));
    expect(bridge, contains("expectedMirrors:['VideoScreen_Left','VideoScreen_Right']"));
    expect(bridge, contains(r'book-and-mirror-ready-${VERSION}'));
    expect(bridge, contains('side:THREE.DoubleSide'));
    expect(bridge, contains('texture.flipY = false'));
    expect(bridge, contains("playAll('surface-click')"));
    expect(bridge, contains('boundMirrors:[...mirrorMeshes]'));
    expect(overlay, contains("castle_bureau_video_bridge.js?v=82"));
    expect(medallion, contains('window.__castleBureauVideoPrime?.()'));
  });
}
