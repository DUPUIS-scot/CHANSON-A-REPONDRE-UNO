import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/app_router.dart';
import '../models/card_image_model.dart';
import '../models/browse_hand_preview_args.dart';
import '../providers/card_browser_provider.dart';
import '../providers/deck_provider.dart';
import '../services/public_card_share_service.dart';
import '../theme/app_theme.dart';
import '../widgets/card_hand_toolbar.dart';
import '../widgets/empty_deck_state.dart';
import '../widgets/five_card_hand.dart';
import '../widgets/home_navigation_button.dart';
import '../widgets/selected_card_actions.dart';
import '../widgets/utility_page_background.dart';
import 'browse_hand_fullscreen_screen.dart';

class CardBrowserScreen extends StatefulWidget {
  const CardBrowserScreen({
    this.focusCardId,
    this.initialCategory,
    this.shareCard,
    super.key,
  });
  final String? focusCardId;
  final String? initialCategory;
  final Future<CardShareResult> Function(CardImageModel card)? shareCard;
  @override
  State<CardBrowserScreen> createState() => _CardBrowserScreenState();
}

class _CardBrowserScreenState extends State<CardBrowserScreen> {
  final browser = CardBrowserProvider();
  final focusNode = FocusNode();
  bool previewOpening = false;
  String? appliedFocusCardId;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final deck = context.watch<DeckProvider>().activeDeck;
    if (deck != null) {
      browser.initializeForDeck(deck.id, deck.cards);
      if (widget.focusCardId != null &&
          appliedFocusCardId != widget.focusCardId) {
        appliedFocusCardId = widget.focusCardId;
        browser.focusCard(
          widget.focusCardId!,
          category: widget.initialCategory,
        );
      }
    }
  }

  @override
  void dispose() {
    browser.dispose();
    focusNode.dispose();
    super.dispose();
  }

  void open(CardImageModel card) => context.go(AppRoutes.cardAlias(card.id));

  Future<void> share(CardImageModel card) async {
    final customShare = widget.shareCard;
    final deck = context.read<DeckProvider>().deckForCard(card.id);
    if (customShare == null && deck == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Unable to share this card')),
        );
      }
      return;
    }
    final result = customShare != null
        ? await customShare(card)
        : await PublicCardShareService.share(card: card, deck: deck!);
    if (!mounted) return;
    if (result == CardShareResult.copied) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Link copied')));
    } else if (result == CardShareResult.failed) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to share this card')),
      );
    }
  }

  Future<void> openHandPreview(int heldIndex, String deckName) async {
    if (previewOpening || browser.visibleHand.isEmpty) return;
    previewOpening = true;
    try {
      try {
        await HapticFeedback.selectionClick();
      } on Object {
        // Haptics are optional on desktop and Web.
      }
      if (!mounted) return;
      final args = BrowseHandPreviewArgs(
        cards: browser.visibleHand,
        initialIndex: heldIndex,
        deckId: browser.deckId ?? '',
        deckName: deckName,
        selectedCardId: browser.selectedCardId,
      );
      final reducedMotion = MediaQuery.disableAnimationsOf(context);
      await Navigator.of(context).push<void>(
        PageRouteBuilder(
          transitionDuration: reducedMotion
              ? Duration.zero
              : const Duration(milliseconds: 320),
          pageBuilder: (_, _, _) => BrowseHandFullscreenScreen(args: args),
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

  Future<void> showFilters() async {
    final deck = context.read<DeckProvider>().activeDeck;
    if (deck == null) return;
    var category = browser.categoryFilter;
    var favourites = browser.favouritesOnly;
    final categories = deck.cards.map((card) => card.category).toSet().toList()
      ..sort();
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) => StatefulBuilder(
        builder: (context, setSheetState) => SafeArea(
          child: Padding(
            padding: EdgeInsets.fromLTRB(
              20,
              20,
              20,
              20 + MediaQuery.viewInsetsOf(context).bottom,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Filter hand',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: category,
                  decoration: const InputDecoration(labelText: 'Category'),
                  items: [
                    const DropdownMenuItem(
                      value: null,
                      child: Text('All categories'),
                    ),
                    ...categories.map(
                      (value) =>
                          DropdownMenuItem(value: value, child: Text(value)),
                    ),
                  ],
                  onChanged: (value) => setSheetState(() => category = value),
                ),
                CheckboxListTile(
                  title: const Text('Favourites only'),
                  value: favourites,
                  onChanged: (value) =>
                      setSheetState(() => favourites = value ?? false),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () {
                        browser.applyFilters(
                          title: '',
                          favourites: false,
                          transcribed: false,
                          clearCategory: true,
                        );
                        Navigator.pop(sheetContext);
                      },
                      child: const Text('Clear'),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(
                      onPressed: () {
                        browser.applyFilters(
                          category: category,
                          title: '',
                          favourites: favourites,
                          transcribed: false,
                          clearCategory: category == null,
                        );
                        Navigator.pop(sheetContext);
                      },
                      child: const Text('Apply'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  int get filterCount =>
      (browser.categoryFilter == null ? 0 : 1) +
      (browser.favouritesOnly ? 1 : 0);

  @override
  Widget build(BuildContext context) {
    final decks = context.watch<DeckProvider>();
    final deck = decks.activeDeck;
    return UtilityPageScaffold(
      appBar: AppBar(
        leading: IconButton(
          tooltip: 'Back',
          onPressed: () =>
              context.canPop() ? context.pop() : context.go(AppRoutes.home),
          icon: const Icon(Icons.arrow_back),
        ),
        title: const Text('Browse Cards'),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 8),
            child: HomeNavigationButton(),
          ),
        ],
      ),
      body: deck == null
          ? EmptyDeckState(
              title: 'No deck selected',
              message:
                  'Choose an active deck before creating a five-card hand.',
              onChooseDeck: () => context.go(AppRoutes.decks),
            )
          : deck.cards.isEmpty
          ? EmptyDeckState(
              title: 'This deck is empty',
              message: 'Import PNG cards into ${deck.name} to browse them.',
              onChooseDeck: () => context.go(AppRoutes.decks),
            )
          : AnimatedBuilder(
              animation: browser,
              builder: (context, _) {
                final selected = browser.availableCards
                    .where((card) => card.id == browser.selectedCardId)
                    .firstOrNull;
                return CallbackShortcuts(
                  bindings: {
                    const SingleActivator(LogicalKeyboardKey.arrowLeft): () =>
                        browser.selectRelative(-1),
                    const SingleActivator(LogicalKeyboardKey.arrowRight): () =>
                        browser.selectRelative(1),
                    const SingleActivator(LogicalKeyboardKey.keyS):
                        browser.generateRandomHand,
                    const SingleActivator(LogicalKeyboardKey.escape):
                        browser.clearSelection,
                    const SingleActivator(LogicalKeyboardKey.enter): () {
                      if (selected != null) open(selected);
                    },
                    const SingleActivator(LogicalKeyboardKey.space): () {
                      if (selected == null && browser.visibleHand.isNotEmpty) {
                        browser.selectCard(browser.visibleHand.first.id);
                      }
                    },
                  },
                  child: Focus(
                    focusNode: focusNode,
                    autofocus: true,
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        children: [
                          CardHandToolbar(
                            deckName: deck.name,
                            cardCount: browser.availableCards.length,
                            filterCount: filterCount,
                            isShuffling: browser.isShuffling,
                            onShuffle: browser.availableCards.isEmpty
                                ? null
                                : browser.generateRandomHand,
                            onReset: browser.resetToFirstCards,
                            onFilter: showFilters,
                          ),
                          if (browser.availableCards.length < 5 &&
                              browser.availableCards.isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(top: 8),
                              child: Text(
                                'This deck contains only ${browser.availableCards.length} ${browser.availableCards.length == 1 ? 'card' : 'cards'}.',
                                style: const TextStyle(
                                  color: AppTheme.brightGold,
                                ),
                              ),
                            ),
                          if (browser.availableCards.isEmpty)
                            Expanded(
                              child: EmptyDeckState(
                                title: 'No cards match',
                                message: 'Clear or change the active filters.',
                                onChooseDeck: showFilters,
                              ),
                            )
                          else
                            Expanded(
                              child: FiveCardHand(
                                cards: browser.visibleHand,
                                deckName: deck.name,
                                selectedCardId: browser.selectedCardId,
                                shuffleGeneration: browser.shuffleGeneration,
                                onCardSelected: browser.selectCard,
                                onCardOpened: open,
                                onCardLongPressed: (index) =>
                                    openHandPreview(index, deck.name),
                              ),
                            ),
                          if (selected != null)
                            SelectedCardActions(
                              card: selected,
                              deckName: deck.name,
                              onOpen: () => open(selected),
                              onShare: () => share(selected),
                              onFavourite: () async {
                                await decks.toggleFavourite(selected.id);
                                final refreshed = decks.activeDeck;
                                if (refreshed != null) {
                                  browser.refreshAfterCardMovedOrDeleted(
                                    refreshed.cards,
                                  );
                                }
                              },
                            ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
    );
  }
}
