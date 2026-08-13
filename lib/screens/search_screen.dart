import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/app_constants.dart';
import '../core/app_router.dart';
import '../data/card_categories.dart';
import '../models/card_image_model.dart';
import '../models/deck_model.dart';
import '../providers/deck_provider.dart';
import '../services/local_storage_service.dart';
import '../services/search_service.dart';
import '../theme/app_theme.dart';
import '../widgets/search_card_castle.dart';
import '../widgets/stored_image.dart';
import '../widgets/webgl_card_castle_view.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  static const _storageKey = 'search_path_state_v1';
  static final _categories = cardCategories
      .map((category) => category.label)
      .toList(growable: false);

  final _search = SearchService();
  Timer? _persistDebounce;
  bool _restored = false;
  String _category = defaultCardCategory.label;
  String? _selectedCardId;
  Set<String> _discoveredCardIds = {};
  int _shuffleSeed = 0;
  int _castleFullscreenRequestId = 0;
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
        _category = _categories.contains(json['category'])
            ? json['category'] as String
            : defaultCardCategory.label;
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

  void _setCategory(String value) {
    setState(() {
      _category = value;
      _selectedCardId = null;
    });
    _schedulePersist();
  }

  List<CardImageModel> _results(List<Deck> decks) {
    final cards = _search.cards(decks: decks, category: _category);
    if (_shuffleSeed != 0) {
      cards.shuffle(Random(_shuffleSeed));
    }
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
    // Keep the WebGL platform view mounted and do not call `_select` here:
    // changing focusedCardId would animate the castle camera before the card
    // opens. Pass the exact search result directly to the modal instead of
    // looking it up in the currently selected deck.
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

  void _viewInCastle(CardImageModel card) {
    setState(() {
      _selectedCardId = card.id;
      _castleFullscreenRequestId += 1;
    });
    _schedulePersist();
  }

  void _handleCastleFullscreenChanged(bool active) {
    _schedulePersist();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<DeckProvider>();
    final permanentDecks = provider.decks
        .where((deck) => deck.id == AppConstants.productionDeckId)
        .toList(growable: false);
    final results = _results(permanentDecks);
    final permanentCards = permanentDecks
        .expand((deck) => deck.cards)
        .toList(growable: false);
    final permanentIds = permanentCards.map((card) => card.id).toSet();
    final discoveredCount = _discoveredCardIds
        .intersection(permanentIds)
        .length;
    final selected = permanentCards
        .where((card) => card.id == _selectedCardId)
        .firstOrNull;

    return Scaffold(
      backgroundColor: const Color(0xFF05080C),
      body: SafeArea(
        child: DecoratedBox(
          decoration: const BoxDecoration(
            gradient: RadialGradient(
              center: Alignment.topCenter,
              radius: 1.3,
              colors: [Color(0xFF102130), Color(0xFF05080C)],
            ),
          ),
          child: Column(
            children: [
              _SearchHeader(
                selectedCategory: _category,
                onCategoryChanged: _setCategory,
                categories: _categories,
              ),
              Expanded(
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final showSidePanel = constraints.maxWidth >= 980;
                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Padding(
                                padding: const EdgeInsets.fromLTRB(
                                  20,
                                  14,
                                  20,
                                  10,
                                ),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        _resultLabel(results.length),
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          color: AppTheme.brightGold,
                                          fontWeight: FontWeight.w800,
                                          letterSpacing: 1.1,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Text(
                                      '$discoveredCount / ${permanentCards.length} DISCOVERED',
                                      style: const TextStyle(
                                        color: Color(0xFFAFC1CC),
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Expanded(
                                child: permanentCards.isEmpty
                                    ? const _EmptyResults()
                                    : _buildCastle(results),
                              ),
                            ],
                          ),
                        ),
                        if (showSidePanel)
                          SizedBox(
                            width: 310,
                            child: _SelectedCardPanel(
                              card: selected,
                              onFullscreen: selected == null
                                  ? null
                                  : () => _openFullscreen(selected),
                              onViewInCastle: selected == null
                                  ? null
                                  : () => _viewInCastle(selected),
                            ),
                          ),
                      ],
                    );
                  },
                ),
              ),
              if (MediaQuery.sizeOf(context).width < 980 && selected != null)
                _MobileSelectionBar(
                  card: selected,
                  onFullscreen: () => _openFullscreen(selected),
                  onViewInCastle: () => _viewInCastle(selected),
                ),
            ],
          ),
        ),
      ),
    );
  }

  String _resultLabel(int count) {
    return '$count RÉSULTATS · $_category';
  }

  Widget _buildCastle(List<CardImageModel> cards) => Padding(
    padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
    child: ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: WebGlCardCastleView(
        cards: cards,
        matchingCardIds: cards.map((card) => card.id).toSet(),
        focusedCardId: _selectedCardId,
        shuffleSeed: _shuffleSeed,
        activeCategory: _category,
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
        fallback: SearchCardCastle(cards: cards, onFullscreen: _openFullscreen),
      ),
    ),
  );
}

// Retained for source compatibility with older state-restoration snapshots;
// the production Castle no longer mounts this five-card overlay.
// ignore: unused_element
class _CastleActiveCardsHud extends StatelessWidget {
  const _CastleActiveCardsHud({
    required this.cards,
    required this.selectedCardId,
    required this.onSelect,
    required this.onFullscreen,
  });

  final List<CardImageModel> cards;
  final String? selectedCardId;
  final ValueChanged<CardImageModel> onSelect;
  final ValueChanged<CardImageModel> onFullscreen;

  @override
  Widget build(BuildContext context) => Center(
    child: ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 610),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: const Color(0xE605090D),
          borderRadius: BorderRadius.circular(13),
          border: Border.all(color: const Color(0xB3FFC928)),
          boxShadow: const [
            BoxShadow(
              color: Color(0xA0000000),
              blurRadius: 18,
              spreadRadius: 2,
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(10, 6, 10, 9),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'CASTLE CARDS',
                style: TextStyle(
                  color: AppTheme.brightGold,
                  fontWeight: FontWeight.w900,
                  fontSize: 11,
                  letterSpacing: 1.1,
                ),
              ),
              const SizedBox(height: 5),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  for (var index = 0; index < cards.length; index++)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 3),
                      child: Semantics(
                        button: true,
                        label:
                            'Active castle card ${index + 1}, '
                            '${cards[index].category}',
                        child: GestureDetector(
                          onTap: () => onSelect(cards[index]),
                          onLongPress: () => onFullscreen(cards[index]),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 180),
                            width: 62,
                            height: 82,
                            decoration: BoxDecoration(
                              color: const Color(0xFF111820),
                              borderRadius: BorderRadius.circular(7),
                              border: Border.all(
                                color: cards[index].id == selectedCardId
                                    ? AppTheme.brightGold
                                    : const Color(0xFF637382),
                                width: cards[index].id == selectedCardId
                                    ? 3
                                    : 1,
                              ),
                              boxShadow: cards[index].id == selectedCardId
                                  ? const [
                                      BoxShadow(
                                        color: Color(0x99FFC928),
                                        blurRadius: 12,
                                      ),
                                    ]
                                  : null,
                            ),
                            clipBehavior: Clip.antiAlias,
                            child: Stack(
                              fit: StackFit.expand,
                              children: [
                                StoredImage(
                                  source: cards[index].imagePath,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, _, _) => const ColoredBox(
                                    color: Color(0xFF20150E),
                                    child: Icon(
                                      Icons.image_not_supported,
                                      color: AppTheme.gold,
                                    ),
                                  ),
                                ),
                                Positioned(
                                  left: 3,
                                  top: 3,
                                  child: DecoratedBox(
                                    decoration: BoxDecoration(
                                      color: const Color(0xD9000000),
                                      borderRadius: BorderRadius.circular(9),
                                    ),
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 5,
                                        vertical: 2,
                                      ),
                                      child: Text(
                                        '${index + 1}',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 10,
                                          fontWeight: FontWeight.w900,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
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

class _SearchHeader extends StatelessWidget {
  const _SearchHeader({
    required this.selectedCategory,
    required this.onCategoryChanged,
    required this.categories,
  });

  final String selectedCategory;
  final ValueChanged<String> onCategoryChanged;
  final List<String> categories;

  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: const BoxDecoration(
      color: Color(0xE6080D12),
      border: Border(bottom: BorderSide(color: Color(0x665EB8EF))),
    ),
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: SizedBox(
        height: 38,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: categories.length,
          separatorBuilder: (_, _) => const SizedBox(width: 8),
          itemBuilder: (_, index) {
            final category = categories[index];
            final active = category == selectedCategory;
            return ChoiceChip(
              label: Text(category),
              selected: active,
              onSelected: (_) => onCategoryChanged(category),
              selectedColor: AppTheme.gold,
              labelStyle: TextStyle(
                color: active ? Colors.black : Colors.white,
                fontWeight: FontWeight.w800,
                fontSize: 12,
              ),
              side: BorderSide(
                color: active ? AppTheme.brightGold : const Color(0xFF516779),
              ),
            );
          },
        ),
      ),
    ),
  );
}

class _SelectedCardPanel extends StatelessWidget {
  const _SelectedCardPanel({
    required this.card,
    required this.onFullscreen,
    required this.onViewInCastle,
  });
  final CardImageModel? card;
  final VoidCallback? onFullscreen;
  final VoidCallback? onViewInCastle;

  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.fromLTRB(0, 12, 16, 16),
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: const Color(0xE80B1117),
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: AppTheme.gold),
    ),
    child: card == null
        ? const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _PanelTitle(),
              Spacer(),
              Center(
                child: Text(
                  'Sélectionnez une carte\npour afficher ses détails.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Color(0xFF9EADB8)),
                ),
              ),
              Spacer(),
            ],
          )
        : Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const _PanelTitle(),
              const SizedBox(height: 14),
              Expanded(
                child: Center(
                  child: Semantics(
                    button: true,
                    label:
                        '${card!.category} card preview. '
                        'Long press to open fullscreen.',
                    onLongPress: onFullscreen,
                    child: GestureDetector(
                      onLongPress: onFullscreen,
                      child: AspectRatio(
                        aspectRatio: card!.aspectRatio,
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: StoredImage(
                            source: card!.imagePath,
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Text(
                card!.category.toUpperCase(),
                style: const TextStyle(
                  color: AppTheme.brightGold,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                card!.question.isEmpty
                    ? 'Question non renseignée'
                    : card!.question,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: Color(0xFFCAD3DA)),
              ),
              const SizedBox(height: 12),
              const Text(
                'Clic court : sélectionner\nClic long : plein écran',
                style: TextStyle(color: Color(0xFF91A2AF), fontSize: 12),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: onFullscreen,
                icon: const Icon(Icons.fullscreen_rounded),
                label: const Text('PLEIN ÉCRAN'),
              ),
              const SizedBox(height: 8),
              FilledButton.icon(
                onPressed: onViewInCastle,
                icon: const Icon(Icons.castle_rounded),
                label: const Text('VOIR DANS LE CHÂTEAU'),
              ),
            ],
          ),
  );
}

class _PanelTitle extends StatelessWidget {
  const _PanelTitle();

  @override
  Widget build(BuildContext context) => const Text(
    'CARTE SÉLECTIONNÉE',
    style: TextStyle(
      color: AppTheme.brightGold,
      fontWeight: FontWeight.w900,
      letterSpacing: .8,
    ),
  );
}

class _MobileSelectionBar extends StatelessWidget {
  const _MobileSelectionBar({
    required this.card,
    required this.onFullscreen,
    required this.onViewInCastle,
  });
  final CardImageModel card;
  final VoidCallback onFullscreen;
  final VoidCallback onViewInCastle;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
    decoration: const BoxDecoration(
      color: Color(0xFF10161C),
      border: Border(top: BorderSide(color: AppTheme.gold)),
    ),
    child: Row(
      children: [
        SizedBox(
          width: 38,
          child: AspectRatio(
            aspectRatio: card.aspectRatio,
            child: StoredImage(source: card.imagePath, fit: BoxFit.cover),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                card.category.toUpperCase(),
                style: const TextStyle(
                  color: AppTheme.brightGold,
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ),
        IconButton(
          tooltip: 'Plein écran',
          onPressed: onFullscreen,
          icon: const Icon(Icons.fullscreen_rounded),
        ),
        FilledButton(
          onPressed: onViewInCastle,
          child: const Icon(Icons.castle_rounded),
        ),
      ],
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
  Widget build(BuildContext context) {
    return Material(
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
                    child: Wrap(
                      alignment: WrapAlignment.center,
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        OutlinedButton.icon(
                          onPressed: () {
                            Navigator.of(context).pop();
                            AppRouter.router.go(AppRoutes.cardAlias(card.id));
                          },
                          icon: const Icon(Icons.more_horiz_rounded),
                          label: const Text('Open Card'),
                        ),
                      ],
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
}
