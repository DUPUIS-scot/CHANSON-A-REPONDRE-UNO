import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../core/app_constants.dart';
import '../models/card_image_model.dart';
import '../providers/deck_provider.dart';
import '../providers/game_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/discard_pile_widget.dart';
import '../widgets/game_table_background.dart';
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
  final revealedCardIds = <String>{};
  bool previewOpening = false;
  PuppetQuality puppetQuality = PuppetQuality.medium;
  final PuppetDealerController puppetController = PuppetDealerController();
  bool _startingPermanentDeck = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final game = context.read<GameProvider>();
    final decks = context.read<DeckProvider>();
    final permanentDeck = decks.decks
        .where((deck) => deck.id == AppConstants.productionDeckId)
        .firstOrNull;
    if (_startingPermanentDeck || game.state != null || permanentDeck == null) {
      return;
    }
    _startingPermanentDeck = true;
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await game.start(permanentDeck);
      if (mounted) setState(() => _startingPermanentDeck = false);
    });
  }

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

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameProvider>();
    final state = game.state;
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: state == null
          ? const Center(child: CircularProgressIndicator())
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
                    return Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Positioned(
                          top: pileTop,
                          left: 0,
                          right: 0,
                          child: Transform.scale(
                            scale: narrow ? .82 : 1,
                            alignment: Alignment.topCenter,
                            child: DiscardPileWidget(
                              topCard: state.topCard,
                              count: state.discardPile.length,
                            ),
                          ),
                        ),
                        Positioned(
                          left: 0,
                          right: 0,
                          bottom: 0,
                          height: handHeight,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            child: Column(
                              children: [
                                const Text(
                                  'YOUR HAND',
                                  style: TextStyle(
                                    color: AppTheme.brightGold,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 1.2,
                                  ),
                                ),
                                Expanded(
                                  child: PlayerHand(
                                    cards: player.hand
                                        .take(AppConstants.maxPlayerHandSize)
                                        .toList(growable: false),
                                    selectedCardId: null,
                                    isPlayable: (_) => true,
                                    revealedCardIds: revealedCardIds,
                                    onRevealedChanged: (ids) => setState(() {
                                      revealedCardIds
                                        ..clear()
                                        ..addAll(ids);
                                    }),
                                    keepRevealed: true,
                                    onSelectionChanged: (_) {},
                                    onFullscreenCard: openHandPreview,
                                  ),
                                ),
                              ],
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
