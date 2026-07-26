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
    required this.revealOnTap,
    required this.keepRevealed,
    this.onLongPressCard,
    this.hideAll = false,
    super.key,
  });
  final List<CardImageModel> cards;
  final String? selectedCardId;
  final bool Function(CardImageModel card) isPlayable;
  final ValueChanged<CardImageModel?> onSelectionChanged;
  final bool revealOnTap;
  final bool keepRevealed;
  final void Function(List<CardImageModel> cards, List<bool> faceUp, int index)?
  onLongPressCard;
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
    final alreadySelected = widget.selectedCardId == card.id;
    if (alreadySelected) {
      if (!widget.keepRevealed) revealed.remove(card.id);
      widget.onSelectionChanged(null);
    } else {
      if (widget.revealOnTap) revealed.add(card.id);
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
        final visibleFiveWidth = constraints.maxWidth / 3.48;
        final cardWidth = visibleFiveWidth.clamp(86.0, 128.0);
        final cardHeight = cardWidth * 1.48;
        final step = cardWidth * .62;
        final contentWidth = cardWidth + step * (widget.cards.length - 1);
        return SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          reverse: contentWidth > constraints.maxWidth,
          child: SizedBox(
            width: math.max(constraints.maxWidth, contentWidth),
            height: cardHeight + 42,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                for (var index = 0; index < widget.cards.length; index++)
                  _DealtCard(
                    key: ValueKey(widget.cards[index].id),
                    delay: Duration(milliseconds: index * 95),
                    left: index * step,
                    bottom: widget.selectedCardId == widget.cards[index].id
                        ? 34
                        : 8 +
                              (1 -
                                      ((index - (widget.cards.length - 1) / 2)
                                              .abs() /
                                          math.max(
                                            1,
                                            widget.cards.length / 2,
                                          ))) *
                                  12,
                    rotation: (index - (widget.cards.length - 1) / 2) * .035,
                    width: cardWidth,
                    height: cardHeight,
                    child: FlippablePlayingCard(
                      frontImagePath: widget.cards[index].imagePath,
                      backImagePath: 'assets/images/card_back.png',
                      category: widget.cards[index].category,
                      isFaceUp: revealed.contains(widget.cards[index].id),
                      isSelected:
                          widget.selectedCardId == widget.cards[index].id,
                      isPlayable: widget.isPlayable(widget.cards[index]),
                      semanticLabel:
                          'Card ${index + 1} of ${widget.cards.length}, ${revealed.contains(widget.cards[index].id) ? widget.cards[index].title : 'face down'}, ${widget.isPlayable(widget.cards[index]) ? 'playable' : 'unavailable'}',
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
    required this.child,
    super.key,
  });
  final Duration delay;
  final double left;
  final double bottom;
  final double rotation;
  final double width;
  final double height;
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
    left: dealt ? widget.left : MediaQuery.sizeOf(context).width / 2,
    bottom: dealt ? widget.bottom : 150,
    width: widget.width,
    height: widget.height,
    child: AnimatedScale(
      scale: dealt ? 1 : .35,
      duration: const Duration(milliseconds: 420),
      child: AnimatedRotation(
        turns: dealt ? widget.rotation / (2 * math.pi) : .2,
        duration: const Duration(milliseconds: 420),
        child: widget.child,
      ),
    ),
  );
}
