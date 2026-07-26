import 'package:flutter/material.dart';

class CardHandToolbar extends StatelessWidget {
  const CardHandToolbar({
    required this.deckName,
    required this.cardCount,
    required this.filterCount,
    required this.isShuffling,
    required this.onShuffle,
    required this.onReset,
    required this.onFilter,
    required this.canGoPrevious,
    required this.canGoNext,
    required this.onPrevious,
    required this.onNext,
    required this.pageLabel,
    super.key,
  });
  final String deckName;
  final int cardCount;
  final int filterCount;
  final bool isShuffling;
  final VoidCallback? onShuffle;
  final VoidCallback onReset;
  final VoidCallback onFilter;
  final bool canGoPrevious;
  final bool canGoNext;
  final VoidCallback onPrevious;
  final VoidCallback onNext;
  final String pageLabel;
  @override
  Widget build(BuildContext context) => Wrap(
    alignment: WrapAlignment.center,
    crossAxisAlignment: WrapCrossAlignment.center,
    spacing: 10,
    runSpacing: 8,
    children: [
      Text(deckName, style: Theme.of(context).textTheme.titleLarge),
      Chip(label: Text('$cardCount cards')),
      if (filterCount > 0)
        Chip(
          avatar: const Icon(Icons.filter_alt, size: 16),
          label: Text('$filterCount filters'),
        ),
      FilledButton.icon(
        onPressed: isShuffling ? null : onShuffle,
        icon: isShuffling
            ? const SizedBox.square(
                dimension: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : const Icon(Icons.shuffle_rounded),
        label: const Text('SHUFFLE CARDS'),
      ),
      OutlinedButton.icon(
        onPressed: isShuffling ? null : onReset,
        icon: const Icon(Icons.restart_alt),
        label: const Text('RESET ORDER'),
      ),
      IconButton.outlined(
        tooltip: 'Previous five cards',
        onPressed: isShuffling || !canGoPrevious ? null : onPrevious,
        icon: const Icon(Icons.chevron_left),
      ),
      Chip(label: Text(pageLabel)),
      IconButton.outlined(
        tooltip: 'Next five cards',
        onPressed: isShuffling || !canGoNext ? null : onNext,
        icon: const Icon(Icons.chevron_right),
      ),
      IconButton.outlined(
        tooltip: 'Filters',
        onPressed: onFilter,
        icon: const Icon(Icons.filter_list),
      ),
    ],
  );
}
