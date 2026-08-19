// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:async';
import 'dart:convert';
import 'dart:html' as html;
import 'dart:ui_web' as ui_web;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../models/card_image_model.dart';

class WebGlCardCastleView extends StatefulWidget {
  const WebGlCardCastleView({
    required this.cards,
    required this.matchingCardIds,
    required this.focusedCardId,
    required this.shuffleSeed,
    required this.activeCategory,
    required this.fullscreenRequestId,
    required this.onCardSelected,
    required this.onCardOpened,
    required this.onFullscreenChanged,
    required this.onCategoriesRequested,
    required this.fallback,
    super.key,
  });

  final List<CardImageModel> cards;
  final Set<String> matchingCardIds;
  final String? focusedCardId;
  final int shuffleSeed;
  final String activeCategory;
  final int fullscreenRequestId;
  final ValueChanged<String> onCardSelected;
  final Future<void> Function(String) onCardOpened;
  final ValueChanged<bool> onFullscreenChanged;
  final VoidCallback onCategoriesRequested;
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
  bool cardOverlayActive = false;

  @override
  void initState() {
    super.initState();
    viewType = 'search-card-castle-${DateTime.now().microsecondsSinceEpoch}';

    final navigator = html.window.navigator;
    final userAgent = navigator.userAgent;
    final isIos = RegExp(r'iP(?:hone|ad|od)').hasMatch(userAgent) ||
        (navigator.platform == 'MacIntel' && (navigator.maxTouchPoints ?? 0) > 1);
    final castleUri = Uri.base.resolve('card_castle/card_castle_fast.html');
    final castleSrc = isIos
        ? castleUri
            .replace(
              queryParameters: {
                ...castleUri.queryParameters,
                'iosLegacy': '1',
              },
            )
            .toString()
        : castleUri.toString();

    iframe = html.IFrameElement()
      ..id = 'search-card-castle-frame'
      ..src = castleSrc
      ..style.border = '0'
      ..style.width = '100%'
      ..style.height = '100%'
      ..style.display = 'block'
      ..setAttribute('allow', 'fullscreen')
      ..setAttribute('allowfullscreen', 'true')
      ..setAttribute('popover', 'manual')
      ..setAttribute('title', 'Three.js Search card castle');
    iframe.dataset['iosLoaderMode'] = isIos ? 'legacy-no-draco' : 'compressed-draco';
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
    final matchesChanged = !setEquals(
      oldWidget.matchingCardIds,
      widget.matchingCardIds,
    );
    if (cardsChanged ||
        matchesChanged ||
        oldWidget.activeCategory != widget.activeCategory ||
        oldWidget.shuffleSeed != widget.shuffleSeed) {
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
    if (event.origin != html.window.location.origin || event.data is! String) {
      return;
    }
    try {
      final decoded = jsonDecode(event.data! as String);
      if (decoded is! Map<String, dynamic>) return;
      iframe.dataset['lastBridgeMessage'] = decoded['type']?.toString() ?? '';
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
          if (id != null && !cardOverlayActive) {
            cardOverlayActive = true;
            iframe.dataset['lastLongPressedCardId'] = id;
            _setInAppFullscreen(false);
            _setCardOverlayMode(true);
            unawaited(
              Future<void>.sync(() => widget.onCardOpened(id)).whenComplete(() {
                if (!mounted) return;
                _setCardOverlayMode(false);
                cardOverlayActive = false;
              }),
            );
          }
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
        case 'categoriesRequested':
          _setInAppFullscreen(false);
          widget.onFullscreenChanged(false);
          widget.onCategoriesRequested();
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
              'text': [card.question, card.answer]
                  .where((value) => value.isNotEmpty)
                  .join(' '),
              'tags': card.tags,
              'metadata': {
                'author': card.author,
                'theme': card.theme,
                'emotion': card.emotion,
                'year': card.year,
              },
              'isMatch': widget.matchingCardIds.contains(card.id),
              'rectoUrl': _assetUrl(card.imagePath),
              'aspectRatio': card.aspectRatio,
            },
          )
          .toList(),
    });
  }

  void _sendFocus() {
    _post({'type': 'focusCard', 'cardId': widget.focusedCardId, 'animate': true});
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

  void _setCardOverlayMode(bool active) {
    iframe.style
      ..pointerEvents = active ? 'none' : ''
      ..visibility = active ? 'hidden' : '';
    iframe.dataset['cardOverlayActive'] = active.toString();
    if (active) {
      iframe.setAttribute('aria-hidden', 'true');
    } else {
      iframe.attributes.remove('aria-hidden');
    }
  }

  String _cardFingerprint(List<CardImageModel> cards) => cards
      .map((card) => '${card.id}\u001f${card.imagePath}\u001f${card.aspectRatio}')
      .join('\u001e');

  String _assetUrl(String source) {
    if (!source.startsWith('assets/')) return source;
    // Uri.resolve already performs the required URL encoding. Re-encoding every
    // percent sign here turned valid card assets into %25 paths and made castle
    // preview textures fail on both desktop and mobile.
    return Uri.base.resolve(source).toString();
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
          Positioned(
            left: 12,
            bottom: 12,
            child: OutlinedButton.icon(
              key: const ValueKey('castle-back-to-categories'),
              onPressed: widget.onCategoriesRequested,
              icon: const Icon(Icons.arrow_back_rounded),
              label: const Text('CATEGORIES'),
            ),
          ),
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
