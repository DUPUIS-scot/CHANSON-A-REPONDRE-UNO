import 'package:flutter/material.dart';

// Use the real high-resolution Play artwork. The previous
// play_stage_background_user.jpg is only a tiny placeholder and rendered as
// an effectively black stage on deployed web builds.
const _playStageBackgroundAsset = 'assets/images/background.png';

class GameTableBackground extends StatelessWidget {
  const GameTableBackground({required this.child, this.stageLayer, super.key});

  final Widget child;
  final Widget? stageLayer;

  @override
  Widget build(BuildContext context) => Stack(
    fit: StackFit.expand,
    children: [
      Positioned.fill(
        child: Image.asset(
          _playStageBackgroundAsset,
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
            child: FractionalTranslation(
              translation: const Offset(0, -0.10),
              child: stageLayer!,
            ),
          ),
        ),
      // Gameplay UI is deliberately last: the 3D jester remains centred
      // behind the player's cards instead of covering them.
      child,
    ],
  );
}
