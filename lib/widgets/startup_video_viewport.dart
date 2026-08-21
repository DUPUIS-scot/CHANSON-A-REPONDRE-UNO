import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:video_player/video_player.dart';

import '../providers/settings_provider.dart';
import '../providers/startup_video_provider.dart';
import '../theme/app_theme.dart';

const _isFlutterTest = bool.fromEnvironment('FLUTTER_TEST');

class StartupVideoViewport extends StatefulWidget {
  const StartupVideoViewport({this.compact = false, super.key});
  final bool compact;

  @override
  State<StartupVideoViewport> createState() => _StartupVideoViewportState();
}

class _StartupVideoViewportState extends State<StartupVideoViewport>
    with SingleTickerProviderStateMixin {
  late final AnimationController rotation;
  double manualYaw = 0;
  double manualPitch = 0;
  bool dragging = false;

  @override
  void initState() {
    super.initState();
    rotation = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 14),
    );
  }

  void _syncRotation(SettingsProvider settings, bool reducedMotion) {
    rotation.duration = Duration(
      milliseconds: (settings.advanced.rotationSpeed * 1000).round(),
    );
    final shouldRotate =
        settings.advanced.rotationEnabled &&
        !reducedMotion &&
        !_isFlutterTest &&
        !dragging;
    if (shouldRotate && !rotation.isAnimating) {
      rotation.repeat();
    } else if (!shouldRotate && rotation.isAnimating) {
      rotation.stop();
    }
  }

  void _dragStart(DragStartDetails details) {
    dragging = true;
    rotation.stop();
  }

  void _dragUpdate(DragUpdateDetails details) {
    setState(() {
      manualYaw += details.delta.dx * .012;
      manualPitch -= details.delta.dy * .012;
    });
  }

  void _dragEnd(
    DragEndDetails details,
    SettingsProvider settings,
    bool reducedMotion,
  ) {
    dragging = false;
    _syncRotation(settings, reducedMotion);
  }

  @override
  void dispose() {
    rotation.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final startup = context.watch<StartupVideoProvider>();
    final settings = context.watch<SettingsProvider>();
    final controller = startup.controller;
    final reducedMotion =
        MediaQuery.disableAnimationsOf(context) ||
        settings.advanced.reducedMotion;
    _syncRotation(settings, reducedMotion);

    return LayoutBuilder(
      builder: (context, constraints) {
        final width = math.min(
          constraints.maxWidth * (widget.compact ? 1 : .86),
          widget.compact ? 520.0 : 1050.0,
        );
        final height = math.min(
          constraints.maxHeight * (widget.compact ? 1 : .74),
          widget.compact ? 320.0 : 650.0,
        );
        final ratio =
            controller?.value.isInitialized == true &&
                controller!.value.aspectRatio > 0
            ? controller.value.aspectRatio
            : 16 / 9;

        return Center(
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onPanStart: _dragStart,
            onPanUpdate: _dragUpdate,
            onPanEnd: (details) => _dragEnd(details, settings, reducedMotion),
            child: SizedBox(
              width: width,
              height: height,
              child: AnimatedBuilder(
                animation: rotation,
                builder: (context, _) {
                  final automaticAngle = rotation.value * math.pi * 2;
                  final yaw = manualYaw + automaticAngle;
                  final pitch = manualPitch + automaticAngle;
                  final frontVisible = math.cos(yaw) * math.cos(pitch) >= 0;
                  return Semantics(
                    label: 'Rotating startup video viewport',
                    child: Transform(
                      alignment: Alignment.center,
                      transform: reducedMotion
                          ? Matrix4.identity()
                          : (Matrix4.identity()
                              ..setEntry(3, 2, .001)
                              ..rotateY(yaw)
                              ..rotateX(pitch)),
                      child: Center(
                        child: AspectRatio(
                          aspectRatio: ratio,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              color: Colors.black,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: AppTheme.gold,
                                width: 2,
                              ),
                              boxShadow: const [
                                BoxShadow(
                                  blurRadius: 24,
                                  spreadRadius: 2,
                                  color: Color(0x66000000),
                                ),
                              ],
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: Transform(
                                alignment: Alignment.center,
                                transform: frontVisible
                                    ? Matrix4.identity()
                                    : Matrix4.rotationY(math.pi),
                                child: _content(
                                  startup,
                                  controller,
                                  mirrored: !frontVisible,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _content(
    StartupVideoProvider startup,
    VideoPlayerController? controller, {
    required bool mirrored,
  }) {
    if (startup.loading) {
      return const ColoredBox(
        color: Colors.black,
        child: Center(child: Text('Loading startup video...')),
      );
    }
    if (controller?.value.isInitialized != true) {
      return ColoredBox(
        color: Colors.black,
        child: Center(
          child: Text(startup.error ?? 'Unable to load the startup video.'),
        ),
      );
    }
    final size = controller!.value.size;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: startup.hasStarted ? startup.toggle : null,
      child: Stack(
        fit: StackFit.expand,
        children: [
          FittedBox(
            fit: BoxFit.contain,
            child: SizedBox(
              width: size.width,
              height: size.height,
              child: Transform.flip(
                flipX: mirrored,
                child: VideoPlayer(controller),
              ),
            ),
          ),
          if (!startup.hasStarted)
            Center(
              child: FilledButton.tonal(
                autofocus: true,
                onPressed: startup.play,
                child: const Text('PLAY'),
              ),
            )
          else if (!controller.value.isPlaying)
            Center(
              child: FilledButton.tonal(
                onPressed: startup.play,
                child: const Text('Paused'),
              ),
            ),
        ],
      ),
    );
  }
}
