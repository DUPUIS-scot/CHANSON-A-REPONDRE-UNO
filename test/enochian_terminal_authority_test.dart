import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('terminal exposes consolidated Enochian and 2JESTER authorities', () {
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
    final radial = File('web/enochian-test/double-jecker-radial-layout-v1.js')
        .readAsStringSync();
    final stemJester = File('web/enochian-test/double-decker-main-stem-link-v1.js')
        .readAsStringSync();
    final jesterRuntime = File('web/enochian-test/double-jecker-runtime-repair-v1.js')
        .readAsStringSync();
    final polish = File('web/enochian-test/enochian-terminal-polish-v1.js')
        .readAsStringSync();
    final twoJ = File('web/enochian-test/double-jester-portal-spinner-v1.js')
        .readAsStringSync();
    final jesterTransport =
        File('web/enochian-test/double-jester-independent-transport-v1.js')
            .readAsStringSync();
    final jesterOutput = File('web/enochian-test/double-jecker-output-v1.js')
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
        contains('double-decker-main-stem-link-v1.js?v=20260829-stem-jester-v14'));
    expect(terminal,
        contains('double-jecker-radial-layout-v1.js?v=20260829-jester-radial-v13'));
    expect(terminal,
        contains('double-jecker-runtime-repair-v1.js?v=20260827-jester-authority-v11'));
    expect(terminal,
        contains('enochian-terminal-polish-v1.js?v=20260827-polish-v3'));
    expect(terminal,
        contains('enochian-ui-repairs-v1.js?v=20260827-ui-repairs-v7'));
    expect(terminal,
        contains('analyser-controls-contained-v1.js?v=20260827-v6'));
    expect(terminal,
        contains('playback-transport-authority-v1.js?v=20260827-v1'));
    expect(terminal,
        contains('two-mix-master-anchor-v1.js?v=20260827-signal-memory-v10'));

    expect(radial, contains("VERSION='v13'"));
    expect(radial, contains('doubleJesterRadialPanelRectV13'));
    expect(radial, contains('jesterRadialAuthority===VERSION'));
    expect(radial, contains("panel.dataset.jeckerRadial='v13'"));
    expect(radial, contains("content:none!important;display:none!important"));
    expect(radial, contains('other:[22,34]'));
    expect(radial, contains('vocals:[34,82]'));
    expect(stemJester, contains("const VERSION='v11'"));
    expect(stemJester, contains("['vocals','drums','bass','other']"));
    expect(stemJester, isNot(contains("mainLevel('instruments')")));
    expect(jesterRuntime, contains("const VERSION='v11'"));
    expect(jesterRuntime, contains('__enochDoubleJesterAuthority'));
    expect(polish, contains("VERSION='20260827-polish-v3'"));
    expect(polish, isNot(contains('const coords={A:{vocals:[30,17]')));
    expect(polish, isNot(contains('JECKER_STORE=')));
    expect(twoJ, contains("const VERSION='v4'"));
    expect(twoJ, contains("faces:['mirror','double-deck']"));
    expect(twoJ, contains('STEMS DOUBLE DECK'));
    expect(twoJ, contains("modeAuthority:'2J performance v6'"));
    expect(twoJ, isNot(contains('data-2j-mode')));
    expect(jesterTransport, contains("const VERSION='v2'"));
    expect(jesterTransport, contains('data-jester-play'));
    expect(jesterTransport, contains('data-jester-pause'));
    expect(jesterOutput, contains('MASTER JESTER'));

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
