import 'package:flutter/material.dart';
import '../models/card_image_model.dart';

class SelectedCardActions extends StatelessWidget {
  const SelectedCardActions({
    required this.card,
    required this.deckName,
    required this.onOpen,
    required this.onTranscribe,
    required this.onDiscuss,
    required this.onFavourite,
    this.onAssignToDeck,
    super.key,
  });
  final CardImageModel card;
  final String deckName;
  final VoidCallback onOpen;
  final VoidCallback onTranscribe;
  final VoidCallback? onDiscuss;
  final VoidCallback onFavourite;
  final VoidCallback? onAssignToDeck;
  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(card.displayTitle, style: Theme.of(context).textTheme.titleLarge),
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
                onPressed: onTranscribe,
                icon: const Icon(Icons.document_scanner),
                label: const Text('Transcribe'),
              ),
              OutlinedButton.icon(
                onPressed: onDiscuss,
                icon: const Icon(Icons.smart_toy),
                label: const Text('Discuss with AI'),
              ),
              OutlinedButton.icon(
                onPressed: onAssignToDeck,
                icon: const Icon(Icons.library_add_outlined),
                label: const Text('Assign to deck'),
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
