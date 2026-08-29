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
external void _dealCard(String id, String versoUrl, String rectoUrl);

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
        ..setAttribute(
          'aria-label',
          'Live 3D jester dealer. Drag head, torso, arms and hands to pose.',
        )
        ..style.width = '100%'
        ..style.height = '100%'
        ..style.position = 'relative'
        ..style.pointerEvents = 'auto'
        ..style.overflow = 'hidden'
        ..style.backgroundColor = 'transparent';
    });
    widget.controller.attach(
      deal: (versoPath, rectoPath) => _animateDeal(versoPath, rectoPath),
      receive: (path) => _animateReceive(path),
      setQuality: (quality) => _setDealerQuality(_elementId, quality.name),
    );
  }

  String _assetUrl(String imagePath) {
    if (imagePath.startsWith('data:')) return imagePath;
    return Uri(
      pathSegments: [
        if (imagePath.startsWith('assets/')) 'assets',
        ...imagePath.split('/'),
      ],
    ).toString().replaceAll('%', '%25');
  }

  void _mountDealer(int _) {
    if (_platformViewCreated) return;
    _platformViewCreated = true;
    Timer.run(() {
      if (mounted) _createDealer(_elementId, widget.quality.name);
    });
  }

  Future<void> _animateDeal(String versoPath, String rectoPath) async {
    _dealCard(_elementId, _assetUrl(versoPath), _assetUrl(rectoPath));
    await Future<void>.delayed(const Duration(milliseconds: 3300));
  }

  Future<void> _animateReceive(String imagePath) async {
    _receiveCard(_elementId, _assetUrl(imagePath));
    await Future<void>.delayed(const Duration(milliseconds: 1850));
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
  Widget build(BuildContext context) => SizedBox.expand(
    key: const Key('puppet-stage-slot'),
    child: ClipRect(
      child: HtmlElementView(
        viewType: _viewType,
        onPlatformViewCreated: _mountDealer,
      ),
    ),
  );
}
