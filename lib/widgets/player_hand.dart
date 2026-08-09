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
    required this.revealedCardIds,
    required this.onRevealedChanged,
    required this.keepRevealed,
    this.onFullscreenCard,
    super.key,
  });
  final List<CardImageModel> cards;
  final String? selectedCardId;
  final bool Function(CardImageModel card) isPlayable;
  final ValueChanged<CardImageModel?> onSelectionChanged;
  final Set<String> revealedCardIds;
  final ValueChanged<Set<String>> onRevealedChanged;
  final bool keepRevealed;
  final ValueChanged<String>? onFullscreenCard;

  @override
  State<PlayerHand> createState() => _PlayerHandState();
}

class _PlayerHandState extends State<PlayerHand> {
  void select(CardImageModel card) {
    final alreadySelected = widget.selectedCardId == card.id;
    if (alreadySelected) {
      widget.onSelectionChanged(null);
    } else {
      widget.onSelectionChanged(card);
    }
  }

  void flip(CardImageModel card) {
    final revealed = widget.keepRevealed
        ? {...widget.revealedCardIds}
        : <String>{};
    if (widget.revealedCardIds.contains(card.id)) {
      revealed.remove(card.id);
    } else {
      revealed.add(card.id);
    }
    widget.onRevealedChanged(Set<String>.unmodifiable(revealed));
  }

  void handleCardTap(CardImageModel card) {
    flip(card);
    select(card);
  }

  @override
  Widget build(BuildContext context) {
    if (widget.cards.isEmpty) {
      return const Center(child: Text('Your hand is empty.'));
    }
    return LayoutBuilder(
      builder: (context, constraints) {
        final preferredWidth = constraints.maxWidth < 500 ? 92.0 : 138.0;
        final fitFactor = 1 + .62 * (widget.cards.length - 1);
        final cardWidth = math.min(
          preferredWidth,
          math.max(72.0, constraints.maxWidth / fitFactor),
        );
        final cardHeight = cardWidth * 3 / 2;
        final step = cardWidth * .62;
        final contentWidth = cardWidth + step * (widget.cards.length - 1);
        final handWidth = math.max(constraints.maxWidth, contentWidth);
        final centeredOffset = math.max(0, (handWidth - contentWidth) / 2);
        return SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          reverse: contentWidth > constraints.maxWidth,
          child: SizedBox(
            width: handWidth,
            height: cardHeight + 42,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                for (var index = 0; index < widget.cards.length; index++)
                  _DealtCard(
                    key: ValueKey(widget.cards[index].id),
                    delay: Duration(milliseconds: index * 95),
                    left: centeredOffset + index * step,
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
                      isFaceUp: widget.revealedCardIds.contains(
                        widget.cards[index].id,
                      ),
                      isSelected:
                          widget.selectedCardId == widget.cards[index].id,
                      isPlayable: widget.isPlayable(widget.cards[index]),
                      semanticLabel:
                          'Card ${index + 1} of ${widget.cards.length}, '
                          '${widget.cards[index].category}, '
                          '${widget.revealedCardIds.contains(widget.cards[index].id) ? 'face up' : 'face down'}, '
                          '${widget.isPlayable(widget.cards[index]) ? 'playable' : 'unavailable'}',
                      onTap: () => handleCardTap(widget.cards[index]),
                      onLongPress: widget.onFullscreenCard == null
                          ? null
                          : () => widget.onFullscreenCard!(
                              widget.cards[index].id,
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
  Widget build(BuildContext context) {
    final duration = MediaQuery.disableAnimationsOf(context)
        ? Duration.zero
        : const Duration(milliseconds: 420);
    return AnimatedPositioned(
      duration: duration,
      curve: Curves.easeOutBack,
      left: dealt ? widget.left : MediaQuery.sizeOf(context).width / 2,
      bottom: dealt ? widget.bottom : 150,
      width: widget.width,
      height: widget.height,
      child: AnimatedScale(
        scale: dealt ? 1 : .35,
        duration: duration,
        child: AnimatedRotation(
          turns: dealt ? widget.rotation / (2 * math.pi) : .2,
          duration: duration,
          child: widget.child,
        ),
      ),
    );
  }
}
