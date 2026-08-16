import 'dart:async';
import 'dart:js_interop';

import 'package:flutter/material.dart';

@JS('transcriptionJesterCreate')
external void _createTranscriptionJester(String id);

@JS('transcriptionJesterDestroy')
external void _destroyTranscriptionJester(String id);

@JS('transcriptionJesterSetSelectedCard')
external void _setTranscriptionJesterSelectedCard(String cardId, String imagePath);

class TranscriptionJesterScene extends StatefulWidget {
  const TranscriptionJesterScene({super.key});

  static void setSelectedCard({
    required String cardId,
    required String imagePath,
  }) {
    try {
      _setTranscriptionJesterSelectedCard(cardId, imagePath);
    } catch (_) {
      // The JS module may not have finished loading yet; the screen retries
      // scene creation and the selected card can be supplied again on rebuild.
    }
  }

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
