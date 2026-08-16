import 'dart:async';
import 'dart:js_interop';

import 'package:flutter/material.dart';

@JS('transcriptionJesterCreate')
external void _createTranscriptionJester(String id);

@JS('transcriptionJesterDestroy')
external void _destroyTranscriptionJester(String id);

class TranscriptionJesterScene extends StatefulWidget {
  const TranscriptionJesterScene({super.key});

  @override
  State<TranscriptionJesterScene> createState() =>
      _TranscriptionJesterSceneState();
}

class _TranscriptionJesterSceneState extends State<TranscriptionJesterScene> {
  late final String _elementId;
  final List<Timer> _retryTimers = [];
  bool _mountedScene = false;

  @override
  void initState() {
    super.initState();
    _elementId =
        'transcription-jester-${DateTime.now().microsecondsSinceEpoch}';

    // Module scripts can finish loading after Flutter has mounted this widget on
    // slower browsers. Retry scene creation so a first-call timing race cannot
    // leave the transcription route without its jester.
    for (final delay in const [
      Duration.zero,
      Duration(milliseconds: 250),
      Duration(milliseconds: 750),
      Duration(milliseconds: 1500),
      Duration(milliseconds: 3000),
    ]) {
      _retryTimers.add(Timer(delay, _tryMountScene));
    }
  }

  void _tryMountScene() {
    if (!mounted || _mountedScene) return;
    try {
      _createTranscriptionJester(_elementId);
      _mountedScene = true;
      for (final timer in _retryTimers) {
        timer.cancel();
      }
    } catch (_) {
      // A later retry will run after transcription_jester.js is available.
    }
  }

  @override
  void dispose() {
    for (final timer in _retryTimers) {
      timer.cancel();
    }
    if (_mountedScene) {
      try {
        _destroyTranscriptionJester(_elementId);
      } catch (_) {
        // The page may already be tearing down the JS module.
      }
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => const IgnorePointer(
        child: SizedBox.expand(),
      );
}
