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
  bool _mountedScene = false;

  @override
  void initState() {
    super.initState();
    _elementId =
        'transcription-jester-${DateTime.now().microsecondsSinceEpoch}';
    Timer.run(() {
      if (!mounted || _mountedScene) return;
      _mountedScene = true;
      _createTranscriptionJester(_elementId);
    });
  }

  @override
  void dispose() {
    if (_mountedScene) _destroyTranscriptionJester(_elementId);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => const IgnorePointer(
    child: SizedBox.expand(),
  );
}
