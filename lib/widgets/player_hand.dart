import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../models/card_image_model.dart';
import 'flippable_playing_card.dart';

class PlayerHand extends StatefulWidget {
  const PlayerHand({
    required this.cards,
    required this.selectedCardId,
    required this.isPlayable,
    required this.onSelectionChanged,
    this.onLongPressCard,
    this.backImagePath = '',
    this.hideAll = false,
    super.key,
  });
  final List<CardImageModel> cards;
  final String? selectedCardId;
  final bool Function(CardImageModel card) isPlayable;
  final ValueChanged<CardImageModel?> onSelectionChanged;
  final void Function(List<CardImageModel> cards, List<bool> faceUp, int index)?
  onLongPressCard;
  final String backImagePath;
  final bool hideAll;

  @override
  State<PlayerHand> createState() => _PlayerHandState();
}

class _PlayerHandState extends State<PlayerHand> {
  final revealed = <String>{};

  @override
  void didUpdateWidget(PlayerHand oldWidget) {
    super.didUpdateWidget(oldWidget);
    final currentIds = widget.cards.map((card) => card.id).toSet();
    revealed.removeWhere((id) => !currentIds.contains(id));
    if (widget.hideAll && !oldWidget.hideAll) revealed.clear();
  }

  void select(CardImageModel card) {
    if (revealed.remove(card.id)) {
      widget.onSelectionChanged(null);
    } else {
      revealed.add(card.id);
      widget.onSelectionChanged(card);
    }
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    if (widget.cards.isEmpty) {
      return const Center(child: Text('Your hand is empty.'));
    }
    return LayoutBuilder(
      builder: (context, constraints) {
        final count = widget.cards.length;
        final roomy = constraints.maxWidth >= 720;
        final overlapStep = roomy ? .78 : .70;
        const rotationReserve = 16.0;
        final horizontalReserve = constraints.maxWidth < 560 ? 28.0 : 12.0;
        final usableWidth = math.max(
          0.0,
          constraints.maxWidth - horizontalReserve - rotationReserve,
        );
        final widthLimited = usableWidth /
            (1 + math.max(0, count - 1) * overlapStep);
        final heightLimited = math.max(
          60.0,
          (constraints.maxHeight - 34) / 1.5,
        );
        final desiredWidth = constraints.maxWidth >= 850
            ? 190.0
            : constraints.maxWidth >= 560
            ? 152.0
            : 110.0;
        final cardWidth = math.max(
          48.0,
          math.min(
            desiredWidth,
            math.min(widthLimited, heightLimited),
          ),
        );
        final cardHeight = cardWidth * 1.5;
        final step = cardWidth * overlapStep;
        final contentWidth = cardWidth + step * (count - 1);
        final centeredOffset = math.max(
          horizontalReserve / 2,
          (constraints.maxWidth - contentWidth) / 2,
        );
        final maxBottom = math.max(0.0, constraints.maxHeight - cardHeight - 4);
        final paintOrder = List<int>.generate(count, (index) => index);
        final selectedIndex = paintOrder.indexWhere(
          (index) => widget.cards[index].id == widget.selectedCardId,
        );
        if (selectedIndex >= 0) {
          paintOrder.add(paintOrder.removeAt(selectedIndex));
        }
        return ClipRect(
          child: SizedBox.expand(
            child: Stack(
              clipBehavior: Clip.hardEdge,
              children: [
                for (final index in paintOrder)
                  _DealtCard(
                    key: ValueKey(widget.cards[index].id),
                    delay: Duration(milliseconds: index * 95),
                    left: centeredOffset + index * step,
                    bottom: math.min(
                      maxBottom,
                      () {
                        final centerDistance =
                            (index - (count - 1) / 2).abs() /
                            math.max(1, count / 2);
                        final base = 5 + (1 - centerDistance) * 12;
                        return base +
                            (widget.selectedCardId == widget.cards[index].id
                                ? 12
                                : 0);
                      }(),
                    ),
                    rotation: (index - (count - 1) / 2) * .052,
                    width: cardWidth,
                    height: cardHeight,
                    selected: widget.selectedCardId == widget.cards[index].id,
                    child: FlippablePlayingCard(
                      frontImagePath: widget.cards[index].imagePath,
                      backImagePath: widget.backImagePath,
                      category: widget.cards[index].category,
                      isFaceUp: revealed.contains(widget.cards[index].id),
                      isSelected:
                          widget.selectedCardId == widget.cards[index].id,
                      isPlayable: widget.isPlayable(widget.cards[index]),
                      semanticLabel:
                          'Card ${index + 1} of ${widget.cards.length}, '
                          '${widget.cards[index].category}, '
                          '${revealed.contains(widget.cards[index].id) ? 'face up' : 'face down'}, '
                          '${widget.isPlayable(widget.cards[index]) ? 'playable' : 'unavailable'}',
                      onTap: () => select(widget.cards[index]),
                      onLongPress: widget.onLongPressCard == null
                          ? null
                          : () => widget.onLongPressCard!(
                              List<CardImageModel>.unmodifiable(widget.cards),
                              List<bool>.unmodifiable(
                                widget.cards
                                    .map((card) => revealed.contains(card.id))
                                    .toList(),
                              ),
                              index,
                            ),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _DealtCard extends StatefulWidget {
  const _DealtCard({
    required this.delay,
    required this.left,
    required this.bottom,
    required this.rotation,
    required this.width,
    required this.height,
    required this.selected,
    required this.child,
    super.key,
  });
  final Duration delay;
  final double left;
  final double bottom;
  final double rotation;
  final double width;
  final double height;
  final bool selected;
  final Widget child;
  @override
  State<_DealtCard> createState() => _DealtCardState();
}

class _DealtCardState extends State<_DealtCard> {
  bool dealt = false;
  @override
  void initState() {
    super.initState();
    Future<void>.delayed(widget.delay, () {
      if (mounted) setState(() => dealt = true);
    });
  }

  @override
  Widget build(BuildContext context) => AnimatedPositioned(
    duration: const Duration(milliseconds: 420),
    curve: Curves.easeOutBack,
    left: dealt ? widget.left : -widget.width * .45,
    bottom: dealt ? widget.bottom : widget.height + 36,
    width: widget.width,
    height: widget.height,
    child: AnimatedScale(
      scale: dealt ? (widget.selected ? 1.015 : 1) : .35,
      duration: const Duration(milliseconds: 420),
      child: AnimatedRotation(
        turns: dealt ? widget.rotation / (2 * math.pi) : .2,
        duration: const Duration(milliseconds: 420),
        child: widget.child,
      ),
    ),
  );
}
