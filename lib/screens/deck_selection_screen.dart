import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/app_constants.dart';
import '../generated/hp_work_in_progress_overlay.dart';
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
                      clipBehavior: Clip.none,
                      children: [
                        tile,
                        IgnorePointer(
                          child: Align(
                            alignment: const Alignment(0, -0.12),
                            child: FractionallySizedBox(
                              widthFactor: 0.96,
                              child: Image.memory(
                                base64Decode(hpWorkInProgressOverlayBase64),
                                fit: BoxFit.contain,
                                gaplessPlayback: true,
                                filterQuality: FilterQuality.high,
                              ),
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
