import 'package:flutter/material.dart';
import '../core/app_constants.dart';
import '../models/card_image_model.dart';
import '../theme/app_theme.dart';
import 'stored_image.dart';

class DiscardPileWidget extends StatelessWidget {
  const DiscardPileWidget({
    required this.topCard,
    required this.count,
    super.key,
  });
  final CardImageModel topCard;
  final int count;
  @override
  Widget build(BuildContext context) => Semantics(
    label: 'Discard pile, ${topCard.category} card on top',
    child: SizedBox(
      width: 84,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AspectRatio(
            aspectRatio: cardAspectRatio,
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppTheme.brightGold, width: 2),
                boxShadow: const [
                  BoxShadow(color: Color(0x66FFC928), blurRadius: 12),
                ],
              ),
              clipBehavior: Clip.antiAlias,
              child: StoredImage(
                source: topCard.imagePath,
                fit: BoxFit.contain,
                errorBuilder: (_, _, _) => const ColoredBox(
                  color: Color(0xFF521E16),
                  child: Icon(Icons.image_not_supported, color: AppTheme.gold),
                ),
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'DISCARD PILE · $count',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    ),
  );
}
