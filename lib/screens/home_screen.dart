import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/app_router.dart';
import '../providers/home_experience_provider.dart';
import '../providers/settings_provider.dart';
import '../providers/background_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/interactive_curtain_overlay.dart';
import '../widgets/home_3d_video_viewport.dart';
import '../widgets/home_intro_controls.dart';
import '../widgets/background_widget.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  static const _sauvageVideoAsset = 'assets/videos/sauvage_background.mp4';

  @override
  Widget build(BuildContext context) {
    final experience = context.watch<HomeExperienceProvider>();
    final reducedMotion =
        context.watch<SettingsProvider>().advanced.reducedMotion ||
        MediaQuery.disableAnimationsOf(context);
    final sauvage = experience.backgroundMode == HomeBackgroundMode.sauvage;
    final homeInteractive = experience.homeInteractive;
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
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.all(AppTheme.spaceLg),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'CHANSON À RÉPONDRE UNO',
                              textAlign: TextAlign.center,
                              style: Theme.of(context).textTheme.headlineMedium
                                  ?.copyWith(
                                    color: AppTheme.brightGold,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 1.2,
                                  ),
                            ),
                            const SizedBox(height: AppTheme.spaceXl),
                            const Text(
                              'ENTER',
                              style: TextStyle(
                                color: Colors.white70,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 2,
                              ),
                            ),
                            const SizedBox(height: AppTheme.spaceLg),
                            Wrap(
                              spacing: AppTheme.spaceLg,
                              runSpacing: AppTheme.spaceSm,
                              alignment: WrapAlignment.center,
                              children: [
                                _PrimaryRoute(
                                  label: 'PLAY',
                                  route: AppRoutes.play,
                                ),
                                _PrimaryRoute(
                                  label: 'CASTLE',
                                  route: AppRoutes.search,
                                ),
                                _PrimaryRoute(
                                  label: 'DJ WHO',
                                  route: AppRoutes.djWhoVideos,
                                ),
                              ],
                            ),
                            const SizedBox(height: AppTheme.spaceXl),
                            Wrap(
                              spacing: 4,
                              runSpacing: 2,
                              alignment: WrapAlignment.center,
                              children: [
                                _SecondaryRoute(
                                  label: 'Deck',
                                  route: AppRoutes.decks,
                                ),
                                _SecondaryRoute(
                                  label: 'Journal',
                                  route: AppRoutes.journal,
                                ),
                                _SecondaryRoute(
                                  label: 'Rules',
                                  route: AppRoutes.rules,
                                ),
                                _SecondaryRoute(
                                  label: 'Settings',
                                  route: AppRoutes.settings,
                                ),
                                const _SecondaryRoute(
                                  label: 'About',
                                  route: AppRoutes.profile,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const InteractiveCurtainOverlay(),
              const Home3dVideoViewport(),
              const HomeIntroControls(),
            ],
          ),
        ),
      ],
    );
  }
}

class _PrimaryRoute extends StatelessWidget {
  const _PrimaryRoute({required this.label, required this.route});
  final String label;
  final String route;
  @override
  Widget build(BuildContext context) => TextButton(
    onPressed: () => context.go(route),
    child: Text(
      label,
      style: const TextStyle(
        color: AppTheme.brightGold,
        fontWeight: FontWeight.w900,
        letterSpacing: 1.1,
      ),
    ),
  );
}

class _SecondaryRoute extends StatelessWidget {
  const _SecondaryRoute({required this.label, required this.route});
  final String label;
  final String route;
  @override
  Widget build(BuildContext context) => TextButton(
    onPressed: () => context.go(route),
    child: Text(label, style: const TextStyle(color: Colors.white70)),
  );
}
