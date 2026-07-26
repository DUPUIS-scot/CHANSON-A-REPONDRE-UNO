import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../data/card_categories.dart';
import '../providers/deck_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/deck_tile.dart';
import '../widgets/home_navigation_button.dart';

class DeckSelectionScreen extends StatelessWidget {
  const DeckSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<DeckProvider>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Choose Deck'),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 8),
            child: HomeNavigationButton(),
          ),
        ],
      ),
      body: provider.loading
          ? const Center(child: CircularProgressIndicator())
          : provider.decks.isEmpty
          ? const Center(child: Text('The permanent deck is loading.'))
          : LayoutBuilder(
              builder: (context, constraints) {
                final columns = constraints.maxWidth >= 1000
                    ? 4
                    : constraints.maxWidth >= 650
                    ? 3
                    : constraints.maxWidth >= 420
                    ? 2
                    : 1;
                return CustomScrollView(
                  slivers: [
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                        child: Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            for (final category in cardCategories)
                              ChoiceChip(
                                label: Text(category.badge),
                                selected:
                                    provider.selectedCategory == category.label,
                                selectedColor: AppTheme.gold,
                                onSelected: (_) => provider.setSelectedCategory(
                                  category.label,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 88),
                      sliver: SliverGrid.builder(
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
                            onSelect: () => provider.select(deck.id),
                          );
                        },
                      ),
                    ),
                  ],
                );
              },
            ),
    );
  }
}
