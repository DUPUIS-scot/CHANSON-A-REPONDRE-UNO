import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

enum BackgroundType { image, video }

class BackgroundWidget extends StatefulWidget {
  const BackgroundWidget({
    required this.type,
    this.imagePath = 'assets/images/main_street_background.png',
    this.videoPath = 'assets/videos/background.mp4',
    this.fallbackImagePath = 'assets/images/home_background.png',
    this.muted = true,
    super.key,
  });

  final BackgroundType type;
  final String imagePath;
  final String videoPath;
  final String fallbackImagePath;
  final bool muted;

  @override
  State<BackgroundWidget> createState() => _BackgroundWidgetState();
}

class _BackgroundWidgetState extends State<BackgroundWidget> {
  VideoPlayerController? controller;
  String? error;
  bool loading = false;

  @override
  void initState() {
    super.initState();
    _configure();
  }

  @override
  void didUpdateWidget(BackgroundWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.type != widget.type ||
        oldWidget.videoPath != widget.videoPath ||
        oldWidget.imagePath != widget.imagePath ||
        oldWidget.muted != widget.muted) {
      _configure();
    }
  }

  Future<void> _configure() async {
    await controller?.dispose();
    controller = null;
    error = null;
    loading = false;
    if (widget.type != BackgroundType.video) {
      if (mounted) setState(() {});
      return;
    }
    if (!widget.videoPath.toLowerCase().endsWith('.mp4')) {
      if (mounted) {
        setState(
          () => error = 'Unsupported video format. Showing PNG background.',
        );
      }
      return;
    }
    final next = widget.videoPath.startsWith('assets/')
        ? VideoPlayerController.asset(widget.videoPath)
        : VideoPlayerController.file(File(widget.videoPath));
    controller = next;
    if (mounted) setState(() => loading = true);
    try {
      await next.initialize();
      await next.setVolume(widget.muted ? 0 : 1);
      await next.setLooping(true);
      await next.play();
      if (mounted) setState(() => loading = false);
    } on Object {
      await next.dispose();
      if (!mounted) return;
      setState(() {
        controller = null;
        loading = false;
        error = 'Video background is unavailable. Showing PNG background.';
      });
    }
  }

  @override
  void dispose() {
    controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final player = controller;
    return Stack(
      fit: StackFit.expand,
      children: [
        _BackgroundImage(
          path: widget.type == BackgroundType.image
              ? widget.imagePath
              : widget.fallbackImagePath,
          fallbackPath: widget.fallbackImagePath,
        ),
        if (player?.value.isInitialized ?? false)
          ClipRect(
            child: FittedBox(
              fit: BoxFit.cover,
              alignment: Alignment.center,
              child: SizedBox(
                width: player!.value.size.width,
                height: player.value.size.height,
                child: VideoPlayer(player),
              ),
            ),
          ),
        if (loading) const Center(child: CircularProgressIndicator.adaptive()),
        if (error != null)
          Align(
            alignment: Alignment.bottomCenter,
            child: SafeArea(
              minimum: const EdgeInsets.all(8),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: const Color(0xDD000000),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  child: Text(error!, textAlign: TextAlign.center),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _BackgroundImage extends StatelessWidget {
  const _BackgroundImage({required this.path, required this.fallbackPath});
  final String path;
  final String fallbackPath;

  @override
  Widget build(BuildContext context) {
    Widget fallback(
      BuildContext context,
      Object error,
      StackTrace? stackTrace,
    ) {
      if (path != fallbackPath) {
        return Image.asset(
          fallbackPath,
          fit: BoxFit.cover,
          errorBuilder: (_, _, _) => const ColoredBox(
            color: Color(0xFF0A0907),
            child: Center(
              child: Icon(Icons.image_not_supported_outlined, size: 48),
            ),
          ),
        );
      }
      return const ColoredBox(
        color: Color(0xFF0A0907),
        child: Center(
          child: Icon(Icons.image_not_supported_outlined, size: 48),
        ),
      );
    }

    if (!path.startsWith('assets/') && !kIsWeb) {
      return Image.file(File(path), fit: BoxFit.cover, errorBuilder: fallback);
    }
    return Image.asset(path, fit: BoxFit.cover, errorBuilder: fallback);
  }
}
