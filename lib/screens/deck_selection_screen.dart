import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/app_constants.dart';
import '../providers/deck_provider.dart';
import '../widgets/deck_tile.dart';
import '../widgets/home_navigation_button.dart';
import '../widgets/utility_page_background.dart';

class DeckSelectionScreen extends StatelessWidget {
  const DeckSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<DeckProvider>();
    final builtInDecks = provider.decks
      .where((deck) => AppConstants.builtInDeckIds.contains(deck.id))
      .toList();
    return UtilityPageScaffold(
      appBar: AppBar(
        title: const Text('Built-in Decks'),
        actions: [
          const Padding(
            padding: EdgeInsets.only(right: 8),
            child: HomeNavigationButton(),
          ),
        ],
      ),
      body: provider.loading
          ? const Center(child: CircularProgressIndicator())
          : builtInDecks.isEmpty
          ? const Center(child: Text('The built-in decks are unavailable.'))
          : LayoutBuilder(
              builder: (context, constraints) => GridView.builder(
                padding: const EdgeInsets.all(24),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: constraints.maxWidth >= 720 ? 2 : 1,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: constraints.maxWidth >= 720 ? 0.72 : 1.45,
                ),
                itemCount: builtInDecks.length,
                itemBuilder: (_, index) {
                  final deck = builtInDecks[index];
                  return DeckTile(
                    deck: deck,
                    selected: deck.id == provider.activeDeckId,
                    editable: false,
                    onSelect: () => provider.select(deck.id),
                    onRename: () {},
                    onDelete: () {},
                  );
                },
              ),
            ),
    );
  }
}
