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
    frameLoads = iframe.onLoad.listen((_) {
      _installInteriorBridge();
      _sendState();
    });
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

  void _installInteriorBridge() {
    final document = iframe.contentWindow?.document;
    if (document == null || document.getElementById('castle-interior-bridge') != null) {
      return;
    }
    final script = html.ScriptElement()
      ..id = 'castle-interior-bridge'
      ..type = 'module'
      ..text = r'''
import * as THREE from '../vendor/three.module.js';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

if (!window.__castleInteriorBridgeInstalled) {
  window.__castleInteriorBridgeInstalled = true;

  const root = document.getElementById('scene');
  const video = document.getElementById('castle-entrance-video');
  const transition = document.getElementById('castle-entrance-transition');
  const resetButton = document.getElementById('castle-reset');
  const interiorUrl = new URL(
    '../assets/assets/models/castle_interior.glb',
    document.baseURI,
  ).href;

  if (root && video && transition) {
    const exteriorCanvas = root.querySelector('canvas');
    const interiorCanvas = document.createElement('canvas');
    interiorCanvas.id = 'castle-interior-canvas';
    interiorCanvas.setAttribute('aria-label', '3D Castle interior');
    Object.assign(interiorCanvas.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      display: 'none',
      zIndex: '3',
      touchAction: 'none',
      background: '#080604',
    });
    root.appendChild(interiorCanvas);

    const renderer = new THREE.WebGLRenderer({
      canvas: interiorCanvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.32;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080604);
    scene.fog = new THREE.FogExp2(0x0c0906, 0.014);

    const camera = new THREE.PerspectiveCamera(47, 1, 0.1, 180);
    const target = new THREE.Vector3(0, 3.1, 0);
    let yaw = 0;
    let pitch = 0.18;
    let distance = 12;
    let active = false;
    let dragging = false;
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let startYaw = 0;
    let startPitch = 0;

    scene.add(new THREE.HemisphereLight(0xc9d7e3, 0x24180f, 2.2));
    scene.add(new THREE.AmbientLight(0x8c765d, 0.72));
    const key = new THREE.PointLight(0xffb45f, 42, 30, 1.8);
    key.position.set(0, 7, 8);
    scene.add(key);
    const left = new THREE.PointLight(0xff7b31, 21, 24, 2);
    left.position.set(-8, 4, 1);
    scene.add(left);
    const right = new THREE.PointLight(0xffc87a, 18, 24, 2);
    right.position.set(8, 5, -1);
    scene.add(right);

    function updateCamera() {
      const cp = Math.cos(pitch);
      camera.position.set(
        target.x + Math.sin(yaw) * cp * distance,
        target.y + Math.sin(pitch) * distance,
        target.z + Math.cos(yaw) * cp * distance,
      );
      camera.lookAt(target);
    }

    function resize() {
      const width = Math.max(1, root.clientWidth);
      const height = Math.max(1, root.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      if (active) renderer.render(scene, camera);
    }

    updateCamera();
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);

    document.body.dataset.interiorModelAsset = interiorUrl;
    document.body.dataset.interiorReady = 'false';
    document.body.dataset.sceneMode = 'exterior';

    const interiorPromise = new Promise((resolve, reject) => {
      new GLTFLoader().load(
        interiorUrl,
        (gltf) => {
          const interiorRoot = gltf.scene;
          interiorRoot.traverse((object) => {
            if (!object.isMesh) return;
            const materials = Array.isArray(object.material)
              ? object.material
              : [object.material];
            materials.filter(Boolean).forEach((material) => {
              if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
                material.roughness = THREE.MathUtils.clamp(
                  material.roughness ?? 0.82,
                  0.58,
                  0.96,
                );
                material.metalness = THREE.MathUtils.clamp(
                  material.metalness ?? 0,
                  0,
                  0.14,
                );
                material.needsUpdate = true;
              }
            });
          });
          const bounds = new THREE.Box3().setFromObject(interiorRoot);
          const size = bounds.getSize(new THREE.Vector3());
          const center = bounds.getCenter(new THREE.Vector3());
          const scale = 34 / Math.max(size.x, size.z, 0.001);
          interiorRoot.scale.setScalar(scale);
          interiorRoot.position.set(
            -center.x * scale,
            -bounds.min.y * scale,
            -center.z * scale,
          );
          scene.add(interiorRoot);
          document.body.dataset.interiorReady = 'true';
          document.body.dataset.interiorAnimations = String(gltf.animations.length);
          resolve(interiorRoot);
        },
        undefined,
        (error) => {
          document.body.dataset.interiorReady = 'false';
          document.body.dataset.interiorError = String(error?.message || error);
          reject(error);
        },
      );
    });

    async function showInterior() {
      if (active) return;
      document.body.dataset.sceneMode = 'interior-loading';
      document.body.classList.add('entrance-video-active');
      try {
        await interiorPromise;
      } catch (_) {
        document.body.classList.remove('entrance-video-active');
        document.body.dataset.sceneMode = 'exterior';
        return;
      }
      if (exteriorCanvas) exteriorCanvas.style.display = 'none';
      interiorCanvas.style.display = 'block';
      document.body.classList.remove('castle-door-hover');
      document.body.classList.remove('entrance-video-active');
      document.body.dataset.castleDoorHover = 'false';
      document.body.dataset.sceneMode = 'interior';
      active = true;
      yaw = 0;
      pitch = 0.18;
      distance = 12;
      target.set(0, 3.1, 0);
      updateCamera();
      resize();
      renderer.render(scene, camera);
    }

    function showExterior() {
      if (!active) return;
      active = false;
      interiorCanvas.style.display = 'none';
      if (exteriorCanvas) exteriorCanvas.style.display = '';
      document.body.dataset.sceneMode = 'exterior';
    }

    video.addEventListener('ended', () => {
      void showInterior();
    });

    transition.addEventListener(
      'click',
      (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        video.pause();
        void showInterior();
      },
      true,
    );

    resetButton?.addEventListener('click', () => {
      if (active) showExterior();
    });

    window.addEventListener(
      'keydown',
      (event) => {
        if (active && event.key === 'Escape') {
          event.preventDefault();
          event.stopImmediatePropagation();
          showExterior();
        }
      },
      true,
    );

    interiorCanvas.addEventListener('pointerdown', (event) => {
      if (!active) return;
      dragging = true;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      startYaw = yaw;
      startPitch = pitch;
      interiorCanvas.setPointerCapture(event.pointerId);
      event.preventDefault();
    });

    interiorCanvas.addEventListener('pointermove', (event) => {
      if (!active || !dragging || pointerId !== event.pointerId) return;
      yaw = startYaw - (event.clientX - startX) * 0.008;
      pitch = THREE.MathUtils.clamp(
        startPitch + (event.clientY - startY) * 0.006,
        0.05,
        1.18,
      );
      updateCamera();
      renderer.render(scene, camera);
      event.preventDefault();
    });

    function releasePointer(event) {
      if (pointerId !== event.pointerId) return;
      dragging = false;
      pointerId = null;
    }

    interiorCanvas.addEventListener('pointerup', releasePointer);
    interiorCanvas.addEventListener('pointercancel', releasePointer);
    interiorCanvas.addEventListener(
      'wheel',
      (event) => {
        if (!active) return;
        distance = THREE.MathUtils.clamp(
          distance + event.deltaY * 0.025,
          5,
          28,
        );
        updateCamera();
        renderer.render(scene, camera);
        event.preventDefault();
      },
      { passive: false },
    );
  }
}
''';
    document.body?.append(script);
  }

  void _handleMessage(html.MessageEvent event) {
    // WindowProxy wrappers are not identity-stable across the Dart/JS boundary,
    // so comparing `event.source` with `iframe.contentWindow` can reject valid
    // messages from this same-origin iframe in release builds.
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
              'text': [
                card.question,
                card.answer,
              ].where((value) => value.isNotEmpty).join(' '),
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
