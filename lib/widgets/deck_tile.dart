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
    this.editable = true,
    this.compact = false,
    super.key,
  });
  final Deck deck;
  final bool selected;
  final VoidCallback onSelect;
  final VoidCallback onRename;
  final VoidCallback onDelete;
  final bool editable;
  final bool compact;

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
                ? Icon(
                    Icons.style_rounded,
                    size: compact ? 40 : 52,
                    color: AppTheme.gold,
                  )
                : StoredImage(
                    source: deck.coverPath,
                    fit: BoxFit.contain,
                    errorBuilder: (_, _, _) => Icon(
                      Icons.broken_image_outlined,
                      size: compact ? 38 : 48,
                    ),
                  ),
          ),
          Padding(
            padding: compact
                ? const EdgeInsets.fromLTRB(9, 6, 2, 3)
                : const EdgeInsets.fromLTRB(12, 10, 4, 6),
            child: Row(
              children: [
                if (selected)
                  Icon(
                    Icons.check_circle,
                    color: AppTheme.brightGold,
                    size: compact ? 16 : 18,
                  ),
                if (selected) SizedBox(width: compact ? 4 : 6),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        deck.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: compact
                            ? Theme.of(context).textTheme.titleSmall
                            : Theme.of(context).textTheme.titleMedium,
                      ),
                      Text(
                        '${deck.cards.length} cards',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: compact
                            ? Theme.of(context).textTheme.bodySmall
                            : null,
                      ),
                    ],
                  ),
                ),
                if (editable)
                  PopupMenuButton<String>(
                    onSelected: (value) =>
                        value == 'rename' ? onRename() : onDelete(),
                    itemBuilder: (_) => const [
                      PopupMenuItem(value: 'rename', child: Text('Rename')),
                      PopupMenuItem(value: 'delete', child: Text('Delete')),
                    ],
                  )
                else
                  Padding(
                    padding: EdgeInsets.all(compact ? 8 : 12),
                    child: Tooltip(
                      message: 'Permanent deck',
                      child: Icon(
                        Icons.lock_outline,
                        size: compact ? 17 : 20,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}
