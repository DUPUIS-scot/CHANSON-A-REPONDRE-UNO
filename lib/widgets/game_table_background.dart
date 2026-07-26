import 'package:flutter/material.dart';

class GameTableBackground extends StatelessWidget {
  const GameTableBackground({required this.child, this.stageLayer, super.key});

  final Widget child;
  final Widget? stageLayer;

  @override
  Widget build(BuildContext context) => Stack(
    fit: StackFit.expand,
    children: [
      const ColoredBox(color: Color(0xFF071412)),
      CustomPaint(painter: _TablePainter()),
      ?stageLayer,
      child,
    ],
  );
}

class _TablePainter extends CustomPainter {
  const _TablePainter();
  @override
  void paint(Canvas canvas, Size size) {
    final stageRect = Offset.zero & size;
    canvas.drawRect(
      stageRect,
      Paint()
        ..shader = const RadialGradient(
          center: Alignment(.05, -.2),
          radius: 1.15,
          colors: [Color(0xFF123B36), Color(0xFF08241F), Color(0xFF03100F)],
          stops: [0, .58, 1],
        ).createShader(stageRect),
    );

    final wallpaper = Paint()
      ..color = const Color(0x1518A38E)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    for (var x = -40.0; x < size.width + 40; x += 44) {
      for (var y = 12.0; y < size.height * .54; y += 44) {
        final shift = ((y / 44).round().isEven) ? 0.0 : 22.0;
        canvas.drawCircle(Offset(x + shift, y), 8, wallpaper);
        canvas.drawLine(
          Offset(x + shift - 8, y),
          Offset(x + shift, y + 13),
          wallpaper,
        );
        canvas.drawLine(
          Offset(x + shift + 8, y),
          Offset(x + shift, y + 13),
          wallpaper,
        );
      }
    }

    _paintCurtain(canvas, size, true);
    _paintCurtain(canvas, size, false);

    final tableTop = size.height * .53;
    final tableRect = Rect.fromLTWH(
      0,
      tableTop,
      size.width,
      size.height - tableTop,
    );
    canvas.drawRect(
      tableRect,
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF6E351A), Color(0xFF3A170C)],
        ).createShader(tableRect),
    );
    canvas.drawRect(
      Rect.fromLTWH(0, tableTop, size.width, 7),
      Paint()..color = const Color(0xFFC07A32),
    );
    canvas.drawRect(
      Rect.fromLTWH(0, tableTop + 7, size.width, 7),
      Paint()..color = const Color(0xFF271008),
    );

    final grain = Paint()
      ..color = const Color(0x55300F08)
      ..strokeWidth = 1.4;
    for (var y = tableTop + 20; y < size.height; y += 22) {
      final bend = ((y - tableTop) % 44 == 0) ? 9.0 : -6.0;
      canvas.drawPath(
        Path()
          ..moveTo(0, y)
          ..quadraticBezierTo(size.width * .3, y + bend, size.width * .58, y)
          ..quadraticBezierTo(size.width * .82, y - bend, size.width, y + 4),
        grain,
      );
    }

    canvas.drawRect(
      stageRect,
      Paint()
        ..shader = const RadialGradient(
          radius: .88,
          colors: [Colors.transparent, Color(0xA8000000)],
          stops: [.55, 1],
        ).createShader(stageRect),
    );
  }

  void _paintCurtain(Canvas canvas, Size size, bool left) {
    final side = left ? 1.0 : -1.0;
    final edge = left ? 0.0 : size.width;
    final inner = size.width * (left ? .19 : .81);
    final path = Path()
      ..moveTo(edge, 0)
      ..lineTo(inner, 0)
      ..cubicTo(
        inner - side * size.width * .02,
        size.height * .15,
        inner - side * size.width * .05,
        size.height * .31,
        inner - side * size.width * .035,
        size.height * .47,
      )
      ..cubicTo(
        inner - side * size.width * .07,
        size.height * .52,
        edge + side * size.width * .025,
        size.height * .58,
        edge,
        size.height * .64,
      )
      ..close();
    canvas.drawPath(
      path,
      Paint()
        ..shader = const LinearGradient(
          colors: [
            Color(0xFF280408),
            Color(0xFF741619),
            Color(0xFF3A080D),
            Color(0xFF8B211E),
            Color(0xFF210307),
          ],
        ).createShader(path.getBounds()),
    );
    final fold = Paint()
      ..color = const Color(0x887E241F)
      ..strokeWidth = size.width * .012
      ..strokeCap = StrokeCap.round;
    for (var i = 1; i <= 4; i++) {
      final x = edge + side * size.width * (.025 + i * .027);
      canvas.drawLine(
        Offset(x, 0),
        Offset(x + side * 15, size.height * .48),
        fold,
      );
    }
    final ropeY = size.height * .37;
    canvas.drawLine(
      Offset(edge, ropeY - 12),
      Offset(edge + side * size.width * .13, ropeY + 8),
      Paint()
        ..color = const Color(0xFFD79A2A)
        ..strokeWidth = 5,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
