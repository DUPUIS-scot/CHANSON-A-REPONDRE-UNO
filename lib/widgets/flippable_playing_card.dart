import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../data/card_categories.dart';
import '../theme/app_theme.dart';
import 'category_badge.dart';
import 'stored_image.dart';

class FlippablePlayingCard extends StatefulWidget {
  const FlippablePlayingCard({
    required this.frontImagePath,
    required this.backImagePath,
    required this.category,
    required this.isFaceUp,
    required this.isSelected,
    required this.isPlayable,
    required this.onTap,
    this.onLongPress,
    this.semanticLabel,
    this.disabled = false,
    super.key,
  });

  final String frontImagePath;
  final String backImagePath;
  final String category;
  final bool isFaceUp;
  final bool isSelected;
  final bool isPlayable;
  final bool disabled;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;
  final String? semanticLabel;

  @override
  State<FlippablePlayingCard> createState() => _FlippablePlayingCardState();
}

class _FlippablePlayingCardState extends State<FlippablePlayingCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController controller;
  bool focused = false;

  @override
  void initState() {
    super.initState();
    controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 420),
      value: widget.isFaceUp ? 1 : 0,
    );
  }

  @override
  void didUpdateWidget(FlippablePlayingCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.isFaceUp != widget.isFaceUp) {
      widget.isFaceUp ? controller.forward() : controller.reverse();
    }
  }

  void handleActivate() {
    if (!controller.isAnimating && !widget.disabled) widget.onTap();
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    enabled: !widget.disabled,
    label: widget.semanticLabel,
    child: FocusableActionDetector(
      enabled: !widget.disabled,
      mouseCursor: widget.disabled
          ? SystemMouseCursors.forbidden
          : SystemMouseCursors.click,
      onShowFocusHighlight: (value) => setState(() => focused = value),
      shortcuts: const {
        SingleActivator(LogicalKeyboardKey.enter): ActivateIntent(),
        SingleActivator(LogicalKeyboardKey.space): ActivateIntent(),
      },
      actions: {
        ActivateIntent: CallbackAction<ActivateIntent>(
          onInvoke: (_) {
            handleActivate();
            return null;
          },
        ),
      },
      child: GestureDetector(
        onTap: handleActivate,
        onLongPress: widget.disabled ? null : widget.onLongPress,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: focused || widget.isSelected
                  ? AppTheme.brightGold
                  : widget.isPlayable
                  ? AppTheme.gold
                  : Colors.white24,
              width: focused || widget.isSelected ? 3 : 1.2,
            ),
            boxShadow: widget.isSelected
                ? const [
                    BoxShadow(
                      color: Color(0xAAFFC928),
                      blurRadius: 22,
                      spreadRadius: 2,
                    ),
                  ]
                : null,
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: AnimatedBuilder(
              animation: controller,
              builder: (context, _) {
                final angle = controller.value * math.pi;
                final showFront = angle >= math.pi / 2;
                return Transform(
                  alignment: Alignment.center,
                  transform: Matrix4.identity()
                    ..setEntry(3, 2, .0015)
                    ..rotateY(angle),
                  child: Transform(
                    alignment: Alignment.center,
                    transform: Matrix4.rotationY(showFront ? math.pi : 0),
                    child: ColorFiltered(
                      colorFilter:
                          widget.disabled || (showFront && !widget.isPlayable)
                          ? const ColorFilter.mode(
                              Color(0x99000000),
                              BlendMode.srcATop,
                            )
                          : const ColorFilter.mode(
                              Colors.transparent,
                              BlendMode.dst,
                            ),
                      child: showFront
                          ? Stack(
                              fit: StackFit.expand,
                              children: [
                                StoredImage(
                                  source: widget.frontImagePath,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, _, _) =>
                                      const _FallbackFace(label: 'CARD'),
                                ),
                                Positioned(
                                  left: 6,
                                  top: 6,
                                  child: CategoryBadge(
                                    category: widget.category,
                                    compact: true,
                                  ),
                                ),
                              ],
                            )
                          : Stack(
                              fit: StackFit.expand,
                              children: [
                                Image.asset(
                                  cardCategoryFor(widget.category).versoAsset,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, _, _) => Image.asset(
                                    widget.backImagePath,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, _, _) =>
                                        const _FallbackFace(label: 'CHanson'),
                                  ),
                                ),
                                Positioned(
                                  left: 6,
                                  top: 6,
                                  child: CategoryBadge(
                                    category: widget.category,
                                    compact: true,
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ),
    ),
  );
}

class _FallbackFace extends StatelessWidget {
  const _FallbackFace({required this.label});
  final String label;
  @override
  Widget build(BuildContext context) => ColoredBox(
    color: const Color(0xFF35170F),
    child: Center(
      child: Text(
        label.toUpperCase(),
        textAlign: TextAlign.center,
        style: const TextStyle(
          color: AppTheme.brightGold,
          fontWeight: FontWeight.bold,
        ),
      ),
    ),
  );
}
