// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:async';
import 'dart:html' as html;
import 'dart:ui_web' as ui_web;

import 'package:flutter/material.dart';

class RulesMachineView extends StatefulWidget {
  const RulesMachineView({
    super.key,
    this.interactive = true,
    this.onSwipeUp,
    this.onSwipeDown,
  });

  final bool interactive;
  final VoidCallback? onSwipeUp;
  final VoidCallback? onSwipeDown;

  @override
  State<RulesMachineView> createState() => _RulesMachineViewState();
}

class _RulesMachineViewState extends State<RulesMachineView> {
  late final String _viewType;
  html.IFrameElement? _iframe;
  StreamSubscription<html.MessageEvent>? _messageSubscription;

  @override
  void initState() {
    super.initState();
    _viewType = 'rules-machine-${DateTime.now().microsecondsSinceEpoch}';
    _messageSubscription = html.window.onMessage.listen((event) {
      final data = event.data;
      if (data == 'rules-machine-swipe-up') {
        widget.onSwipeUp?.call();
      } else if (data == 'rules-machine-swipe-down') {
        widget.onSwipeDown?.call();
      }
    });
    ui_web.platformViewRegistry.registerViewFactory(_viewType, (_) {
      final uri = Uri.base.resolve('rules_machine/index.html');
      final iframe = html.IFrameElement()
        ..src = uri.toString()
        ..title = 'Interactive segmented Rules machine'
        ..setAttribute('allow', 'fullscreen')
        ..setAttribute('allowfullscreen', 'true')
        ..style.border = '0'
        ..style.width = '100%'
        ..style.height = '100%'
        ..style.display = 'block'
        ..style.backgroundColor = '#080706';
      _iframe = iframe;
      _syncPointerOwnership();
      return iframe;
    });
  }

  @override
  void didUpdateWidget(covariant RulesMachineView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.interactive != widget.interactive) {
      _syncPointerOwnership();
    }
  }

  void _syncPointerOwnership() {
    final iframe = _iframe;
    if (iframe == null) return;
    iframe.style.pointerEvents = widget.interactive ? 'auto' : 'none';
  }

  @override
  void dispose() {
    _messageSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => HtmlElementView(viewType: _viewType);
}
