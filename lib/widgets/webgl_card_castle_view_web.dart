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
    required this.activeCategory,
    required this.fullscreenRequestId,
    required this.onCardSelected,
    required this.onCardOpened,
    required this.onCategoryChanged,
    required this.onHomeRequested,
    required this.onDjWhoRequested,
    required this.onFullscreenChanged,
    required this.fallback,
    super.key,
  });

  final List<CardImageModel> cards;
  final String? focusedCardId;
  final int shuffleSeed;
  final String activeCategory;
  final int fullscreenRequestId;
  final ValueChanged<String> onCardSelected;
  final ValueChanged<String> onCardOpened;
  final ValueChanged<String> onCategoryChanged;
  final VoidCallback onHomeRequested;
  final VoidCallback onDjWhoRequested;
  final ValueChanged<bool> onFullscreenChanged;
  final Widget fallback;

  @override
  State<WebGlCardCastleView> createState() => _WebGlCardCastleViewState();
}

class _WebGlCardCastleViewState extends State<WebGlCardCastleView> {
  late final String viewType;
  late final html.IFrameElement iframe;
  StreamSubscription<html.MessageEvent>? messages;
  StreamSubscription<html.Event>? frameLoads;
  bool rendererFailed = false;
  bool rendererReady = false;

  @override
  void initState() {
    super.initState();
    viewType = 'search-card-castle-${DateTime.now().microsecondsSinceEpoch}';
    iframe = html.IFrameElement()
      ..id = 'search-card-castle-frame'
      ..src = Uri.base.resolve('card_castle/card_castle.html').toString()
      ..style.border = '0'
      ..style.width = '100%'
      ..style.height = '100%'
      ..style.display = 'block'
      ..setAttribute('allow', 'fullscreen')
      ..setAttribute('allowfullscreen', 'true')
      ..setAttribute('popover', 'manual')
      ..setAttribute('title', 'Three.js Search card castle');
    ui_web.platformViewRegistry.registerViewFactory(viewType, (_) => iframe);
    frameLoads = iframe.onLoad.listen((_) => _sendState());
    messages = html.window.onMessage.listen(_handleMessage);
  }

  @override
  void didUpdateWidget(covariant WebGlCardCastleView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!rendererReady) return;
    final cardsChanged =
        _cardFingerprint(oldWidget.cards) != _cardFingerprint(widget.cards);
    if (cardsChanged || oldWidget.shuffleSeed != widget.shuffleSeed) {
      _sendState();
    } else if (oldWidget.focusedCardId != widget.focusedCardId) {
      _sendFocus();
    }
    if (oldWidget.fullscreenRequestId != widget.fullscreenRequestId) {
      _requestFullscreen();
    }
  }

  @override
  void dispose() {
    _post({'type': 'dispose'});
    frameLoads?.cancel();
    messages?.cancel();
    _setInAppFullscreen(false);
    super.dispose();
  }

  void _handleMessage(html.MessageEvent event) {
    if (event.source != iframe.contentWindow || event.data is! String) return;
    try {
      final decoded = jsonDecode(event.data! as String);
      if (decoded is! Map<String, dynamic>) return;
      switch (decoded['type']) {
        case 'rendererReady':
          rendererReady = true;
          _sendState();
          if (widget.fullscreenRequestId > 0) _requestFullscreen();
        case 'rendererError':
          if (mounted) setState(() => rendererFailed = true);
        case 'cardSelected':
          final id = decoded['cardId'] as String?;
          if (id != null) widget.onCardSelected(id);
        case 'cardLongPressed':
          final id = decoded['cardId'] as String?;
          if (id != null) {
            _setInAppFullscreen(false);
            widget.onCardOpened(id);
          }
        case 'categorySelected':
          final category = decoded['category'] as String?;
          if (category != null) widget.onCategoryChanged(category);
        case 'homeRequested':
          _setInAppFullscreen(false);
          widget.onHomeRequested();
        case 'djWhoRequested':
          _setInAppFullscreen(false);
          widget.onDjWhoRequested();
        case 'fullscreenFallbackRequested':
          _setInAppFullscreen(true);
          _post({'type': 'setInAppFullscreen', 'active': true});
        case 'fullscreenFallbackExit':
          _setInAppFullscreen(false);
          _post({'type': 'setInAppFullscreen', 'active': false});
        case 'fullscreenChanged':
          final active = decoded['active'] == true;
          if (!active) _setInAppFullscreen(false);
          widget.onFullscreenChanged(active);
      }
    } on FormatException {
      // Ignore unrelated window messages.
    }
  }

  void _sendState() {
    _post({
      'type': 'setCards',
      'focusedCardId': widget.focusedCardId,
      'animateFocus': widget.focusedCardId != null,
      'activeCategory': widget.activeCategory,
      'shuffleSeed': widget.shuffleSeed,
      'cards': widget.cards
          .map(
            (card) => {
              'id': card.id,
              'category': card.category,
              'question': card.question,
              'thumbnailUrl': _assetUrl(card.imagePath),
              'aspectRatio': card.aspectRatio,
            },
          )
          .toList(),
    });
  }

  void _sendFocus() {
    _post({
      'type': 'focusCard',
      'cardId': widget.focusedCardId,
      'animate': true,
    });
  }

  void _requestFullscreen() {
    if (!rendererReady) return;
    _post({'type': 'enterFullscreen'});
  }

  void _setInAppFullscreen(bool active) {
    if (active) {
      iframe.style
        ..position = 'fixed'
        ..left = '0'
        ..top = '0'
        ..width = '100vw'
        ..height = '100vh'
        ..zIndex = '2147483647'
        ..backgroundColor = '#03070c';
    } else {
      iframe.style
        ..position = ''
        ..left = ''
        ..top = ''
        ..width = '100%'
        ..height = '100%'
        ..zIndex = ''
        ..backgroundColor = '';
    }
  }

  String _cardFingerprint(List<CardImageModel> cards) => cards
      .map(
        (card) => '${card.id}\u001f${card.imagePath}\u001f${card.aspectRatio}',
      )
      .join('\u001e');

  String _assetUrl(String source) {
    if (!source.startsWith('assets/')) return source;
    // Flutter emits literal "%20" characters in some GitHub Pages asset
    // filenames. Encode the percent itself so Three.js requests that real file.
    return Uri.base.resolve('assets/$source').toString().replaceAll('%', '%25');
  }

  void _post(Map<String, dynamic> data) {
    iframe.contentWindow?.postMessage(jsonEncode(data), Uri.base.origin);
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
      color: const Color(0xDD090806),
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: const Color(0xFFFFC928)),
    ),
    child: const Padding(
      padding: EdgeInsets.all(10),
      child: Text(
        '3D Castle unavailable. Using the compatibility card view.',
        style: TextStyle(color: Color(0xFFFFC928)),
      ),
    ),
  );
}
