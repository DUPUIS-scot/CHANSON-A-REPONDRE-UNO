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
              builder: (context, constraints) {
                final width = constraints.maxWidth;
                final columns = width >= 1080
                    ? 3
                    : width >= 720
                    ? 2
                    : width >= 340
                    ? 2
                    : 1;
                return GridView.builder(
                  padding: EdgeInsets.symmetric(
                    horizontal: width < 720 ? 14 : 24,
                    vertical: 18,
                  ),
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: columns,
                    crossAxisSpacing: width < 720 ? 12 : 16,
                    mainAxisSpacing: width < 720 ? 12 : 16,
                    childAspectRatio: width < 720 ? 0.64 : 0.72,
                  ),
                  itemCount: decks.length,
                  itemBuilder: (_, index) {
                    final deck = decks[index];
                    final tile = DeckTile(
                      deck: deck,
                      selected: deck.id == provider.activeDeckId,
                      editable: false,
                      onSelect: () => provider.select(deck.id),
                      onRename: () {},
                      onDelete: () {},
                    );

                    if (deck.id != AppConstants.hpDeckId) {
                      return tile;
                    }

                    return Stack(
                      fit: StackFit.expand,
                      children: [
                        tile,
                        IgnorePointer(
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(8, 18, 8, 58),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Expanded(
                                  child: Image.asset(
                                    'assets/images/castle_jester_loading_bar.png',
                                    fit: BoxFit.contain,
                                    errorBuilder: (_, _, _) =>
                                        const SizedBox.shrink(),
                                  ),
                                ),
                                const SizedBox(height: 6),
                                DecoratedBox(
                                  decoration: BoxDecoration(
                                    color: const Color(0xE61A120C),
                                    borderRadius: BorderRadius.circular(18),
                                    border: Border.all(
                                      color: const Color(0xFFFFC64A),
                                      width: 2,
                                    ),
                                    boxShadow: const [
                                      BoxShadow(
                                        blurRadius: 10,
                                        color: Color(0x99000000),
                                      ),
                                    ],
                                  ),
                                  child: const Padding(
                                    padding: EdgeInsets.symmetric(
                                      horizontal: 14,
                                      vertical: 8,
                                    ),
                                    child: Text(
                                      'WORK IN PROGRESS',
                                      textAlign: TextAlign.center,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        color: Color(0xFFFFC64A),
                                        fontSize: 15,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 0.8,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                );
              },
            ),
    );
  }
}
