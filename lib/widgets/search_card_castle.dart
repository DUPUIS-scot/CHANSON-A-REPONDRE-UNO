import 'dart:math' as math;

import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/card_image_model.dart';
import '../theme/app_theme.dart';
import 'category_badge.dart';
import 'stored_image.dart';

class SearchCardCastle extends StatefulWidget {
  const SearchCardCastle({
    required this.cards,
    required this.onOpenFullscreen,
    super.key,
  });

  final List<CardImageModel> cards;
  final ValueChanged<CardImageModel> onOpenFullscreen;

  @override
  State<SearchCardCastle> createState() => _SearchCardCastleState();
}

class _SearchCardCastleState extends State<SearchCardCastle> {
  int focusedIndex = 0;

  @override
  void didUpdateWidget(SearchCardCastle oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (focusedIndex >= widget.cards.length) {
      focusedIndex = math.max(0, widget.cards.length - 1);
    }
  }

  int get pageStart => (focusedIndex ~/ 5) * 5;
  List<CardImageModel> get activeCards =>
      widget.cards.skip(pageStart).take(5).toList(growable: false);

  void move(int delta) {
    if (widget.cards.isEmpty) return;
    setState(() {
      focusedIndex = (focusedIndex + delta)
          .clamp(0, widget.cards.length - 1)
          .toInt();
    });
  }

  void select(CardImageModel card) {
    final index = widget.cards.indexWhere((item) => item.id == card.id);
    if (index >= 0) setState(() => focusedIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    if (widget.cards.isEmpty) return const SizedBox.shrink();
    final foreground = widget.cards[focusedIndex];
    return FocusableActionDetector(
      autofocus: true,
      shortcuts: const {
        SingleActivator(LogicalKeyboardKey.arrowLeft): _MoveIntent(-1),
        SingleActivator(LogicalKeyboardKey.arrowRight): _MoveIntent(1),
      },
      actions: {
        _MoveIntent: CallbackAction<_MoveIntent>(
          onInvoke: (intent) {
            move(intent.delta);
            return null;
          },
        ),
      },
      child: Listener(
        onPointerSignal: (event) {
          if (event is PointerScrollEvent) {
            final delta = event.scrollDelta.dx != 0
                ? event.scrollDelta.dx
                : event.scrollDelta.dy;
            if (delta > 0) move(1);
            if (delta < 0) move(-1);
          }
        },
        child: GestureDetector(
          onHorizontalDragEnd: (details) {
            final velocity = details.primaryVelocity ?? 0;
            if (velocity < 0) move(1);
            if (velocity > 0) move(-1);
          },
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: const Color(0xEE070604),
              border: Border.all(color: AppTheme.gold.withValues(alpha: .5)),
              borderRadius: BorderRadius.circular(18),
            ),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                children: [
                  Row(
                    children: [
                      IconButton.outlined(
                        tooltip: 'Previous card',
                        onPressed: focusedIndex == 0 ? null : () => move(-1),
                        icon: const Icon(Icons.chevron_left),
                      ),
                      Expanded(
                        child: Text(
                          'Card castle ${focusedIndex + 1} / ${widget.cards.length}',
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: AppTheme.brightGold,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                      IconButton.outlined(
                        tooltip: 'Next card',
                        onPressed: focusedIndex == widget.cards.length - 1
                            ? null
                            : () => move(1),
                        icon: const Icon(Icons.chevron_right),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    height: 360,
                    child: LayoutBuilder(
                      builder: (context, constraints) {
                        final cardWidth = constraints.maxWidth < 600
                            ? 76.0
                            : 96.0;
                        return Stack(
                          alignment: Alignment.bottomCenter,
                          children: [
                            for (
                              var i = 0;
                              i < math.min(widget.cards.length, 14);
                              i++
                            )
                              _CastleThumb(
                                card:
                                    widget.cards[(pageStart + i) %
                                        widget.cards.length],
                                width: cardWidth * .62,
                                selected: false,
                                left:
                                    (constraints.maxWidth / 2) -
                                    cardWidth * 3.2 +
                                    (i % 7) * cardWidth * .95,
                                bottom: 130 + (i ~/ 7) * 70,
                                scale: .78 - (i ~/ 7) * .08,
                                onTap: select,
                                onLongPress: widget.onOpenFullscreen,
                              ),
                            for (var i = 0; i < activeCards.length; i++)
                              _CastleThumb(
                                card: activeCards[i],
                                width: cardWidth,
                                selected: activeCards[i].id == foreground.id,
                                left:
                                    (constraints.maxWidth / 2) -
                                    ((activeCards.length - 1) *
                                            cardWidth *
                                            .62) /
                                        2 +
                                    i * cardWidth * .62,
                                bottom: activeCards[i].id == foreground.id
                                    ? 24
                                    : 10,
                                scale: activeCards[i].id == foreground.id
                                    ? 1.12
                                    : .96,
                                onTap: select,
                                onLongPress: widget.onOpenFullscreen,
                              ),
                          ],
                        );
                      },
                    ),
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

class _CastleThumb extends StatelessWidget {
  const _CastleThumb({
    required this.card,
    required this.width,
    required this.selected,
    required this.left,
    required this.bottom,
    required this.scale,
    required this.onTap,
    required this.onLongPress,
  });

  final CardImageModel card;
  final double width;
  final bool selected;
  final double left;
  final double bottom;
  final double scale;
  final ValueChanged<CardImageModel> onTap;
  final ValueChanged<CardImageModel> onLongPress;

  @override
  Widget build(BuildContext context) => Positioned(
    left: left,
    bottom: bottom,
    width: width,
    height: width * 1.48,
    child: Semantics(
      button: true,
      label:
          '${card.displayTitle}, ${card.category}. Long press to open fullscreen.',
      child: GestureDetector(
        onTap: () => onTap(card),
        onLongPress: () => onLongPress(card),
        child: AnimatedScale(
          scale: scale,
          duration: const Duration(milliseconds: 180),
          child: DecoratedBox(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: selected ? AppTheme.brightGold : Colors.white54,
                width: selected ? 3 : 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: selected ? .7 : .45),
                  blurRadius: selected ? 28 : 14,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(7),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  StoredImage(source: card.imagePath, fit: BoxFit.cover),
                  Positioned(
                    left: 4,
                    top: 4,
                    child: CategoryBadge(
                      category: card.category,
                      compact: true,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

class _MoveIntent extends Intent {
  const _MoveIntent(this.delta);
  final int delta;
}
