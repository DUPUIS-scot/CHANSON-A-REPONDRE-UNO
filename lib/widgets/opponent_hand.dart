import 'package:flutter/material.dart';

import '../data/card_categories.dart';
import '../models/card_image_model.dart';
import '../theme/app_theme.dart';

class OpponentHand extends StatelessWidget {
  const OpponentHand({required this.cards, super.key});
  final List<CardImageModel> cards;

  @override
  Widget build(BuildContext context) {
    final visibleCards = cards.take(5).toList(growable: false);
    final narrow = MediaQuery.sizeOf(context).width < 720;
    final cardWidth = narrow ? 38.0 : 54.0;
    final cardHeight = cardWidth * 1.5;
    return Semantics(
      label: 'Opponent hand, ${visibleCards.length} cards, all face down',
      child: Container(
        padding: EdgeInsets.fromLTRB(narrow ? 9 : 14, 6, narrow ? 9 : 14, 12),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xEE382113), Color(0xEE130B07)],
          ),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.gold, width: 1.2),
          boxShadow: const [
            BoxShadow(
              color: Colors.black87,
              blurRadius: 14,
              offset: Offset(0, 7),
            ),
            BoxShadow(color: Color(0x338D6327), blurRadius: 5),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Transform.translate(
              offset: const Offset(0, -13),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 28,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFF24140C),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppTheme.gold),
                ),
                child: const Text(
                  'OPPONENT',
                  style: TextStyle(
                    color: Color(0xFFF1D8A0),
                    fontFamily: 'Georgia',
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.2,
                  ),
                ),
              ),
            ),
            Transform.translate(
              offset: const Offset(0, -6),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  for (var index = 0; index < visibleCards.length; index++) ...[
                    if (index > 0) SizedBox(width: narrow ? 4 : 7),
                    Container(
                      width: cardWidth,
                      height: cardHeight,
                      decoration: BoxDecoration(
                        border: Border.all(color: const Color(0xFFE7C274)),
                        borderRadius: BorderRadius.circular(5),
                        boxShadow: const [
                          BoxShadow(
                            color: Colors.black87,
                            blurRadius: 5,
                            offset: Offset(0, 3),
                          ),
                        ],
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: Image.asset(
                        cardCategoryFor(
                          visibleCards[index].category,
                        ).versoAsset,
                        fit: BoxFit.contain,
                        errorBuilder: (_, _, _) =>
                            const ColoredBox(color: Color(0xFF4A1E14)),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
