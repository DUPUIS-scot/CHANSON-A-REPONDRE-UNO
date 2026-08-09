import 'dart:math' as math;

import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../core/app_constants.dart';
import '../models/card_image_model.dart';
import '../theme/app_theme.dart';
import 'stored_image.dart';

class SearchCardCastle extends StatefulWidget {
  const SearchCardCastle({
    required this.cards,
    required this.onFullscreen,
    super.key,
  });

  final List<CardImageModel> cards;
  final ValueChanged<CardImageModel> onFullscreen;

  @override
  State<SearchCardCastle> createState() => _SearchCardCastleState();
}

class _SearchCardCastleState extends State<SearchCardCastle> {
  int focusedIndex = 0;

  @override
  void didUpdateWidget(covariant SearchCardCastle oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (focusedIndex >= widget.cards.length) {
      focusedIndex = math.max(0, widget.cards.length - 1);
    }
  }

  void _move(int delta) {
    if (widget.cards.isEmpty) return;
    setState(() {
      focusedIndex = (focusedIndex + delta)
          .clamp(0, widget.cards.length - 1)
          .toInt();
    });
  }

  void _focus(CardImageModel card) {
    final index = widget.cards.indexWhere((item) => item.id == card.id);
    if (index >= 0) setState(() => focusedIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    if (widget.cards.isEmpty) return const SizedBox.shrink();
    final start = (focusedIndex ~/ 5) * 5;
    final active = widget.cards.skip(start).take(5).toList();

    return FocusableActionDetector(
      autofocus: true,
      shortcuts: const {
        SingleActivator(LogicalKeyboardKey.arrowLeft): _MoveIntent(-1),
        SingleActivator(LogicalKeyboardKey.arrowRight): _MoveIntent(1),
      },
      actions: {
        _MoveIntent: CallbackAction<_MoveIntent>(
          onInvoke: (intent) {
            _move(intent.delta);
            return null;
          },
        ),
      },
      child: Listener(
        onPointerSignal: (event) {
          if (event is PointerScrollEvent) {
            final delta = event.scrollDelta.dx == 0
                ? event.scrollDelta.dy
                : event.scrollDelta.dx;
            if (delta > 0) _move(1);
            if (delta < 0) _move(-1);
          }
        },
        child: GestureDetector(
          onHorizontalDragEnd: (details) {
            final velocity = details.primaryVelocity ?? 0;
            if (velocity < 0) _move(1);
            if (velocity > 0) _move(-1);
          },
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                children: [
                  Row(
                    children: [
                      IconButton.outlined(
                        tooltip: 'Previous',
                        onPressed: focusedIndex == 0 ? null : () => _move(-1),
                        icon: const Icon(Icons.chevron_left),
                      ),
                      Expanded(
                        child: Text(
                          'Card castle ${focusedIndex + 1}/${widget.cards.length}',
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: AppTheme.brightGold,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                      IconButton.outlined(
                        tooltip: 'Next',
                        onPressed: focusedIndex == widget.cards.length - 1
                            ? null
                            : () => _move(1),
                        icon: const Icon(Icons.chevron_right),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    height: 330,
                    child: LayoutBuilder(
                      builder: (context, constraints) {
                        final width = constraints.maxWidth < 520 ? 70.0 : 92.0;
                        return Stack(
                          alignment: Alignment.bottomCenter,
                          children: [
                            for (
                              var i = 0;
                              i < math.min(widget.cards.length, 12);
                              i++
                            )
                              _CastleCard(
                                card: widget
                                    .cards[(start + i) % widget.cards.length],
                                width: width * .6,
                                left:
                                    constraints.maxWidth / 2 -
                                    width * 3 +
                                    (i % 6) * width,
                                bottom: 128 + (i ~/ 6) * 58,
                                selected: false,
                                onTap: _focus,
                                onLongPress: widget.onFullscreen,
                              ),
                            for (var i = 0; i < active.length; i++)
                              _CastleCard(
                                card: active[i],
                                width: width,
                                left:
                                    constraints.maxWidth / 2 -
                                    active.length * width * .34 +
                                    i * width * .68,
                                bottom:
                                    active[i].id ==
                                        widget.cards[focusedIndex].id
                                    ? 24
                                    : 8,
                                selected:
                                    active[i].id ==
                                    widget.cards[focusedIndex].id,
                                onTap: _focus,
                                onLongPress: widget.onFullscreen,
                              ),
                          ],
                        );
                      },
                    ),
                  ),
                  const Text(
                    'Swipe, wheel, arrows, or buttons to navigate. Long-press for fullscreen.',
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _CastleCard extends StatelessWidget {
  const _CastleCard({
    required this.card,
    required this.width,
    required this.left,
    required this.bottom,
    required this.selected,
    required this.onTap,
    required this.onLongPress,
  });

  final CardImageModel card;
  final double width;
  final double left;
  final double bottom;
  final bool selected;
  final ValueChanged<CardImageModel> onTap;
  final ValueChanged<CardImageModel> onLongPress;

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: left,
      bottom: bottom,
      child: Semantics(
        label: '${card.category} search result card',
        button: true,
        child: GestureDetector(
          onTap: () => onTap(card),
          onLongPress: () => onLongPress(card),
          child: AnimatedScale(
            duration: const Duration(milliseconds: 160),
            scale: selected ? 1.16 : 1,
            child: DecoratedBox(
              decoration: BoxDecoration(
                border: Border.all(
                  color: selected ? AppTheme.brightGold : Colors.white54,
                  width: selected ? 3 : 1,
                ),
                borderRadius: BorderRadius.circular(10),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black87,
                    blurRadius: 18,
                    offset: Offset(0, 10),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: SizedBox(
                  width: width,
                  height: width / cardAspectRatio,
                  child: StoredImage(
                    source: card.imagePath,
                    fit: BoxFit.contain,
                    errorBuilder: (_, _, _) => const ColoredBox(
                      color: AppTheme.leather,
                      child: Icon(Icons.image_not_supported_outlined),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _MoveIntent extends Intent {
  const _MoveIntent(this.delta);
  final int delta;
}
