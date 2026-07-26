import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/video_item.dart';

class VideoPlaylistTile extends StatefulWidget {
  const VideoPlaylistTile({
    required this.video,
    required this.selected,
    required this.onTap,
    super.key,
  });
  final VideoItem video;
  final bool selected;
  final VoidCallback onTap;

  @override
  State<VideoPlaylistTile> createState() => _VideoPlaylistTileState();
}

class _VideoPlaylistTileState extends State<VideoPlaylistTile> {
  bool hovered = false;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Semantics(
      button: true,
      selected: widget.selected,
      label: 'Play ${widget.video.title}, ${widget.video.duration}',
      child: FocusableActionDetector(
        mouseCursor: SystemMouseCursors.click,
        onShowHoverHighlight: (value) => setState(() => hovered = value),
        shortcuts: const {
          SingleActivator(LogicalKeyboardKey.enter): ActivateIntent(),
          SingleActivator(LogicalKeyboardKey.space): ActivateIntent(),
        },
        actions: {
          ActivateIntent: CallbackAction<ActivateIntent>(
            onInvoke: (_) {
              widget.onTap();
              return null;
            },
          ),
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 140),
          decoration: BoxDecoration(
            color: widget.selected
                ? colors.secondaryContainer
                : hovered
                ? colors.surfaceContainerHighest
                : colors.surfaceContainer,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: widget.selected ? colors.primary : colors.outlineVariant,
              width: widget.selected ? 2 : 1,
            ),
          ),
          child: InkWell(
            borderRadius: BorderRadius.circular(8),
            onTap: widget.onTap,
            child: Padding(
              padding: const EdgeInsets.all(8),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: SizedBox(
                      width: 136,
                      child: AspectRatio(
                        aspectRatio: 16 / 9,
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            Image.network(
                              'https://img.youtube.com/vi/${widget.video.videoId}/hqdefault.jpg',
                              fit: BoxFit.cover,
                              semanticLabel:
                                  'Thumbnail for ${widget.video.title}',
                              loadingBuilder: (_, child, progress) =>
                                  progress == null
                                  ? child
                                  : const Center(
                                      child: CircularProgressIndicator(),
                                    ),
                              errorBuilder: (_, _, _) => ColoredBox(
                                color: colors.surfaceContainerHighest,
                                child: const Center(
                                  child: Icon(Icons.video_file_outlined),
                                ),
                              ),
                            ),
                            if (widget.selected)
                              const Center(
                                child: Icon(
                                  Icons.play_circle_fill,
                                  size: 38,
                                  color: Colors.white,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.video.title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontWeight: widget.selected
                                ? FontWeight.bold
                                : FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(widget.video.duration),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
