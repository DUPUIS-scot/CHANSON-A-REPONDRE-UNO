import 'package:flutter/material.dart';

const _playStageBackgroundAsset =
    'assets/images/play_stage_background_user.jpg';

class GameTableBackground extends StatelessWidget {
  const GameTableBackground({required this.child, this.stageLayer, super.key});

  final Widget child;
  final Widget? stageLayer;

  @override
  Widget build(BuildContext context) {
    final screenSize = MediaQuery.sizeOf(context);

    return Stack(
      clipBehavior: Clip.none,
      fit: StackFit.expand,
      children: [
        // Paint the supplied Play background at the actual viewport size so
        // the image is not restricted by the desktop game's 1120px table.
        Positioned.fill(
          child: OverflowBox(
            alignment: Alignment.center,
            minWidth: screenSize.width,
            maxWidth: screenSize.width,
            minHeight: screenSize.height,
            maxHeight: screenSize.height,
            child: Image.asset(
              _playStageBackgroundAsset,
              width: screenSize.width,
              height: screenSize.height,
              fit: BoxFit.cover,
              alignment: Alignment.center,
              filterQuality: FilterQuality.high,
              errorBuilder: (context, error, stackTrace) =>
                  const ColoredBox(color: Color(0xFF050302)),
            ),
          ),
        ),

        // Keep the 3D jester behind all interactive game UI.
        if (stageLayer != null)
          Positioned.fill(
            child: IgnorePointer(child: stageLayer!),
          ),

        // Draw piles, player hand and controls stay visually in front.
        child,
      ],
    );
  }
}
