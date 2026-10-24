// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:html' as html;
import 'dart:ui_web' as ui_web;

import 'package:flutter/material.dart';

class EvelBungeeView extends StatefulWidget {
  const EvelBungeeView({super.key});

  @override
  State<EvelBungeeView> createState() => _EvelBungeeViewState();
}

class _EvelBungeeViewState extends State<EvelBungeeView> {
  late final String _viewType;

  @override
  void initState() {
    super.initState();
    _viewType = 'evel-bungee-${DateTime.now().microsecondsSinceEpoch}';
    ui_web.platformViewRegistry.registerViewFactory(_viewType, (_) {
      return html.IFrameElement()
        ..src = 'https://space-panda-bungee-360.true-creek-9787.chatgpt.site/'
        ..title = 'EVEL BUNGEE'
        ..setAttribute('allow', 'autoplay; fullscreen')
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
