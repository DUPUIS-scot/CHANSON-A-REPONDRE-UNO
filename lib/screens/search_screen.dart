import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/card_categories.dart';
import '../models/card_image_model.dart';
import '../providers/deck_provider.dart';
import '../services/search_service.dart';
import '../widgets/home_navigation_button.dart';
import '../widgets/search_card_castle.dart';
import '../widgets/stored_image.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final controller = TextEditingController();
  String? deckId;
  String? category;
  String? colour;

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  void clear() {
    controller.clear();
    setState(() {
      deckId = null;
      category = null;
      colour = null;
    });
  }

  void openFullscreen(CardImageModel card) {
    showDialog<void>(
      context: context,
      barrierColor: Colors.black87,
      builder: (dialogContext) => Material(
        color: Colors.transparent,
        child: Stack(
          children: [
            Positioned.fill(
              child: GestureDetector(
                onTap: () => Navigator.of(dialogContext).pop(),
                child: const SizedBox.expand(),
              ),
            ),
            Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: AspectRatio(
                  aspectRatio: card.aspectRatio,
                  child: StoredImage(
                    source: card.imagePath,
                    fit: BoxFit.contain,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<DeckProvider>();
    final service = SearchService();
    final cards = service.cards(
      decks: provider.decks,
      query: controller.text,
      deckId: deckId,
      category: category,
      colour: colour,
    );
    final decks = service.decks(provider.decks, controller.text);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Search'),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 8),
            child: HomeNavigationButton(),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                TextField(
                  controller: controller,
                  onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(
                    labelText: 'Search cards and decks',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: IconButton(
                      onPressed: clear,
                      icon: const Icon(Icons.clear),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 10,
                  children: [
                    DropdownButton<String?>(
                      value: deckId,
                      hint: const Text('Deck'),
                      items: [
                        const DropdownMenuItem(
                          value: null,
                          child: Text('Any deck'),
                        ),
                        ...provider.decks.map(
                          (deck) => DropdownMenuItem(
                            value: deck.id,
                            child: Text(deck.name),
                          ),
                        ),
                      ],
                      onChanged: (v) => setState(() => deckId = v),
                    ),
                    DropdownButton<String?>(
                      value: category,
                      hint: const Text('Category'),
                      items: [
                        const DropdownMenuItem(
                          value: null,
                          child: Text('Any category'),
                        ),
                        ...cardCategories.map(
                          (v) => DropdownMenuItem(
                            value: v.label,
                            child: Text(v.badge),
                          ),
                        ),
                      ],
                      onChanged: (v) => setState(() => category = v),
                    ),
                    DropdownButton<String?>(
                      value: colour,
                      hint: const Text('Colour'),
                      items: [
                        const DropdownMenuItem(
                          value: null,
                          child: Text('Any colour'),
                        ),
                        ...provider.cards
                            .map((card) => card.colour)
                            .toSet()
                            .map(
                              (v) => DropdownMenuItem(value: v, child: Text(v)),
                            ),
                      ],
                      onChanged: (v) => setState(() => colour = v),
                    ),
                    TextButton.icon(
                      onPressed: clear,
                      icon: const Icon(Icons.filter_alt_off),
                      label: const Text('Clear filters'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: cards.isEmpty && decks.isEmpty
                ? const Center(
                    child: Text('No cards or decks match your search.'),
                  )
                : ListView(
                    children: [
                      if (decks.isNotEmpty)
                        const ListTile(title: Text('DECKS')),
                      ...decks.map(
                        (deck) => ListTile(
                          leading: const Icon(Icons.style),
                          title: Text(deck.name),
                          subtitle: Text('${deck.cards.length} cards'),
                        ),
                      ),
                      if (cards.isNotEmpty)
                        const ListTile(title: Text('CARDS')),
                      if (cards.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: SearchCardCastle(
                            cards: cards,
                            onOpenFullscreen: openFullscreen,
                          ),
                        ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}
