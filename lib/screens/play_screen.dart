import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../data/card_categories.dart';
import '../models/card_image_model.dart';
import '../models/deck_model.dart';
import '../providers/deck_provider.dart';
import '../providers/game_provider.dart';
import '../providers/settings_provider.dart';
import '../theme/app_theme.dart';
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
      backgroundColor: const Color(0xFF050302),
      appBar: AppBar(
        toolbarHeight: 82,
        automaticallyImplyLeading: false,
        titleSpacing: 0,
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
                          child: Image.asset(
                            _playLogoAsset,
                            fit: BoxFit.contain,
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
          : ColoredBox(
              color: const Color(0xFF050302),
              child: Center(
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
                      stageLayer: PuppetDealerScene(
                        controller: puppetController,
                        quality: puppetQuality,
                      ),
                      child: SafeArea(
                        top: false,
                        child: LayoutBuilder(
                          builder: (context, constraints) {
                            final narrow = constraints.maxWidth < 600;
                            final veryNarrow = constraints.maxWidth < 380;
                            final short = constraints.maxHeight < 650;
                            final player = state.players.first;
                            final selected = player.hand
                                .where((card) => card.id == selectedCardId)
                                .firstOrNull;

                            final pileScale = veryNarrow
                                ? .58
                                : narrow
                                ? .74
                                : .92;
                            final pileTop = constraints.maxHeight *
                                (short
                                    ? .53
                                    : narrow
                                    ? .57
                                    : .60);
                            final pileInset = veryNarrow
                                ? 8.0
                                : narrow
                                ? 18.0
                                : constraints.maxWidth * .055;
                            final actionHeight = short ? 56.0 : 72.0;
                            final handHeight = short
                                ? 150.0
                                : (constraints.maxHeight * .28)
                                      .clamp(188.0, 270.0);
                            final handBottom = actionHeight + (short ? 5 : 7);
                            final canDraw =
                                state.currentPlayerIndex == 0 &&
                                player.hand.length < 5 &&
                                !dealerBusy;

                            return Stack(
                              clipBehavior: Clip.none,
                              children: [
                                Positioned(
                                  top: pileTop,
                                  left: pileInset,
                                  child: Transform.scale(
                                    scale: pileScale,
                                    alignment: Alignment.topLeft,
                                    child: DrawPileWidget(
                                      key: const Key('draw-pile-left'),
                                      count: state.drawPile.length,
                                      topCard: state.drawPile.lastOrNull,
                                      backImagePath: handBackImagePath,
                                      onDraw: canDraw ? drawWithDealer : null,
                                    ),
                                  ),
                                ),
                                Positioned(
                                  top: pileTop,
                                  right: pileInset,
                                  child: Transform.scale(
                                    scale: pileScale,
                                    alignment: Alignment.topRight,
                                    child: DiscardPileWidget(
                                      key: const Key('discard-pile-right'),
                                      topCard: state.topCard,
                                      count: state.discardPile.length,
                                    ),
                                  ),
                                ),
                                Positioned(
                                  left: 0,
                                  right: 0,
                                  bottom: handBottom,
                                  height: handHeight,
                                  child: Padding(
                                    padding: EdgeInsets.symmetric(
                                      horizontal: veryNarrow
                                          ? 5
                                          : narrow
                                          ? 10
                                          : 24,
                                    ),
                                    child: PlayerHand(
                                      cards: player.hand
                                          .take(5)
                                          .toList(growable: false),
                                      backImagePath: handBackImagePath,
                                      selectedCardId: selectedCardId,
                                      isPlayable: game.canPlay,
                                      hideAll: hideHand,
                                      onSelectionChanged: (card) => setState(() {
                                        selectedCardId = card?.id;
                                        hideHand = false;
                                      }),
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
                                  left: narrow ? 18 : 46,
                                  right: narrow ? 18 : 46,
                                  bottom: 8,
                                  height: actionHeight,
                                  child: _PlayActionBar(
                                    canPlay:
                                        selected != null &&
                                        game.canPlay(selected) &&
                                        !dealerBusy,
                                    onPlay: playSelected,
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
            ),
    );
  }
}

class _TheatricalHeaderBackground extends StatelessWidget {
  const _TheatricalHeaderBackground();

  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: const BoxDecoration(
      color: Color(0xFF050403),
      border: Border(
        bottom: BorderSide(color: AppTheme.gold, width: 1.5),
      ),
      boxShadow: [
        BoxShadow(color: Colors.black87, blurRadius: 12, offset: Offset(0, 4)),
      ],
    ),
  );
}

class _PlayActionBar extends StatelessWidget {
  const _PlayActionBar({required this.canPlay, required this.onPlay});

  final bool canPlay;
  final VoidCallback onPlay;

  static const _textStyle = TextStyle(
    fontFamily: 'Georgia',
    fontSize: 21,
    fontWeight: FontWeight.w800,
    letterSpacing: 2.0,
  );

  @override
  Widget build(BuildContext context) => FilledButton.icon(
    onPressed: canPlay ? onPlay : null,
    icon: const Icon(Icons.play_arrow_rounded, size: 34),
    label: const FittedBox(child: Text('PLAY CARD')),
    style: FilledButton.styleFrom(
      backgroundColor: const Color(0xFF641C18),
      disabledBackgroundColor: const Color(0xFF3A1714),
      foregroundColor: AppTheme.brightGold,
      disabledForegroundColor: const Color(0xFF8F7443),
      side: const BorderSide(color: AppTheme.gold, width: 2),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(22),
      ),
      textStyle: _textStyle,
      elevation: 14,
      shadowColor: Colors.black,
    ),
  );
}

class _GameLauncher extends StatelessWidget {
  const _GameLauncher({required this.decks, required this.game});

  final DeckProvider decks;
  final GameProvider game;

  @override
  Widget build(BuildContext context) => Center(
    child: SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 430),
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Semantics(
                  image: true,
                  label: 'Chanson à Répondre UNO',
                  child: FractionallySizedBox(
                    widthFactor: .72,
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 280),
                      child: AspectRatio(
                        key: const Key('play-launcher-logo'),
                        aspectRatio: 836 / 303,
                        child: ExcludeSemantics(
                          child: Image.asset(
                            _playLogoAsset,
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                DropdownButtonFormField<String>(
                  initialValue: decks.activeDeckId,
                  decoration: const InputDecoration(labelText: 'Active deck'),
                  items: decks.decks
                      .map(
                        (deck) => DropdownMenuItem(
                          value: deck.id,
                          child: Text('${deck.name} (${deck.cards.length})'),
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
                          final ok = await game.start(decks.activeDeck!);
                          if (!ok && context.mounted && game.message != null) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(game.message!)),
                            );
                          }
                        },
                  icon: const Icon(Icons.play_arrow_rounded),
                  label: const Text('START GAME'),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}
