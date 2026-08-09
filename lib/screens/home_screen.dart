import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/app_router.dart';
import '../providers/deck_provider.dart';
import '../providers/game_provider.dart';
import '../providers/home_experience_provider.dart';
import '../providers/settings_provider.dart';
import '../providers/background_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/app_bottom_navigation.dart';
import '../widgets/continue_progress_panel.dart';
import '../widgets/interactive_curtain_overlay.dart';
import '../widgets/deck_carousel.dart';
import '../widgets/home_menu_card.dart';
import '../widgets/recent_cards.dart';
import '../widgets/home_header.dart';
import '../widgets/home_3d_video_viewport.dart';
import '../widgets/home_intro_controls.dart';
import '../widgets/background_widget.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  static const _menuBackgroundAsset = 'assets/images/main_menu_background.png';
  static const _sauvageVideoAsset = 'assets/videos/sauvage_background.mp4';

  static const _cardAlignments = <Alignment>[
    Alignment.topLeft,
    Alignment.topCenter,
    Alignment.topRight,
    Alignment.centerLeft,
    Alignment.center,
    Alignment.centerRight,
    Alignment.bottomLeft,
    Alignment.bottomRight,
  ];

  static const _overlayOpacities = <double>[
    .52,
    .58,
    .58,
    .52,
    .52,
    .52,
    .52,
    .52,
  ];

  bool _backgroundPrecached = false;

  static const _items = <_HomeItem>[
    _HomeItem(
      Icons.play_arrow_rounded,
      'Play',
      'Start a new game or continue your saved game.',
      AppRoutes.play,
      Color(0xFFE43C2C),
    ),
    _HomeItem(
      Icons.style_rounded,
      'Choose Deck',
      'Enter the permanent curated card collection.',
      AppRoutes.decks,
      Color(0xFFE9B52F),
    ),
    _HomeItem(
      Icons.menu_book_rounded,
      'Browse Cards',
      'Explore every card by category.',
      AppRoutes.cards,
      Color(0xFF75B83A),
    ),
    _HomeItem(
      Icons.search_rounded,
      'Search',
      'Find cards by keyword, theme, author, and more.',
      AppRoutes.search,
      Color(0xFF2EA4DC),
    ),
    _HomeItem(
      Icons.book_rounded,
      'Journal',
      'Return to your saved notes and memories.',
      AppRoutes.journal,
      Color(0xFFC85AD9),
    ),
    _HomeItem(
      Icons.smart_toy_rounded,
      'AI Chat',
      'Discuss the cards and your ideas with AI.',
      AppRoutes.aiChat,
      Color(0xFF35C9C5),
    ),
    _HomeItem(
      Icons.gavel_rounded,
      'Rules',
      'Learn the game and discover its variants.',
      AppRoutes.rules,
      Color(0xFFE87524),
    ),
    _HomeItem(
      Icons.settings_rounded,
      'Settings',
      'Adjust appearance, sound, motion, and play preferences.',
      AppRoutes.settings,
      Color(0xFFC8B79B),
    ),
  ];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_backgroundPrecached) return;
    _backgroundPrecached = true;
    precacheImage(const AssetImage(_menuBackgroundAsset), context);
  }

  @override
  Widget build(BuildContext context) {
    final decks = context.watch<DeckProvider>();
    final game = context.watch<GameProvider>().state;
    final experience = context.watch<HomeExperienceProvider>();
    final reducedMotion =
        context.watch<SettingsProvider>().advanced.reducedMotion ||
        MediaQuery.disableAnimationsOf(context);
    final sauvage = experience.backgroundMode == HomeBackgroundMode.sauvage;
    final homeInteractive = experience.homeInteractive;
    final continueDeck = game == null
        ? null
        : decks.decks.where((deck) => deck.id == game.deckId).firstOrNull;
    final recent = [...decks.cards]
      ..sort((a, b) => b.importedAt.compareTo(a.importedAt));

    return Stack(
      fit: StackFit.expand,
      children: [
        if (sauvage) ...[
          IgnorePointer(
            child: BackgroundWidget(
              type: reducedMotion ? BackgroundType.image : BackgroundType.video,
              videoPath: _sauvageVideoAsset,
              fallbackImagePath: BackgroundProvider.defaultImageAsset,
              muted: true,
            ),
          ),
          IgnorePointer(
            child: ColoredBox(color: Colors.black.withValues(alpha: .32)),
          ),
        ],
        Scaffold(
          backgroundColor: Colors.transparent,
          body: Stack(
            fit: StackFit.expand,
            children: [
              IgnorePointer(
                ignoring: !homeInteractive,
                child: SafeArea(
                  bottom: false,
                  child: TweenAnimationBuilder<double>(
                    tween: Tween(begin: 0, end: 1),
                    duration: MediaQuery.disableAnimationsOf(context)
                        ? Duration.zero
                        : const Duration(milliseconds: 500),
                    builder: (context, opacity, child) =>
                        Opacity(opacity: opacity, child: child),
                    child: LayoutBuilder(
                      builder: (context, constraints) {
                        final width = constraints.maxWidth;
                        final columns = width >= AppTheme.desktopBreakpoint
                            ? 4
                            : width >= AppTheme.tabletBreakpoint
                            ? 3
                            : 2;
                        final horizontal = width >= AppTheme.tabletBreakpoint
                            ? AppTheme.spaceLg
                            : AppTheme.spaceSm;
                        return SingleChildScrollView(
                          padding: EdgeInsets.fromLTRB(
                            horizontal,
                            12,
                            horizontal,
                            28,
                          ),
                          child: Center(
                            child: ConstrainedBox(
                              constraints: const BoxConstraints(
                                maxWidth: AppTheme.maxContentWidth,
                              ),
                              child: Column(
                                children: [
                                  HomeHeader(
                                    onProfile: () => context.go('/profile'),
                                    onSettings: () =>
                                        context.go(AppRoutes.settings),
                                  ),
                                  const SizedBox(height: 18),
                                  GridView.builder(
                                    shrinkWrap: true,
                                    physics:
                                        const NeverScrollableScrollPhysics(),
                                    itemCount: _items.length,
                                    gridDelegate:
                                        SliverGridDelegateWithFixedCrossAxisCount(
                                          crossAxisCount: columns,
                                          crossAxisSpacing: 14,
                                          mainAxisSpacing: 14,
                                          childAspectRatio: width < 500
                                              ? .85
                                              : width < 900
                                              ? 1.0
                                              : 1.12,
                                        ),
                                    itemBuilder: (context, index) {
                                      final item = _items[index];
                                      return HomeMenuCard(
                                        icon: item.icon,
                                        title: item.title,
                                        description: item.description,
                                        accent: item.accent,
                                        backgroundAsset: _menuBackgroundAsset,
                                        backgroundAlignment:
                                            _cardAlignments[index],
                                        overlayOpacity:
                                            _overlayOpacities[index],
                                        onTap: () => context.go(item.route),
                                      );
                                    },
                                  ),
                                  const SizedBox(height: 18),
                                  ContinueProgressPanel(
                                    deck: continueDeck,
                                    game: game,
                                    onContinue: () =>
                                        context.go(AppRoutes.play),
                                  ),
                                  const SizedBox(height: 18),
                                  DeckCarousel(
                                    decks: decks.decks.take(10).toList(),
                                    onDeckTap: (deck) async {
                                      await decks.select(deck.id);
                                      if (context.mounted) {
                                        context.go(AppRoutes.deck(deck.id));
                                      }
                                    },
                                    onViewAll: () =>
                                        context.go(AppRoutes.decks),
                                  ),
                                  const SizedBox(height: 18),
                                  RecentCards(
                                    cards: recent.take(12).toList(),
                                    onCardTap: (card) => context.go(
                                      AppRoutes.cardAlias(card.id),
                                    ),
                                    onViewAll: () =>
                                        context.go(AppRoutes.cards),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
              ),
              const InteractiveCurtainOverlay(),
              const Home3dVideoViewport(),
              const HomeIntroControls(),
            ],
          ),
          bottomNavigationBar: IgnorePointer(
            ignoring: !homeInteractive,
            child: AnimatedOpacity(
              opacity: homeInteractive ? 1 : .45,
              duration: const Duration(milliseconds: 180),
              child: const AppBottomNavigation(),
            ),
          ),
        ),
      ],
    );
  }
}

class _HomeItem {
  const _HomeItem(
    this.icon,
    this.title,
    this.description,
    this.route,
    this.accent,
  );
  final IconData icon;
  final String title;
  final String description;
  final String route;
  final Color accent;
}
