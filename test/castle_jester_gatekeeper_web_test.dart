import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('castle jester is the only entrance trigger', () {
    final html = File('web/card_castle/card_castle.html').readAsStringSync();
    final controller = File('web/card_castle/castle_jester_gatekeeper.js').readAsStringSync();

    expect(html, contains('CastleJesterGatekeeper'));
    expect(html, contains('CASTLE_JESTER_URL'));
    expect(html, isNot(contains('castle-door-flash')));
    expect(html, isNot(contains('castle-door-hover')));
    expect(html, isNot(contains('isCastleDoorHit')));
    expect(controller, contains("document.body.dataset.castleJesterState='entering'"));
    expect(controller, contains('this.onEnterRequested?.()'));
  });
}
