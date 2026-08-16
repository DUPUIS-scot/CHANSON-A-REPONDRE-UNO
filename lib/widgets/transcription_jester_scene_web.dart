// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:async';
import 'dart:html' as html;
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

  static String? _pendingCardId;
  static String? _pendingImagePath;

  static void setSelectedCard({
    required String cardId,
    required String imagePath,
  }) {
    _pendingCardId = cardId;
    _pendingImagePath = imagePath;
    _pushPendingCardToJs();
  }

  static void setOverlayVisible(bool visible) {
    for (final element in html.document.querySelectorAll(
      '[data-transcription-jester-canvas="true"]',
    )) {
      element.style.visibility = visible ? 'visible' : 'hidden';
    }
  }

  static void _pushPendingCardToJs() {
    final cardId = _pendingCardId;
    final imagePath = _pendingImagePath;
    if (cardId == null || imagePath == null) return;
    try {
      _setTranscriptionJesterSelectedCard(cardId, imagePath);
    } catch (_) {
      // The JS module may not have finished loading yet. The scene retries
      // this handoff every time scene creation is attempted/succeeds.
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
      TranscriptionJesterScene._pushPendingCardToJs();
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
