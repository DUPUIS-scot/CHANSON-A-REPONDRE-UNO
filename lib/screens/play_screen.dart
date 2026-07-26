import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

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
import '../widgets/stored_image.dart';
import 'play_hand_fullscreen_screen.dart';

class PlayScreen extends StatefulWidget {
  const PlayScreen({super.key});
  @override
  State<PlayScreen> createState() => _PlayScreenState();
}

class _PlayScreenState extends State<PlayScreen> {
  String? selectedCardId;
  CardImageModel? flyingCard;
  CardImageModel? dealtCard;
  bool hideHand = false;
  bool previewOpening = false;
  bool dealerDrawing = false;

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
    setState(() => flyingCard = selected);
    await Future<void>.delayed(const Duration(milliseconds: 420));
    if (!mounted) return;
    final played = await game.play(selected);
    if (!mounted) return;
    setState(() {
      flyingCard = null;
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
    if (state == null || state.currentPlayerIndex != 0 || dealerDrawing) return;
    final before = state.players.first.hand.map((card) => card.id).toSet();
    setState(() => dealerDrawing = true);
    await Future<void>.delayed(const Duration(milliseconds: 180));
    if (!mounted) return;
    await game.draw();
    if (!mounted) return;
    final after = game.state?.players.first.hand ?? const <CardImageModel>[];
    final drawn = after.where((card) => !before.contains(card.id)).firstOrNull;
    setState(() => dealtCard = drawn);
    await Future<void>.delayed(const Duration(milliseconds: 520));
    if (!mounted) return;
    setState(() {
      dealerDrawing = false;
      dealtCard = null;
      hideHand = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameProvider>();
    final decks = context.watch<DeckProvider>();
    final settings = context.watch<SettingsProvider>();
    final state = game.state;
    return Scaffold(
      backgroundColor: const Color(0xFF130D0B),
      appBar: AppBar(
        title: const Text('Play'),
        backgroundColor: const Color(0xFF130D0B),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 8),
            child: HomeNavigationButton(confirmActiveGame: true),
          ),
        ],
      ),
      body: state == null
          ? _GameLauncher(decks: decks, game: game)
          : GameTableBackground(
              child: SafeArea(
                child: Stack(
                  children: [
                    _JesterDealer(drawing: dealerDrawing),
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final compact = constraints.maxHeight < 700;
                        final player = state.players.first;
                        final opponent = state.players.length > 1
                            ? state.players[1]
                            : state.players.first;
                        final selected = player.hand
                            .where((card) => card.id == selectedCardId)
                            .firstOrNull;
                        return Column(
                          children: [
                            Padding(
                              padding: const EdgeInsets.fromLTRB(56, 8, 56, 4),
                              child: OpponentHand(
                                cardCount: opponent.hand.length,
                              ),
                            ),
                            Expanded(
                              child: Center(
                                child: SingleChildScrollView(
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Wrap(
                                        alignment: WrapAlignment.center,
                                        spacing: 22,
                                        crossAxisAlignment:
                                            WrapCrossAlignment.center,
                                        children: [
                                          DrawPileWidget(
                                            count: state.drawPile.length,
                                            onDraw:
                                                state.currentPlayerIndex == 0
                                                ? drawWithDealer
                                                : null,
                                          ),
                                          DiscardPileWidget(
                                            topCard: state.topCard,
                                            count: state.discardPile.length,
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 10),
                                      Wrap(
                                        alignment: WrapAlignment.center,
                                        spacing: 16,
                                        runSpacing: 4,
                                        children: [
                                          _Status(
                                            label: 'CURRENT PLAYER',
                                            value: state
                                                .players[state
                                                    .currentPlayerIndex]
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
                                      if (game.message != null)
                                        Padding(
                                          padding: const EdgeInsets.only(
                                            top: 6,
                                          ),
                                          child: Text(
                                            game.message!,
                                            style: const TextStyle(
                                              color: AppTheme.brightGold,
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            if (selected != null)
                              Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 4,
                                ),
                                child: Wrap(
                                  alignment: WrapAlignment.center,
                                  spacing: 8,
                                  children: [
                                    FilledButton.icon(
                                      onPressed:
                                          game.canPlay(selected) &&
                                              flyingCard == null
                                          ? playSelected
                                          : null,
                                      icon: const Icon(Icons.play_arrow),
                                      label: const Text('PLAY CARD'),
                                    ),
                                    OutlinedButton.icon(
                                      onPressed: flyingCard == null
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
                            SizedBox(
                              height: compact ? 180 : 230,
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                ),
                                child: PlayerHand(
                                  cards: player.hand,
                                  selectedCardId: selectedCardId,
                                  isPlayable: game.canPlay,
                                  revealOnTap: settings.revealPlayerHandOnTap,
                                  keepRevealed:
                                      settings.keepRevealedCardsFaceUp,
                                  hideAll: hideHand,
                                  onSelectionChanged: (card) => setState(() {
                                    selectedCardId = card?.id;
                                    hideHand = false;
                                  }),
                                  onLongPressCard: openHandPreview,
                                ),
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                    if (flyingCard != null)
                      Positioned.fill(
                        child: IgnorePointer(
                          child: TweenAnimationBuilder<double>(
                            tween: Tween(begin: 0, end: 1),
                            duration: const Duration(milliseconds: 420),
                            curve: Curves.easeInOut,
                            builder: (context, value, child) => Align(
                              alignment: Alignment(0, .88 - value * 1.05),
                              child: Transform.scale(
                                scale: 1 - value * .18,
                                child: Opacity(
                                  opacity: 1 - value * .15,
                                  child: child,
                                ),
                              ),
                            ),
                            child: Container(
                              width: 92,
                              height: 136,
                              decoration: BoxDecoration(
                                border: Border.all(
                                  color: AppTheme.brightGold,
                                  width: 3,
                                ),
                                borderRadius: BorderRadius.circular(8),
                                boxShadow: const [
                                  BoxShadow(
                                    color: Color(0xAAFFC928),
                                    blurRadius: 20,
                                  ),
                                ],
                              ),
                              clipBehavior: Clip.antiAlias,
                              child: StoredImage(source: flyingCard!.imagePath),
                            ),
                          ),
                        ),
                      ),
                    if (dealtCard != null)
                      Positioned.fill(
                        child: IgnorePointer(
                          child: TweenAnimationBuilder<double>(
                            tween: Tween(begin: 0, end: 1),
                            duration: const Duration(milliseconds: 520),
                            curve: Curves.easeInOutCubic,
                            builder: (context, value, child) => Align(
                              alignment: Alignment(
                                -.42 + value * .42,
                                -.02 + value * .9,
                              ),
                              child: Transform.scale(
                                scale: .75 + value * .18,
                                child: Opacity(
                                  opacity: .95 - value * .05,
                                  child: child,
                                ),
                              ),
                            ),
                            child: Container(
                              width: 76,
                              height: 112,
                              decoration: BoxDecoration(
                                border: Border.all(
                                  color: AppTheme.brightGold,
                                  width: 2,
                                ),
                                borderRadius: BorderRadius.circular(8),
                                boxShadow: const [
                                  BoxShadow(
                                    color: Color(0x99FFC928),
                                    blurRadius: 18,
                                  ),
                                ],
                              ),
                              clipBehavior: Clip.antiAlias,
                              child: StoredImage(source: dealtCard!.imagePath),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
    );
  }
}

class _JesterDealer extends StatelessWidget {
  const _JesterDealer({required this.drawing});

  final bool drawing;

  @override
  Widget build(BuildContext context) => Positioned.fill(
    child: IgnorePointer(
      child: LayoutBuilder(
        builder: (context, constraints) {
          final height = (constraints.maxHeight * .64).clamp(260.0, 620.0);
          final width = (constraints.maxWidth * 1.12).clamp(640.0, 1500.0);
          return Stack(
            children: [
              Positioned(
                top: constraints.maxHeight * .01,
                left: 0,
                right: 0,
                child: Center(
                  child: AnimatedSlide(
                    duration: const Duration(milliseconds: 260),
                    curve: Curves.easeOutCubic,
                    offset: drawing ? const Offset(-.035, .025) : Offset.zero,
                    child: AnimatedScale(
                      duration: const Duration(milliseconds: 260),
                      scale: drawing ? 1.035 : 1,
                      child: Opacity(
                        opacity: .9,
                        child: ConstrainedBox(
                          constraints: BoxConstraints(
                            maxHeight: height,
                            maxWidth: width,
                          ),
                          child: Image.asset(
                            'assets/images/puppet_dealer.png',
                            fit: BoxFit.contain,
                            alignment: Alignment.topCenter,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    ),
  );
}

class _GameLauncher extends StatelessWidget {
  const _GameLauncher({required this.decks, required this.game});
  final DeckProvider decks;
  final GameProvider game;
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
