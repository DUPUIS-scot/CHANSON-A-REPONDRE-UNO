import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../data/card_categories.dart';
import '../core/app_constants.dart';
import '../models/card_image_model.dart';
import '../providers/deck_provider.dart';
import '../providers/game_provider.dart';
import '../providers/settings_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/discard_pile_widget.dart';
import '../widgets/draw_pile_widget.dart';
import '../widgets/game_table_background.dart';
import '../widgets/home_navigation_button.dart';
import '../widgets/opponent_hand.dart';
import '../widgets/player_hand.dart';
import '../widgets/puppet_dealer_controller.dart';
import '../widgets/puppet_dealer_scene.dart';
import 'play_hand_fullscreen_screen.dart';

class PlayScreen extends StatefulWidget {
  const PlayScreen({super.key});
  @override
  State<PlayScreen> createState() => _PlayScreenState();
}

class _PlayScreenState extends State<PlayScreen> {
  String? selectedCardId;
  CardImageModel? flyingCard;
  final revealedCardIds = <String>{};
  bool previewOpening = false;
  bool dealerBusy = false;
  PuppetQuality puppetQuality = PuppetQuality.medium;
  final PuppetDealerController puppetController = PuppetDealerController();

  Future<void> openHandPreview(String cardId) async {
    final state = context.read<GameProvider>().state;
    if (previewOpening || state == null) return;
    final cards = List<CardImageModel>.unmodifiable(state.players.first.hand);
    final initialIndex = cards.indexWhere((card) => card.id == cardId);
    if (initialIndex < 0) return;
    final faceUp = List<bool>.unmodifiable(
      cards.map((card) => revealedCardIds.contains(card.id)),
    );
    previewOpening = true;
    try {
      try {
        await HapticFeedback.selectionClick();
      } on Object {
        // Haptics are optional and unsupported on some desktop platforms.
      }
      if (!mounted) return;
      final reducedMotion = MediaQuery.disableAnimationsOf(context);
      await Navigator.of(context).push<void>(
        PageRouteBuilder<void>(
          transitionDuration: reducedMotion
              ? Duration.zero
              : const Duration(milliseconds: 320),
          reverseTransitionDuration: reducedMotion
              ? Duration.zero
              : const Duration(milliseconds: 280),
          pageBuilder: (_, _, _) => PlayHandFullscreenScreen(
            cards: cards,
            faceUp: faceUp,
            initialIndex: initialIndex,
          ),
          transitionsBuilder: (_, animation, _, child) => FadeTransition(
            opacity: animation,
            child: ScaleTransition(
              scale: Tween(begin: .96, end: 1.0).animate(animation),
              child: child,
            ),
          ),
        ),
      );
    } finally {
      previewOpening = false;
    }
  }

  Future<void> playSelected() async {
    final game = context.read<GameProvider>();
    final state = game.state;
    final selected = state?.players.first.hand
        .where((card) => card.id == selectedCardId)
        .firstOrNull;
    if (selected == null) return;
    if (!game.canPlay(selected)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'This card does not match the current colour or category.',
          ),
        ),
      );
      return;
    }
    setState(() {
      flyingCard = selected;
      dealerBusy = true;
    });
    await puppetController.receiveFromPlayer(selected.imagePath);
    if (!mounted) return;
    final played = await game.play(selected);
    if (!mounted) return;
    setState(() {
      flyingCard = null;
      dealerBusy = false;
      selectedCardId = null;
      revealedCardIds.remove(selected.id);
      if (context.read<SettingsProvider>().hidePlayerHandAfterTurn) {
        revealedCardIds.clear();
      }
    });
    if (!played && game.message != null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(game.message!)));
    }
  }

  Future<void> drawWithDealer() async {
    final game = context.read<GameProvider>();
    final state = game.state;
    if (dealerBusy || state == null || state.drawPile.isEmpty) return;
    if (state.players[state.currentPlayerIndex].hand.length >=
        AppConstants.maxPlayerHandSize) {
      return;
    }
    final card = state.drawPile.last;
    setState(() => dealerBusy = true);
    try {
      await puppetController.dealToPlayer(
        cardCategoryFor(card.category).versoAsset,
      );
      if (mounted) await game.draw();
    } finally {
      if (mounted) setState(() => dealerBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameProvider>();
    final decks = context.watch<DeckProvider>();
    final settings = context.watch<SettingsProvider>();
    final state = game.state;
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('Play'),
        backgroundColor: const Color(0xCC130D0B),
        actions: [
          PopupMenuButton<PuppetQuality>(
            initialValue: puppetQuality,
            tooltip: '3D quality',
            icon: const Icon(Icons.tune),
            onSelected: (quality) {
              setState(() => puppetQuality = quality);
              puppetController.setQuality(quality);
            },
            itemBuilder: (context) => PuppetQuality.values
                .map(
                  (quality) => PopupMenuItem(
                    value: quality,
                    child: Row(
                      children: [
                        Icon(
                          quality == puppetQuality
                              ? Icons.radio_button_checked
                              : Icons.radio_button_unchecked,
                          size: 18,
                        ),
                        const SizedBox(width: 10),
                        Text(
                          '${quality.name[0].toUpperCase()}'
                          '${quality.name.substring(1)}',
                        ),
                      ],
                    ),
                  ),
                )
                .toList(),
          ),
          const Padding(
            padding: EdgeInsets.only(right: 8),
            child: HomeNavigationButton(confirmActiveGame: true),
          ),
        ],
      ),
      body: state == null
          ? _GameLauncher(
              decks: decks,
              game: game,
              onStarting: () => setState(() {
                selectedCardId = null;
                revealedCardIds.clear();
              }),
            )
          : GameTableBackground(
              stageLayer: LayoutBuilder(
                builder: (context, constraints) {
                  final narrow =
                      constraints.maxWidth < AppTheme.tabletBreakpoint;
                  final short = constraints.maxHeight < 620;
                  final width = narrow
                      ? constraints.maxWidth
                      : constraints.maxWidth * .72;
                  final height =
                      constraints.maxHeight *
                      (short
                          ? .48
                          : narrow
                          ? .58
                          : .64);
                  return Align(
                    alignment: Alignment.topCenter,
                    child: SizedBox(
                      width: width,
                      height: height,
                      child: PuppetDealerScene(
                        controller: puppetController,
                        quality: puppetQuality,
                      ),
                    ),
                  );
                },
              ),
              child: SafeArea(
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final narrow =
                        constraints.maxWidth < AppTheme.tabletBreakpoint;
                    final compact = constraints.maxHeight < 700;
                    final player = state.players.first;
                    final opponent = state.players.length > 1
                        ? state.players[1]
                        : state.players.first;
                    final selected = player.hand
                        .where((card) => card.id == selectedCardId)
                        .firstOrNull;
                    final handHeight = compact
                        ? (constraints.maxHeight * .31).clamp(150.0, 188.0)
                        : (constraints.maxHeight * .27).clamp(188.0, 260.0);
                    final pileTop =
                        (constraints.maxHeight * (narrow ? .36 : .46)).clamp(
                          88.0,
                          (constraints.maxHeight - handHeight - 142).clamp(
                            88.0,
                            double.infinity,
                          ),
                        );
                    final statusTop =
                        (constraints.maxHeight * (narrow ? .56 : .63)).clamp(
                          150.0,
                          (constraints.maxHeight - handHeight - 58).clamp(
                            150.0,
                            double.infinity,
                          ),
                        );
                    final pileInset = narrow
                        ? 12.0
                        : constraints.maxWidth * .14;
                    return Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Positioned(
                          top: 8,
                          left: narrow ? 12 : constraints.maxWidth * .055,
                          child: OpponentHand(cards: opponent.hand),
                        ),
                        Positioned(
                          top: pileTop,
                          left: pileInset,
                          child: Transform.scale(
                            scale: narrow ? .82 : 1,
                            alignment: Alignment.topLeft,
                            child: DrawPileWidget(
                              count: state.drawPile.length,
                              topCard: state.drawPile.lastOrNull,
                              onDraw:
                                  state.currentPlayerIndex == 0 &&
                                      !dealerBusy &&
                                      player.hand.length <
                                          AppConstants.maxPlayerHandSize
                                  ? drawWithDealer
                                  : null,
                            ),
                          ),
                        ),
                        Positioned(
                          top: pileTop,
                          right: pileInset,
                          child: Transform.scale(
                            scale: narrow ? .82 : 1,
                            alignment: Alignment.topRight,
                            child: DiscardPileWidget(
                              topCard: state.topCard,
                              count: state.discardPile.length,
                            ),
                          ),
                        ),
                        Positioned(
                          top: statusTop,
                          left: narrow ? AppTheme.spaceSm : 150,
                          right: narrow ? AppTheme.spaceSm : 150,
                          child: Wrap(
                            alignment: WrapAlignment.center,
                            spacing: narrow ? 5 : 10,
                            runSpacing: 5,
                            children: [
                              _Status(
                                label: 'CURRENT PLAYER',
                                value: state
                                    .players[state.currentPlayerIndex]
                                    .name,
                              ),
                              _Status(
                                label: 'COLOUR',
                                value: state.currentColour.name,
                              ),
                              _Status(
                                label: 'CATEGORY',
                                value: state.currentCategory,
                              ),
                            ],
                          ),
                        ),
                        if (game.message != null)
                          Positioned(
                            top: statusTop + (narrow ? 82 : 58),
                            left: AppTheme.spaceMd,
                            right: AppTheme.spaceMd,
                            child: Text(
                              game.message!,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                color: AppTheme.brightGold,
                                shadows: [
                                  Shadow(color: Colors.black, blurRadius: 4),
                                ],
                              ),
                            ),
                          ),
                        if (selected != null)
                          Positioned(
                            bottom: handHeight - 12,
                            left: 0,
                            right: 0,
                            child: Wrap(
                              alignment: WrapAlignment.center,
                              spacing: 8,
                              children: [
                                FilledButton.icon(
                                  onPressed:
                                      game.canPlay(selected) && !dealerBusy
                                      ? playSelected
                                      : null,
                                  icon: const Icon(Icons.play_arrow),
                                  label: const Text('PLAY CARD'),
                                ),
                                OutlinedButton.icon(
                                  onPressed: !dealerBusy
                                      ? () => setState(
                                          () => selectedCardId = null,
                                        )
                                      : null,
                                  icon: const Icon(Icons.close),
                                  label: const Text('CANCEL'),
                                ),
                              ],
                            ),
                          ),
                        Positioned(
                          left: 0,
                          right: 0,
                          bottom: 0,
                          height: handHeight,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            child: PlayerHand(
                              cards: player.hand
                                  .take(AppConstants.maxPlayerHandSize)
                                  .toList(growable: false),
                              selectedCardId: selectedCardId,
                              isPlayable: game.canPlay,
                              revealedCardIds: revealedCardIds,
                              onRevealedChanged: (ids) => setState(() {
                                revealedCardIds
                                  ..clear()
                                  ..addAll(ids);
                              }),
                              keepRevealed: settings.keepRevealedCardsFaceUp,
                              onSelectionChanged: (card) => setState(() {
                                selectedCardId = card?.id;
                              }),
                              onFullscreenCard: openHandPreview,
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),
            ),
    );
  }
}

class _GameLauncher extends StatelessWidget {
  const _GameLauncher({
    required this.decks,
    required this.game,
    required this.onStarting,
  });
  final DeckProvider decks;
  final GameProvider game;
  final VoidCallback onStarting;
  @override
  Widget build(BuildContext context) => Center(
    child: ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 430),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.casino, size: 52, color: AppTheme.gold),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: decks.activeDeckId,
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Active deck'),
                items: decks.decks
                    .map(
                      (deck) => DropdownMenuItem(
                        value: deck.id,
                        child: Text(
                          '${deck.name} (${deck.cards.length})',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    )
                    .toList(),
                onChanged: (id) {
                  if (id != null) decks.select(id);
                },
              ),
              const SizedBox(height: 18),
              FilledButton.icon(
                onPressed: decks.activeDeck == null
                    ? null
                    : () async {
                        onStarting();
                        final ok = await game.start(decks.activeDeck!);
                        if (!ok && context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                game.message ?? 'Could not start game.',
                              ),
                            ),
                          );
                        }
                      },
                icon: const Icon(Icons.play_arrow),
                label: const Text('NEW GAME'),
              ),
              if (decks.activeDeck == null)
                const Padding(
                  padding: EdgeInsets.only(top: 12),
                  child: Text('Select a deck before starting.'),
                ),
            ],
          ),
        ),
      ),
    ),
  );
}

class _Status extends StatelessWidget {
  const _Status({required this.label, required this.value});
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
    decoration: BoxDecoration(
      color: const Color(0xCC130D0B),
      borderRadius: BorderRadius.circular(6),
      border: Border.all(color: AppTheme.gold),
    ),
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          label,
          style: Theme.of(
            context,
          ).textTheme.labelSmall?.copyWith(color: AppTheme.gold),
        ),
        Text(value, style: Theme.of(context).textTheme.titleSmall),
      ],
    ),
  );
}
