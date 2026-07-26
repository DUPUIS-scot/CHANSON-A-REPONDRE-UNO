import 'package:flutter/material.dart';
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
    label: 'Discard pile, top card ${topCard.displayTitle}',
    child: SizedBox(
      width: 92,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            height: 126,
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
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => const ColoredBox(
                color: Color(0xFF521E16),
                child: Icon(Icons.image_not_supported, color: AppTheme.gold),
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '$count discarded',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    ),
  );
}
