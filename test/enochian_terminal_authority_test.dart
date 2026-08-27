import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('terminal exposes and installs the v6 authoritative runtime', () {
    final liveCopy = File('web/enochian-test/live-copy.html').readAsStringSync();
    final authority =
        File('web/enochian-test/authoritative-runtime.js').readAsStringSync();
    final terminal =
        File('web/enochian-terminal/index.html').readAsStringSync();
    final playbackOwner = File('web/enochian-test/playback-transport-authority-v1.js')
        .readAsStringSync();
    final twoMixOwner = File('web/enochian-test/two-mix-master-anchor-v1.js')
        .readAsStringSync();
    final signalOwner = File('web/enochian-test/analyser-controls-contained-v1.js')
        .readAsStringSync();

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
        contains('enochian-ui-repairs-v1.js?v=20260827-ui-repairs-v5'));
    expect(terminal,
        contains('analyser-controls-contained-v1.js?v=20260827-v5'));
    expect(terminal, contains('installEnochianUiRepairsV1'));
    expect(terminal, contains('installEnochianAnalyserControlsContainedV1'));
    expect(playbackOwner, contains("playbackTransportAuthority='v1'"));
    expect(playbackOwner, contains('repeat(9,minmax(0,1fr))'));
    expect(twoMixOwner, contains("twoMixMasterAnchor='v1'"));
    expect(twoMixOwner, contains('two-mix-help-open'));
    expect(signalOwner, contains("analyserControlsContained='v6'"));
    expect(signalOwner, isNot(contains('const repairPlayback=')));
    expect(signalOwner, isNot(contains('const repairTwoMix=')));
  });
}
