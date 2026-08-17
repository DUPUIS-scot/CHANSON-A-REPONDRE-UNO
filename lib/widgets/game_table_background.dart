import 'package:flutter/material.dart';

// User-supplied high-resolution theatrical Play artwork. Keep this as the
// bottom-most layer and make it cover the complete viewport on every aspect
// ratio.
const _playStageBackgroundAsset =
    'assets/images/play_stage_background_user.jpg';

class GameTableBackground extends StatelessWidget {
  const GameTableBackground({required this.child, this.stageLayer, super.key});

  final Widget child;
  final Widget? stageLayer;

  @override
  Widget build(BuildContext context) => SizedBox.expand(
    child: Stack(
      fit: StackFit.expand,
      clipBehavior: Clip.hardEdge,
      children: [
        Positioned.fill(
          child: Image.asset(
            _playStageBackgroundAsset,
            width: double.infinity,
            height: double.infinity,
            fit: BoxFit.cover,
            alignment: Alignment.center,
            filterQuality: FilterQuality.high,
            errorBuilder: (context, error, stackTrace) =>
                const ColoredBox(color: Color(0xFF050302)),
          ),
        ),
        if (stageLayer != null)
          Positioned.fill(
            child: IgnorePointer(
              child: Center(child: stageLayer!),
            ),
          ),
        // Gameplay UI is always last so cards remain in front of the jester.
        Positioned.fill(child: child),
      ],
    ),
  );
}
