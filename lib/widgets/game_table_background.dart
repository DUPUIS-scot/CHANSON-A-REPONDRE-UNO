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
      if (stageLayer != null)
        LayoutBuilder(
          builder: (context, constraints) {
            final narrow = constraints.maxWidth < 600;
            final short = constraints.maxHeight < 650;
            final horizontalInset = narrow
                ? 18.0
                : (constraints.maxWidth * 0.10).clamp(56.0, 128.0);
            final bottomInset = short
                ? 138.0
                : narrow
                ? (constraints.maxHeight * 0.27).clamp(150.0, 220.0)
                : (constraints.maxHeight * 0.24).clamp(168.0, 238.0);
            final topInset = narrow ? 8.0 : 14.0;

            return Padding(
              padding: EdgeInsets.fromLTRB(
                horizontalInset,
                topInset,
                horizontalInset,
                bottomInset,
              ),
              child: stageLayer,
            );
          },
        ),
      child,
    ],
  );
}
