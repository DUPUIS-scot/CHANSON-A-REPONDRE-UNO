import 'package:flutter/material.dart';
import '../core/app_constants.dart';
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
        InkWell(
          onTap: onDraw,
          borderRadius: BorderRadius.circular(8),
          child: SizedBox(
            width: 88,
            child: AspectRatio(
              aspectRatio: cardAspectRatio,
              child: Stack(
                children: [
                  for (var offset = 6; offset >= 0; offset -= 3)
                    Positioned(
                      left: offset.toDouble(),
                      top: offset.toDouble(),
                      right: (6 - offset).toDouble(),
                      bottom: (6 - offset).toDouble(),
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppTheme.gold),
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
                    bottom: 8,
                    left: 0,
                    right: 0,
                    child: Text(
                      '$count',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'DRAW PILE',
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    ),
  );
}
