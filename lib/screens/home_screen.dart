import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:video_player/video_player.dart';

import '../core/app_router.dart';
import '../providers/background_provider.dart';
import '../providers/deck_provider.dart';
import '../providers/game_provider.dart';
import '../providers/home_experience_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/app_bottom_navigation.dart';
import '../widgets/continue_progress_panel.dart';
import '../widgets/interactive_curtain_overlay.dart';
import '../widgets/deck_carousel.dart';
import '../widgets/home_background_video.dart';
import '../widgets/home_menu_card.dart';
import '../widgets/recent_cards.dart';
import '../widgets/home_header.dart';
import '../widgets/home_3d_video_viewport.dart';
import '../widgets/home_intro_controls.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  static const _homeBackgroundVideo = 'assets/videos/home_background.mp4';
  static const _menuBackgroundAsset =
      'assets/images/main_menu_background.png';

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
  late final VideoPlayerController _backgroundController;
  bool _backgroundReady = false;

  static const _items = <_HomeItem>[
    _HomeItem(
      Icons.play_arrow_rounded,
      'Play',
      'Jouer une nouvelle partie ou continuer une partie existante.',
      AppRoutes.play,
      Color(0xFFE43C2C),
    ),
    _HomeItem(
      Icons.style_rounded,
      'Choose Deck',
      'Sélectionner, créer ou gérer vos decks de cartes.',
      AppRoutes.decks,
      Color(0xFFE9B52F),
    ),
    _HomeItem(
      Icons.menu_book_rounded,
      'Browse Cards',
      'Explorer toutes les cartes par deck ou catégorie.',
      AppRoutes.cards,
      Color(0xFF75B83A),
    ),
    _HomeItem(
      Icons.search_rounded,
      'Search',
      'Trouver des cartes par mot-clé, thème, auteur et plus encore.',
      AppRoutes.search,
      Color(0xFF2EA4DC),
    ),
    _HomeItem(
      Icons.book_rounded,
      'Journal',
      'Consulter vos entrées, notes et souvenirs enregistrés.',
      AppRoutes.journal,
      Color(0xFFC85AD9),
    ),
    _HomeItem(
      Icons.smart_toy_rounded,
      'AI Chat',
      'Discuter avec l’IA à propos des cartes et de vos idées.',
      AppRoutes.aiChat,
      Color(0xFF35C9C5),
    ),
    _HomeItem(
      Icons.gavel_rounded,
      'Rules',
      'Apprendre les règles du jeu et découvrir des variantes.',
      AppRoutes.rules,
      Color(0xFFE87524),
    ),
    _HomeItem(
      Icons.settings_rounded,
      'Settings',
      'Personnaliser votre expérience de jeu et vos préférences.',
      AppRoutes.settings,
      Color(0xFFC8B79B),
    ),
  ];

  @override
  void initState() {
    super.initState();
    _backgroundController = VideoPlayerController.asset(_homeBackgroundVideo);
    _backgroundController.initialize().then((_) async {
      await _backgroundController.setLooping(true);
      await _backgroundController.setVolume(0);
      await _backgroundController.play();
      if (mounted) setState(() => _backgroundReady = true);
    });
  }

  @override
  void dispose() {
    _backgroundController.dispose();
    super.dispose();
  }

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
    final background = context.watch<BackgroundProvider>();
    _syncBackgroundPlayback(background.mode);
    final game = context.watch<GameProvider>().state;
    final experience = context.watch<HomeExperienceProvider>();
    final homeInteractive = experience.homeInteractive;
    final continueDeck = game == null
        ? null
        : decks.decks.where((deck) => deck.id == game.deckId).firstOrNull;
    final recent = [...decks.cards]
      ..sort((a, b) => b.importedAt.compareTo(a.importedAt));

    return Scaffold(
      backgroundColor: AppTheme.ink,
      body: Stack(
        fit: StackFit.expand,
        children: [
          Positioned.fill(
            child: background.mode == BackgroundMode.sauvage
                ? HomeBackgroundVideo(
                    controller: _backgroundController,
                    ready: _backgroundReady,
                  )
                : Image.asset(
                    background.imagePath,
                    fit: BoxFit.cover,
                    alignment: Alignment.center,
                    filterQuality: FilterQuality.high,
                    errorBuilder: (context, error, stackTrace) =>
                        const ColoredBox(color: Color(0xFF090503)),
                  ),
          ),
          IgnorePointer(
            ignoring: !homeInteractive,
            child: SafeArea(
              bottom: false,
              child: TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: 1),
                duration: const Duration(milliseconds: 500),
                builder: (context, opacity, child) =>
                    Opacity(opacity: opacity, child: child),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final width = constraints.maxWidth;
                    final columns = width >= 1050
                        ? 4
                        : width >= 650
                        ? 3
                        : 2;
                    final horizontal = width >= 900 ? 28.0 : 14.0;
                    return SingleChildScrollView(
                      padding: EdgeInsets.fromLTRB(
                        horizontal,
                        12,
                        horizontal,
                        28,
                      ),
                      child: Center(
                        child: ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 1240),
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
                                physics: const NeverScrollableScrollPhysics(),
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
                                onContinue: () => context.go(AppRoutes.play),
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
                                onViewAll: () => context.go(AppRoutes.decks),
                              ),
                              const SizedBox(height: 18),
                              RecentCards(
                                cards: recent.take(12).toList(),
                                onCardTap: (card) =>
                                    context.go(AppRoutes.cardAlias(card.id)),
                                onViewAll: () => context.go(AppRoutes.cards),
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
    );
  }

  void _syncBackgroundPlayback(BackgroundMode mode) {
    if (!_backgroundReady || !_backgroundController.value.isInitialized) {
      return;
    }
    if (mode == BackgroundMode.sauvage) {
      if (!_backgroundController.value.isPlaying) {
        unawaited(_backgroundController.play());
      }
    } else if (_backgroundController.value.isPlaying) {
      unawaited(_backgroundController.pause());
    }
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
