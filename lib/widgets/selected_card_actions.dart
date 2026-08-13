import 'package:flutter/material.dart';
import '../models/card_image_model.dart';

class SelectedCardActions extends StatelessWidget {
  const SelectedCardActions({
    required this.card,
    required this.deckName,
    required this.onOpen,
    required this.onShare,
    required this.onFavourite,
    super.key,
  });
  final CardImageModel card;
  final String deckName;
  final VoidCallback onOpen;
  final VoidCallback onShare;
  final VoidCallback onFavourite;
  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            card.category.toUpperCase(),
            style: Theme.of(context).textTheme.titleLarge,
          ),
          Text(deckName),
          const SizedBox(height: 8),
          Wrap(
            alignment: WrapAlignment.center,
            spacing: 8,
            runSpacing: 8,
            children: [
              FilledButton.icon(
                onPressed: onOpen,
                icon: const Icon(Icons.fullscreen),
                label: const Text('Open Full Screen'),
              ),
              OutlinedButton.icon(
                onPressed: onShare,
                icon: const Icon(Icons.share_outlined),
                label: const Text('Share'),
              ),
              IconButton.outlined(
                tooltip: card.isFavourite
                    ? 'Remove favourite'
                    : 'Add favourite',
                onPressed: onFavourite,
                icon: Icon(
                  card.isFavourite ? Icons.favorite : Icons.favorite_border,
                ),
              ),
            ],
          ),
        ],
      ),
    ),
  );
}
