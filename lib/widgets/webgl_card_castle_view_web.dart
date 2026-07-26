// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:async';
import 'dart:convert';
import 'dart:html' as html;
import 'dart:ui_web' as ui_web;

import 'package:flutter/material.dart';

import '../models/card_image_model.dart';

class WebGlCardCastleView extends StatefulWidget {
  const WebGlCardCastleView({
    required this.cards,
    required this.focusedCardId,
    required this.shuffleSeed,
    required this.onCardSelected,
    required this.onCardOpened,
    required this.fallback,
    super.key,
  });

  final List<CardImageModel> cards;
  final String? focusedCardId;
  final int shuffleSeed;
  final ValueChanged<String> onCardSelected;
  final ValueChanged<String> onCardOpened;
  final Widget fallback;

  @override
  State<WebGlCardCastleView> createState() => _WebGlCardCastleViewState();
}

class _WebGlCardCastleViewState extends State<WebGlCardCastleView> {
  late final String viewType;
  late final html.IFrameElement iframe;
  StreamSubscription<html.MessageEvent>? messages;
  bool rendererFailed = false;

  @override
  void initState() {
    super.initState();
    viewType = 'card-castle-${DateTime.now().microsecondsSinceEpoch}';
    iframe = html.IFrameElement()
      ..src = 'card_castle/card_castle.html'
      ..style.border = '0'
      ..style.width = '100%'
      ..style.height = '100%'
      ..style.display = 'block'
      ..setAttribute('title', 'Three.js card castle renderer');
    // ignore: undefined_prefixed_name
    ui_web.platformViewRegistry.registerViewFactory(viewType, (_) => iframe);
    iframe.onLoad.listen((_) => _sendState());
    messages = html.window.onMessage.listen(_handleMessage);
  }

  @override
  void didUpdateWidget(covariant WebGlCardCastleView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.cards != widget.cards ||
        oldWidget.focusedCardId != widget.focusedCardId ||
        oldWidget.shuffleSeed != widget.shuffleSeed) {
      _sendState();
    }
  }

  @override
  void dispose() {
    _post({'type': 'dispose'});
    messages?.cancel();
    super.dispose();
  }

  void _handleMessage(html.MessageEvent event) {
    if (event.source != iframe.contentWindow) return;
    final data = event.data;
    if (data is! String) return;
    final decoded = jsonDecode(data);
    if (decoded is! Map<String, dynamic>) return;
    switch (decoded['type']) {
      case 'rendererError':
        setState(() => rendererFailed = true);
      case 'cardSelected':
        final id = decoded['cardId'] as String?;
        if (id != null) widget.onCardSelected(id);
      case 'cardLongPressed':
        final id = decoded['cardId'] as String?;
        if (id != null) widget.onCardOpened(id);
    }
  }

  void _sendState() {
    final base = Uri.base;
    final assetBase = '${base.origin}${base.path}assets/';
    _post({
      'type': 'setCards',
      'focusedCardId': widget.focusedCardId,
      'shuffleSeed': widget.shuffleSeed,
      'cards': widget.cards
          .map(
            (card) => {
              'id': card.id,
              'title': card.displayTitle,
              'category': card.category,
              'thumbnailUrl': card.imagePath.startsWith('assets/')
                  ? '$assetBase${card.imagePath}'
                  : card.imagePath,
              'aspectRatio': card.aspectRatio,
            },
          )
          .toList(),
    });
  }

  void _post(Map<String, dynamic> data) {
    iframe.contentWindow?.postMessage(jsonEncode(data), '*');
  }

  @override
  Widget build(BuildContext context) {
    if (rendererFailed) {
      return Stack(
        fit: StackFit.expand,
        children: [
          widget.fallback,
          const Positioned(left: 12, top: 12, child: _FallbackNotice()),
        ],
      );
    }
    return HtmlElementView(viewType: viewType);
  }
}

class _FallbackNotice extends StatelessWidget {
  const _FallbackNotice();

  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: BoxDecoration(
      color: const Color(0xCC090806),
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: const Color(0xFFFFC928)),
    ),
    child: const Padding(
      padding: EdgeInsets.all(10),
      child: Text(
        '3D Castle unavailable on this device. Using compatibility view.',
        style: TextStyle(color: Color(0xFFFFC928)),
      ),
    ),
  );
}
