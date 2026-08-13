import 'package:flutter/material.dart';

import '../models/card_image_model.dart';
import 'browse_hand_card.dart';

class FiveCardHand extends StatelessWidget {
  const FiveCardHand({
    required this.cards,
    required this.deckName,
    required this.selectedCardId,
    required this.shuffleGeneration,
    required this.onCardSelected,
    required this.onCardOpened,
    this.onCardLongPressed,
    super.key,
  });
  final List<CardImageModel> cards;
  final String deckName;
  final String? selectedCardId;
  final int shuffleGeneration;
  final ValueChanged<String> onCardSelected;
  final ValueChanged<CardImageModel> onCardOpened;
  final ValueChanged<int>? onCardLongPressed;

  double rotation(int index) {
    const angles = [-5.0, -2.5, 0.0, 2.5, 5.0];
    if (cards.length == 1) return 0;
    final mapped = (index * 4 / (cards.length - 1)).round();
    return angles[mapped];
  }

  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, constraints) {
      final wide = constraints.maxWidth >= 820;
      final gap = wide ? 18.0 : 12.0;
      final maxHeight = constraints.maxHeight * .68;
      final cardWidth = wide
          ? ((constraints.maxWidth - gap * (cards.length - 1)) / cards.length)
                .clamp(100.0, 260.0)
          : (constraints.maxWidth * .48).clamp(150.0, 220.0);
      final handWidth = cards.isEmpty
          ? 0.0
          : cardWidth * cards.length + gap * (cards.length - 1);
      final row = SizedBox(
        width: wide ? constraints.maxWidth : handWidth,
        height: constraints.maxHeight,
        child: Row(
          mainAxisAlignment: wide
              ? MainAxisAlignment.center
              : MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            for (var index = 0; index < cards.length; index++) ...[
              SizedBox(
                width: cardWidth,
                height: maxHeight,
                child: Center(
                  child: BrowseHandCard(
                    key: ValueKey('${shuffleGeneration}_${cards[index].id}'),
                    card: cards[index],
                    position: index + 1,
                    total: cards.length,
                    deckName: deckName,
                    rotationDegrees: rotation(index),
                    selected: selectedCardId == cards[index].id,
                    onTap: () => onCardSelected(cards[index].id),
                    onOpen: () => onCardOpened(cards[index]),
                    onLongPress: onCardLongPressed == null
                        ? null
                        : () => onCardLongPressed!(index),
                  ),
                ),
              ),
              if (index != cards.length - 1) SizedBox(width: gap),
            ],
          ],
        ),
      );
      return AnimatedSwitcher(
        duration: const Duration(milliseconds: 380),
        transitionBuilder: (child, animation) => FadeTransition(
          opacity: animation,
          child: SlideTransition(
            position: Tween(
              begin: const Offset(0, .08),
              end: Offset.zero,
            ).animate(animation),
            child: child,
          ),
        ),
        child: wide
            ? KeyedSubtree(key: ValueKey(shuffleGeneration), child: row)
            : SingleChildScrollView(
                key: ValueKey(shuffleGeneration),
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 18),
                child: row,
              ),
      );
    },
  );
}
