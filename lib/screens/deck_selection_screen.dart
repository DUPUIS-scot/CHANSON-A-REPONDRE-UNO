import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/app_constants.dart';
import '../providers/deck_provider.dart';
import '../widgets/deck_tile.dart';
import '../widgets/home_navigation_button.dart';

class DeckSelectionScreen extends StatelessWidget {
  const DeckSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<DeckProvider>();
    final permanentDeck = provider.decks
        .where((deck) => deck.id == AppConstants.productionDeckId)
        .firstOrNull;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Permanent Deck'),
        actions: [
          const Padding(
            padding: EdgeInsets.only(right: 8),
            child: HomeNavigationButton(),
          ),
        ],
      ),
      body: provider.loading
          ? const Center(child: CircularProgressIndicator())
          : permanentDeck == null
          ? const Center(child: Text('The permanent deck is unavailable.'))
          : Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 520),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: DeckTile(
                    deck: permanentDeck,
                    selected: permanentDeck.id == provider.activeDeckId,
                    editable: false,
                    onSelect: () => provider.select(permanentDeck.id),
                    onRename: () {},
                    onDelete: () {},
                  ),
                ),
              ),
            ),
    );
  }
}
