import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/app_router.dart';
import '../models/card_image_model.dart';
import '../models/journal_entry_model.dart';
import '../providers/deck_provider.dart';
import '../providers/journal_provider.dart';
import '../widgets/home_navigation_button.dart';
import '../widgets/card_selection_dialog.dart';
import '../widgets/medium_card_thumbnail.dart';

class JournalScreen extends StatefulWidget {
  const JournalScreen({super.key});
  @override
  State<JournalScreen> createState() => _JournalScreenState();
}

class _JournalScreenState extends State<JournalScreen> {
  String query = '';

  Future<void> edit(BuildContext context, [JournalEntryModel? entry]) async {
    final text = TextEditingController(text: entry?.text);
    final linkedCardIds = <String>[...?entry?.linkedCardIds];
    await showDialog<void>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text(entry == null ? 'New journal entry' : 'Edit entry'),
          content: SizedBox(
            width: 520,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: text,
                    minLines: 5,
                    maxLines: 10,
                    decoration: const InputDecoration(
                      labelText: 'Response, note or memory',
                    ),
                  ),
                  const SizedBox(height: 10),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        final cards = context.read<DeckProvider>().cards;
                        final selected = await showDialog<List<String>>(
                          context: dialogContext,
                          builder: (_) => CardSelectionDialog(
                            cards: cards,
                            initiallySelectedIds: linkedCardIds.toSet(),
                          ),
                        );
                        if (selected != null) {
                          setDialogState(() {
                            linkedCardIds
                              ..clear()
                              ..addAll(selected);
                          });
                        }
                      },
                      icon: const Icon(Icons.style_outlined),
                      label: Text(
                        linkedCardIds.isEmpty
                            ? 'Link cards'
                            : 'Linked cards selected: ${linkedCardIds.length}',
                      ),
                    ),
                  ),
                  if (linkedCardIds.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: linkedCardIds.map((id) {
                        final card = context.read<DeckProvider>().cardById(id);
                        return InputChip(
                          avatar: const Icon(Icons.style, size: 18),
                          label: Text(card?.title ?? 'Unavailable card'),
                          onDeleted: () => setDialogState(
                            () => linkedCardIds.remove(id),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () async {
                if (text.text.trim().isEmpty) return;
                await context.read<JournalProvider>().saveEntry(
                  id: entry?.id,
                  text: text.text.trim(),
                  linkedCardIds: linkedCardIds,
                  photoPath: entry?.photoPath,
                  voicePath: entry?.voicePath,
                );
                if (dialogContext.mounted) Navigator.pop(dialogContext);
              },
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
    text.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<JournalProvider>();
    final cards = context.watch<DeckProvider>().cards;
    final cardsById = {for (final card in cards) card.id: card};
    final entries =
        provider.entries
            .where(
              (entry) => entry.text.toLowerCase().contains(query.toLowerCase()),
            )
            .toList()
          ..sort((a, b) => b.modifiedAt.compareTo(a.modifiedAt));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Journal'),
        actions: [
          IconButton(
            onPressed: () => edit(context),
            icon: const Icon(Icons.add),
            tooltip: 'New entry',
          ),
          const Padding(
            padding: EdgeInsets.only(right: 8),
            child: HomeNavigationButton(),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              onChanged: (value) => setState(() => query = value),
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search),
                labelText: 'Search journal',
              ),
            ),
          ),
          Expanded(
            child: entries.isEmpty
                ? const Center(child: Text('No journal entries found.'))
                : ListView.separated(
                    padding: const EdgeInsets.all(12),
                    itemCount: entries.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final entry = entries[index];
                      return _JournalEntryCard(
                        entry: entry,
                        cardsById: cardsById,
                        onEdit: () => edit(context, entry),
                        onToggleFavourite: () =>
                            provider.toggleFavourite(entry.id),
                        onDelete: () => _delete(context, provider, entry),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Future<void> _delete(
    BuildContext context,
    JournalProvider provider,
    JournalEntryModel entry,
  ) async {
    final yes =
        await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Delete entry?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: () => Navigator.pop(context, true),
                child: const Text('Delete'),
              ),
            ],
          ),
        ) ??
        false;
    if (yes) await provider.delete(entry.id);
  }
}

class _JournalEntryCard extends StatelessWidget {
  const _JournalEntryCard({
    required this.entry,
    required this.cardsById,
    required this.onEdit,
    required this.onToggleFavourite,
    required this.onDelete,
  });

  final JournalEntryModel entry;
  final Map<String, CardImageModel> cardsById;
  final VoidCallback onEdit;
  final VoidCallback onToggleFavourite;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final links = entry.linkedCardIds
        .map((id) => (id: id, card: cardsById[id]))
        .toList(growable: false);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                IconButton(
                  tooltip: entry.isFavourite
                      ? 'Remove favourite'
                      : 'Add favourite',
                  onPressed: onToggleFavourite,
                  icon: Icon(
                    entry.isFavourite ? Icons.favorite : Icons.favorite_border,
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(entry.text, style: Theme.of(context).textTheme.bodyLarge),
                      const SizedBox(height: 8),
                      Text(
                        'Created ${entry.createdAt.toLocal()}\n'
                        'Modified ${entry.modifiedAt.toLocal()}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                IconButton(
                  tooltip: 'Edit entry',
                  onPressed: onEdit,
                  icon: const Icon(Icons.edit_outlined),
                ),
                IconButton(
                  tooltip: 'Delete entry',
                  onPressed: onDelete,
                  icon: const Icon(Icons.delete_outline),
                ),
              ],
            ),
            if (links.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text(
                links.length == 1 ? 'Linked card' : 'Linked cards',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 10),
              if (links.length > 4)
                SizedBox(
                  height: 290,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: links.length,
                    separatorBuilder: (_, _) => const SizedBox(width: 16),
                    itemBuilder: (_, index) => _linkedCard(context, links[index]),
                  ),
                )
              else
                Wrap(
                  spacing: 16,
                  runSpacing: 16,
                  children: links.map((link) => _linkedCard(context, link)).toList(),
                ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _linkedCard(
    BuildContext context,
    ({String id, CardImageModel? card}) link,
  ) {
    final card = link.card;
    if (card == null) return const _MissingLinkedCard();
    return MediumCardThumbnail(
      card: card,
      onTap: () => context.push(AppRoutes.card(card.id)),
    );
  }
}

class _MissingLinkedCard extends StatelessWidget {
  const _MissingLinkedCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: MediumCardThumbnail.width,
      height: 220,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        border: Border.all(color: Theme.of(context).colorScheme.outline),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.link_off, size: 36),
          const SizedBox(height: 10),
          const Text('Linked card unavailable', textAlign: TextAlign.center),
        ],
      ),
    );
  }
}
