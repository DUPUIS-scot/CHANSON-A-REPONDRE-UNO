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
                final height = constraints.maxHeight;

                // Keep portrait/tablet behaviour unchanged. The compact mode is
                // deliberately offered only to short landscape phone viewports.
                final compactLandscape = width > height && height < 520;

                final columns = compactLandscape
                    ? 3
                    : width >= 1080
                    ? 3
                    : width >= 720
                    ? 2
                    : width >= 340
                    ? 2
                    : 1;

                final horizontalPadding = compactLandscape
                    ? 10.0
                    : width < 720
                    ? 14.0
                    : 24.0;
                final verticalPadding = compactLandscape ? 8.0 : 18.0;
                final spacing = compactLandscape
                    ? 10.0
                    : width < 720
                    ? 12.0
                    : 16.0;

                final portraitAspectRatio = width < 720 ? 0.64 : 0.72;
                final landscapeTileHeight = compactLandscape
                    ? (height - (verticalPadding * 2)).clamp(210.0, 360.0)
                    : null;

                return SafeArea(
                  top: false,
                  child: GridView.builder(
                    padding: EdgeInsets.symmetric(
                      horizontal: horizontalPadding,
                      vertical: verticalPadding,
                    ),
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: columns,
                      crossAxisSpacing: spacing,
                      mainAxisSpacing: spacing,
                      mainAxisExtent: landscapeTileHeight,
                      childAspectRatio: portraitAspectRatio,
                    ),
                    itemCount: decks.length,
                    itemBuilder: (_, index) {
                      final deck = decks[index];
                      final tile = DeckTile(
                        deck: deck,
                        selected: deck.id == provider.activeDeckId,
                        editable: false,
                        compact: compactLandscape,
                        onSelect: () => provider.select(deck.id),
                        onRename: () {},
                        onDelete: () {},
                      );

                      if (deck.id != AppConstants.hpDeckId) {
                        return tile;
                      }

                      return Stack(
                        fit: StackFit.expand,
                        clipBehavior: Clip.none,
                        children: [
                          tile,
                          IgnorePointer(
                            child: Align(
                              alignment: const Alignment(0, -0.08),
                              child: FractionallySizedBox(
                                widthFactor: compactLandscape ? 0.86 : 0.94,
                                child: Image.asset(
                                  'assets/hp/work_in_progress_ribbon.webp',
                                  fit: BoxFit.contain,
                                  filterQuality: FilterQuality.high,
                                  errorBuilder: (_, _, _) =>
                                      const SizedBox.shrink(),
                                ),
                              ),
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                );
              },
            ),
    );
  }
}
