import 'package:flutter/material.dart';

const _playStageBackgroundAsset = 'assets/images/play_stage_background.jpg';

class GameTableBackground extends StatelessWidget {
  const GameTableBackground({required this.child, this.stageLayer, super.key});

  final Widget child;
  final Widget? stageLayer;

  @override
  Widget build(BuildContext context) => Stack(
    fit: StackFit.expand,
    children: [
      const ColoredBox(color: Color(0xFF050302)),
      Positioned.fill(
        child: Image.asset(
          _playStageBackgroundAsset,
          fit: BoxFit.cover,
          alignment: Alignment.center,
          filterQuality: FilterQuality.high,
        ),
      ),
      ?stageLayer,
      child,
    ],
  );
}
