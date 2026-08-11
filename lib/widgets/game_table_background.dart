import 'dart:math' as math;

import 'package:flutter/material.dart';

class GameTableBackground extends StatelessWidget {
  const GameTableBackground({required this.child, this.stageLayer, super.key});

  final Widget child;
  final Widget? stageLayer;

  @override
  Widget build(BuildContext context) => Stack(
    fit: StackFit.expand,
    children: [
      const ColoredBox(color: Color(0xFF050907)),
      const RepaintBoundary(child: CustomPaint(painter: _TablePainter())),
      ?stageLayer,
      child,
    ],
  );
}

class _TablePainter extends CustomPainter {
  const _TablePainter();

  @override
  void paint(Canvas canvas, Size size) {
    final full = Offset.zero & size;
    _paintWall(canvas, size, full);
    _paintCurtain(canvas, size, left: true);
    _paintCurtain(canvas, size, left: false);
    _paintPelmet(canvas, size);
    _paintTable(canvas, size);
    canvas.drawRect(
      full,
      Paint()
        ..shader = const RadialGradient(
          center: Alignment(0, -.12),
          radius: 1.04,
          colors: [Colors.transparent, Color(0xB5000000)],
          stops: [.48, 1],
        ).createShader(full),
    );
  }

  void _paintWall(Canvas canvas, Size size, Rect full) {
    canvas.drawRect(
      full,
      Paint()
        ..shader = const RadialGradient(
          center: Alignment(0, -.28),
          radius: .9,
          colors: [Color(0xFF17463F), Color(0xFF092820), Color(0xFF03100E)],
          stops: [0, .56, 1],
        ).createShader(full),
    );
    final pattern = Paint()
      ..color = const Color(0x244F967A)
      ..style = PaintingStyle.stroke
      ..strokeWidth = .8;
    for (var y = 22.0; y < size.height * .56; y += 38) {
      final row = (y / 38).round();
      for (var x = -20.0; x < size.width + 20; x += 38) {
        final center = Offset(x + (row.isOdd ? 19 : 0), y);
        final diamond = Path()
          ..moveTo(center.dx, center.dy - 7)
          ..lineTo(center.dx + 7, center.dy)
          ..lineTo(center.dx, center.dy + 7)
          ..lineTo(center.dx - 7, center.dy)
          ..close();
        canvas.drawPath(diamond, pattern);
        canvas.drawCircle(center, 1.8, pattern);
      }
    }
  }

  void _paintCurtain(Canvas canvas, Size size, {required bool left}) {
    final direction = left ? 1.0 : -1.0;
    final outside = left ? 0.0 : size.width;
    final inside = size.width * (left ? .22 : .78);
    final curtain = Path()
      ..moveTo(outside, 0)
      ..lineTo(inside, 0)
      ..cubicTo(
        inside - direction * size.width * .018,
        size.height * .16,
        inside - direction * size.width * .065,
        size.height * .29,
        inside - direction * size.width * .045,
        size.height * .43,
      )
      ..cubicTo(
        inside - direction * size.width * .09,
        size.height * .49,
        outside + direction * size.width * .035,
        size.height * .57,
        outside,
        size.height * .66,
      )
      ..close();
    canvas.drawPath(
      curtain,
      Paint()
        ..shader = LinearGradient(
          begin: left ? Alignment.centerLeft : Alignment.centerRight,
          end: left ? Alignment.centerRight : Alignment.centerLeft,
          colors: const [
            Color(0xFF170205),
            Color(0xFF671118),
            Color(0xFF260408),
            Color(0xFF8A211E),
            Color(0xFF270407),
          ],
          stops: const [0, .22, .48, .72, 1],
        ).createShader(curtain.getBounds()),
    );
    final highlight = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0x007B211D), Color(0xAA9D3327), Color(0x001C0205)],
      ).createShader(curtain.getBounds())
      ..style = PaintingStyle.stroke
      ..strokeWidth = math.max(5, size.width * .011)
      ..strokeCap = StrokeCap.round;
    for (var index = 1; index <= 5; index++) {
      final x = outside + direction * size.width * (.012 + index * .031);
      canvas.drawPath(
        Path()
          ..moveTo(x, 0)
          ..cubicTo(
            x + direction * 9,
            size.height * .18,
            x - direction * 7,
            size.height * .35,
            x + direction * 13,
            size.height * .53,
          ),
        highlight,
      );
    }
    _paintRope(canvas, size, left: left);
  }

  void _paintRope(Canvas canvas, Size size, {required bool left}) {
    final direction = left ? 1.0 : -1.0;
    final outside = left ? 0.0 : size.width;
    final y = size.height * .37;
    final rope = Paint()
      ..color = const Color(0xFFD39A32)
      ..strokeWidth = 5
      ..strokeCap = StrokeCap.round;
    final tie = Offset(outside + direction * size.width * .13, y + 7);
    canvas.drawLine(Offset(outside, y - 16), tie, rope);
    canvas.drawCircle(tie, 6, Paint()..color = const Color(0xFFF1C55A));
    canvas.drawLine(tie, tie + const Offset(0, 36), rope..strokeWidth = 3);
    final tassel = Path()
      ..moveTo(tie.dx - 7, tie.dy + 31)
      ..lineTo(tie.dx + 7, tie.dy + 31)
      ..lineTo(tie.dx + 11, tie.dy + 50)
      ..lineTo(tie.dx - 11, tie.dy + 50)
      ..close();
    canvas.drawPath(tassel, Paint()..color = const Color(0xFFB9751E));
  }

  void _paintPelmet(Canvas canvas, Size size) {
    final height = math.min(24.0, size.height * .038);
    final rect = Rect.fromLTWH(0, 0, size.width, height);
    canvas.drawRect(
      rect,
      Paint()
        ..shader = const LinearGradient(
          colors: [Color(0xFF160A06), Color(0xFF4A1E0E), Color(0xFF160A06)],
        ).createShader(rect),
    );
    canvas.drawLine(
      Offset(0, height),
      Offset(size.width, height),
      Paint()
        ..color = const Color(0xFFB77B28)
        ..strokeWidth = 2,
    );
  }

  void _paintTable(Canvas canvas, Size size) {
    final top = size.height * .52;
    final tablePath = Path()
      ..moveTo(-size.width * .04, top + 28)
      ..quadraticBezierTo(
        size.width * .5,
        top - 28,
        size.width * 1.04,
        top + 28,
      )
      ..lineTo(size.width * 1.08, size.height * 1.04)
      ..lineTo(-size.width * .08, size.height * 1.04)
      ..close();
    final bounds = tablePath.getBounds();
    canvas.drawPath(
      tablePath.shift(const Offset(0, 12)),
      Paint()
        ..color = const Color(0xDD000000)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 16),
    );
    canvas.drawPath(
      tablePath,
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF6B351A), Color(0xFF3B180C), Color(0xFF1C0B06)],
          stops: [0, .48, 1],
        ).createShader(bounds),
    );
    final rim = Path()
      ..moveTo(-size.width * .02, top + 34)
      ..quadraticBezierTo(
        size.width * .5,
        top - 12,
        size.width * 1.02,
        top + 34,
      );
    canvas.drawPath(
      rim,
      Paint()
        ..color = const Color(0xFFD09A43)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3,
    );
    canvas.drawPath(
      rim.shift(const Offset(0, 7)),
      Paint()
        ..color = const Color(0xFF241008)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 6,
    );
    final grain = Paint()
      ..color = const Color(0x50300C05)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;
    for (var y = top + 40; y < size.height; y += 18) {
      final bend = ((y / 18).round().isEven) ? 8.0 : -6.0;
      canvas.drawPath(
        Path()
          ..moveTo(-20, y)
          ..quadraticBezierTo(size.width * .28, y + bend, size.width * .55, y)
          ..quadraticBezierTo(
            size.width * .8,
            y - bend,
            size.width + 20,
            y + 3,
          ),
        grain,
      );
    }
    final inner = RRect.fromRectAndRadius(
      Rect.fromLTRB(
        size.width * .045,
        top + 45,
        size.width * .955,
        size.height * .965,
      ),
      const Radius.circular(44),
    );
    canvas.drawRRect(
      inner,
      Paint()
        ..color = const Color(0x667A4B22)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2,
    );
    canvas.drawRRect(
      inner.deflate(8),
      Paint()
        ..color = const Color(0x558D6327)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
