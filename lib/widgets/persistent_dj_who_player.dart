import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:youtube_player_iframe/youtube_player_iframe.dart';

import '../core/app_router.dart';
import '../providers/dj_who_player_provider.dart';
import 'dj_who_avatar.dart';

class PersistentDjWhoPlayer extends StatelessWidget {
  const PersistentDjWhoPlayer({super.key});

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: AppRouter.router.routerDelegate,
    builder: (context, _) {
      final onDjWhoRoute =
          AppRouter.router.state.uri.path == AppRoutes.djWhoVideos;
      return Consumer<DjWhoPlayerProvider>(
        builder: (context, player, _) {
          if (!onDjWhoRoute && !player.isActive) {
            return const SizedBox.shrink();
          }

          player.ensureInitialized();
          if (player.controller == null || player.selectedVideo == null) {
            return const SizedBox.shrink();
          }

          return LayoutBuilder(
            builder: (context, constraints) {
              final desktop = constraints.maxWidth >= 850;
              final miniWidth = math.min(
                desktop ? 380.0 : constraints.maxWidth - 16,
                constraints.maxWidth - (desktop ? 32 : 16),
              );
              final safeMiniWidth = math.max(200.0, miniWidth);
              final miniVideoHeight = math.max(200.0, safeMiniWidth * 9 / 16);
              const miniControlsHeight = 66.0;

              return Stack(
                fit: StackFit.expand,
                clipBehavior: Clip.hardEdge,
                children: [
                  if (onDjWhoRoute)
                    Positioned(
                      top: 146,
                      left: 16,
                      right: desktop ? 422 : 16,
                      child: _ExpandedPlayerCard(player: player),
                    )
                  else ...[
                    Positioned(
                      right: desktop ? 16 : 8,
                      bottom: (desktop ? 16 : 8) + miniControlsHeight,
                      width: safeMiniWidth,
                      height: miniVideoHeight,
                      child: _MiniVideoSurface(player: player),
                    ),
                    Positioned(
                      right: desktop ? 16 : 8,
                      bottom: desktop ? 16 : 8,
                      width: safeMiniWidth,
                      height: miniControlsHeight,
                      child: _MiniPlayerBar(player: player),
                    ),
                  ],
                ],
              );
            },
          );
        },
      );
    },
  );
}

class _ExpandedPlayerCard extends StatelessWidget {
  const _ExpandedPlayerCard({required this.player});

  final DjWhoPlayerProvider player;

  @override
  Widget build(BuildContext context) {
    final video = player.selectedVideo!;
    final colors = Theme.of(context).colorScheme;

    return Material(
      key: const Key('persistent-dj-who-player'),
      elevation: 6,
      color: colors.surface,
      borderRadius: BorderRadius.circular(12),
      clipBehavior: Clip.antiAlias,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          YoutubePlayer(
            key: const Key('dj-who-persistent-youtube-player'),
            controller: player.controller!,
            aspectRatio: 16 / 9,
            keepAlive: true,
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                const DjWhoAvatar(size: 40),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        video.title,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Text(
                        'Vidéo ${player.selectedIndex + 1} sur '
                        '${player.videos.length} · lecture suivante auto',
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MiniVideoSurface extends StatelessWidget {
  const _MiniVideoSurface({required this.player});

  final DjWhoPlayerProvider player;

  @override
  Widget build(BuildContext context) => Material(
    elevation: 18,
    color: Colors.black,
    borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
    clipBehavior: Clip.antiAlias,
    child: YoutubePlayer(
      key: const Key('dj-who-persistent-youtube-player'),
      controller: player.controller!,
      aspectRatio: 16 / 9,
      keepAlive: true,
    ),
  );
}

class _MiniPlayerBar extends StatelessWidget {
  const _MiniPlayerBar({required this.player});

  final DjWhoPlayerProvider player;

  @override
  Widget build(BuildContext context) {
    final video = player.selectedVideo!;
    final colors = Theme.of(context).colorScheme;

    return Material(
      key: const Key('persistent-dj-who-mini-player'),
      elevation: 18,
      color: colors.surface,
      borderRadius: const BorderRadius.vertical(bottom: Radius.circular(14)),
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 7),
        child: Row(
          children: [
            const DjWhoAvatar(size: 34),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'DJ WHO',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                  Text(
                    video.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            _MiniButton(
              tooltip: 'Previous DJ WHO video',
              icon: Icons.skip_previous_rounded,
              onPressed: () => unawaited(player.previous()),
            ),
            _MiniButton(
              tooltip: player.isPlaying ? 'Pause DJ WHO' : 'Play DJ WHO',
              icon: player.isPlaying
                  ? Icons.pause_rounded
                  : Icons.play_arrow_rounded,
              onPressed: () => unawaited(player.togglePlayback()),
            ),
            _MiniButton(
              tooltip: 'Next DJ WHO video',
              icon: Icons.skip_next_rounded,
              onPressed: () => unawaited(player.next()),
            ),
            _MiniButton(
              tooltip: 'Open DJ WHO playlist',
              icon: Icons.open_in_full_rounded,
              onPressed: () => AppRouter.router.go(AppRoutes.djWhoVideos),
            ),
            _MiniButton(
              tooltip: 'Stop and close DJ WHO player',
              icon: Icons.close_rounded,
              onPressed: () => unawaited(player.stopAndDismiss()),
            ),
          ],
        ),
      ),
    );
  }
}

class _MiniButton extends StatelessWidget {
  const _MiniButton({
    required this.tooltip,
    required this.icon,
    required this.onPressed,
  });

  final String tooltip;
  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) => IconButton(
    tooltip: tooltip,
    onPressed: onPressed,
    icon: Icon(icon, size: 21),
    padding: EdgeInsets.zero,
    visualDensity: VisualDensity.compact,
    constraints: const BoxConstraints.tightFor(width: 36, height: 36),
  );
}
