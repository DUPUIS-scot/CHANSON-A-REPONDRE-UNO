import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:youtube_player_iframe/youtube_player_iframe.dart';

import '../data/dj_who_videos.dart';
import '../widgets/app_page_shell.dart';
import '../widgets/video_playlist_tile.dart';

class DjWhoVideosScreen extends StatefulWidget {
  const DjWhoVideosScreen({super.key});

  @override
  State<DjWhoVideosScreen> createState() => _DjWhoVideosScreenState();
}

class _DjWhoVideosScreenState extends State<DjWhoVideosScreen> {
  int selectedIndex = 0;
  late final YoutubePlayerController controller;

  @override
  void initState() {
    super.initState();
    controller = YoutubePlayerController(
      params: const YoutubePlayerParams(
        showControls: true,
        showFullscreenButton: true,
      ),
    );
    controller.cuePlaylist(
      list: djWhoVideos.map((video) => video.videoId).toList(growable: false),
      listType: ListType.playlist,
    );
  }

  @override
  void dispose() {
    controller.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final validVideos = djWhoVideos
        .where((video) => video.hasValidVideoId)
        .toList(growable: false);
    final selected = validVideos.isEmpty
        ? null
        : validVideos[selectedIndex.clamp(0, validVideos.length - 1)];

    return AppPageShell(
      title: 'DJ WHO Videos',
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(
            'DJ WHO Videos',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 8),
          const Text(
            'A curated in-app playlist for DJ WHO videos. External channel links stay on this page.',
          ),
          const SizedBox(height: 16),
          if (selected != null)
            _VideoPreview(controller: controller, title: selected.title)
          else
            const _EmptyPlaylist(),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: _openChannel,
            icon: const Icon(Icons.open_in_new),
            label: const Text('Open DJ WHO channel'),
          ),
          if (validVideos.isNotEmpty) ...[
            const SizedBox(height: 24),
            for (var index = 0; index < validVideos.length; index++) ...[
              VideoPlaylistTile(
                video: validVideos[index],
                selected: index == selectedIndex,
                onTap: () {
                  setState(() => selectedIndex = index);
                  controller.loadVideoById(videoId: validVideos[index].videoId);
                },
              ),
              const SizedBox(height: 10),
            ],
          ],
        ],
      ),
    );
  }

  Future<void> _openChannel() async {
    await launchUrl(
      Uri.parse('https://youtube.com/@djwho-o7t'),
      mode: LaunchMode.externalApplication,
    );
  }
}

class _VideoPreview extends StatelessWidget {
  const _VideoPreview({required this.controller, required this.title});

  final YoutubePlayerController controller;
  final String title;

  @override
  Widget build(BuildContext context) => Semantics(
    label: 'Selected DJ WHO video: $title',
    child: ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: AspectRatio(
        aspectRatio: 16 / 9,
        child: YoutubePlayer(controller: controller),
      ),
    ),
  );
}

class _EmptyPlaylist extends StatelessWidget {
  const _EmptyPlaylist();

  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Icon(
            Icons.ondemand_video_outlined,
            size: 48,
            color: Theme.of(context).colorScheme.primary,
          ),
          const SizedBox(height: 12),
          Text(
            'No DJ WHO videos are configured yet.',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          const Text(
            'Add verified YouTube video IDs to the DJ WHO playlist data to show them here.',
            textAlign: TextAlign.center,
          ),
        ],
      ),
    ),
  );
}
