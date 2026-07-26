import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

class HomeBackgroundVideo extends StatelessWidget {
  const HomeBackgroundVideo({
    required this.controller,
    required this.ready,
    super.key,
  });

  final VideoPlayerController controller;
  final bool ready;

  @override
  Widget build(BuildContext context) {
    if (!ready || !controller.value.isInitialized) {
      return const ColoredBox(color: Color(0xFF090503));
    }
    final size = controller.value.size;
    final width = size.width > 0 ? size.width : 16.0;
    final height = size.height > 0 ? size.height : 9.0;
    return ClipRect(
      child: FittedBox(
        fit: BoxFit.cover,
        alignment: Alignment.center,
        child: SizedBox(
          width: width,
          height: height,
          child: VideoPlayer(controller),
        ),
      ),
    );
  }
}
