import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../providers/dj_who_player_provider.dart';
import '../widgets/app_page_shell.dart';
import '../widgets/dj_who_avatar.dart';
import '../widgets/persistent_dj_who_player.dart';
import '../widgets/video_playlist_tile.dart';

class DjWhoVideosScreen extends StatelessWidget {
  const DjWhoVideosScreen({super.key});

  @override
  Widget build(BuildContext context) => AppPageShell(
    title: 'DJ WHO Videos',
    showBackButton: false,
    child: Stack(
      fit: StackFit.expand,
      children: [
        Image.asset(
          'assets/images/dj_who_stage_background.jpg',
          fit: BoxFit.cover,
          alignment: Alignment.center,
        ),
        DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.black.withValues(alpha: .18),
                Colors.black.withValues(alpha: .32),
              ],
            ),
          ),
        ),
        Consumer<DjWhoPlayerProvider>(
          builder: (context, player, _) {
            final videos = player.videos;
            return Scrollbar(
              thumbVisibility: true,
              interactive: true,
              child: ListView(
                primary: true,
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
                children: [
                  _Header(onOpenChannel: _openChannel),
                  const SizedBox(height: 16),
                  const Center(
                    child: ConstrainedBox(
                      constraints: BoxConstraints(maxWidth: 980),
                      child: DjWhoRoutePlayer(),
                    ),
                  ),
                  const SizedBox(height: 18),
                  if (videos.isEmpty)
                    const _EmptyPlaylist()
                  else
                    Center(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 980),
                        child: Column(
                          children: [
                            for (var index = 0; index < videos.length; index++) ...[
                              VideoPlaylistTile(
                                video: videos[index],
                                selected: index == player.selectedIndex,
                                onTap: () => unawaited(player.selectVideo(index)),
                              ),
                              if (index != videos.length - 1)
                                const SizedBox(height: 10),
                            ],
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            );
          },
        ),
      ],
    ),
  );

  Future<void> _openChannel() async {
    await launchUrl(
      Uri.parse('https://youtube.com/@djwho-o7t'),
      mode: LaunchMode.externalApplication,
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.onOpenChannel});
  final VoidCallback onOpenChannel;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      const DjWhoAvatar(size: 58),
      const SizedBox(width: 14),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'DJ WHO',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w700,
                shadows: const [Shadow(blurRadius: 8, color: Colors.black87)],
              ),
            ),
            const Text('Playlist officielle', style: TextStyle(color: Colors.white70)),
          ],
        ),
      ),
      OutlinedButton.icon(
        onPressed: onOpenChannel,
        style: OutlinedButton.styleFrom(
          foregroundColor: Colors.white,
          side: BorderSide(color: Colors.white.withValues(alpha: .65)),
          backgroundColor: Colors.black.withValues(alpha: .22),
        ),
        icon: const Icon(Icons.open_in_new),
        label: const Text('Chaîne YouTube'),
      ),
    ],
  );
}

class _EmptyPlaylist extends StatelessWidget {
  const _EmptyPlaylist();
  @override
  Widget build(BuildContext context) => const Padding(
    padding: EdgeInsets.symmetric(vertical: 32),
    child: Center(
      child: Text(
        'La playlist DJ WHO est momentanément indisponible.',
        style: TextStyle(color: Colors.white),
      ),
    ),
  );
}
