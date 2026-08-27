import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('terminal exposes and installs the v6 authoritative runtime', () {
    final liveCopy = File('web/enochian-test/live-copy.html').readAsStringSync();
    final authority =
        File('web/enochian-test/authoritative-runtime.js').readAsStringSync();
    final terminal =
        File('web/enochian-terminal/index.html').readAsStringSync();

    expect(liveCopy, contains('window.__enochStemRuntimeApi='));
    expect(liveCopy, contains("version:'v1'"));
    expect(authority, contains('const api=w.__enochStemRuntimeApi'));
    expect(authority, isNot(contains("typeof setStemMode!=='function'")));
    expect(authority,
        contains("d.documentElement.dataset.authoritativeRuntime='v6'"));
    expect(terminal,
        contains('live-copy.html?v=20260827-cache-repair-v4'));
    expect(terminal,
        contains('authoritative-runtime.js?v=20260825-runtime-api-v2'));
    expect(terminal,
        contains('enochian-ui-repairs-v1.js?v=20260827-ui-repairs-v3'));
    expect(terminal, contains('installEnochianUiRepairsV1'));
  });
}
