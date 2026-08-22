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
    final decks = provider.decks
        .where((deck) => AppConstants.builtInDeckIds.contains(deck.id))
        .toList();

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
          ? const Center(child: Text('The built-in decks are unavailable.'))
          : LayoutBuilder(
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
                  childAspectRatio: constraints.maxWidth >= 720 ? 0.72 : 1.45,
                ),
                itemCount: decks.length,
                itemBuilder: (_, index) {
                  final deck = decks[index];
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
