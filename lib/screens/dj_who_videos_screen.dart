import 'dart:async';

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:youtube_player_iframe/youtube_player_iframe.dart';

import '../data/dj_who_videos.dart';
import '../models/video_item.dart';
import '../widgets/app_page_shell.dart';
import '../widgets/dj_who_avatar.dart';
import '../widgets/video_playlist_tile.dart';

class DjWhoVideosScreen extends StatefulWidget {
  const DjWhoVideosScreen({super.key});

  @override
  State<DjWhoVideosScreen> createState() => _DjWhoVideosScreenState();
}

class _DjWhoVideosScreenState extends State<DjWhoVideosScreen> {
  late final List<VideoItem> videos;
  YoutubePlayerController? controller;
  StreamSubscription<YoutubePlayerValue>? playerSubscription;
  int selectedIndex = 0;
  bool advancing = false;

  @override
  void initState() {
    super.initState();
    videos = djWhoVideos
        .where((video) => video.hasValidVideoId)
        .toList(growable: false);
    if (videos.isNotEmpty) {
      controller = YoutubePlayerController.fromVideoId(
        videoId: videos.first.videoId,
        params: const YoutubePlayerParams(
          showControls: true,
          showFullscreenButton: true,
          enableKeyboard: true,
          strictRelatedVideos: true,
          interfaceLanguage: 'fr',
        ),
      );
      playerSubscription = controller!.stream.listen(_onPlayerValue);
    }
  }

  void _onPlayerValue(YoutubePlayerValue value) {
    if (value.playerState != PlayerState.ended ||
        advancing ||
        videos.length < 2) {
      return;
    }
    advancing = true;
    final next = (selectedIndex + 1) % videos.length;
    unawaited(
      _selectVideo(next).whenComplete(() {
        advancing = false;
      }),
    );
  }

  Future<void> _selectVideo(int index) async {
    if (index < 0 || index >= videos.length || controller == null) return;
    if (mounted) setState(() => selectedIndex = index);
    await controller!.loadVideoById(videoId: videos[index].videoId);
  }

  @override
  void dispose() {
    unawaited(playerSubscription?.cancel());
    unawaited(controller?.close());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AppPageShell(
    title: 'DJ WHO Videos',
    child: Padding(
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
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const Text('Playlist officielle'),
                  ],
                ),
              ),
              OutlinedButton.icon(
                onPressed: _openChannel,
                icon: const Icon(Icons.open_in_new),
                label: const Text('Chaîne YouTube'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: videos.isEmpty
                ? const _EmptyPlaylist()
                : LayoutBuilder(
                    builder: (context, constraints) {
                      final desktop = constraints.maxWidth >= 850;
                      final player = _PlayerPanel(
                        controller: controller!,
                        video: videos[selectedIndex],
                        position: selectedIndex + 1,
                        count: videos.length,
                      );
                      final playlist = _Playlist(
                        videos: videos,
                        selectedIndex: selectedIndex,
                        onSelected: _selectVideo,
                      );
                      if (!desktop) {
                        return Column(
                          children: [
                            player,
                            const SizedBox(height: 12),
                            Expanded(child: playlist),
                          ],
                        );
                      }
                      return Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(child: player),
                          const SizedBox(width: 16),
                          SizedBox(width: 390, child: playlist),
                        ],
                      );
                    },
                  ),
          ),
        ],
      ),
    ),
  );

  Future<void> _openChannel() async {
    await launchUrl(
      Uri.parse('https://youtube.com/@djwho-o7t'),
      mode: LaunchMode.externalApplication,
    );
  }
}

class _PlayerPanel extends StatelessWidget {
  const _PlayerPanel({
    required this.controller,
    required this.video,
    required this.position,
    required this.count,
  });

  final YoutubePlayerController controller;
  final VideoItem video;
  final int position;
  final int count;

  @override
  Widget build(BuildContext context) => Card(
    clipBehavior: Clip.antiAlias,
    child: Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        YoutubePlayer(
          controller: controller,
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
                    Text('Vidéo $position sur $count · lecture suivante auto'),
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

class _Playlist extends StatelessWidget {
  const _Playlist({
    required this.videos,
    required this.selectedIndex,
    required this.onSelected,
  });

  final List<VideoItem> videos;
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
    child: Text('La playlist DJ WHO est momentanément indisponible.'),
  );
}
