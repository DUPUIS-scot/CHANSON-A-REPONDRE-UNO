import 'package:flutter/material.dart';

class GameTableBackground extends StatelessWidget {
  const GameTableBackground({required this.child, this.stageLayer, super.key});

  final Widget child;
  final Widget? stageLayer;

  @override
  Widget build(BuildContext context) => Stack(
    fit: StackFit.expand,
    children: [
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
          colors: [Color(0x66123B36), Color(0x5508241F), Color(0x4403100F)],
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
          colors: [Color(0xCC6E351A), Color(0xDD3A170C)],
        ).createShader(tableRect),
    );
    canvas.drawRect(
      Rect.fromLTWH(0, tableTop, size.width, 7),
      Paint()..color = const Color(0xDDC07A32),
    );
    canvas.drawRect(
      Rect.fromLTWH(0, tableTop + 7, size.width, 7),
      Paint()..color = const Color(0xDD271008),
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

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
