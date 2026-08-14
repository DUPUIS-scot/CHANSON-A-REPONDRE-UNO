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
    label: 'Discard pile, ${topCard.category} card on top',
    child: Transform.translate(
      offset: const Offset(0, -140),
      child: SizedBox(
        width: 108,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              height: 145,
              child: Stack(
                children: [
                  for (var offset = 8; offset >= 4; offset -= 2)
                    Positioned(
                      left: offset.toDouble(),
                      top: offset.toDouble(),
                      right: (10 - offset).toDouble(),
                      bottom: (10 - offset).toDouble(),
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          color: const Color(0xFF2B180E),
                          borderRadius: BorderRadius.circular(9),
                          border: Border.all(color: const Color(0xFF8D6327)),
                        ),
                      ),
                    ),
                  Positioned.fill(
                    right: 8,
                    bottom: 8,
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(9),
                        border: Border.all(
                          color: AppTheme.brightGold,
                          width: 1.6,
                        ),
                        boxShadow: const [
                          BoxShadow(
                            color: Colors.black87,
                            blurRadius: 12,
                            offset: Offset(0, 7),
                          ),
                        ],
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: StoredImage(
                        key: const Key('discard-pile-recto'),
                        source: topCard.imagePath,
                        fit: BoxFit.contain,
                        errorBuilder: (_, _, _) => const ColoredBox(
                          color: Color(0xFF521E16),
                          child: Icon(
                            Icons.image_not_supported,
                            color: AppTheme.gold,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Transform.translate(
              offset: const Offset(0, -5),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xEE24140C),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF9C6B28)),
                ),
                child: Text(
                  'DÉFAUSSE · $count',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: const Color(0xFFF1D8A0),
                    fontFamily: 'Georgia',
                    fontWeight: FontWeight.w700,
                    letterSpacing: .5,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
