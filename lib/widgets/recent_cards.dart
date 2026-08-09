import 'package:flutter/material.dart';
import '../core/app_constants.dart';
import '../models/card_image_model.dart';
import '../theme/app_theme.dart';
import 'stored_image.dart';

class RecentCards extends StatelessWidget {
  const RecentCards({
    required this.cards,
    required this.onCardTap,
    required this.onViewAll,
    super.key,
  });
  final List<CardImageModel> cards;
  final ValueChanged<CardImageModel> onCardTap;
  final VoidCallback onViewAll;
  Color _accent(String colour) => switch (colour.toLowerCase()) {
    'red' => const Color(0xFFE43C2C),
    'yellow' => const Color(0xFFE9B52F),
    'green' => const Color(0xFF75B83A),
    'blue' => const Color(0xFF2EA4DC),
    _ => AppTheme.gold,
  };
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Row(
        children: [
          Expanded(
            child: Text(
              'RECENT CARDS',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(color: AppTheme.gold),
            ),
          ),
          TextButton.icon(
            onPressed: onViewAll,
            label: const Text('VIEW ALL'),
            iconAlignment: IconAlignment.end,
            icon: const Icon(Icons.arrow_forward),
          ),
        ],
      ),
      const SizedBox(height: 10),
      if (cards.isEmpty)
        const SizedBox(
          height: 120,
          child: Center(
            child: Text('Recently imported cards will appear here.'),
          ),
        )
      else
        SizedBox(
          height: 190,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: cards.length,
            separatorBuilder: (_, _) => const SizedBox(width: 10),
            itemBuilder: (_, index) {
              final card = cards[index];
              return SizedBox(
                width: 100,
                child: Column(
                  children: [
                    Material(
                      color: Colors.transparent,
                      borderRadius: BorderRadius.circular(8),
                      clipBehavior: Clip.antiAlias,
                      child: InkWell(
                        onTap: () => onCardTap(card),
                        child: AspectRatio(
                          aspectRatio: cardAspectRatio,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              border: Border.all(color: _accent(card.colour)),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: StoredImage(
                              source: card.path,
                              fit: BoxFit.contain,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      card.category.toUpperCase(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: _accent(card.colour),
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
    ],
  );
}
