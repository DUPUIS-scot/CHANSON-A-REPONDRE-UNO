import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart' show ScrollCacheExtent;
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
import '../theme/app_theme.dart';
import '../widgets/category_badge.dart';
import '../widgets/search_card_castle.dart';
import '../widgets/stored_image.dart';
import '../widgets/webgl_card_castle_view.dart';

enum _SearchViewMode { castle, grid, list }

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  static const _storageKey = 'search_path_state_v1';
  static const _pageSize = 30;
  static final _categories = <String>[
    'TOUTES',
    ...cardCategories.map((category) => category.label),
  ];

  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  final _search = SearchService();
  final Map<String, FocusNode> _cardFocusNodes = {};
  final Map<String, GlobalKey> _cardKeys = {};
  Timer? _debounce;
  Timer? _persistDebounce;
  bool _restored = false;
  String _query = '';
  String _category = 'TOUTES';
  String? _selectedCardId;
  _SearchViewMode _viewMode = _SearchViewMode.castle;
  int _shuffleSeed = 0;
  int _visibleCount = _pageSize;
  double _savedScrollOffset = 0;
  int _gridColumns = 4;
  int _castleFullscreenRequestId = 0;
  _SearchViewMode? _viewBeforeCastleFullscreen;
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
  void initState() {
    super.initState();
    _scrollController.addListener(_handleScroll);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _persistDebounce?.cancel();
    unawaited(_persistState());
    _controller.dispose();
    _scrollController.dispose();
    for (final node in _cardFocusNodes.values) {
      node.dispose();
    }
    super.dispose();
  }

  Future<void> _restoreState() async {
    final source = await _storage.read(_storageKey);
    if (!mounted || source == null) return;
    try {
      final json = jsonDecode(source) as Map<String, dynamic>;
      setState(() {
        _query = json['query'] as String? ?? '';
        _controller.text = _query;
        _category = _categories.contains(json['category'])
            ? json['category'] as String
            : 'TOUTES';
        _selectedCardId = json['selectedCardId'] as String?;
        _viewMode = switch (json['viewMode']) {
          'grid' => _SearchViewMode.grid,
          'list' => _SearchViewMode.list,
          _ => _SearchViewMode.castle,
        };
        _savedScrollOffset = (json['scrollOffset'] as num?)?.toDouble() ?? 0;
        _shuffleSeed = (json['shuffleSeed'] as num?)?.toInt() ?? 0;
        _visibleCount = max(
          _pageSize,
          (json['visibleCount'] as num?)?.toInt() ?? _pageSize,
        );
      });
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted || !_scrollController.hasClients) return;
        _scrollController.jumpTo(
          _savedScrollOffset.clamp(
            0,
            _scrollController.position.maxScrollExtent,
          ),
        );
      });
    } on Object {
      // Ignore stale state from older app versions.
    }
  }

  Future<void> _persistState() async {
    final offset = _scrollController.hasClients
        ? _scrollController.offset
        : _savedScrollOffset;
    await _storage.write(_storageKey, {
      'query': _query,
      'category': _category,
      'selectedCardId': _selectedCardId,
      'viewMode': _viewMode.name,
      'scrollOffset': offset,
      'shuffleSeed': _shuffleSeed,
      'visibleCount': _visibleCount,
    });
  }

  void _schedulePersist() {
    _persistDebounce?.cancel();
    _persistDebounce = Timer(
      const Duration(milliseconds: 180),
      () => unawaited(_persistState()),
    );
  }

  void _handleScroll() {
    _savedScrollOffset = _scrollController.offset;
    if (_scrollController.position.extentAfter < 600) {
      setState(() => _visibleCount += _pageSize);
    }
    _schedulePersist();
  }

  void _onQueryChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 250), () {
      if (!mounted) return;
      setState(() {
        _query = value;
        _visibleCount = _pageSize;
      });
      _jumpToTop();
      _schedulePersist();
    });
  }

  void _setCategory(String value) {
    setState(() {
      _category = value;
      _visibleCount = _pageSize;
      _selectedCardId = null;
    });
    _jumpToTop();
    _schedulePersist();
  }

  void _jumpToTop() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        0,
        duration: const Duration(milliseconds: 180),
        curve: Curves.easeOut,
      );
    }
  }

  List<CardImageModel> _results(List<Deck> decks) {
    final category = _category == 'TOUTES' ? null : _category;
    final cards = _search.cards(
      decks: decks,
      query: _query,
      category: category,
    );
    if (_shuffleSeed != 0) {
      cards.shuffle(Random(_shuffleSeed));
    }
    return cards;
  }

  void _shuffle() {
    setState(() {
      _shuffleSeed = Random().nextInt(0x7fffffff) + 1;
      _visibleCount = _pageSize;
    });
    _jumpToTop();
    _schedulePersist();
  }

  void _select(CardImageModel card) {
    setState(() => _selectedCardId = card.id);
    _schedulePersist();
  }

  Future<void> _openFullscreen(CardImageModel card) async {
    _select(card);
    await context.push(AppRoutes.cardAlias(card.id));
    if (mounted) setState(() {});
  }

  Future<void> _openCastleCardFullscreen(CardImageModel card) async {
    if (_viewBeforeCastleFullscreen != null) {
      setState(() {
        _viewMode = _viewBeforeCastleFullscreen!;
        _viewBeforeCastleFullscreen = null;
      });
    }
    await _openFullscreen(card);
  }

  void _viewInCastle(CardImageModel card) {
    setState(() {
      _viewBeforeCastleFullscreen = _viewMode == _SearchViewMode.castle
          ? null
          : _viewMode;
      _selectedCardId = card.id;
      _viewMode = _SearchViewMode.castle;
      _castleFullscreenRequestId += 1;
    });
    _schedulePersist();
  }

  void _handleCastleFullscreenChanged(bool active) {
    if (active || _viewBeforeCastleFullscreen == null) return;
    setState(() {
      _viewMode = _viewBeforeCastleFullscreen!;
      _viewBeforeCastleFullscreen = null;
    });
    _schedulePersist();
  }

  void _moveFocus(List<CardImageModel> cards, int index, int delta) {
    if (cards.isEmpty) return;
    final next = (index + delta).clamp(0, cards.length - 1);
    final card = cards[next];
    if (next >= _visibleCount) {
      setState(() => _visibleCount = next + _pageSize);
    }
    _select(card);
    _cardFocusNodes[card.id]?.requestFocus();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final target = _cardKeys[card.id]?.currentContext;
      if (target != null) {
        Scrollable.ensureVisible(
          target,
          duration: const Duration(milliseconds: 160),
          alignment: .2,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<DeckProvider>();
    final results = _results(provider.decks);
    final selected = results
        .where((card) => card.id == _selectedCardId)
        .firstOrNull;
    final visible = results.take(_visibleCount).toList(growable: false);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        child: DecoratedBox(
          decoration: const BoxDecoration(
            gradient: RadialGradient(
              center: Alignment.topCenter,
              radius: 1.3,
              colors: [Color(0xB3102130), Color(0x9905080C)],
            ),
          ),
          child: Column(
            children: [
              _SearchHeader(
                controller: _controller,
                selectedCategory: _category,
                viewMode: _viewMode,
                onQueryChanged: _onQueryChanged,
                onCategoryChanged: _setCategory,
                onShuffle: results.isEmpty ? null : _shuffle,
                onViewModeChanged: (mode) {
                  setState(() => _viewMode = mode);
                  _schedulePersist();
                },
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
                                child: Text(
                                  _resultLabel(results.length),
                                  style: const TextStyle(
                                    color: AppTheme.brightGold,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 1.1,
                                  ),
                                ),
                              ),
                              Expanded(
                                child: results.isEmpty
                                    ? const _EmptyResults()
                                    : _buildResults(visible, results),
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
    if (_query.trim().isEmpty) return '$count RÉSULTATS';
    return '$count RÉSULTATS POUR “${_query.trim().toUpperCase()}”';
  }

  Widget _buildResults(List<CardImageModel> visible, List<CardImageModel> all) {
    if (_viewMode == _SearchViewMode.castle) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: WebGlCardCastleView(
            cards: all,
            focusedCardId: _selectedCardId,
            shuffleSeed: _shuffleSeed,
            activeCategory: _category,
            fullscreenRequestId: _castleFullscreenRequestId,
            onCardSelected: (id) {
              final card = all.where((item) => item.id == id).firstOrNull;
              if (card != null) _select(card);
            },
            onCardOpened: (id) {
              final card = all.where((item) => item.id == id).firstOrNull;
              if (card != null) {
                unawaited(_openCastleCardFullscreen(card));
              }
            },
            onCategoryChanged: _setCategory,
            onHomeRequested: () => context.go(AppRoutes.home),
            onFullscreenChanged: _handleCastleFullscreenChanged,
            fallback: SearchCardCastle(
              cards: visible,
              onFullscreen: _openFullscreen,
            ),
          ),
        ),
      );
    }
    if (_viewMode == _SearchViewMode.list) {
      _gridColumns = 1;
      return Scrollbar(
        controller: _scrollController,
        child: ListView.separated(
          controller: _scrollController,
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
          itemCount: visible.length,
          separatorBuilder: (_, _) => const SizedBox(height: 8),
          itemBuilder: (context, index) => _SearchListRow(
            key: _cardKeys.putIfAbsent(visible[index].id, GlobalKey.new),
            card: visible[index],
            selected: visible[index].id == _selectedCardId,
            focusNode: _cardFocusNodes.putIfAbsent(
              visible[index].id,
              FocusNode.new,
            ),
            onSelect: () => _select(visible[index]),
            onFullscreen: () => _openFullscreen(visible[index]),
            onMove: (delta) => _moveFocus(all, index, delta),
          ),
        ),
      );
    }
    return LayoutBuilder(
      builder: (context, constraints) {
        _gridColumns = constraints.maxWidth >= 900
            ? 5
            : constraints.maxWidth >= 680
            ? 4
            : constraints.maxWidth >= 430
            ? 3
            : 2;
        return Scrollbar(
          controller: _scrollController,
          child: GridView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
            scrollCacheExtent: const ScrollCacheExtent.pixels(700),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: _gridColumns,
              crossAxisSpacing: 14,
              mainAxisSpacing: 14,
              childAspectRatio: 2 / 3,
            ),
            itemCount: visible.length,
            itemBuilder: (context, index) => _SearchCardTile(
              key: _cardKeys.putIfAbsent(visible[index].id, GlobalKey.new),
              card: visible[index],
              selected: visible[index].id == _selectedCardId,
              focusNode: _cardFocusNodes.putIfAbsent(
                visible[index].id,
                FocusNode.new,
              ),
              onSelect: () => _select(visible[index]),
              onFullscreen: () => _openFullscreen(visible[index]),
              onMove: (delta) => _moveFocus(
                all,
                index,
                delta < -1
                    ? -_gridColumns
                    : delta > 1
                    ? _gridColumns
                    : delta,
              ),
            ),
          ),
        );
      },
    );
  }
}

class _SearchHeader extends StatelessWidget {
  const _SearchHeader({
    required this.controller,
    required this.selectedCategory,
    required this.viewMode,
    required this.onQueryChanged,
    required this.onCategoryChanged,
    required this.onShuffle,
    required this.onViewModeChanged,
    required this.categories,
  });

  final TextEditingController controller;
  final String selectedCategory;
  final _SearchViewMode viewMode;
  final ValueChanged<String> onQueryChanged;
  final ValueChanged<String> onCategoryChanged;
  final VoidCallback? onShuffle;
  final ValueChanged<_SearchViewMode> onViewModeChanged;
  final List<String> categories;

  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: const BoxDecoration(
      color: Color(0xE6080D12),
      border: Border(bottom: BorderSide(color: Color(0x665EB8EF))),
    ),
    child: Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
      child: Column(
        children: [
          Row(
            children: [
              Semantics(
                label: 'Chanson à Répondre UNO logo',
                image: true,
                child: Image.asset(
                  'assets/images/app_logo.png',
                  width: 78,
                  height: 62,
                  fit: BoxFit.contain,
                ),
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'RECHERCHE',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.5,
                      ),
                    ),
                    Text(
                      'Trouvez vos cartes',
                      style: TextStyle(color: Color(0xFF9EB4C5)),
                    ),
                  ],
                ),
              ),
              IconButton.outlined(
                tooltip: 'DJ Who',
                onPressed: () => context.go(AppRoutes.djWhoVideos),
                icon: const Icon(Icons.queue_music_rounded),
              ),
              const SizedBox(width: 8),
              IconButton.outlined(
                tooltip: 'Accueil',
                onPressed: () => context.go(AppRoutes.home),
                icon: const Icon(Icons.home_rounded),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: controller,
                  onChanged: onQueryChanged,
                  textInputAction: TextInputAction.search,
                  decoration: InputDecoration(
                    hintText: 'Rechercher une carte…',
                    prefixIcon: const Icon(Icons.search_rounded),
                    suffixIcon: controller.text.isEmpty
                        ? null
                        : IconButton(
                            tooltip: 'Effacer la recherche',
                            onPressed: () {
                              controller.clear();
                              onQueryChanged('');
                            },
                            icon: const Icon(Icons.close_rounded),
                          ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              FilledButton.tonalIcon(
                onPressed: onShuffle,
                icon: const Icon(Icons.shuffle_rounded),
                label: MediaQuery.sizeOf(context).width >= 620
                    ? const Text('SHUFFLE')
                    : const SizedBox.shrink(),
              ),
              const SizedBox(width: 8),
              SegmentedButton<_SearchViewMode>(
                showSelectedIcon: false,
                segments: const [
                  ButtonSegment(
                    value: _SearchViewMode.castle,
                    icon: Icon(Icons.castle_rounded),
                    tooltip: '3D Castle View',
                  ),
                  ButtonSegment(
                    value: _SearchViewMode.grid,
                    icon: Icon(Icons.grid_view_rounded),
                    tooltip: 'Grid View',
                  ),
                  ButtonSegment(
                    value: _SearchViewMode.list,
                    icon: Icon(Icons.view_list_rounded),
                    tooltip: 'List View',
                  ),
                ],
                selected: {viewMode},
                onSelectionChanged: (value) => onViewModeChanged(value.first),
              ),
            ],
          ),
          const SizedBox(height: 10),
          SizedBox(
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
                    color: active
                        ? AppTheme.brightGold
                        : const Color(0xFF516779),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    ),
  );
}

class _SearchCardTile extends StatefulWidget {
  const _SearchCardTile({
    required this.card,
    required this.selected,
    required this.focusNode,
    required this.onSelect,
    required this.onFullscreen,
    required this.onMove,
    super.key,
  });
  final CardImageModel card;
  final bool selected;
  final FocusNode focusNode;
  final VoidCallback onSelect;
  final VoidCallback onFullscreen;
  final ValueChanged<int> onMove;

  @override
  State<_SearchCardTile> createState() => _SearchCardTileState();
}

class _SearchCardTileState extends State<_SearchCardTile> {
  bool focused = false;

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    selected: widget.selected,
    label: '${widget.card.category} search result card',
    onTap: widget.onSelect,
    onLongPress: widget.onFullscreen,
    child: CallbackShortcuts(
      bindings: {
        const SingleActivator(LogicalKeyboardKey.arrowLeft): () =>
            widget.onMove(-1),
        const SingleActivator(LogicalKeyboardKey.arrowRight): () =>
            widget.onMove(1),
        const SingleActivator(LogicalKeyboardKey.arrowUp): () =>
            widget.onMove(-2),
        const SingleActivator(LogicalKeyboardKey.arrowDown): () =>
            widget.onMove(2),
        const SingleActivator(LogicalKeyboardKey.keyF): widget.onFullscreen,
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: widget.selected || focused
                ? AppTheme.brightGold
                : const Color(0xFF50616D),
            width: widget.selected
                ? 3
                : focused
                ? 2
                : 1,
          ),
          boxShadow: widget.selected
              ? const [BoxShadow(color: Color(0x99FFC928), blurRadius: 16)]
              : null,
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          focusNode: widget.focusNode,
          onFocusChange: (value) => setState(() => focused = value),
          onTap: widget.onSelect,
          onLongPress: widget.onFullscreen,
          child: Stack(
            fit: StackFit.expand,
            children: [
              StoredImage(
                source: widget.card.imagePath,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) => const ColoredBox(
                  color: Color(0xFF141A20),
                  child: Center(child: Icon(Icons.broken_image_outlined)),
                ),
              ),
              Positioned(
                left: 6,
                top: 6,
                child: CategoryBadge(
                  category: widget.card.category,
                  compact: true,
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

class _SearchListRow extends StatelessWidget {
  const _SearchListRow({
    required this.card,
    required this.selected,
    required this.focusNode,
    required this.onSelect,
    required this.onFullscreen,
    required this.onMove,
    super.key,
  });
  final CardImageModel card;
  final bool selected;
  final FocusNode focusNode;
  final VoidCallback onSelect;
  final VoidCallback onFullscreen;
  final ValueChanged<int> onMove;

  @override
  Widget build(BuildContext context) => CallbackShortcuts(
    bindings: {
      const SingleActivator(LogicalKeyboardKey.arrowUp): () => onMove(-1),
      const SingleActivator(LogicalKeyboardKey.arrowDown): () => onMove(1),
    },
    child: Material(
      color: selected ? const Color(0xFF332A0D) : const Color(0xCC111820),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: BorderSide(
          color: selected ? AppTheme.brightGold : const Color(0xFF425461),
          width: selected ? 2 : 1,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        focusNode: focusNode,
        onTap: onSelect,
        onLongPress: onFullscreen,
        child: SizedBox(
          height: 96,
          child: Row(
            children: [
              AspectRatio(
                aspectRatio: card.aspectRatio,
                child: StoredImage(source: card.imagePath, fit: BoxFit.cover),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      card.category.toUpperCase(),
                      style: const TextStyle(
                        color: AppTheme.brightGold,
                        fontSize: 12,
                      ),
                    ),
                    if (card.question.isNotEmpty)
                      Text(
                        card.question,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Color(0xFFAFBBC4)),
                      ),
                  ],
                ),
              ),
              IconButton(
                tooltip: 'Ouvrir en plein écran',
                onPressed: onFullscreen,
                icon: const Icon(Icons.fullscreen_rounded),
              ),
              const SizedBox(width: 6),
            ],
          ),
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
