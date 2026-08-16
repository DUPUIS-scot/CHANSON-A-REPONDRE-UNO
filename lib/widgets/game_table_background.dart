import 'package:flutter/material.dart';

const _playStageBackgroundAsset =
    'assets/images/shared_stage_background_user.jpg';

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
          errorBuilder: (context, error, stackTrace) =>
              const ColoredBox(color: Color(0xFF050302)),
        ),
      ),
      if (stageLayer != null)
        LayoutBuilder(
          builder: (context, constraints) {
            final narrow = constraints.maxWidth < 600;
            final short = constraints.maxHeight < 650;
            final horizontalInset = narrow
                ? 8.0
                : (constraints.maxWidth * 0.055).clamp(24.0, 72.0);
            final bottomInset = short
                ? 112.0
                : narrow
                ? (constraints.maxHeight * 0.20).clamp(118.0, 170.0)
                : (constraints.maxHeight * 0.16).clamp(110.0, 160.0);
            final topInset = narrow ? 2.0 : 4.0;

            return Padding(
              padding: EdgeInsets.fromLTRB(
                horizontalInset,
                topInset,
                horizontalInset,
                bottomInset,
              ),
              child: Center(
                child: FittedBox(
                  fit: BoxFit.contain,
                  alignment: Alignment.center,
                  child: SizedBox(
                    width: constraints.maxWidth - (horizontalInset * 2),
                    height: constraints.maxHeight - topInset - bottomInset,
                    child: stageLayer,
                  ),
                ),
              ),
            );
          },
        ),
      child,
    ],
  );
}
