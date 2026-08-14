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
      const ColoredBox(color: Color(0xFF050302)),
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
    _paintStageDepth(canvas, size, full);
    _paintCurtain(canvas, size, left: true);
    _paintCurtain(canvas, size, left: false);
    _paintProscenium(canvas, size);
    _paintSpotlight(canvas, size);
    _paintFloor(canvas, size);
    canvas.drawRect(
      full,
      Paint()
        ..shader = const RadialGradient(
          center: Alignment(0, -.08),
          radius: 1.12,
          colors: [Colors.transparent, Color(0xB8000000)],
          stops: [.52, 1],
        ).createShader(full),
    );
  }

  void _paintStageDepth(Canvas canvas, Size size, Rect full) {
    canvas.drawRect(
      full,
      Paint()
        ..shader = const RadialGradient(
          center: Alignment(0, -.22),
          radius: .88,
          colors: [Color(0xFF392114), Color(0xFF170B08), Color(0xFF050302)],
          stops: [0, .53, 1],
        ).createShader(full),
    );

    final archPaint = Paint()
      ..color = const Color(0xFF2E170D)
      ..style = PaintingStyle.stroke
      ..strokeWidth = math.max(8, size.width * .012);
    final inner = Rect.fromLTWH(
      size.width * .22,
      size.height * .04,
      size.width * .56,
      size.height * .62,
    );
    canvas.drawArc(inner, math.pi, math.pi, false, archPaint);

    final columnPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.centerLeft,
        end: Alignment.centerRight,
        colors: [Color(0xFF170A06), Color(0xFF5D321A), Color(0xFF130805)],
      ).createShader(full);
    final columnWidth = math.max(18.0, size.width * .035);
    for (final x in [size.width * .18, size.width * .82 - columnWidth]) {
      final rect = Rect.fromLTWH(x, size.height * .11, columnWidth, size.height * .55);
      canvas.drawRRect(
        RRect.fromRectAndRadius(rect, const Radius.circular(6)),
        columnPaint,
      );
      canvas.drawRect(
        Rect.fromLTWH(x - 5, size.height * .62, columnWidth + 10, 8),
        Paint()..color = const Color(0xFF7A4A25),
      );
    }
  }

  void _paintCurtain(Canvas canvas, Size size, {required bool left}) {
    final direction = left ? 1.0 : -1.0;
    final outside = left ? 0.0 : size.width;
    final inside = size.width * (left ? .24 : .76);
    final curtain = Path()
      ..moveTo(outside, 0)
      ..lineTo(inside, 0)
      ..cubicTo(
        inside - direction * size.width * .02,
        size.height * .15,
        inside - direction * size.width * .075,
        size.height * .28,
        inside - direction * size.width * .05,
        size.height * .43,
      )
      ..cubicTo(
        inside - direction * size.width * .10,
        size.height * .54,
        outside + direction * size.width * .04,
        size.height * .63,
        outside,
        size.height * .69,
      )
      ..close();
    canvas.drawPath(
      curtain,
      Paint()
        ..shader = LinearGradient(
          begin: left ? Alignment.centerLeft : Alignment.centerRight,
          end: left ? Alignment.centerRight : Alignment.centerLeft,
          colors: const [
            Color(0xFF160104),
            Color(0xFF6E1018),
            Color(0xFF240307),
            Color(0xFF8D211E),
            Color(0xFF220307),
          ],
          stops: const [0, .2, .47, .72, 1],
        ).createShader(curtain.getBounds()),
    );

    final fold = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0x00170204), Color(0xB9A3382A), Color(0x00170204)],
      ).createShader(curtain.getBounds())
      ..style = PaintingStyle.stroke
      ..strokeWidth = math.max(5, size.width * .01)
      ..strokeCap = StrokeCap.round;
    for (var index = 1; index <= 5; index++) {
      final x = outside + direction * size.width * (.014 + index * .032);
      canvas.drawPath(
        Path()
          ..moveTo(x, 0)
          ..cubicTo(
            x + direction * 8,
            size.height * .18,
            x - direction * 9,
            size.height * .38,
            x + direction * 13,
            size.height * .61,
          ),
        fold,
      );
    }
    _paintRope(canvas, size, left: left);
  }

  void _paintRope(Canvas canvas, Size size, {required bool left}) {
    final direction = left ? 1.0 : -1.0;
    final outside = left ? 0.0 : size.width;
    final y = size.height * .43;
    final rope = Paint()
      ..color = const Color(0xFFD6A23A)
      ..strokeWidth = 5
      ..strokeCap = StrokeCap.round;
    final tie = Offset(outside + direction * size.width * .13, y + 5);
    canvas.drawLine(Offset(outside, y - 17), tie, rope);
    canvas.drawCircle(tie, 6.5, Paint()..color = const Color(0xFFF2C95B));
    canvas.drawLine(tie, tie + const Offset(0, 42), rope..strokeWidth = 3.2);
    final tassel = Path()
      ..moveTo(tie.dx - 8, tie.dy + 36)
      ..lineTo(tie.dx + 8, tie.dy + 36)
      ..lineTo(tie.dx + 12, tie.dy + 59)
      ..lineTo(tie.dx - 12, tie.dy + 59)
      ..close();
    canvas.drawPath(tassel, Paint()..color = const Color(0xFFB7791F));
  }

  void _paintProscenium(Canvas canvas, Size size) {
    final top = math.min(20.0, size.height * .032);
    final rect = Rect.fromLTWH(0, 0, size.width, top);
    canvas.drawRect(
      rect,
      Paint()
        ..shader = const LinearGradient(
          colors: [Color(0xFF100604), Color(0xFF4C2813), Color(0xFF100604)],
        ).createShader(rect),
    );
    canvas.drawLine(
      Offset(0, top),
      Offset(size.width, top),
      Paint()
        ..color = const Color(0xFFB9832F)
        ..strokeWidth = 2,
    );
  }

  void _paintSpotlight(Canvas canvas, Size size) {
    final beam = Path()
      ..moveTo(size.width * .48, 0)
      ..lineTo(size.width * .52, 0)
      ..lineTo(size.width * .67, size.height * .66)
      ..lineTo(size.width * .33, size.height * .66)
      ..close();
    canvas.drawPath(
      beam,
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0x72FFD88A), Color(0x2EEDB65A), Color(0x00DCA347)],
        ).createShader(beam.getBounds()),
    );
    canvas.drawCircle(
      Offset(size.width * .5, size.height * .035),
      math.max(12, size.width * .018),
      Paint()..color = const Color(0xFFE8B85D),
    );
  }

  void _paintFloor(Canvas canvas, Size size) {
    final top = size.height * .63;
    final floorRect = Rect.fromLTWH(0, top, size.width, size.height - top);
    canvas.drawRect(
      floorRect,
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF4D2A16), Color(0xFF261106), Color(0xFF120704)],
          stops: [0, .55, 1],
        ).createShader(floorRect),
    );

    final grain = Paint()
      ..color = const Color(0x50300C05)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.1;
    for (var y = top + 16; y < size.height; y += 18) {
      final bend = ((y / 18).round().isEven) ? 7.0 : -5.0;
      canvas.drawPath(
        Path()
          ..moveTo(-20, y)
          ..quadraticBezierTo(size.width * .28, y + bend, size.width * .55, y)
          ..quadraticBezierTo(size.width * .8, y - bend, size.width + 20, y + 3),
        grain,
      );
    }

    for (var x = 0.0; x <= size.width; x += math.max(48, size.width * .07)) {
      canvas.drawLine(
        Offset(size.width * .5, top),
        Offset(x, size.height),
        Paint()
          ..color = const Color(0x423B180B)
          ..strokeWidth = 1,
      );
    }

    final carpet = Rect.fromCenter(
      center: Offset(size.width * .5, size.height * .70),
      width: size.width * .42,
      height: size.height * .20,
    );
    canvas.drawOval(
      carpet,
      Paint()
        ..color = const Color(0x4D9C5A20)
        ..style = PaintingStyle.fill,
    );
    canvas.drawOval(
      carpet,
      Paint()
        ..color = const Color(0xAA8D6327)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2,
    );
    canvas.drawOval(
      carpet.deflate(10),
      Paint()
        ..color = const Color(0x888D6327)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
