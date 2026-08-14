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
          radius: 1.08,
          colors: [Colors.transparent, Color(0xC5000000)],
          stops: [.50, 1],
        ).createShader(full),
    );
  }

  void _paintStageDepth(Canvas canvas, Size size, Rect full) {
    canvas.drawRect(
      full,
      Paint()
        ..shader = const RadialGradient(
          center: Alignment(0, -.18),
          radius: .86,
          colors: [Color(0xFF3E2415), Color(0xFF180B08), Color(0xFF050302)],
          stops: [0, .50, 1],
        ).createShader(full),
    );

    final archPaint = Paint()
      ..color = const Color(0xFF3B2112)
      ..style = PaintingStyle.stroke
      ..strokeWidth = math.max(10, size.width * .014);
    final inner = Rect.fromLTWH(
      size.width * .20,
      size.height * .025,
      size.width * .60,
      size.height * .64,
    );
    canvas.drawArc(inner, math.pi, math.pi, false, archPaint);

    final columnPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.centerLeft,
        end: Alignment.centerRight,
        colors: [Color(0xFF170A06), Color(0xFF69401F), Color(0xFF140805)],
      ).createShader(full);
    final columnWidth = math.max(18.0, size.width * .038);
    for (final x in [size.width * .16, size.width * .84 - columnWidth]) {
      final rect = Rect.fromLTWH(x, size.height * .09, columnWidth, size.height * .56);
      canvas.drawRRect(
        RRect.fromRectAndRadius(rect, const Radius.circular(7)),
        columnPaint,
      );
      canvas.drawRect(
        Rect.fromLTWH(x - 5, size.height * .61, columnWidth + 10, 8),
        Paint()..color = const Color(0xFF855529),
      );
    }
  }

  void _paintCurtain(Canvas canvas, Size size, {required bool left}) {
    final direction = left ? 1.0 : -1.0;
    final outside = left ? 0.0 : size.width;
    final inside = size.width * (left ? .26 : .74);
    final curtain = Path()
      ..moveTo(outside, 0)
      ..lineTo(inside, 0)
      ..cubicTo(
        inside - direction * size.width * .025,
        size.height * .15,
        inside - direction * size.width * .08,
        size.height * .28,
        inside - direction * size.width * .055,
        size.height * .43,
      )
      ..cubicTo(
        inside - direction * size.width * .11,
        size.height * .54,
        outside + direction * size.width * .045,
        size.height * .66,
        outside,
        size.height * .73,
      )
      ..close();
    canvas.drawPath(
      curtain,
      Paint()
        ..shader = LinearGradient(
          begin: left ? Alignment.centerLeft : Alignment.centerRight,
          end: left ? Alignment.centerRight : Alignment.centerLeft,
          colors: const [
            Color(0xFF120104),
            Color(0xFF7B111B),
            Color(0xFF280307),
            Color(0xFF9D2A25),
            Color(0xFF1C0205),
          ],
          stops: const [0, .20, .48, .73, 1],
        ).createShader(curtain.getBounds()),
    );

    final fold = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0x00170204), Color(0xC4B24B35), Color(0x00170204)],
      ).createShader(curtain.getBounds())
      ..style = PaintingStyle.stroke
      ..strokeWidth = math.max(6, size.width * .011)
      ..strokeCap = StrokeCap.round;
    for (var index = 1; index <= 5; index++) {
      final x = outside + direction * size.width * (.014 + index * .034);
      canvas.drawPath(
        Path()
          ..moveTo(x, 0)
          ..cubicTo(
            x + direction * 8,
            size.height * .18,
            x - direction * 10,
            size.height * .39,
            x + direction * 14,
            size.height * .64,
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
      ..color = const Color(0xFFE0AB43)
      ..strokeWidth = 5
      ..strokeCap = StrokeCap.round;
    final tie = Offset(outside + direction * size.width * .13, y + 5);
    canvas.drawLine(Offset(outside, y - 18), tie, rope);
    canvas.drawCircle(tie, 6.5, Paint()..color = const Color(0xFFF4CF67));
    canvas.drawLine(tie, tie + const Offset(0, 46), rope..strokeWidth = 3.2);
    final tassel = Path()
      ..moveTo(tie.dx - 8, tie.dy + 40)
      ..lineTo(tie.dx + 8, tie.dy + 40)
      ..lineTo(tie.dx + 13, tie.dy + 64)
      ..lineTo(tie.dx - 13, tie.dy + 64)
      ..close();
    canvas.drawPath(tassel, Paint()..color = const Color(0xFFC08023));
  }

  void _paintProscenium(Canvas canvas, Size size) {
    final top = math.min(20.0, size.height * .03);
    final rect = Rect.fromLTWH(0, 0, size.width, top);
    canvas.drawRect(
      rect,
      Paint()
        ..shader = const LinearGradient(
          colors: [Color(0xFF0E0503), Color(0xFF563117), Color(0xFF0E0503)],
        ).createShader(rect),
    );
    canvas.drawLine(
      Offset(0, top),
      Offset(size.width, top),
      Paint()
        ..color = const Color(0xFFC18A34)
        ..strokeWidth = 2,
    );
  }

  void _paintSpotlight(Canvas canvas, Size size) {
    final beam = Path()
      ..moveTo(size.width * .475, 0)
      ..lineTo(size.width * .525, 0)
      ..lineTo(size.width * .69, size.height * .68)
      ..lineTo(size.width * .31, size.height * .68)
      ..close();
    canvas.drawPath(
      beam,
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0x86FFD98E), Color(0x34EEBA61), Color(0x00DCA347)],
        ).createShader(beam.getBounds()),
    );
    canvas.drawCircle(
      Offset(size.width * .5, size.height * .034),
      math.max(12, size.width * .018),
      Paint()..color = const Color(0xFFF0C066),
    );
  }

  void _paintFloor(Canvas canvas, Size size) {
    final top = size.height * .64;
    final floorRect = Rect.fromLTWH(0, top, size.width, size.height - top);
    canvas.drawRect(
      floorRect,
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF5A331A), Color(0xFF2A1307), Color(0xFF120704)],
          stops: [0, .55, 1],
        ).createShader(floorRect),
    );

    final grain = Paint()
      ..color = const Color(0x58360E06)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.1;
    for (var y = top + 15; y < size.height; y += 18) {
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
          ..color = const Color(0x4A451C0D)
          ..strokeWidth = 1,
      );
    }

    final carpet = Rect.fromCenter(
      center: Offset(size.width * .5, size.height * .72),
      width: size.width * .46,
      height: size.height * .22,
    );
    canvas.drawOval(
      carpet,
      Paint()
        ..color = const Color(0x5A8F4E18)
        ..style = PaintingStyle.fill,
    );
    canvas.drawOval(
      carpet,
      Paint()
        ..color = const Color(0xB69B7130)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2,
    );
    canvas.drawOval(
      carpet.deflate(10),
      Paint()
        ..color = const Color(0x909B7130)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
