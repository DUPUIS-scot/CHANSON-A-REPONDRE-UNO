import 'package:flutter/material.dart';

// High-resolution Play artwork. Keep this as the bottom-most layer and make
// it cover the complete viewport on every aspect ratio.
const _playStageBackgroundAsset = 'assets/images/background.png';

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
          // Keep the 3D dealer centred and behind the playable hand. Do not
          // translate the WebGL layer: its own camera/model transform controls
          // framing and orientation, while this layer owns only z-order.
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
