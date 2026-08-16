// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:async';
import 'dart:html' as html;
import 'dart:js_interop';
import 'dart:ui_web' as ui_web;

import 'package:flutter/material.dart';

import 'puppet_dealer_controller.dart';

@JS('puppetDealerCreate')
external void _createDealer(String id, String quality);

@JS('puppetDealerDeal')
external void _dealCard(String id, String imageUrl);

@JS('puppetDealerReceive')
external void _receiveCard(String id, String imageUrl);

@JS('puppetDealerSetQuality')
external void _setDealerQuality(String id, String quality);

@JS('puppetDealerDestroy')
external void _destroyDealer(String id);

class PuppetDealerScene extends StatefulWidget {
  const PuppetDealerScene({
    required this.controller,
    required this.quality,
    super.key,
  });

  final PuppetDealerController controller;
  final PuppetQuality quality;

  @override
  State<PuppetDealerScene> createState() => _PuppetDealerSceneState();
}

class _PuppetDealerSceneState extends State<PuppetDealerScene> {
  late final String _elementId;
  late final String _viewType;
  bool _platformViewCreated = false;

  @override
  void initState() {
    super.initState();
    final stamp = DateTime.now().microsecondsSinceEpoch;
    _elementId = 'dealer-3d-container-$stamp';
    _viewType = 'puppet-dealer-view-$stamp';
    ui_web.platformViewRegistry.registerViewFactory(_viewType, (_) {
      return html.DivElement()
        ..id = _elementId
        ..className = 'dealer-3d-container'
        ..setAttribute('aria-label', 'Live 3D jester card dealer')
        ..style.width = '100%'
        ..style.height = '100%'
        ..style.position = 'relative'
        ..style.pointerEvents = 'none'
        ..style.overflow = 'hidden'
        ..style.backgroundColor = 'transparent';
    });
    widget.controller.attach(
      deal: (path) => _animate(path, receive: false),
      receive: (path) => _animate(path, receive: true),
      setQuality: (quality) => _setDealerQuality(_elementId, quality.name),
    );
  }

  void _mountDealer(int _) {
    if (_platformViewCreated) return;
    _platformViewCreated = true;
    Timer.run(() {
      if (mounted) _createDealer(_elementId, widget.quality.name);
    });
  }

  Future<void> _animate(String imagePath, {required bool receive}) async {
    final imageUrl = imagePath.startsWith('data:')
        ? imagePath
        : Uri(
            pathSegments: [
              if (imagePath.startsWith('assets/')) 'assets',
              ...imagePath.split('/'),
            ],
          ).toString().replaceAll('%', '%25');
    if (receive) {
      _receiveCard(_elementId, imageUrl);
      await Future<void>.delayed(const Duration(milliseconds: 1650));
    } else {
      _dealCard(_elementId, imageUrl);
      await Future<void>.delayed(const Duration(milliseconds: 2350));
    }
  }

  @override
  void didUpdateWidget(covariant PuppetDealerScene oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.quality != oldWidget.quality) {
      _setDealerQuality(_elementId, widget.quality.name);
    }
  }

  @override
  void dispose() {
    widget.controller.detach();
    _destroyDealer(_elementId);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => IgnorePointer(
    child: SizedBox.expand(
      key: const Key('puppet-stage-slot'),
      child: ClipRect(
        child: Transform.scale(
          scale: 1.55,
          alignment: Alignment.topCenter,
          child: HtmlElementView(
            viewType: _viewType,
            onPlatformViewCreated: _mountDealer,
          ),
        ),
      ),
    ),
  );
}
