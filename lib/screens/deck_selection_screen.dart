import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/app_constants.dart';
import '../providers/deck_provider.dart';
import '../services/deck_import_service.dart';
import '../services/local_storage_service.dart';
import '../widgets/deck_tile.dart';
import '../widgets/home_navigation_button.dart';

class DeckSelectionScreen extends StatelessWidget {
  const DeckSelectionScreen({super.key});

  Future<void> _importDeck(BuildContext context) async {
    try {
      final importer = DeckImportService(context.read<LocalStorageService>());
      final files = await importer.pickPngFiles();
      if (files == null || !context.mounted) return;
      final name = await _name(context, 'Name imported deck');
      if (name == null || !context.mounted) return;
      await context.read<DeckProvider>().import(name, files);
    } on Object catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$error')));
      }
    }
  }

  Future<String?> _name(
    BuildContext context,
    String title, [
    String initial = '',
  ]) async {
    final controller = TextEditingController(text: initial);
    return showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(labelText: 'Deck name'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, controller.text.trim()),
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<DeckProvider>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Choose Deck'),
        actions: [
          IconButton(
            tooltip: 'Create empty deck',
            onPressed: () async {
              final name = await _name(context, 'Create deck');
              if (name != null && context.mounted) {
                await context.read<DeckProvider>().create(name);
              }
            },
            icon: const Icon(Icons.add),
          ),
          const Padding(
            padding: EdgeInsets.only(right: 8),
            child: HomeNavigationButton(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _importDeck(context),
        icon: const Icon(Icons.file_upload_outlined),
        label: const Text('Import PNG deck'),
      ),
      body: provider.loading
          ? const Center(child: CircularProgressIndicator())
          : provider.decks.isEmpty
          ? const Center(
              child: Text('No decks yet. Create one or import PNG cards.'),
            )
          : LayoutBuilder(
              builder: (context, constraints) {
                final columns = constraints.maxWidth >= 1000
                    ? 4
                    : constraints.maxWidth >= 650
                    ? 3
                    : constraints.maxWidth >= 420
                    ? 2
                    : 1;
                return GridView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 88),
                  itemCount: provider.decks.length,
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: columns,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 1.15,
                  ),
                  itemBuilder: (context, index) {
                    final deck = provider.decks[index];
                    return DeckTile(
                      deck: deck,
                      selected: deck.id == provider.activeDeckId,
                      editable: deck.id != AppConstants.productionDeckId,
                      onSelect: () => provider.select(deck.id),
                      onRename: () async {
                        final name = await _name(
                          context,
                          'Rename deck',
                          deck.name,
                        );
                        if (name != null && context.mounted) {
                          await provider.rename(deck.id, name);
                        }
                      },
                      onDelete: () async {
                        final confirmed =
                            await showDialog<bool>(
                              context: context,
                              builder: (context) => AlertDialog(
                                title: const Text('Delete deck?'),
                                content: Text(
                                  'Delete ${deck.name} and all of its imported files?',
                                ),
                                actions: [
                                  TextButton(
                                    onPressed: () =>
                                        Navigator.pop(context, false),
                                    child: const Text('Cancel'),
                                  ),
                                  FilledButton(
                                    onPressed: () =>
                                        Navigator.pop(context, true),
                                    child: const Text('Delete'),
                                  ),
                                ],
                              ),
                            ) ??
                            false;
                        if (confirmed) await provider.delete(deck.id);
                      },
                    );
                  },
                );
              },
            ),
    );
  }
}
