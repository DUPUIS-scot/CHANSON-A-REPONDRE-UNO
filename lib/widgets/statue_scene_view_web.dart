// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:html' as html;
import 'dart:ui_web' as ui_web;

import 'package:flutter/material.dart';

class StatueSceneView extends StatefulWidget {
  const StatueSceneView({super.key});

  @override
  State<StatueSceneView> createState() => _StatueSceneViewState();
}

class _StatueSceneViewState extends State<StatueSceneView> {
  late final String _viewType;

  @override
  void initState() {
    super.initState();
    _viewType = 'interactive-statue-${DateTime.now().microsecondsSinceEpoch}';
    ui_web.platformViewRegistry.registerViewFactory(_viewType, (_) {
      final uri = Uri.base.resolve('statue_scene/index.html');
      return html.IFrameElement()
        ..src = uri.toString()
        ..title = 'Interactive detective statue holding a traffic cone'
        ..setAttribute('allow', 'fullscreen')
        ..setAttribute('allowfullscreen', 'true')
        ..style.border = '0'
        ..style.width = '100%'
        ..style.height = '100%'
        ..style.display = 'block'
        ..style.backgroundColor = '#090604';
    });
  }

  @override
  Widget build(BuildContext context) => HtmlElementView(viewType: _viewType);
}

