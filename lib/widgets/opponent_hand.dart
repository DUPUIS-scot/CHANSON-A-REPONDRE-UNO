import 'dart:math' as math;

import 'package:flutter/material.dart';

class OpponentHand extends StatelessWidget {
  const OpponentHand({required this.cardCount, super.key});
  final int cardCount;

  @override
  Widget build(BuildContext context) {
    final visible = cardCount.clamp(0, 12);
    return Semantics(
      label: 'Opponent hand, $cardCount cards, all face down',
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'OPPONENT • $cardCount CARDS',
            style: Theme.of(context).textTheme.labelLarge,
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
                      child: Container(
                        width: 48,
                        height: 72,
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.white70),
                          borderRadius: BorderRadius.circular(5),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: Image.asset(
                          'assets/images/card_back.png',
                          fit: BoxFit.contain,
                          errorBuilder: (_, _, _) =>
                              const ColoredBox(color: Color(0xFF4A1E14)),
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
