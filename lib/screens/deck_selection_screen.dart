import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/app_constants.dart';
import '../core/app_router.dart';
import '../providers/deck_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/app_page_shell.dart';
import '../widgets/stored_image.dart';

class DeckSelectionScreen extends StatelessWidget {
  const DeckSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<DeckProvider>();
    final deck = provider.decks
        .where((item) => item.id == AppConstants.productionDeckId)
        .firstOrNull;

    return AppPageShell(
      title: 'Choose Deck',
      child: provider.loading
          ? Center(
              child: Semantics(
                label: 'Loading the permanent deck',
                child: const CircularProgressIndicator(),
              ),
            )
          : deck == null
          ? const _MissingDeckState()
          : Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(AppTheme.spaceLg),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 720),
                  child: Card(
                    clipBehavior: Clip.antiAlias,
                    child: Padding(
                      padding: const EdgeInsets.all(AppTheme.spaceLg),
                      child: LayoutBuilder(
                        builder: (context, constraints) {
                          final compact =
                              constraints.maxWidth < AppTheme.tabletBreakpoint;
                          final artwork = AspectRatio(
                            aspectRatio: cardAspectRatio,
                            child: StoredImage(
                              source: deck.coverPath,
                              fit: BoxFit.contain,
                              errorBuilder: (_, _, _) => const ColoredBox(
                                color: AppTheme.darkLeather,
                                child: Center(
                                  child: Icon(
                                    Icons.style_rounded,
                                    size: 72,
                                    color: AppTheme.gold,
                                  ),
                                ),
                              ),
                            ),
                          );
                          final details = Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: compact
                                ? CrossAxisAlignment.center
                                : CrossAxisAlignment.start,
                            children: [
                              const Icon(
                                Icons.lock_outline_rounded,
                                color: AppTheme.brightGold,
                              ),
                              const SizedBox(height: AppTheme.spaceSm),
                              Text(
                                deck.name,
                                textAlign: compact
                                    ? TextAlign.center
                                    : TextAlign.start,
                                style: Theme.of(
                                  context,
                                ).textTheme.headlineSmall,
                              ),
                              const SizedBox(height: AppTheme.spaceSm),
                              Text(
                                '${deck.cards.length} permanent cards',
                                style: Theme.of(context).textTheme.bodyLarge,
                              ),
                              const SizedBox(height: AppTheme.spaceMd),
                              const Text(
                                'The curated built-in collection used throughout Play, Browse Cards, and Search.',
                                textAlign: TextAlign.start,
                              ),
                              const SizedBox(height: AppTheme.spaceLg),
                              FilledButton.icon(
                                onPressed: () async {
                                  await provider.select(deck.id);
                                  if (context.mounted) {
                                    context.go(AppRoutes.cards);
                                  }
                                },
                                icon: const Icon(Icons.menu_book_rounded),
                                label: const Text('Browse Cards'),
                              ),
                            ],
                          );
                          if (compact) {
                            return Column(
                              children: [
                                SizedBox(height: 280, child: artwork),
                                const SizedBox(height: AppTheme.spaceLg),
                                details,
                              ],
                            );
                          }
                          return SizedBox(
                            height: 420,
                            child: Row(
                              children: [
                                SizedBox(width: 250, child: artwork),
                                const SizedBox(width: AppTheme.spaceXl),
                                Expanded(child: details),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                ),
              ),
            ),
    );
  }
}

class _MissingDeckState extends StatelessWidget {
  const _MissingDeckState();

  @override
  Widget build(BuildContext context) => Center(
    child: ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 420),
      child: const Padding(
        padding: EdgeInsets.all(AppTheme.spaceLg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.style_outlined, size: 56, color: AppTheme.gold),
            SizedBox(height: AppTheme.spaceMd),
            Text(
              'The permanent deck could not be loaded.',
              textAlign: TextAlign.center,
            ),
            SizedBox(height: AppTheme.spaceSm),
            Text(
              'Reload the application. Your saved game and preferences will remain available.',
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    ),
  );
}
