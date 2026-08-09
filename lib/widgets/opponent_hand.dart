import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../core/app_constants.dart';
import '../data/card_categories.dart';
import '../models/card_image_model.dart';

class OpponentHand extends StatelessWidget {
  const OpponentHand({required this.cards, super.key});
  final List<CardImageModel> cards;

  @override
  Widget build(BuildContext context) {
    final cardCount = cards.length;
    final visible = cardCount.clamp(0, 12);
    return Semantics(
      label: 'Opponent hand, $cardCount cards, all face down',
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'OPPONENT · $cardCount CARDS',
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              shadows: const [Shadow(color: Colors.black, blurRadius: 5)],
            ),
          ),
          const SizedBox(height: 4),
          SizedBox(
            height: 68,
            width: math.max(70, 32 + visible * 22).toDouble(),
            child: Stack(
              children: [
                for (var index = 0; index < visible; index++)
                  Positioned(
                    left: index * 22,
                    child: Transform.rotate(
                      angle: (index - (visible - 1) / 2) * .025,
                      child: SizedBox(
                        width: 48,
                        child: AspectRatio(
                          aspectRatio: cardAspectRatio,
                          child: Container(
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.white70),
                              borderRadius: BorderRadius.circular(5),
                            ),
                            clipBehavior: Clip.antiAlias,
                            child: Image.asset(
                              cardCategoryFor(cards[index].category).versoAsset,
                              fit: BoxFit.contain,
                              errorBuilder: (_, _, _) =>
                                  const ColoredBox(color: Color(0xFF4A1E14)),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
