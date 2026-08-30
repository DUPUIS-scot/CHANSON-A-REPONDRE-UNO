import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/app_router.dart';
import '../data/card_categories.dart';
import '../models/card_image_model.dart';
import '../models/deck_model.dart';
import '../providers/deck_provider.dart';
import '../services/local_storage_service.dart';
import '../services/search_service.dart';
import '../theme/app_design_tokens.dart';
import '../theme/app_theme.dart';
import '../widgets/search_card_castle.dart';
import '../widgets/stored_image.dart';
import '../widgets/webgl_card_castle_view.dart';

const searchAllCategoriesLabel = 'ALL CATEGORIES';

const _searchCategoryOrder = <String>[
  'classique',
  'art-contemporain',
  'cyberpunk',
  'poesie',
  'sauvage',
];

List<CardCategoryDefinition> searchCategoriesForDeck(Deck? deck) {
  if (deck == null) return const <CardCategoryDefinition>[];
  final deckCategories = deck.cards
      .map((card) => card.category)
      .where(isKnownCardCategory)
      .map(normalizeCardCategoryLabel)
      .toSet();
  return [
    for (final id in _searchCategoryOrder)
      if (deckCategories.contains(cardCategoryFor(id).label))
        cardCategoryFor(id),
  ];
}

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  static const _storageKey = 'search_path_state_v1';

  final _search = SearchService();
  Timer? _persistDebounce;
  bool _restored = false;
  bool _castleActive = false;
  String? _category;
  String? _selectedCardId;
  Set<String> _discoveredCardIds = {};
  int _shuffleSeed = 0;
  final int _castleFullscreenRequestId = 0;
  bool _castleCardViewerOpen = false;
  late LocalStorageService _storage;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_restored) {
      _restored = true;
      _storage = context.read<LocalStorageService>();
      unawaited(_restoreState());
    }
  }

  @override
  void dispose() {
    _persistDebounce?.cancel();
    unawaited(_persistState());
    super.dispose();
  }

  Future<void> _restoreState() async {
    final source = await _storage.read(_storageKey);
    if (!mounted || source == null) return;
    try {
      final json = jsonDecode(source) as Map<String, dynamic>;
      setState(() {
        final storedCategory = json['category'];
        _category =
            storedCategory is String && isKnownCardCategory(storedCategory)
            ? normalizeCardCategoryLabel(storedCategory)
            : null;
        // Search always reopens at the category foyer.  Restoring an old
        // in-castle state made a direct /#/search visit skip its own entry
        // point and could restore a stale card selection.
        _castleActive = false;
        _selectedCardId = json['selectedCardId'] as String?;
        _discoveredCardIds = (json['discoveredCardIds'] as List<dynamic>? ?? [])
            .whereType<String>()
            .toSet();
        _shuffleSeed = (json['shuffleSeed'] as num?)?.toInt() ?? 0;
      });
    } on Object {
      // Ignore stale state from older app versions.
    }
  }

  Future<void> _persistState() async {
    await _storage.write(_storageKey, {
      'castleActive': _castleActive,
      'category': _category,
      'selectedCardId': _selectedCardId,
      'discoveredCardIds': _discoveredCardIds.toList(),
      'shuffleSeed': _shuffleSeed,
    });
  }

  void _schedulePersist() {
    _persistDebounce?.cancel();
    _persistDebounce = Timer(
      const Duration(milliseconds: 180),
      () => unawaited(_persistState()),
    );
  }

  void _openCategory(String value) {
    setState(() {
      _castleActive = true;
      _category = value;
      _selectedCardId = null;
    });
    _schedulePersist();
  }

  void _openAllCategories() {
    setState(() {
      _castleActive = true;
      _category = null;
      _selectedCardId = null;
    });
    _schedulePersist();
  }

  void _leaveCastle() {
    setState(() {
      _castleActive = false;
      _category = null;
      _selectedCardId = null;
    });
    _schedulePersist();
  }

  List<CardImageModel> _results(List<Deck> decks) {
    final cards = _search.cards(decks: decks, category: _category);
    if (_shuffleSeed != 0) cards.shuffle(Random(_shuffleSeed));
    return cards;
  }

  void _select(CardImageModel card) {
    setState(() {
      _selectedCardId = card.id;
      _discoveredCardIds = {..._discoveredCardIds, card.id};
    });
    _schedulePersist();
  }

  Future<void> _openFullscreen(CardImageModel card) async {
    _select(card);
    await context.push(AppRoutes.cardAlias(card.id));
    if (mounted) setState(() {});
  }

  Future<void> _openCastleCardFullscreen(CardImageModel card) async {
    if (_castleCardViewerOpen || !mounted) return;
    _castleCardViewerOpen = true;
    try {
      await showGeneralDialog<void>(
        context: context,
        barrierColor: Colors.black87,
        barrierDismissible: false,
        barrierLabel: 'Fullscreen card',
        transitionDuration: const Duration(milliseconds: 180),
        pageBuilder: (_, _, _) => _CastleCardFullscreen(card: card),
        transitionBuilder: (_, animation, _, child) => FadeTransition(
          opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
          child: child,
        ),
      );
    } finally {
      _castleCardViewerOpen = false;
    }
  }

  void _handleCastleFullscreenChanged(bool active) => _schedulePersist();

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<DeckProvider>();
    final activeDeck = provider.activeDeck;
    final activeDecks = activeDeck != null ? [activeDeck] : <Deck>[];
    final categories = searchCategoriesForDeck(activeDeck);
    final permanentCards = activeDecks
        .expand((deck) => deck.cards)
        .toList(growable: false);
    final deckVersoArtwork =
        activeDeck != null && activeDeck.cardBack.isNotEmpty
        ? activeDeck.cardBack
        : null;
    final categoryArtworkOverride =
        activeDeck != null &&
            !activeDeck.hasExplicitCategories &&
            activeDeck.cardBack.isNotEmpty
        ? activeDeck.cardBack
        : null;

    final category = _category;
    final categoryAvailable = category != null &&
        categories.any((item) => item.label == category);
    final allCategoriesAvailable =
        category == null &&
        permanentCards.isNotEmpty &&
        (categories.isEmpty || categories.length > 1);
    final castleActive =
        _castleActive && (categoryAvailable || allCategoriesAvailable);
    final results = castleActive
        ? _results(activeDecks)
        : const <CardImageModel>[];

    return PopScope(
      canPop: !castleActive,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop && castleActive) _leaveCastle();
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF05080C),
        body: !castleActive
            ? _SearchCategorySelection(
                categories: categories,
                deckVersoArtwork: deckVersoArtwork,
                categoryArtworkOverride: categoryArtworkOverride,
                onCategorySelected: _openCategory,
                onUncategorizedSelected:
                    categories.isEmpty && permanentCards.isNotEmpty
                    ? _openAllCategories
                    : null,
                onAllCategoriesSelected:
                    categories.length > 1 ? _openAllCategories : null,
              )
            : permanentCards.isEmpty
            ? Stack(
                fit: StackFit.expand,
                children: [
                  const SafeArea(child: _EmptyResults()),
                  _CastleFallbackBackButton(onPressed: _leaveCastle),
                ],
              )
            : _buildCastle(
                results,
                category ?? searchAllCategoriesLabel,
              ),
      ),
    );
  }

  Widget _buildCastle(List<CardImageModel> cards, String category) =>
      WebGlCardCastleView(
        cards: cards,
        matchingCardIds: cards.map((card) => card.id).toSet(),
        focusedCardId: _selectedCardId,
        shuffleSeed: _shuffleSeed,
        activeCategory: category,
        fullscreenRequestId: _castleFullscreenRequestId,
        onCardSelected: (id) {
          final card = cards.where((item) => item.id == id).firstOrNull;
          if (card != null) _select(card);
        },
        onCardOpened: (id) async {
          final card = cards.where((item) => item.id == id).firstOrNull;
          if (card != null) await _openCastleCardFullscreen(card);
        },
        onFullscreenChanged: _handleCastleFullscreenChanged,
        onCategoriesRequested: _leaveCastle,
        fallback: SearchCardCastle(cards: cards, onFullscreen: _openFullscreen),
      );
}

class _CastleFallbackBackButton extends StatelessWidget {
  const _CastleFallbackBackButton({required this.onPressed});
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) => SafeArea(
    child: Align(
      alignment: Alignment.topLeft,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: OutlinedButton.icon(
          key: const ValueKey('castle-back-to-categories'),
          onPressed: onPressed,
          icon: const Icon(Icons.arrow_back_rounded),
          label: const Text('CATEGORIES'),
        ),
      ),
    ),
  );
}

class _SearchCategorySelection extends StatelessWidget {
  const _SearchCategorySelection({
    required this.onCategorySelected,
    required this.categories,
    required this.onAllCategoriesSelected,
    required this.onUncategorizedSelected,
    this.deckVersoArtwork,
    this.categoryArtworkOverride,
  });

  final ValueChanged<String> onCategorySelected;
  final VoidCallback? onAllCategoriesSelected;
  final VoidCallback? onUncategorizedSelected;
  final List<CardCategoryDefinition> categories;
  final String? deckVersoArtwork;
  final String? categoryArtworkOverride;

  @override
  Widget build(BuildContext context) => Stack(
    fit: StackFit.expand,
    children: [
      Image.asset(
        'assets/images/search_castle_background.png',
        fit: BoxFit.cover,
        alignment: Alignment.center,
        filterQuality: FilterQuality.high,
        cacheWidth: (MediaQuery.sizeOf(context).width *
                MediaQuery.devicePixelRatioOf(context))
            .round(),
      ),
      const DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0x33000612), Color(0x12000612), Color(0xA6000308)],
            stops: [0, .46, 1],
          ),
        ),
      ),
      SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final compact = constraints.maxWidth < 700;
            final singleEntry = categories.length <= 1;
            final gutter = AppBreakpoints.gutterFor(constraints.maxWidth);
            final galleryWidth = min(constraints.maxWidth - gutter * 2, 1120.0);

            if (singleEntry) {
              final category = categories.firstOrNull;
              final artworkSource = category != null
                  ? categoryArtworkOverride ?? category.versoAsset
                  : deckVersoArtwork;
              final onPressed = category != null
                  ? () => onCategorySelected(category.label)
                  : onUncategorizedSelected;

              if (artworkSource != null && onPressed != null) {
                final singleCardWidth = min(
                  compact ? galleryWidth * .78 : galleryWidth * .38,
                  compact ? 340.0 : 380.0,
                ).clamp(200.0, 380.0);

                return Padding(
                  key: const ValueKey('search-single-category-screen'),
                  padding: EdgeInsets.fromLTRB(
                    gutter,
                    compact ? 82 : 92,
                    gutter,
                    24,
                  ),
                  child: Center(
                    child: _VersoEntryButton(
                      artworkSource: artworkSource,
                      semanticLabel: category?.label ?? 'Open deck in the castle',
                      keyValue: category?.label ?? 'deck-verso',
                      width: singleCardWidth,
                      onPressed: onPressed,
                    ),
                  ),
                );
              }
            }

            final desktopColumns = max(1, min(categories.length, 5));
            final desktopGaps = max(0, desktopColumns - 1) * 14;
            final cardWidth = compact
                ? ((galleryWidth - 14) / 2).clamp(112.0, 166.0)
                : ((galleryWidth - desktopGaps) / desktopColumns)
                      .clamp(120.0, 184.0);

            return SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(
                gutter,
                compact ? 92 : 104,
                gutter,
                24,
              ),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: max(
                    0,
                    constraints.maxHeight - (compact ? 118 : 130),
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Text(
                      'CHOOSE A CATEGORY',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: .88),
                        fontSize: compact ? 12 : 14,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 2.4,
                        shadows: const [
                          Shadow(color: Colors.black, blurRadius: 8),
                        ],
                      ),
                    ),
                    SizedBox(height: compact ? 14 : 20),
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 1120),
                      child: Wrap(
                        alignment: WrapAlignment.center,
                        spacing: 14,
                        runSpacing: compact ? 16 : 20,
                        children: [
                          for (final category in categories)
                            _CategoryArtworkButton(
                              category: category,
                              artworkSource:
                                  categoryArtworkOverride ?? category.versoAsset,
                              width: cardWidth,
                              onPressed: () =>
                                  onCategorySelected(category.label),
                            ),
                        ],
                      ),
                    ),
                    if (onAllCategoriesSelected != null) ...[
                      SizedBox(height: compact ? 18 : 24),
                      FilledButton.icon(
                        key: const ValueKey('search-all-categories'),
                        onPressed: onAllCategoriesSelected,
                        icon: const Icon(Icons.castle_rounded),
                        label: const Text(searchAllCategoriesLabel),
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xE6FFC928),
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 22,
                            vertical: 13,
                          ),
                          textStyle: const TextStyle(
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.1,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            );
          },
        ),
      ),
      const _SearchEntryNavigation(),
    ],
  );
}

class _VersoEntryButton extends StatefulWidget {
  const _VersoEntryButton({
    required this.artworkSource,
    required this.semanticLabel,
    required this.keyValue,
    required this.width,
    required this.onPressed,
  });

  final String artworkSource;
  final String semanticLabel;
  final String keyValue;
  final double width;
  final VoidCallback onPressed;

  @override
  State<_VersoEntryButton> createState() => _VersoEntryButtonState();
}

class _VersoEntryButtonState extends State<_VersoEntryButton> {
  bool hovered = false;

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    label: widget.semanticLabel,
    child: MouseRegion(
      onEnter: (_) => setState(() => hovered = true),
      onExit: (_) => setState(() => hovered = false),
      child: AnimatedScale(
        duration: const Duration(milliseconds: 170),
        curve: Curves.easeOut,
        scale: hovered ? 1.035 : 1,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 170),
          transform: Matrix4.translationValues(0, hovered ? -7 : 0, 0),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.width * .065),
            boxShadow: [
              BoxShadow(
                color: hovered
                    ? const Color(0x99FFC928)
                    : const Color(0xB3000000),
                blurRadius: hovered ? 24 : 18,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              key: ValueKey('search-verso-${widget.keyValue}'),
              onTap: widget.onPressed,
              borderRadius: BorderRadius.circular(widget.width * .065),
              child: SizedBox(
                width: widget.width,
                child: AspectRatio(
                  aspectRatio: 2 / 3,
                  child: StoredImage(
                    source: widget.artworkSource,
                    fit: BoxFit.contain,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

class _CategoryArtworkButton extends StatefulWidget {
  const _CategoryArtworkButton({
    required this.category,
    required this.artworkSource,
    required this.width,
    required this.onPressed,
  });

  final CardCategoryDefinition category;
  final String artworkSource;
  final double width;
  final VoidCallback onPressed;

  @override
  State<_CategoryArtworkButton> createState() =>
      _CategoryArtworkButtonState();
}

class _CategoryArtworkButtonState extends State<_CategoryArtworkButton> {
  bool hovered = false;

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    label: '${widget.category.label}. Open category in the castle.',
    child: MouseRegion(
      onEnter: (_) => setState(() => hovered = true),
      onExit: (_) => setState(() => hovered = false),
      child: AnimatedScale(
        duration: const Duration(milliseconds: 170),
        curve: Curves.easeOut,
        scale: hovered ? 1.035 : 1,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 170),
          transform: Matrix4.translationValues(0, hovered ? -7 : 0, 0),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.width * .065),
            boxShadow: [
              BoxShadow(
                color: hovered
                    ? const Color(0x99FFC928)
                    : const Color(0xB3000000),
                blurRadius: hovered ? 24 : 18,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              key: ValueKey('search-category-${widget.category.label}'),
              onTap: widget.onPressed,
              borderRadius: BorderRadius.circular(widget.width * .065),
              child: SizedBox(
                width: widget.width,
                child: AspectRatio(
                  aspectRatio: 2 / 3,
                  child: StoredImage(
                    source: widget.artworkSource,
                    fit: BoxFit.contain,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

class _SearchEntryNavigation extends StatelessWidget {
  const _SearchEntryNavigation();

  @override
  Widget build(BuildContext context) => SafeArea(
    key: const ValueKey('search-entry-navigation'),
    child: SizedBox(
      height: 76,
      child: Stack(
        alignment: Alignment.topCenter,
        children: [
          Positioned(
            left: 12,
            top: 12,
            child: IconButton(
              key: const ValueKey('search-home-button'),
              onPressed: () => context.go(AppRoutes.home),
              tooltip: 'Home',
              icon: const Icon(Icons.home_rounded),
              color: Colors.white,
              iconSize: 25,
              style: IconButton.styleFrom(
                minimumSize: const Size.square(48),
                backgroundColor: const Color(0xA608111C),
                side: const BorderSide(color: Color(0x80FFFFFF)),
                shadowColor: Colors.black,
                elevation: 5,
              ),
            ),
          ),
          const Positioned(
            top: 14,
            child: IgnorePointer(
              child: Text(
                'SEARCH',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 25,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 3.2,
                  shadows: [Shadow(color: Colors.black, blurRadius: 12)],
                ),
              ),
            ),
          ),
          Positioned(
            right: 12,
            top: 12,
            child: Tooltip(
              message: 'DJ WHO',
              child: Semantics(
                button: true,
                label: 'DJ WHO',
                child: InkWell(
                  key: const ValueKey('search-dj-who-button'),
                  onTap: () => context.go(AppRoutes.djWhoVideos),
                  customBorder: const CircleBorder(),
                  child: Container(
                    width: 56,
                    height: 56,
                    padding: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: const Color(0xCCFFC928),
                        width: 1.5,
                      ),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x88000000),
                          blurRadius: 10,
                          offset: Offset(0, 4),
                        ),
                      ],
                    ),
                    child: ClipOval(
                      child: Image.asset(
                        'assets/images/dj_who.png',
                        fit: BoxFit.cover,
                        width: 52,
                        height: 52,
                        cacheWidth: (52 * MediaQuery.devicePixelRatioOf(context))
                            .round(),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

class _EmptyResults extends StatelessWidget {
  const _EmptyResults();

  @override
  Widget build(BuildContext context) => const Center(
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.search_off_rounded, size: 54, color: Color(0xFF718391)),
        SizedBox(height: 10),
        Text(
          'Aucune carte ne correspond à cette recherche.',
          style: TextStyle(color: Color(0xFFB7C2CA)),
        ),
      ],
    ),
  );
}

class _CastleCardFullscreen extends StatelessWidget {
  const _CastleCardFullscreen({required this.card});

  final CardImageModel card;

  void _close(BuildContext context) => Navigator.of(context).pop();

  @override
  Widget build(BuildContext context) => Material(
    color: Colors.black,
    child: SafeArea(
      child: CallbackShortcuts(
        bindings: {
          const SingleActivator(LogicalKeyboardKey.escape): () =>
              _close(context),
        },
        child: Focus(
          autofocus: true,
          child: Column(
            children: [
              SizedBox(
                height: 64,
                child: Row(
                  children: [
                    IconButton(
                      tooltip: 'Close fullscreen card',
                      onPressed: () => _close(context),
                      icon: const Icon(Icons.close_rounded),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        card.category.toUpperCase(),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppTheme.brightGold,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                  ],
                ),
              ),
              Expanded(
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    const horizontalPadding = 16.0;
                    const verticalPadding = 12.0;
                    final availableWidth = max(
                      0.0,
                      constraints.maxWidth - horizontalPadding * 2,
                    );
                    final availableHeight = max(
                      0.0,
                      constraints.maxHeight - verticalPadding * 2,
                    );
                    final width = min(
                      availableWidth,
                      availableHeight * card.aspectRatio,
                    );
                    final height = width / card.aspectRatio;
                    return Center(
                      child: SizedBox(
                        width: width,
                        height: height,
                        child: Semantics(
                          image: true,
                          label: '${card.category}, front of card',
                          child: StoredImage(
                            source: card.imagePath,
                            fit: BoxFit.contain,
                            errorBuilder: (_, _, _) => const Center(
                              child: Icon(Icons.broken_image, size: 80),
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
              SafeArea(
                top: false,
                child: Container(
                  width: double.infinity,
                  color: const Color(0xFF090909),
                  padding: const EdgeInsets.all(12),
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.of(context).pop();
                      AppRouter.router.go(AppRoutes.cardAlias(card.id));
                    },
                    icon: const Icon(Icons.more_horiz_rounded),
                    label: const Text('Open Card'),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
