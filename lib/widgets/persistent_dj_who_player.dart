import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:youtube_player_iframe/youtube_player_iframe.dart';

import '../core/app_router.dart';
import '../providers/dj_who_player_provider.dart';
import 'dj_who_avatar.dart';

class PersistentDjWhoPlayer extends StatefulWidget {
  const PersistentDjWhoPlayer({super.key});

  @override
  State<PersistentDjWhoPlayer> createState() => _PersistentDjWhoPlayerState();
}

class _PersistentDjWhoPlayerState extends State<PersistentDjWhoPlayer> {
  final GlobalKey _youtubePlayerKey = GlobalKey(
    debugLabel: 'dj-who-youtube-surface',
  );
  DjWhoPlayerProvider? _player;
  bool? _onDjWhoRoute;

  @override
  void initState() {
    super.initState();
    AppRouter.router.routerDelegate.addListener(_handleRouteChange);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _player = context.read<DjWhoPlayerProvider>();
    _handleRouteChange();
  }

  void _handleRouteChange() {
    final player = _player;
    if (player == null) return;

    final onDjWhoRoute =
        AppRouter.router.state.uri.path == AppRoutes.djWhoVideos;
    if (_onDjWhoRoute == onDjWhoRoute) return;
    _onDjWhoRoute = onDjWhoRoute;

    if (onDjWhoRoute) {
      unawaited(player.enterPlayerRoute());
    } else {
      unawaited(player.leavePlayerRoute());
    }
  }

  @override
  void dispose() {
    AppRouter.router.routerDelegate.removeListener(_handleRouteChange);
    super.dispose();
  }

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
          if (player.selectedVideo == null) {
            return const SizedBox.shrink();
          }

          return LayoutBuilder(
            builder: (context, constraints) {
              final desktop = constraints.maxWidth >= 850;

              return Stack(
                fit: StackFit.expand,
                clipBehavior: Clip.hardEdge,
                children: [
                  if (onDjWhoRoute)
                    Positioned(
                      top: 146,
                      left: 16,
                      right: desktop ? 422 : 16,
                      child: player.hasMountedPlayer
                          ? _ExpandedPlayerCard(
                              player: player,
                              youtubePlayerKey: _youtubePlayerKey,
                            )
                          : const _PlayerLoadingCard(),
                    )
                  else ...[
                    if (player.hasMountedPlayer)
                      Positioned(
                        left: 0,
                        bottom: 0,
                        width: 160,
                        height: 90,
                        child: IgnorePointer(
                          child: ClipRect(
                            child: Opacity(
                              opacity: 0.01,
                              child: SizedBox(
                                width: 160,
                                height: 90,
                                child: YoutubePlayer(
                                  key: _youtubePlayerKey,
                                  controller: player.controller!,
                                  aspectRatio: 16 / 9,
                                  keepAlive: true,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    if (desktop)
                      Positioned(
                        right: 16,
                        bottom: 16,
                        width: 460,
                        child: _MiniPlayerBar(player: player),
                      )
                    else
                      Positioned(
                        left: 8,
                        right: 8,
                        bottom: 8,
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

class _PlayerLoadingCard extends StatelessWidget {
  const _PlayerLoadingCard();

  @override
  Widget build(BuildContext context) => Material(
    elevation: 6,
    color: Theme.of(context).colorScheme.surface,
    borderRadius: BorderRadius.circular(12),
    clipBehavior: Clip.antiAlias,
    child: const AspectRatio(
      aspectRatio: 16 / 9,
      child: Center(child: CircularProgressIndicator()),
    ),
  );
}

class _ExpandedPlayerCard extends StatelessWidget {
  const _ExpandedPlayerCard({
    required this.player,
    required this.youtubePlayerKey,
  });

  final DjWhoPlayerProvider player;
  final Key youtubePlayerKey;

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
            key: youtubePlayerKey,
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

class _MiniPlayerBar extends StatelessWidget {
  const _MiniPlayerBar({required this.player});

  final DjWhoPlayerProvider player;

  @override
  Widget build(BuildContext context) {
    final video = player.selectedVideo!;
    final colors = Theme.of(context).colorScheme;
    final castleSuspended = player.isCastleLoadSuspended;
    final resumesAfterCastle = player.willResumeAfterCastleLoad;
    final statusText = castleSuspended
        ? (resumesAfterCastle
              ? 'CASTLE LOADING · DJ WHO PAUSED'
              : 'CASTLE LOADING · AUTO-RESUME OFF')
        : video.title;
    final playbackTooltip = castleSuspended
        ? (resumesAfterCastle
              ? 'Cancel DJ WHO resume after Castle loading'
              : 'Resume DJ WHO after Castle loading')
        : (player.isPlaying ? 'Pause DJ WHO' : 'Play DJ WHO');
    final playbackIcon = castleSuspended
        ? (resumesAfterCastle ? Icons.schedule_rounded : Icons.play_arrow_rounded)
        : (player.isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded);

    return Material(
      key: const Key('persistent-dj-who-mini-player'),
      elevation: 18,
      color: colors.surface,
      borderRadius: BorderRadius.circular(14),
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
                    statusText,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      fontWeight: castleSuspended ? FontWeight.w600 : null,
                    ),
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
              tooltip: playbackTooltip,
              icon: playbackIcon,
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
