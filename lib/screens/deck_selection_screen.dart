import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/app_constants.dart';
import '../providers/deck_provider.dart';
import '../widgets/deck_tile.dart';
import '../widgets/home_navigation_button.dart';
import '../widgets/utility_page_background.dart';

class DeckSelectionScreen extends StatelessWidget {
  const DeckSelectionScreen({super.key});

  Future<String?> _askForName(
    BuildContext context, {
    required String title,
    String initialValue = '',
    String confirmLabel = 'Create',
  }) async {
    final controller = TextEditingController(text: initialValue);
    final result = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(title),
        content: TextField(
          controller: controller,
          autofocus: true,
          textInputAction: TextInputAction.done,
          decoration: const InputDecoration(
            labelText: 'Deck name',
            hintText: 'My new deck',
          ),
          onSubmitted: (value) {
            if (value.trim().isNotEmpty) {
              Navigator.of(dialogContext).pop(value.trim());
            }
          },
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              final value = controller.text.trim();
              if (value.isNotEmpty) Navigator.of(dialogContext).pop(value);
            },
            child: Text(confirmLabel),
          ),
        ],
      ),
    );
    controller.dispose();
    return result;
  }

  Future<void> _createDeck(BuildContext context) async {
    final name = await _askForName(context, title: 'Create a new deck');
    if (name == null || !context.mounted) return;
    await context.read<DeckProvider>().create(name);
  }

  Future<void> _renameDeck(
    BuildContext context,
    String id,
    String currentName,
  ) async {
    final name = await _askForName(
      context,
      title: 'Rename deck',
      initialValue: currentName,
      confirmLabel: 'Rename',
    );
    if (name == null || !context.mounted) return;
    await context.read<DeckProvider>().rename(id, name);
  }

  Future<void> _deleteDeck(
    BuildContext context,
    String id,
    String name,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Delete deck?'),
        content: Text('Delete “$name”?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;
    await context.read<DeckProvider>().delete(id);
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<DeckProvider>();
    final decks = provider.decks;

    return UtilityPageScaffold(
      appBar: AppBar(
        title: const Text('Decks'),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 8),
            child: HomeNavigationButton(),
          ),
        ],
      ),
      body: provider.loading
          ? const Center(child: CircularProgressIndicator())
          : decks.isEmpty
          ? const Center(child: Text('No decks are available.'))
          : Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
                  child: Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      FilledButton.icon(
                        onPressed: () => _createDeck(context),
                        icon: const Icon(Icons.add_rounded),
                        label: const Text('New deck'),
                      ),
                    ],
                  ),
                ),
                const Padding(
                  padding: EdgeInsets.fromLTRB(24, 14, 24, 0),
                  child: Text(
                    'Create a new deck here. Card artwork is added to the project separately.',
                  ),
                ),
                Expanded(
                  child: LayoutBuilder(
                    builder: (context, constraints) => GridView.builder(
                      padding: const EdgeInsets.all(24),
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: constraints.maxWidth >= 1080
                            ? 3
                            : constraints.maxWidth >= 720
                            ? 2
                            : 1,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 16,
                        childAspectRatio: constraints.maxWidth >= 720
                            ? 0.72
                            : 1.45,
                      ),
                      itemCount: decks.length,
                      itemBuilder: (_, index) {
                        final deck = decks[index];
                        final builtIn = AppConstants.builtInDeckIds.contains(
                          deck.id,
                        );
                        return DeckTile(
                          deck: deck,
                          selected: deck.id == provider.activeDeckId,
                          editable: !builtIn,
                          onSelect: () => provider.select(deck.id),
                          onRename: () =>
                              _renameDeck(context, deck.id, deck.name),
                          onDelete: () =>
                              _deleteDeck(context, deck.id, deck.name),
                        );
                      },
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
