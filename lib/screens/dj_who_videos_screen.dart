import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../providers/dj_who_player_provider.dart';
import '../widgets/app_page_shell.dart';
import '../widgets/dj_who_avatar.dart';
import '../widgets/video_playlist_tile.dart';

class DjWhoVideosScreen extends StatelessWidget {
  const DjWhoVideosScreen({super.key});

  @override
  Widget build(BuildContext context) => AppPageShell(
    title: 'DJ WHO Videos',
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
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Row(
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
                            shadows: const [
                              Shadow(blurRadius: 8, color: Colors.black87),
                            ],
                          ),
                        ),
                        const Text(
                          'Playlist officielle',
                          style: TextStyle(color: Colors.white70),
                        ),
                      ],
                    ),
                  ),
                  OutlinedButton.icon(
                    onPressed: _openChannel,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: BorderSide(
                        color: Colors.white.withValues(alpha: .65),
                      ),
                      backgroundColor: Colors.black.withValues(alpha: .22),
                    ),
                    icon: const Icon(Icons.open_in_new),
                    label: const Text('Chaîne YouTube'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Expanded(
                child: Consumer<DjWhoPlayerProvider>(
                  builder: (context, player, _) {
                    final videos = player.videos;
                    if (videos.isEmpty) return const _EmptyPlaylist();

                    return LayoutBuilder(
                      builder: (context, constraints) {
                        final desktop = constraints.maxWidth >= 850;
                        final playlist = _Playlist(
                          videos: videos,
                          selectedIndex: player.selectedIndex,
                          onSelected: player.selectVideo,
                        );

                        if (!desktop) {
                          final playerSlotHeight =
                              (constraints.maxWidth * 9 / 16) + 78;
                          return Column(
                            children: [
                              SizedBox(height: playerSlotHeight),
                              const SizedBox(height: 12),
                              Expanded(child: playlist),
                            ],
                          );
                        }

                        return Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Expanded(child: SizedBox.expand()),
                            const SizedBox(width: 16),
                            SizedBox(width: 390, child: playlist),
                          ],
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          ),
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

class _Playlist extends StatelessWidget {
  const _Playlist({
    required this.videos,
    required this.selectedIndex,
    required this.onSelected,
  });

  final List<dynamic> videos;
  final int selectedIndex;
  final Future<void> Function(int index) onSelected;

  @override
  Widget build(BuildContext context) => Scrollbar(
    child: ListView.separated(
      primary: true,
      itemCount: videos.length,
      separatorBuilder: (_, _) => const SizedBox(height: 10),
      itemBuilder: (_, index) => VideoPlaylistTile(
        video: videos[index],
        selected: index == selectedIndex,
        onTap: () => unawaited(onSelected(index)),
      ),
    ),
  );
}

class _EmptyPlaylist extends StatelessWidget {
  const _EmptyPlaylist();

  @override
  Widget build(BuildContext context) => const Center(
    child: Text(
      'La playlist DJ WHO est momentanément indisponible.',
      style: TextStyle(color: Colors.white),
    ),
  );
}
