import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/app_router.dart';
import '../providers/background_provider.dart';
import '../providers/home_experience_provider.dart';
import '../services/background_import_service.dart';
import '../theme/app_theme.dart';
import '../widgets/background_widget.dart';
import '../widgets/home_3d_video_viewport.dart';
import '../widgets/home_header.dart';
import '../widgets/home_intro_controls.dart';
import '../widgets/interactive_curtain_overlay.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final background = context.watch<BackgroundProvider>();
    final experience = context.watch<HomeExperienceProvider>();
    final homeInteractive = experience.homeInteractive;

    return Scaffold(
      backgroundColor: AppTheme.ink,
      body: Stack(
        fit: StackFit.expand,
        children: [
          Positioned.fill(
            child: BackgroundWidget(
              type: background.type == BackgroundMediaType.video
                  ? BackgroundType.video
                  : BackgroundType.image,
              imagePath: background.imagePath,
              videoPath: background.videoPath,
              fallbackImagePath: BackgroundProvider.defaultImageAsset,
              muted: background.muteVideo,
            ),
          ),
          Positioned.fill(
            child: IgnorePointer(
              child: ColoredBox(
                color: Colors.black.withValues(alpha: background.darkOverlay),
              ),
            ),
          ),
          IgnorePointer(
            ignoring: !homeInteractive,
            child: SafeArea(
              child: AnimatedOpacity(
                opacity: homeInteractive ? 1 : 0,
                duration: const Duration(milliseconds: 500),
                child: _ArtisticHome(onNavigate: (route) => context.go(route)),
              ),
            ),
          ),
          const InteractiveCurtainOverlay(),
          const Home3dVideoViewport(),
          const HomeIntroControls(),
        ],
      ),
    );
  }
}

class _ArtisticHome extends StatelessWidget {
  const _ArtisticHome({required this.onNavigate});

  final ValueChanged<String> onNavigate;

  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, constraints) {
      final compact = constraints.maxWidth < 620;
      return SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(
          compact ? 16 : 32,
          12,
          compact ? 16 : 32,
          28,
        ),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 980),
            child: Column(
              children: [
                HomeHeader(
                  onProfile: () => onNavigate(AppRoutes.profile),
                  onSettings: () => onNavigate(AppRoutes.settings),
                  showActions: false,
                ),
                SizedBox(height: compact ? 30 : 52),
                Text(
                  'ENTER',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: AppTheme.gold,
                    letterSpacing: 5,
                  ),
                ),
                const SizedBox(height: 18),
                Wrap(
                  alignment: WrapAlignment.center,
                  spacing: compact ? 12 : 30,
                  runSpacing: 14,
                  children: [
                    _PrimaryEntrance(
                      icon: Icons.play_arrow_rounded,
                      label: 'PLAY',
                      onTap: () => onNavigate(AppRoutes.play),
                    ),
                    _PrimaryEntrance(
                      icon: Icons.castle_rounded,
                      label: 'CASTLE',
                      onTap: () => onNavigate(AppRoutes.search),
                    ),
                    _PrimaryEntrance(
                      icon: Icons.graphic_eq_rounded,
                      label: 'DJ WHO',
                      onTap: () => onNavigate(AppRoutes.djWhoVideos),
                    ),
                  ],
                ),
                SizedBox(height: compact ? 34 : 58),
                Container(
                  width: 460,
                  height: 1,
                  color: AppTheme.gold.withValues(alpha: .42),
                ),
                const SizedBox(height: 16),
                Wrap(
                  alignment: WrapAlignment.center,
                  spacing: 4,
                  runSpacing: 2,
                  children: [
                    _SecondaryEntrance('DECK', AppRoutes.decks, onNavigate),
                    _SecondaryEntrance('BROWSE', AppRoutes.cards, onNavigate),
                    _SecondaryEntrance(
                      'JOURNAL',
                      AppRoutes.journal,
                      onNavigate,
                    ),
                    _SecondaryEntrance('RULES', AppRoutes.rules, onNavigate),
                    _SecondaryEntrance(
                      'SETTINGS',
                      AppRoutes.settings,
                      onNavigate,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      );
    },
  );
}

class _PrimaryEntrance extends StatelessWidget {
  const _PrimaryEntrance({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    label: label,
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(48),
      child: Container(
        constraints: const BoxConstraints(minWidth: 150, minHeight: 72),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xB0140B08),
          borderRadius: BorderRadius.circular(48),
          border: Border.all(color: AppTheme.gold, width: 1.4),
          boxShadow: const [
            BoxShadow(
              color: Color(0x443D0804),
              blurRadius: 22,
              spreadRadius: 3,
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: AppTheme.brightGold, size: 30),
            const SizedBox(height: 5),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.5,
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

class _SecondaryEntrance extends StatelessWidget {
  const _SecondaryEntrance(this.label, this.route, this.onNavigate);

  final String label;
  final String route;
  final ValueChanged<String> onNavigate;

  @override
  Widget build(BuildContext context) => TextButton(
    onPressed: () => onNavigate(route),
    style: TextButton.styleFrom(foregroundColor: const Color(0xFFEAD9B0)),
    child: Text(label, style: const TextStyle(letterSpacing: .9)),
  );
}
