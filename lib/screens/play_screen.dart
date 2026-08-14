import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../data/card_categories.dart';
import '../models/card_image_model.dart';
import '../providers/deck_provider.dart';
import '../providers/game_provider.dart';
import '../providers/settings_provider.dart';
import '../theme/app_theme.dart';
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
  static const puppetQuality = PuppetQuality.medium;
  final PuppetDealerController puppetController = PuppetDealerController();

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
    final state = game.state;
    if (dealerBusy || state == null || state.drawPile.isEmpty) return;
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
    final state = game.state;
    final activeDeck = decks.decks
        .where((deck) => deck.id == state?.deckId)
        .firstOrNull;

    return Scaffold(
      backgroundColor: const Color(0xFF130D0B),
      appBar: AppBar(
        toolbarHeight: 68,
        automaticallyImplyLeading: false,
        titleSpacing: 0,
        title: SizedBox(
          width: double.infinity,
          height: 68,
          child: Stack(
            alignment: Alignment.center,
            children: [
              const Positioned.fill(
                child: Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8, vertical: 10),
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
                        width: mobile ? 112 : 204,
                        height: mobile ? 42 : 52,
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
          : ColoredBox(
              color: const Color(0xFF080504),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 1100),
                  child: DecoratedBox(
                    decoration: const BoxDecoration(
                      border: Border.symmetric(
                        vertical: BorderSide(color: Color(0xFF6F451B)),
                      ),
                      boxShadow: [
                        BoxShadow(color: Colors.black, blurRadius: 28),
                      ],
                    ),
                    child: GameTableBackground(
                      stageLayer: LayoutBuilder(
                        builder: (context, constraints) {
                          final narrow = constraints.maxWidth < 600;
                          final short = constraints.maxHeight < 650;
                          return Align(
                            alignment: Alignment.topCenter,
                            child: Transform.translate(
                              offset: Offset(0, narrow ? -4 : -10),
                              child: SizedBox(
                                width: narrow
                                    ? constraints.maxWidth * 1.08
                                    : constraints.maxWidth * .94,
                                height: constraints.maxHeight *
                                    (short
                                        ? .72
                                        : narrow
                                        ? .74
                                        : .78),
                                child: PuppetDealerScene(
                                  controller: puppetController,
                                  quality: puppetQuality,
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                      child: SafeArea(
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
                                ? .62
                                : narrow
                                ? .76
                                : 1.0;
                            final pileTop = constraints.maxHeight *
                                (short
                                    ? .43
                                    : narrow
                                    ? .48
                                    : .50);
                            final pileInset = veryNarrow
                                ? 7.0
                                : narrow
                                ? 16.0
                                : constraints.maxWidth * .035;
                            final actionHeight = short ? 52.0 : 62.0;
                            final handHeight = short
                                ? 158.0
                                : (constraints.maxHeight * .26)
                                      .clamp(176.0, 244.0);
                            final handBottom = actionHeight + (short ? 8 : 10);
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
                                      backImagePath: activeDeck?.cardBack ?? '',
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
                                    child: DrawPileWidget(
                                      key: const Key('draw-pile-right'),
                                      count: state.drawPile.length,
                                      topCard: state.drawPile.lastOrNull,
                                      backImagePath: activeDeck?.cardBack ?? '',
                                      onDraw: canDraw ? drawWithDealer : null,
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
                                      horizontal: veryNarrow ? 7 : 14,
                                    ),
                                    child: PlayerHand(
                                      cards: player.hand
                                          .take(5)
                                          .toList(growable: false),
                                      backImagePath: activeDeck?.cardBack ?? '',
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
                                            activeDeck?.cardBack ?? '',
                                          ),
                                    ),
                                  ),
                                ),
                                Positioned(
                                  left: narrow ? 28 : 190,
                                  right: narrow ? 28 : 190,
                                  bottom: 7,
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
      gradient: LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xFF24150B), Color(0xFF0E0906)],
      ),
      border: Border(
        top: BorderSide(color: Color(0xFF7D501C)),
        bottom: BorderSide(color: AppTheme.gold, width: 1.2),
      ),
      boxShadow: [
        BoxShadow(color: Colors.black87, blurRadius: 10, offset: Offset(0, 4)),
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
    fontSize: 18,
    fontWeight: FontWeight.w800,
    letterSpacing: 1.6,
  );

  @override
  Widget build(BuildContext context) => FilledButton.icon(
    onPressed: canPlay ? onPlay : null,
    icon: const Icon(Icons.play_arrow_rounded, size: 30),
    label: const FittedBox(child: Text('PLAY CARD')),
    style: FilledButton.styleFrom(
      backgroundColor: const Color(0xFF7A1E19),
      disabledBackgroundColor: const Color(0xFF421513),
      foregroundColor: AppTheme.brightGold,
      disabledForegroundColor: const Color(0xFF9A7844),
      side: const BorderSide(color: AppTheme.gold, width: 1.8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(13),
      ),
      textStyle: _textStyle,
      elevation: 11,
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
    ),
  );
}
