import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Windows Castle waits for jester before interior preload', () {
    final bootstrap = File('web/flutter_bootstrap.js').readAsStringSync();

    expect(
      bootstrap,
      contains("windowsPostExteriorStage = 'waiting-for-jester-terminal-state'"),
    );
    expect(bootstrap, contains('new MutationObserver(finishIfTerminal)'));
    expect(bootstrap, contains("attributeFilter: ['data-castle-jester']"));
    expect(
      bootstrap,
      contains("jesterState !== 'ready' && jesterState !== 'failed'"),
    );
    expect(
      bootstrap,
      contains('finishWindowsPostExteriorStage(jesterState)'),
    );
    expect(bootstrap, contains('frameWindow.__castlePreloadInterior?.();'));

    // Windows must not start the interior merely because a short polling
    // timeout elapsed while the jester GLB is still downloading or decoding.
    expect(bootstrap, isNot(contains('jesterPolls')));
    expect(bootstrap, isNot(contains('__castleEnableDeferredQuality')));
  });
}
