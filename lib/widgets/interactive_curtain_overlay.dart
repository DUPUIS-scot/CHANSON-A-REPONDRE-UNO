import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../providers/home_experience_provider.dart';
import 'curtain_control_button.dart';
import 'curtain_edge_handle.dart';

class InteractiveCurtainOverlay extends StatefulWidget {
  const InteractiveCurtainOverlay({super.key});
  @override
  State<InteractiveCurtainOverlay> createState() =>
      _InteractiveCurtainOverlayState();
}

class _InteractiveCurtainOverlayState extends State<InteractiveCurtainOverlay>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  HomeExperienceProvider? _provider;
  bool _syncing = false;

  @override
  void initState() {
    super.initState();
    _controller =
        AnimationController(
          vsync: this,
          duration: const Duration(milliseconds: 1200),
        )..addListener(() {
          if (!_syncing) _provider?.setCurtainProgress(_controller.value);
        });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final next = context.read<HomeExperienceProvider>();
    if (_provider != next) {
      _provider?.removeListener(_syncFromProvider);
      _provider = next..addListener(_syncFromProvider);
      _syncing = true;
      _controller.value = next.curtainProgress;
      _syncing = false;
    }
    _controller.duration = MediaQuery.disableAnimationsOf(context)
        ? const Duration(milliseconds: 180)
        : const Duration(milliseconds: 1200);
  }

  void _syncFromProvider() {
    final provider = _provider;
    if (provider == null || _controller.isAnimating) return;
    if (provider.isTransitioning) {
      final target = provider.targetOpen ? 1.0 : 0.0;
      _controller.animateTo(target, curve: Curves.easeInOutCubic).then((_) {
        if (mounted) provider.finishTransition(target == 1);
      });
    }
  }

  void _drag(double delta, double width, bool left) {
    if (width <= 0) return;
    _controller.stop();
    final outward = left ? -delta : delta;
    _controller.value = (_controller.value + outward / (width * .5)).clamp(
      0,
      1,
    );
  }

  @override
  void dispose() {
    _provider?.removeListener(_syncFromProvider);
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final experience = context.watch<HomeExperienceProvider>();
    final progress = experience.curtainProgress;
    return CallbackShortcuts(
      bindings: {
        const SingleActivator(LogicalKeyboardKey.keyO): experience.openCurtains,
        const SingleActivator(LogicalKeyboardKey.keyC):
            experience.closeCurtains,
      },
      child: Focus(
        child: LayoutBuilder(
          builder: (context, constraints) {
            if (constraints.maxWidth <= 0) return const SizedBox.shrink();
            final fullWidth = constraints.maxWidth;
            final panelWidth = fullWidth * .5;
            final panels = Stack(
              fit: StackFit.expand,
              children: [
                _panel(true, panelWidth, fullWidth, -panelWidth * progress),
                _panel(false, panelWidth, fullWidth, panelWidth * progress),
              ],
            );
            return Stack(
              fit: StackFit.expand,
              children: [
                IgnorePointer(ignoring: progress >= .95, child: panels),
                if (progress < .95)
                  Listener(
                    behavior: HitTestBehavior.translucent,
                    onPointerSignal: (signal) {
                      if (signal is PointerScrollEvent &&
                          signal.scrollDelta.dy.abs() >= 2 &&
                          experience.videoPlaying) {
                        final delta = -signal.scrollDelta.dy / 900;
                        _controller.stop();
                        _controller.value = (_controller.value + delta).clamp(
                          0,
                          1,
                        );
                      }
                    },
                    child: GestureDetector(
                      behavior: HitTestBehavior.translucent,
                      onHorizontalDragUpdate: experience.videoPlaying
                          ? (event) {
                              final left =
                                  event.localPosition.dx <
                                  constraints.maxWidth / 2;
                              _drag(event.delta.dx, constraints.maxWidth, left);
                            }
                          : null,
                      onHorizontalDragEnd: experience.videoPlaying
                          ? (event) => experience.completeCurtainDrag(
                              event.primaryVelocity ?? 0,
                            )
                          : null,
                    ),
                  ),
                if (progress >= .95) ...[
                  CurtainEdgeHandle(
                    alignment: Alignment.centerLeft,
                    onDragUpdate: (delta) =>
                        _drag(delta, constraints.maxWidth, true),
                    onDragEnd: (velocity) =>
                        experience.completeCurtainDrag(-velocity),
                  ),
                  CurtainEdgeHandle(
                    alignment: Alignment.centerRight,
                    onDragUpdate: (delta) =>
                        _drag(delta, constraints.maxWidth, false),
                    onDragEnd: experience.completeCurtainDrag,
                  ),
                ],
                Positioned(
                  top: 12,
                  right: 12,
                  child: SafeArea(
                    child: CurtainControlButton(
                      isOpen: experience.homeInteractive,
                      onPressed: experience.homeInteractive
                          ? experience.closeCurtains
                          : experience.openCurtains,
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _panel(
    bool left,
    double width,
    double fullWidth,
    double offset,
  ) => Transform.translate(
    offset: Offset(offset, 0),
    child: Align(
      alignment: left ? Alignment.centerLeft : Alignment.centerRight,
      child: ClipRect(
        child: SizedBox(
          width: width,
          height: double.infinity,
          child: OverflowBox(
            alignment: left ? Alignment.centerLeft : Alignment.centerRight,
            minWidth: fullWidth,
            maxWidth: fullWidth,
            child: Image.asset(
              'assets/images/closed_curtains.png',
              width: fullWidth,
              height: double.infinity,
              fit: BoxFit.cover,
              alignment: Alignment.center,
              errorBuilder: (_, _, _) =>
                  const ColoredBox(color: Color(0xFF65150F)),
            ),
          ),
        ),
      ),
    ),
  );
}
