import 'package:flutter/material.dart';
import '../models/deck_model.dart';
import '../theme/app_theme.dart';
import 'stored_image.dart';

class DeckTile extends StatelessWidget {
  const DeckTile({
    required this.deck,
    required this.selected,
    required this.onSelect,
    super.key,
  });
  final Deck deck;
  final bool selected;
  final VoidCallback onSelect;
  @override
  Widget build(BuildContext context) => Card(
    clipBehavior: Clip.antiAlias,
    child: InkWell(
      onTap: onSelect,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: deck.coverPath.isEmpty
                ? const Icon(
                    Icons.style_rounded,
                    size: 52,
                    color: AppTheme.gold,
                  )
                : StoredImage(
                    source: deck.coverPath,
                    fit: BoxFit.cover,
                    errorBuilder: (_, _, _) =>
                        const Icon(Icons.broken_image_outlined, size: 48),
                  ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 10, 4, 6),
            child: Row(
              children: [
                if (selected)
                  const Icon(
                    Icons.check_circle,
                    color: AppTheme.brightGold,
                    size: 18,
                  ),
                if (selected) const SizedBox(width: 6),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        deck.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Text('${deck.cards.length} cards'),
                    ],
                  ),
                ),
                const Icon(Icons.lock_outline, color: AppTheme.gold, size: 18),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}
