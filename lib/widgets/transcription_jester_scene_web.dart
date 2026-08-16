// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:async';
import 'dart:html' as html;
import 'dart:js_interop';
import 'dart:ui_web' as ui_web;

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
  late final String _viewType;
  bool _mountedScene = false;

  @override
  void initState() {
    super.initState();
    final stamp = DateTime.now().microsecondsSinceEpoch;
    _elementId = 'transcription-jester-$stamp';
    _viewType = 'transcription-jester-view-$stamp';

    ui_web.platformViewRegistry.registerViewFactory(_viewType, (_) {
      return html.DivElement()
        ..id = _elementId
        ..className = 'transcription-jester-scene'
        ..setAttribute(
          'aria-label',
          'Animated 3D jester laughing toward the viewer',
        )
        ..style.width = '100%'
        ..style.height = '100%'
        ..style.position = 'relative'
        ..style.pointerEvents = 'none'
        ..style.overflow = 'hidden'
        ..style.opacity = '0.92'
        ..style.backgroundColor = 'transparent';
    });
  }

  void _mount(int _) {
    if (_mountedScene) return;
    _mountedScene = true;
    Timer.run(() {
      if (mounted) _createTranscriptionJester(_elementId);
    });
  }

  @override
  void dispose() {
    if (_mountedScene) _destroyTranscriptionJester(_elementId);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => IgnorePointer(
    child: HtmlElementView(
      viewType: _viewType,
      onPlatformViewCreated: _mount,
    ),
  );
}
