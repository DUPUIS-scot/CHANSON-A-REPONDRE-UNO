import 'package:flutter/material.dart';

class GameTableBackground extends StatelessWidget {
  const GameTableBackground({
    required this.child,
    this.stageLayer,
    super.key,
  });

  final Widget child;
  final Widget? stageLayer;

  @override
  Widget build(BuildContext context) => Stack(
    fit: StackFit.expand,
    children: [
      const ColoredBox(color: Color(0xFF130D0B)),
      CustomPaint(painter: _TablePainter()),
      ?stageLayer,
      Positioned(
        left: 0,
        top: 0,
        bottom: 0,
        width: 42,
        child: ColoredBox(
          color: const Color(0xFF5A160E).withValues(alpha: .72),
        ),
      ),
      Positioned(
        right: 0,
        top: 0,
        bottom: 0,
        width: 42,
        child: ColoredBox(
          color: const Color(0xFF5A160E).withValues(alpha: .72),
        ),
      ),
      child,
    ],
  );
}

class _TablePainter extends CustomPainter {
  const _TablePainter();
  @override
  void paint(Canvas canvas, Size size) {
    final table = Paint()..color = const Color(0xFF4A2816);
    canvas.drawRect(
      Rect.fromLTWH(0, size.height * .34, size.width, size.height * .66),
      table,
    );
    final grain = Paint()
      ..color = const Color(0x55300F08)
      ..strokeWidth = 2;
    for (var y = size.height * .38; y < size.height; y += 24) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y + 8), grain);
    }
    final glow = Paint()..color = const Color(0x22FFB34A);
    canvas.drawCircle(
      Offset(size.width / 2, size.height * .58),
      size.shortestSide * .34,
      glow,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
