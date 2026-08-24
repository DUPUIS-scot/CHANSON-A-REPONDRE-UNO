import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/app_router.dart';
import '../providers/background_provider.dart';
import '../providers/home_experience_provider.dart';
import '../services/background_import_service.dart';
import '../services/local_storage_service.dart';
import '../theme/app_theme.dart';
import '../widgets/background_widget.dart';
import '../widgets/home_3d_video_viewport.dart';
import '../widgets/home_header.dart';
import '../widgets/home_intro_controls.dart';
import '../widgets/interactive_curtain_overlay.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  static const _searchStorageKey = 'search_path_state_v1';

  Future<void> _openCastleFromHome(BuildContext context) async {
    final storage = context.read<LocalStorageService>();
    final source = await storage.read(_searchStorageKey);

    if (source != null) {
      try {
        final decoded = jsonDecode(source);
        if (decoded is Map<String, dynamic>) {
          decoded['castleActive'] = false;
          decoded['category'] = null;
          decoded['selectedCardId'] = null;
          await storage.write(_searchStorageKey, decoded);
        } else {
          await storage.remove(_searchStorageKey);
        }
      } on Object {
        await storage.remove(_searchStorageKey);
      }
    }

    if (context.mounted) context.go(AppRoutes.search);
  }

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
                child: _ArtisticHome(
                  onNavigate: (route) => context.go(route),
                  onCastle: () => _openCastleFromHome(context),
                ),
              ),
            ),
          ),
          const InteractiveCurtainOverlay(),
          const Home3dVideoViewport(),
          const HomeIntroControls(),
          if (background.type == BackgroundMediaType.video)
            Positioned(
              right: 12,
              bottom: 12,
              child: SafeArea(
                child: IconButton.filledTonal(
                  tooltip: background.muteVideo
                      ? 'Turn SAUVAGE sound on'
                      : 'Mute SAUVAGE',
                  onPressed: () =>
                      background.setMuteVideo(!background.muteVideo),
                  icon: Icon(
                    background.muteVideo
                        ? Icons.volume_off_rounded
                        : Icons.volume_up_rounded,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _ArtisticHome extends StatelessWidget {
  const _ArtisticHome({required this.onNavigate, required this.onCastle});

  final ValueChanged<String> onNavigate;
  final VoidCallback onCastle;

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
                      onTap: onCastle,
                    ),
                    _PrimaryEntrance(
                      icon: Icons.graphic_eq_rounded,
                      label: 'DJ WHO',
                      onTap: () => onNavigate(AppRoutes.djWhoVideos),
                    ),
                    _PrimaryEntrance(
                      icon: Icons.album_rounded,
                      label: 'ENOCHIAN TERMINAL',
                      tooltip: 'Best experience on desktop',
                      onTap: () => onNavigate(AppRoutes.enochianTerminal),
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
    this.tooltip,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final String? tooltip;

  @override
  Widget build(BuildContext context) {
    final entrance = Semantics(
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
                textAlign: TextAlign.center,
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

    if (tooltip == null) return entrance;
    return Tooltip(
      message: tooltip!,
      preferBelow: true,
      waitDuration: const Duration(milliseconds: 300),
      child: entrance,
    );
  }
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
