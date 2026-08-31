import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('laboratory video binds Blender book pages and mirror surfaces', () {
    final bridge = File('web/card_castle/castle_bureau_video_bridge.js').readAsStringSync();
    final overlay = File('web/card_castle/castle_navigation_overlay.js').readAsStringSync();
    final medallion = File('web/card_castle/castle_laboratory_medallion_button.js').readAsStringSync();

    expect(bridge, contains("const VERSION = 'v81'"));
    expect(bridge, contains("../assets/assets/videos/bureau_screen_loop.mp4"));
    expect(bridge, contains(r'const BOOK_NAME = /^VideoBookPage_(Left|Right)$/i'));
    expect(bridge, contains("bureauVideoContract = 'VideoBookPage_Left|VideoBookPage_Right|mirror-surface'"));
    expect(bridge, contains("expectedBooks:['VideoBookPage_Left','VideoBookPage_Right']"));
    expect(bridge, contains('looksLikeMirrorSurface'));
    expect(bridge, contains('LEGACY_MIRROR_NAME'));
    expect(bridge, contains('book-and-mirror-ready-${VERSION}'));
    expect(bridge, contains('side:THREE.DoubleSide'));
    expect(bridge, contains('texture.flipY = false'));
    expect(bridge, contains("attemptPlay('surface-click')"));
    expect(bridge, contains('boundMirrors:[...mirrorMeshes]'));
    expect(overlay, contains("castle_bureau_video_bridge.js?v=81"));
    expect(medallion, contains('window.__castleBureauVideoPrime?.()'));
  });
}
