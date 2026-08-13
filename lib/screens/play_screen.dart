import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../data/card_categories.dart';
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

const _playLogoAsset = 'assets/images/app_logo.png';

class PlayScreen extends StatefulWidget {
  const PlayScreen({super.key});
  @override
  State<PlayScreen> createState() => _PlayScreenState();
}

class _PlayScreenState extends State<PlayScreen> {
  String? selectedCardId;
  CardImageModel? flyingCard;
  bool hideHand = false;
  bool previewOpening = false;
  bool dealerBusy = false;
  static const puppetQuality = PuppetQuality.medium;
  final PuppetDealerController puppetController = PuppetDealerController();

  Future<void> openHandPreview(
    List<CardImageModel> cards,
    List<bool> faceUp,
    int initialIndex,
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
                  constraints: const BoxConstraints(maxWidth: 960),
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
                          return Align(
                            alignment: Alignment.topCenter,
                            child: Padding(
                              padding: EdgeInsets.only(top: narrow ? 52 : 62),
                              child: SizedBox(
                                width: narrow
                                    ? constraints.maxWidth
                                    : constraints.maxWidth * .72,
                                height:
                                    constraints.maxHeight * (narrow ? .51 : .59),
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
                            final opponent = state.players.length > 1
                                ? state.players[1]
                                : state.players.first;
                            final selected = player.hand
                                .where((card) => card.id == selectedCardId)
                                .firstOrNull;
                            final pileScale = veryNarrow
                                ? .68
                                : narrow
                                ? .78
                                : .96;
                            final pileTop = constraints.maxHeight * .46;
                            final pileInset = veryNarrow
                                ? 8.0
                                : narrow
                                ? 18.0
                                : constraints.maxWidth * .13;
                            final actionHeight = short ? 50.0 : 58.0;
                            final handHeight = short
                                ? 156.0
                                : (constraints.maxHeight * .25).clamp(168.0, 224.0);
                            final handBottom = actionHeight + 15;
                            return Stack(
                              children: [
                                Positioned(
                                  top: 8,
                                  left: 0,
                                  right: 0,
                                  child: Align(
                                    alignment: Alignment.topCenter,
                                    child: OpponentHand(cards: opponent.hand),
                                  ),
                                ),
                                Positioned(
                                  top: pileTop,
                                  left: pileInset,
                                  child: Transform.scale(
                                    scale: pileScale,
                                    alignment: Alignment.topLeft,
                                    child: DrawPileWidget(
                                      count: state.drawPile.length,
                                      topCard: state.drawPile.lastOrNull,
                                      onDraw:
                                          state.currentPlayerIndex == 0 &&
                                              player.hand.length < 5 &&
                                              !dealerBusy
                                          ? drawWithDealer
                                          : null,
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
                                      topCard: state.topCard,
                                      count: state.discardPile.length,
                                    ),
                                  ),
                                ),
                                Positioned(
                                  top: pileTop + (narrow ? 13 : 23),
                                  left: narrow ? 86 : 180,
                                  right: narrow ? 86 : 180,
                                  child: _CentralPlayArea(
                                    message: game.message,
                                    compact: narrow,
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
                                      selectedCardId: selectedCardId,
                                      isPlayable: game.canPlay,
                                      hideAll: hideHand,
                                      onSelectionChanged: (card) => setState(() {
                                        selectedCardId = card?.id;
                                        hideHand = false;
                                      }),
                                      onLongPressCard: openHandPreview,
                                    ),
                                  ),
                                ),
                                Positioned(
                                  left: narrow ? 10 : 52,
                                  right: narrow ? 10 : 52,
                                  bottom: 7,
                                  height: actionHeight,
                                  child: _PlayActionBar(
                                    canPlay:
                                        selected != null &&
                                        game.canPlay(selected) &&
                                        !dealerBusy,
                                    canCancel:
                                        selected != null && !dealerBusy,
                                    onPlay: playSelected,
                                    onCancel: () => setState(
                                      () => selectedCardId = null,
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

class _CentralPlayArea extends StatelessWidget {
  const _CentralPlayArea({required this.message, required this.compact});

  final String? message;
  final bool compact;

  @override
  Widget build(BuildContext context) => Container(
    constraints: BoxConstraints(minHeight: compact ? 54 : 68),
    padding: EdgeInsets.symmetric(
      horizontal: compact ? 8 : 20,
      vertical: compact ? 7 : 12,
    ),
    decoration: BoxDecoration(
      gradient: const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xDD301B0E), Color(0xF2180C07)],
      ),
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: const Color(0xFF9C6B28), width: 1.2),
      boxShadow: const [
        BoxShadow(color: Colors.black87, blurRadius: 10, offset: Offset(0, 5)),
      ],
    ),
    child: Center(
      child: Text(
        message?.trim().isNotEmpty == true ? message! : 'PLAY AREA',
        maxLines: compact ? 2 : 3,
        overflow: TextOverflow.ellipsis,
        textAlign: TextAlign.center,
        style: TextStyle(
          color: const Color(0xFFF1D8A0),
          fontFamily: 'Georgia',
          fontSize: compact ? 12 : 15,
          fontWeight: FontWeight.w700,
          letterSpacing: compact ? .6 : 1.1,
          shadows: const [Shadow(color: Colors.black, blurRadius: 4)],
        ),
      ),
    ),
  );
}

class _PlayActionBar extends StatelessWidget {
  const _PlayActionBar({
    required this.canPlay,
    required this.canCancel,
    required this.onPlay,
    required this.onCancel,
  });

  final bool canPlay;
  final bool canCancel;
  final VoidCallback onPlay;
  final VoidCallback onCancel;

  static const _textStyle = TextStyle(
    fontFamily: 'Georgia',
    fontWeight: FontWeight.w800,
    letterSpacing: 1.1,
  );

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Expanded(
        child: FilledButton.icon(
          onPressed: canPlay ? onPlay : null,
          icon: const Icon(Icons.play_arrow_rounded),
          label: const FittedBox(child: Text('PLAY CARD')),
          style: FilledButton.styleFrom(
            backgroundColor: const Color(0xFF751B18),
            disabledBackgroundColor: const Color(0xFF421513),
            foregroundColor: AppTheme.brightGold,
            disabledForegroundColor: const Color(0xFF9A7844),
            side: const BorderSide(color: AppTheme.gold, width: 1.5),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
            textStyle: _textStyle,
            elevation: 9,
            shadowColor: Colors.black,
          ),
        ),
      ),
      const SizedBox(width: 12),
      Expanded(
        child: OutlinedButton.icon(
          onPressed: canCancel ? onCancel : null,
          icon: const Icon(Icons.close_rounded),
          label: const FittedBox(child: Text('CANCEL')),
          style: OutlinedButton.styleFrom(
            backgroundColor: const Color(0xEE160E09),
            disabledBackgroundColor: const Color(0xCC100B08),
            foregroundColor: const Color(0xFFF2DFC0),
            disabledForegroundColor: const Color(0xFF806B4D),
            side: const BorderSide(color: Color(0xFF9C6B28), width: 1.4),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
            textStyle: _textStyle,
          ),
        ),
      ),
    ],
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
