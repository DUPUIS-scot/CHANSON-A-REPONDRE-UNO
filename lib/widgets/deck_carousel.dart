import 'package:flutter/material.dart';
import '../models/deck_model.dart';
import '../theme/app_theme.dart';
import 'stored_image.dart';

class DeckCarousel extends StatelessWidget {
  const DeckCarousel({
    required this.decks,
    required this.onDeckTap,
    required this.onViewAll,
    super.key,
  });
  final List<Deck> decks;
  final ValueChanged<Deck> onDeckTap;
  final VoidCallback onViewAll;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      _SectionHeader(title: 'FEATURED DECKS', onViewAll: onViewAll),
      const SizedBox(height: 10),
      if (decks.isEmpty)
        const SizedBox(
          height: 120,
          child: Center(
            child: Text('Featured decks will appear here.'),
          ),
        )
      else
        SizedBox(
          height: 190,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: decks.length,
            separatorBuilder: (_, _) => const SizedBox(width: 10),
            itemBuilder: (_, index) {
              final deck = decks[index];
              return SizedBox(
                width: 138,
                child: Card(
                  clipBehavior: Clip.antiAlias,
                  child: InkWell(
                    onTap: () => onDeckTap(deck),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Expanded(
                          child: deck.coverPath.isEmpty
                              ? const Icon(
                                  Icons.style,
                                  size: 44,
                                  color: AppTheme.gold,
                                )
                              : StoredImage(source: deck.coverPath),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(8),
                          child: Column(
                            children: [
                              Text(
                                deck.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(
                                '${deck.cards.length} cards',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ],
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

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.onViewAll});
  final String title;
  final VoidCallback onViewAll;
  @override
  Widget build(BuildContext context) => Row(
    children: [
      Text(
        title,
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
  );
}
