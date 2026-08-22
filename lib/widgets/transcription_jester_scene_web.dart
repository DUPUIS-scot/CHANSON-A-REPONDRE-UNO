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

@JS('transcriptionPuppetSetEnabled')
external void _setTranscriptionPuppetEnabled(bool enabled);

@JS('transcriptionPuppetReset')
external void _resetTranscriptionPuppet();

class TranscriptionJesterScene extends StatefulWidget {
  const TranscriptionJesterScene({super.key});

  static String? _pendingCardId;
  static String? _pendingImagePath;
  static bool _pendingPuppetEnabled = false;
  static bool _puppetScriptRequested = false;

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
      if (!visible) {
        element.style.visibility = 'hidden';
        continue;
      }
      final isPuppet = element.dataset['transcriptionPuppet'] == 'true';
      element.style.visibility = _pendingPuppetEnabled
          ? (isPuppet ? 'visible' : 'hidden')
          : (isPuppet ? 'hidden' : 'visible');
    }
  }

  static void setPuppetMode(bool enabled) {
    _pendingPuppetEnabled = enabled;
    _ensurePuppetScript();
    _pushPendingPuppetToJs();
  }

  static void resetPuppetPose() {
    _ensurePuppetScript();
    try {
      _resetTranscriptionPuppet();
    } catch (_) {
      // The module may still be loading. Reset is intentionally best-effort.
    }
  }

  static void _ensurePuppetScript() {
    if (_puppetScriptRequested) return;
    _puppetScriptRequested = true;

    final existing = html.document.querySelector(
      'script[data-transcription-puppet-module="true"]',
    );
    if (existing != null) {
      Timer(Duration.zero, _pushPendingPuppetToJs);
      return;
    }

    final script = html.ScriptElement()
      ..type = 'module'
      ..src = 'transcription_puppet.js?v=20260822a'
      ..dataset['transcriptionPuppetModule'] = 'true';
    script.onLoad.listen((_) => _pushPendingPuppetToJs());
    html.document.head?.append(script);
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

  static void _pushPendingPuppetToJs() {
    try {
      _setTranscriptionPuppetEnabled(_pendingPuppetEnabled);
    } catch (_) {
      // The optional puppet module may still be loading.
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
      TranscriptionJesterScene._pushPendingPuppetToJs();
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
