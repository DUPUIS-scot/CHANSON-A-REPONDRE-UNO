import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/app_router.dart';
import '../data/card_categories.dart';
import '../models/card_image_model.dart';
import '../models/browse_hand_preview_args.dart';
import '../providers/card_browser_provider.dart';
import '../providers/deck_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/browse_card_castle_scene.dart';
import '../widgets/card_hand_toolbar.dart';
import '../widgets/empty_deck_state.dart';
import '../widgets/home_navigation_button.dart';
import '../widgets/selected_card_actions.dart';
import 'browse_hand_fullscreen_screen.dart';

class CardBrowserScreen extends StatefulWidget {
  const CardBrowserScreen({super.key});
  @override
  State<CardBrowserScreen> createState() => _CardBrowserScreenState();
}

class _CardBrowserScreenState extends State<CardBrowserScreen> {
  final browser = CardBrowserProvider();
  final focusNode = FocusNode();
  bool previewOpening = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final decks = context.watch<DeckProvider>();
    final deck = decks.activeDeck;
    if (deck != null) {
      browser.initializeForDeck(deck.id, deck.cards);
      if (browser.categoryFilter == null && decks.selectedCategory != null) {
        browser.applyFilters(category: decks.selectedCategory);
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
    var title = browser.titleFilter;
    var favourites = browser.favouritesOnly;
    var transcribed = browser.transcribedOnly;
    final categories = cardCategories.map((category) => category.label);
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
                TextFormField(
                  initialValue: title,
                  decoration: const InputDecoration(labelText: 'Card title'),
                  onChanged: (value) => title = value,
                ),
                const SizedBox(height: 10),
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
                CheckboxListTile(
                  title: const Text('Transcribed only'),
                  value: transcribed,
                  onChanged: (value) =>
                      setSheetState(() => transcribed = value ?? false),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () async {
                        final deckProvider = context.read<DeckProvider>();
                        final navigator = Navigator.of(sheetContext);
                        browser.applyFilters(
                          title: '',
                          favourites: false,
                          transcribed: false,
                          clearCategory: true,
                        );
                        await deckProvider.setSelectedCategory(null);
                        navigator.pop();
                      },
                      child: const Text('Clear'),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(
                      onPressed: () async {
                        final deckProvider = context.read<DeckProvider>();
                        final navigator = Navigator.of(sheetContext);
                        browser.applyFilters(
                          category: category,
                          title: title,
                          favourites: favourites,
                          transcribed: transcribed,
                          clearCategory: category == null,
                        );
                        await deckProvider.setSelectedCategory(category);
                        navigator.pop();
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
      (browser.titleFilter.isEmpty ? 0 : 1) +
      (browser.favouritesOnly ? 1 : 0) +
      (browser.transcribedOnly ? 1 : 0);

  Future<void> assignSelectedCardToDeck(CardImageModel card) async {
    final decks = context.read<DeckProvider>();
    final targets = decks.assignableDecksFor(card);
    if (targets.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No available custom deck can receive this card.'),
        ),
      );
      return;
    }

    final targetDeckId = await showDialog<String>(
      context: context,
      builder: (dialogContext) => SimpleDialog(
        title: const Text('Assign to deck'),
        children: [
          for (final target in targets)
            SimpleDialogOption(
              onPressed: () => Navigator.pop(dialogContext, target.id),
              child: Text(target.name),
            ),
        ],
      ),
    );
    if (targetDeckId == null) return;

    final assigned = await decks.assignCardToDeck(card, targetDeckId);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          assigned ? 'Card assigned to deck.' : 'Card could not be assigned.',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final decks = context.watch<DeckProvider>();
    final deck = decks.activeDeck;
    return Scaffold(
      backgroundColor: const Color(0xFF090806),
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
              message:
                  'Assign cards to ${deck.name} from the permanent library.',
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
                            canGoPrevious: browser.canGoPrevious,
                            canGoNext: browser.canGoNext,
                            onPrevious: browser.previousPage,
                            onNext: browser.nextPage,
                            pageLabel:
                                '${browser.pageNumber}/${browser.pageCount}',
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
                              child: BrowseCardCastleScene(
                                cards: browser.availableCards,
                                visibleCards: browser.visibleHand,
                                pageStart: browser.pageStart,
                                deckName: deck.name,
                                selectedCardId: browser.selectedCardId,
                                shuffleGeneration: browser.shuffleGeneration,
                                onCardSelected: browser.selectCard,
                                onCardOpened: open,
                                onCardLongPressed: (index) =>
                                    openHandPreview(index, deck.name),
                                onPrevious: browser.previousPage,
                                onNext: browser.nextPage,
                                canGoPrevious: browser.canGoPrevious,
                                canGoNext: browser.canGoNext,
                              ),
                            ),
                          if (selected != null)
                            SelectedCardActions(
                              card: selected,
                              deckName: deck.name,
                              onOpen: () => open(selected),
                              onTranscribe: () => context.go(
                                AppRoutes.transcription(selected.id),
                              ),
                              onDiscuss: selected.transcriptionReviewed
                                  ? () => context.go(
                                      AppRoutes.cardChat(selected.id),
                                    )
                                  : null,
                              onFavourite: () async {
                                await decks.toggleFavourite(selected.id);
                                final refreshed = decks.activeDeck;
                                if (refreshed != null) {
                                  browser.refreshAfterCardMovedOrDeleted(
                                    refreshed.cards,
                                  );
                                }
                              },
                              onAssignToDeck: () =>
                                  assignSelectedCardToDeck(selected),
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
