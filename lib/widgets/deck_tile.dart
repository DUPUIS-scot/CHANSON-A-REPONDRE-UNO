import 'package:flutter/material.dart';
import '../models/deck_model.dart';
import '../theme/app_theme.dart';
import 'stored_image.dart';

class DeckTile extends StatelessWidget {
  const DeckTile({
    required this.deck,
    required this.selected,
    required this.onSelect,
    required this.onRename,
    required this.onDelete,
    super.key,
  });
  final Deck deck;
  final bool selected;
  final VoidCallback onSelect;
  final VoidCallback onRename;
  final VoidCallback onDelete;
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
                    fit: BoxFit.contain,
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
                PopupMenuButton<String>(
                  onSelected: (value) =>
                      value == 'rename' ? onRename() : onDelete(),
                  itemBuilder: (_) => const [
                    PopupMenuItem(value: 'rename', child: Text('Rename')),
                    PopupMenuItem(value: 'delete', child: Text('Delete')),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}
