import 'package:flutter/material.dart';
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
          Text(
            'RECENT CARDS',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(color: AppTheme.gold),
          ),
          const SizedBox(width: 16),
          const Expanded(child: Divider(color: AppTheme.gold)),
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
            child: Text('Recently viewed cards will appear here.'),
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
              return Container(
                width: 132,
                decoration: BoxDecoration(
                  border: Border.all(color: _accent(card.colour)),
                  borderRadius: BorderRadius.circular(8),
                ),
                clipBehavior: Clip.antiAlias,
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () => onCardTap(card),
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        StoredImage(source: card.path),
                        Align(
                          alignment: Alignment.bottomCenter,
                          child: Container(
                            width: double.infinity,
                            color: const Color(0xD9000000),
                            padding: const EdgeInsets.all(8),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  card.category.toUpperCase(),
                                  style: TextStyle(
                                    color: _accent(card.colour),
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Text(
                                  card.displayTitle,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
    ],
  );
}
