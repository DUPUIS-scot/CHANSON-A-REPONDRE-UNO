import 'package:flutter/material.dart';

import '../data/card_categories.dart';
import '../models/card_image_model.dart';
import '../theme/app_theme.dart';

class DrawPileWidget extends StatelessWidget {
  const DrawPileWidget({
    required this.count,
    required this.onDraw,
    this.topCard,
    super.key,
  });

  final int count;
  final VoidCallback? onDraw;
  final CardImageModel? topCard;

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    label: 'Draw pile, $count cards',
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        DecoratedBox(
          decoration: BoxDecoration(
            color: const Color(0xAA1B100A),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0x887D501C)),
            boxShadow: const [
              BoxShadow(
                color: Colors.black87,
                blurRadius: 13,
                offset: Offset(0, 8),
              ),
            ],
          ),
          child: InkWell(
            onTap: onDraw,
            borderRadius: BorderRadius.circular(14),
            child: SizedBox(
              width: 102,
              height: 145,
              child: Stack(
                children: [
                  for (var offset = 9; offset >= 0; offset -= 3)
                    Positioned(
                      left: offset.toDouble(),
                      top: offset.toDouble(),
                      right: (9 - offset).toDouble(),
                      bottom: (9 - offset).toDouble(),
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(9),
                          border: Border.all(color: const Color(0xFFD5AE58)),
                          color: const Color(0xFF24140E),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: Image.asset(
                          topCard == null
                              ? 'assets/images/card_back.png'
                              : cardCategoryFor(topCard!.category).versoAsset,
                          fit: BoxFit.contain,
                          errorBuilder: (_, _, _) =>
                              const Icon(Icons.style, color: AppTheme.gold),
                        ),
                      ),
                    ),
                  Positioned(
                    right: 8,
                    top: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 7,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xDD160D08),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.gold),
                      ),
                      child: Text(
                        '$count',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        Transform.translate(
          offset: const Offset(0, -5),
          child: const _PilePlaque(label: 'DRAW PILE'),
        ),
      ],
    ),
  );
}

class _PilePlaque extends StatelessWidget {
  const _PilePlaque({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    decoration: BoxDecoration(
      color: const Color(0xEE24140C),
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: const Color(0xFF9C6B28)),
    ),
    child: Text(
      label,
      style: Theme.of(context).textTheme.labelSmall?.copyWith(
        color: const Color(0xFFF1D8A0),
        fontFamily: 'Georgia',
        fontWeight: FontWeight.w700,
        letterSpacing: .7,
      ),
    ),
  );
}
