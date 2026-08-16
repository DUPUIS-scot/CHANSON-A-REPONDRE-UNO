import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../data/card_categories.dart';
import '../models/card_image_model.dart';
import '../models/deck_model.dart';
import '../providers/deck_provider.dart';
import '../providers/game_provider.dart';
import '../providers/settings_provider.dart';
import '../widgets/discard_pile_widget.dart';
import '../widgets/draw_pile_widget.dart';
import '../widgets/game_table_background.dart';
import '../widgets/home_navigation_button.dart';
import '../widgets/player_hand.dart';
import '../widgets/puppet_dealer_controller.dart';
import '../widgets/puppet_dealer_scene.dart';
import 'play_hand_fullscreen_screen.dart';

const _playLogoAsset = 'assets/images/app_logo.png';

class PlayScreen extends StatefulWidget {
  const PlayScreen({super.key});

  @override
  State<PlayScreen> createState() => _PlayScreenState();
}

class _PlayScreenState extends State<PlayScreen> {
  String? selectedCardId;
  bool hideHand = false;
  bool previewOpening = false;
  bool dealerBusy = false;
  String? _pendingDeckSyncId;
  static const puppetQuality = PuppetQuality.medium;
  final PuppetDealerController puppetController = PuppetDealerController();

  String _handBackImagePath(Deck? deck) {
    if (deck == null) return '';
    return !deck.hasExplicitCategories && deck.cardBack.isNotEmpty
        ? deck.cardBack
        : '';
  }

  String _cardVersoForDeck(Deck? deck, CardImageModel card) {
    final deckBack = _handBackImagePath(deck);
    return deckBack.isNotEmpty
        ? deckBack
        : cardCategoryFor(card.category).versoAsset;
  }

  void _scheduleSelectedDeckSync(DeckProvider decks, GameProvider game) {
    final selectedDeck = decks.activeDeck;
    final state = game.state;
    if (selectedDeck == null || state == null || state.deckId == selectedDeck.id) {
      if (_pendingDeckSyncId == selectedDeck?.id) _pendingDeckSyncId = null;
      return;
    }
    if (_pendingDeckSyncId == selectedDeck.id) return;
    _pendingDeckSyncId = selectedDeck.id;

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted) return;
      final liveDecks = context.read<DeckProvider>();
      final liveGame = context.read<GameProvider>();
      final liveDeck = liveDecks.activeDeck;
      if (liveDeck == null) {
        _pendingDeckSyncId = null;
        return;
      }
      if (liveGame.state?.deckId != liveDeck.id) {
        await liveGame.start(liveDeck);
      }
      if (!mounted) return;
      setState(() {
        _pendingDeckSyncId = null;
        selectedCardId = null;
        hideHand = false;
      });
    });
  }

  Future<void> openHandPreview(
    List<CardImageModel> cards,
    List<bool> faceUp,
    int initialIndex,
    String backImagePath,
  ) async {
    if (previewOpening || cards.isEmpty) return;
    previewOpening = true;
    try {
      try {
        await HapticFeedback.selectionClick();
      } on Object {
        // Haptics are optional on desktop browsers.
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
            backImagePath: backImagePath,
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
    if (state == null || state.players.isEmpty) return;
    final player = state.players[state.currentPlayerIndex];
    final selected = player.hand
        .where((card) => card.id == selectedCardId)
        .firstOrNull;
    if (selected == null) return;

    setState(() => dealerBusy = true);
    await puppetController.receiveFromPlayer(selected.imagePath);
    if (!mounted) return;
    final played = await game.play(selected);
    if (!mounted) return;
    setState(() {
      dealerBusy = false;
      selectedCardId = null;
      hideHand = context.read<SettingsProvider>().hidePlayerHandAfterTurn;
    });
    if (!played && game.message != null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(game.message!)));
    }
  }

  Future<void> drawWithDealer() async {
    final game = context.read<GameProvider>();
    final decks = context.read<DeckProvider>();
    final state = game.state;
    if (dealerBusy || state == null || state.drawPile.isEmpty) return;
    final card = state.drawPile.last;
    final activeDeck = decks.activeDeck;
    setState(() => dealerBusy = true);
    try {
      await puppetController.dealToPlayer(_cardVersoForDeck(activeDeck, card));
      if (mounted) await game.draw();
    } finally {
      if (mounted) setState(() => dealerBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameProvider>();
    final decks = context.watch<DeckProvider>();
    final state = game.state;
    final activeDeck = decks.activeDeck;
    final deckMismatch =
        state != null && activeDeck != null && state.deckId != activeDeck.id;
    _scheduleSelectedDeckSync(decks, game);
    final handBackImagePath = _handBackImagePath(activeDeck);

    return Scaffold(
      backgroundColor: Colors.transparent,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        toolbarHeight: 82,
        automaticallyImplyLeading: false,
        titleSpacing: 0,
        elevation: 0,
        scrolledUnderElevation: 0,
        shadowColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        title: SizedBox(
          width: double.infinity,
          height: 82,
          child: Stack(
            alignment: Alignment.center,
            children: [
              const Positioned.fill(
                child: Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  child: HomeNavigationButton(
                    confirmActiveGame: true,
                    showDjWho: true,
                    theatricalSplit: true,
                  ),
                ),
              ),
              IgnorePointer(
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final mobile = constraints.maxWidth < 600;
                    return Semantics(
                      image: true,
                      label: 'Chanson à Répondre UNO',
                      child: SizedBox(
                        key: const Key('play-header-logo'),
                        width: mobile ? 142 : 236,
                        height: mobile ? 54 : 68,
                        child: ExcludeSemantics(
                          child: KeyedSubtree(
                            key: const Key('play-launcher-logo'),
                            child: Image.asset(
                              _playLogoAsset,
                              fit: BoxFit.contain,
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
        backgroundColor: Colors.transparent,
        flexibleSpace: const _TheatricalHeaderBackground(),
      ),
      body: state == null
          ? _GameLauncher(decks: decks, game: game)
          : deckMismatch
          ? const ColoredBox(
              color: Color(0xFF050302),
              child: Center(child: CircularProgressIndicator()),
            )
          : Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1120),
                child: DecoratedBox(
                  decoration: const BoxDecoration(
                    border: Border.symmetric(
                      vertical: BorderSide(color: Color(0xFF8D6124)),
                    ),
                    boxShadow: [
                      BoxShadow(color: Colors.black, blurRadius: 30),
                    ],
                  ),
                  child: GameTableBackground(
                    stageLayer: LayoutBuilder(
                      builder: (context, stageConstraints) {
                        final narrow = stageConstraints.maxWidth < 600;
                        final torsoHeight = (stageConstraints.maxHeight *
                                (narrow ? 0.48 : 0.52))
                            .clamp(300.0, narrow ? 420.0 : 560.0);
                        final torsoWidth = (stageConstraints.maxWidth *
                                (narrow ? 0.68 : 0.62))
                            .clamp(280.0, narrow ? 480.0 : 700.0);
                        return Align(
                          alignment: const Alignment(0, -0.04),
                          child: SizedBox(
                            key: const Key('play-puppet-torso-viewport'),
                            width: torsoWidth,
                            height: torsoHeight,
                            child: PuppetDealerScene(
                              controller: puppetController,
                              quality: puppetQuality,
                            ),
                          ),
                        );
                      },
                    ),
                    child: SafeArea(
                      top: false,
                      child: LayoutBuilder(
                        builder: (context, constraints) {
                          final narrow = constraints.maxWidth < 600;
                          final shortViewport = constraints.maxHeight < 700;
                          final handHeight = narrow
                              ? (shortViewport ? 196.0 : 220.0)
                              : 280.0;
                          final handBottom = narrow
                              ? (shortViewport ? 104.0 : 114.0)
                              : 128.0;
                          final pileTop = narrow
                              ? (shortViewport ? 112.0 : 122.0)
                              : 142.0;
                          final state = game.state!;
                          final player = state.players[state.currentPlayerIndex];
                          final hand = hideHand ? <CardImageModel>[] : player.hand;
                          final selectedIndex = hand.indexWhere(
                            (card) => card.id == selectedCardId,
                          );

                          return Stack(
                            fit: StackFit.expand,
                            children: [
                              Positioned(
                                key: const Key('draw-pile-left'),
                                left: narrow ? 12 : 28,
                                top: pileTop,
                                child: DrawPileWidget(
                                  count: state.drawPile.length,
                                  topCard: state.drawPile.isEmpty
                                      ? null
                                      : state.drawPile.last,
                                  backImagePath: handBackImagePath,
                                  onDraw: dealerBusy ? null : drawWithDealer,
                                ),
                              ),
                              if (state.discardPile.isNotEmpty)
                                Positioned(
                                  right: narrow ? 12 : 28,
                                  top: pileTop,
                                  child: KeyedSubtree(
                                    key: const Key('discard-pile-right'),
                                    child: DiscardPileWidget(
                                      count: state.discardPile.length,
                                      topCard: state.discardPile.last,
                                    ),
                                  ),
                                ),
                              Positioned(
                                left: narrow ? 12 : 24,
                                right: narrow ? 12 : 24,
                                bottom: handBottom,
                                child: SizedBox(
                                  height: handHeight,
                                  child: PlayerHand(
                                    cards: hand,
                                    selectedCardId: selectedCardId,
                                    backImagePath: handBackImagePath,
                                    isPlayable: game.canPlay,
                                    onSelectionChanged: dealerBusy
                                        ? (_) {}
                                        : (card) {
                                            setState(() {
                                              selectedCardId = card?.id;
                                            });
                                          },
                                    onLongPressCard: (cards, faceUp, index) =>
                                        openHandPreview(
                                      cards,
                                      faceUp,
                                      index,
                                      handBackImagePath,
                                    ),
                                  ),
                                ),
                              ),
                              Positioned(
                                left: narrow ? 16 : 32,
                                right: narrow ? 16 : 32,
                                bottom: narrow ? 18 : 28,
                                child: FilledButton.icon(
                                  onPressed: dealerBusy || selectedIndex < 0
                                      ? null
                                      : playSelected,
                                  icon: const Icon(Icons.play_arrow_rounded),
                                  label: const Text('PLAY CARD'),
                                  style: FilledButton.styleFrom(
                                    minimumSize: const Size.fromHeight(72),
                                    backgroundColor: const Color(0xB8471515),
                                    foregroundColor: const Color(0xFFE6B04A),
                                    disabledBackgroundColor: const Color(0x773A1717),
                                    disabledForegroundColor: const Color(0x778F7141),
                                    side: const BorderSide(
                                      color: Color(0xFFE0A735),
                                      width: 2,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(24),
                                    ),
                                    textStyle: TextStyle(
                                      fontSize: narrow ? 25 : 30,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 1.2,
                                    ),
                                  ),
                                ),
                              ),
                            ],
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

class _TheatricalHeaderBackground extends StatelessWidget {
  const _TheatricalHeaderBackground();

  @override
  Widget build(BuildContext context) => const SizedBox.expand();
}

class _GameLauncher extends StatelessWidget {
  const _GameLauncher({required this.decks, required this.game});

  final DeckProvider decks;
  final GameProvider game;

  @override
  Widget build(BuildContext context) => ColoredBox(
        color: const Color(0xFF050302),
        child: Center(
          child: FilledButton(
            onPressed: decks.activeDeck == null
                ? null
                : () => game.start(decks.activeDeck!),
            child: const Text('START GAME'),
          ),
        ),
      );
}
