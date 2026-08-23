import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/app_router.dart';
import '../providers/dj_who_player_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/dj_who_enochian_terminal.dart';

class EnochianTerminalScreen extends StatefulWidget {
  const EnochianTerminalScreen({super.key});

  @override
  State<EnochianTerminalScreen> createState() => _EnochianTerminalScreenState();
}

class _EnochianTerminalScreenState extends State<EnochianTerminalScreen>
    with SingleTickerProviderStateMixin {
  static const _names = <String>[
    'UN', 'PA', 'VEH', 'GAL', 'GRAPH', 'OR', 'NA', 'GON', 'UR', 'TAL',
    'GISA', 'FAM', 'GED', 'DON', 'MED', 'MALS', 'GER', 'DRUX', 'PAL',
    'CEPH', 'VAN',
  ];

  late final AnimationController _rotation;
  Timer? _clock;
  bool _bootstrapped = false;
  double _seconds = 0;
  double _speed = 1;
  final _english = TextEditingController(text: 'HELLO WORLD');
  final _enochian = TextEditingController();

  @override
  void initState() {
    super.initState();
    _rotation = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 12),
    )..repeat();
    _enochian.text = _encode(_english.text);
    _clock = Timer.periodic(const Duration(milliseconds: 200), (_) => _tick());
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_bootstrapped) return;
    _bootstrapped = true;
    unawaited(context.read<DjWhoPlayerProvider>().ensureAudioController());
  }

  Future<void> _tick() async {
    if (!mounted) return;
    final player = context.read<DjWhoPlayerProvider>();
    final controller = player.controller;
    double? next;
    if (controller != null) {
      try {
        next = await controller.currentTime;
      } catch (_) {}
    }
    if (!mounted) return;
    setState(() {
      _seconds = next ?? (_seconds + .2 * _speed);
    });
  }

  String _encode(String input) {
    final words = <String>[];
    for (final rune in input.toUpperCase().runes) {
      final c = String.fromCharCode(rune);
      final code = c.codeUnitAt(0);
      if (code >= 65 && code <= 90) {
        words.add(_names[(code - 65) % _names.length]);
      } else if (c == ' ') {
        words.add('/');
      }
    }
    return words.join(' ');
  }

  String _backgroundLog(DjWhoPlayerProvider player) {
    final seed = (_seconds * 8).floor() + player.selectedIndex * 17;
    final entries = <String>[];
    for (var row = 0; row < 18; row++) {
      final a = _names[(seed + row * 3) % _names.length];
      final b = _names[(seed + row * 5 + 7) % _names.length];
      final c = _names[(seed + row * 7 + 11) % _names.length];
      final d = _names[(seed + row * 11 + 13) % _names.length];
      entries.add('$a  $b  $c  $d');
    }
    return entries.join('\n');
  }

  String _time(double seconds) {
    final total = seconds.floor();
    final m = total ~/ 60;
    final s = total % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  void dispose() {
    _clock?.cancel();
    _rotation.dispose();
    _english.dispose();
    _enochian.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF030605),
      body: SafeArea(
        child: Consumer<DjWhoPlayerProvider>(
          builder: (context, player, _) {
            return LayoutBuilder(
              builder: (context, constraints) {
                final compact = constraints.maxWidth < 760 || constraints.maxHeight < 690;
                final platterSize = compact
                    ? math.min(constraints.maxWidth * .48, constraints.maxHeight * .34)
                    : math.min(constraints.maxWidth * .36, constraints.maxHeight * .46);

                return Stack(
                  fit: StackFit.expand,
                  children: [
                    Positioned.fill(
                      child: CustomPaint(
                        painter: _SignalBackdropPainter(_seconds),
                      ),
                    ),
                    Positioned.fill(
                      child: IgnorePointer(
                        child: Opacity(
                          opacity: .10,
                          child: Padding(
                            padding: const EdgeInsets.all(20),
                            child: FittedBox(
                              fit: BoxFit.cover,
                              alignment: Alignment.center,
                              child: SizedBox(
                                width: 780,
                                child: DjWhoEnochianTerminal(player: player),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    Positioned.fill(
                      child: IgnorePointer(
                        child: _ScrollingEnochianBackground(
                          text: _backgroundLog(player),
                          phase: _seconds,
                        ),
                      ),
                    ),
                    Positioned(
                      left: 8,
                      top: 6,
                      child: IconButton(
                        tooltip: 'Home',
                        onPressed: () => context.go(AppRoutes.home),
                        icon: const Icon(
                          Icons.home_rounded,
                          color: AppTheme.brightGold,
                        ),
                      ),
                    ),
                    Positioned(
                      left: 60,
                      right: 60,
                      top: 14,
                      child: const Text(
                        'ENOCHIAN TERMINAL',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Color(0xFF9CE9DD),
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.w800,
                          letterSpacing: 4,
                          fontSize: 16,
                        ),
                      ),
                    ),
                    Positioned(
                      left: 12,
                      right: 12,
                      top: 54,
                      child: _trackBar(player),
                    ),
                    Align(
                      alignment: compact ? const Alignment(0, -.07) : const Alignment(0, -.02),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            player.selectedVideo?.title.toUpperCase() ?? 'DJ WHO',
                            style: const TextStyle(
                              color: AppTheme.brightGold,
                              fontFamily: 'monospace',
                              letterSpacing: 2.5,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 8),
                          SizedBox(
                            width: platterSize,
                            height: platterSize,
                            child: AnimatedBuilder(
                              animation: _rotation,
                              builder: (context, child) => Transform.rotate(
                                angle: _rotation.value * math.pi * 2 * _speed,
                                child: child,
                              ),
                              child: CustomPaint(
                                painter: const _EnochianPlatterPainter(),
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),
                          _transport(player),
                        ],
                      ),
                    ),
                    Positioned(
                      left: 12,
                      right: 12,
                      bottom: 12,
                      child: _translationPanel(compact),
                    ),
                  ],
                );
              },
            );
          },
        ),
      ),
    );
  }

  Widget _trackBar(DjWhoPlayerProvider player) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
    decoration: BoxDecoration(
      color: Colors.black.withValues(alpha: .62),
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: const Color(0xFF315C55)),
    ),
    child: Row(
      children: [
        const Text('SOURCE', style: _micro),
        const SizedBox(width: 10),
        Expanded(
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: List.generate(player.videos.length, (index) {
                final selected = index == player.selectedIndex;
                return Padding(
                  padding: const EdgeInsets.only(right: 7),
                  child: ChoiceChip(
                    label: Text(player.videos[index].title),
                    selected: selected,
                    visualDensity: VisualDensity.compact,
                    onSelected: (_) => unawaited(player.selectVideo(index)),
                  ),
                );
              }),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(_time(_seconds), style: _micro),
      ],
    ),
  );

  Widget _transport(DjWhoPlayerProvider player) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
    decoration: BoxDecoration(
      color: Colors.black.withValues(alpha: .76),
      borderRadius: BorderRadius.circular(28),
      border: Border.all(color: const Color(0xFF315C55)),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          tooltip: 'Previous',
          onPressed: () => unawaited(player.previous()),
          icon: const Icon(Icons.skip_previous_rounded),
        ),
        IconButton.filled(
          tooltip: player.isPlaying ? 'Pause' : 'Play audio',
          onPressed: () => unawaited(player.togglePlayback()),
          icon: Icon(
            player.isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
          ),
        ),
        IconButton(
          tooltip: 'Next',
          onPressed: () => unawaited(player.next()),
          icon: const Icon(Icons.skip_next_rounded),
        ),
        const SizedBox(width: 6),
        PopupMenuButton<double>(
          tooltip: 'Visual speed',
          initialValue: _speed,
          onSelected: (value) => setState(() => _speed = value),
          itemBuilder: (_) => const [
            PopupMenuItem(value: .5, child: Text('0.5×')),
            PopupMenuItem(value: 1, child: Text('1×')),
            PopupMenuItem(value: 2, child: Text('2×')),
          ],
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Text('$_speed×', style: _micro),
          ),
        ),
      ],
    ),
  );

  Widget _translationPanel(bool compact) => Container(
    padding: const EdgeInsets.all(10),
    decoration: BoxDecoration(
      color: Colors.black.withValues(alpha: .82),
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: const Color(0xFF315C55)),
      boxShadow: const [BoxShadow(color: Colors.black54, blurRadius: 20)],
    ),
    child: compact
        ? Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _translatorField(),
              const SizedBox(height: 6),
              _translatorOutput(),
            ],
          )
        : Row(
            children: [
              Expanded(child: _translatorField()),
              const SizedBox(width: 10),
              Expanded(child: _translatorOutput()),
            ],
          ),
  );

  Widget _translatorField() => TextField(
    controller: _english,
    onChanged: (value) {
      setState(() {
        _enochian.text = _encode(value);
      });
    },
    style: const TextStyle(
      color: Colors.white,
      fontFamily: 'monospace',
      fontSize: 13,
    ),
    decoration: InputDecoration(
      isDense: true,
      labelText: 'TRANSLATE TO ENOCHIAN',
      suffixIcon: IconButton(
        tooltip: 'Clear',
        onPressed: () {
          setState(() {
            _english.clear();
            _enochian.clear();
          });
        },
        icon: const Icon(Icons.clear_rounded),
      ),
      border: const OutlineInputBorder(),
    ),
  );

  Widget _translatorOutput() => InkWell(
    onTap: () => Clipboard.setData(ClipboardData(text: _enochian.text)),
    borderRadius: BorderRadius.circular(8),
    child: Container(
      constraints: const BoxConstraints(minHeight: 48),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF06110F),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFF1E665A)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              _enochian.text.isEmpty ? 'ENOCHIAN OUTPUT' : _enochian.text,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Color(0xFF89E6D8),
                fontFamily: 'monospace',
                fontWeight: FontWeight.w700,
                letterSpacing: 1.4,
                fontSize: 12,
              ),
            ),
          ),
          const Icon(Icons.copy_rounded, size: 16, color: Color(0xFF89E6D8)),
        ],
      ),
    ),
  );

  static const _micro = TextStyle(
    color: Color(0xFF7EB8AE),
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: FontWeight.w700,
    letterSpacing: 1.5,
  );
}

class _ScrollingEnochianBackground extends StatelessWidget {
  const _ScrollingEnochianBackground({
    required this.text,
    required this.phase,
  });

  final String text;
  final double phase;

  @override
  Widget build(BuildContext context) {
    final offset = (phase * 18) % 240;
    return ClipRect(
      child: Transform.translate(
        offset: Offset(0, offset - 120),
        child: Center(
          child: Text(
            '$text\n$text',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: const Color(0xFF6CE0CE).withValues(alpha: .13),
              fontFamily: 'monospace',
              fontSize: 22,
              height: 1.7,
              letterSpacing: 5,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ),
    );
  }
}

class _SignalBackdropPainter extends CustomPainter {
  const _SignalBackdropPainter(this.t);

  final double t;

  @override
  void paint(Canvas canvas, Size size) {
    final grid = Paint()
      ..color = const Color(0xFF0C2A25)
      ..strokeWidth = 1;
    for (var i = 1; i < 12; i++) {
      final x = size.width * i / 12;
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), grid);
    }
    for (var i = 1; i < 8; i++) {
      final y = size.height * i / 8;
      canvas.drawLine(Offset(0, y), Offset(size.width, y), grid);
    }

    final paint = Paint()
      ..color = const Color(0xFF3BD7BE).withValues(alpha: .42)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    for (var band = 0; band < 4; band++) {
      final path = Path();
      for (var x = 0.0; x <= size.width; x += 4) {
        final y = size.height * (.26 + band * .16) +
            math.sin(x * (.025 + band * .006) + t * (2.4 + band * .8)) *
                (10 + band * 4) +
            math.sin(x * .11 - t * (4.3 + band)) * 4;
        if (x == 0) {
          path.moveTo(x, y);
        } else {
          path.lineTo(x, y);
        }
      }
      canvas.drawPath(path, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _SignalBackdropPainter oldDelegate) => oldDelegate.t != t;
}

class _EnochianPlatterPainter extends CustomPainter {
  const _EnochianPlatterPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final c = Offset(size.width / 2, size.height / 2);
    final r = math.min(size.width, size.height) / 2 - 6;
    canvas.drawCircle(c, r, Paint()..color = const Color(0xFF050707));
    for (final factor in [.96, .84, .72, .60, .48, .34]) {
      canvas.drawCircle(
        c,
        r * factor,
        Paint()
          ..color = const Color(0xFF315C55)
          ..style = PaintingStyle.stroke
          ..strokeWidth = factor == .96 ? 3 : 1,
      );
    }
    final gold = Paint()
      ..color = const Color(0xFFD5A94B)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    canvas.drawCircle(c, r * .78, gold);

    const glyphs = 'UNPAVEHGALGRAPHORNAGONURTALGISAFAMGEDDONMEDMALSGERDRUXPALCEPHVAN';
    final textPainter = TextPainter(textDirection: TextDirection.ltr);
    for (var i = 0; i < 21; i++) {
      final angle = (math.pi * 2 * i / 21) - math.pi / 2;
      final pos = Offset(
        c.dx + math.cos(angle) * r * .70,
        c.dy + math.sin(angle) * r * .70,
      );
      final label = glyphs.substring(i * 2, math.min(i * 2 + 2, glyphs.length));
      textPainter.text = TextSpan(
        text: label,
        style: const TextStyle(
          color: Color(0xFFD7B15B),
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      );
      textPainter.layout();
      canvas.save();
      canvas.translate(pos.dx, pos.dy);
      canvas.rotate(angle + math.pi / 2);
      textPainter.paint(
        canvas,
        Offset(-textPainter.width / 2, -textPainter.height / 2),
      );
      canvas.restore();
    }

    final cyan = Paint()
      ..color = const Color(0xFF55E6CD)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    final star = Path();
    for (var i = 0; i < 14; i++) {
      final angle = -math.pi / 2 + i * math.pi / 7;
      final rr = i.isEven ? r * .20 : r * .09;
      final p = Offset(
        c.dx + math.cos(angle) * rr,
        c.dy + math.sin(angle) * rr,
      );
      if (i == 0) {
        star.moveTo(p.dx, p.dy);
      } else {
        star.lineTo(p.dx, p.dy);
      }
    }
    star.close();
    canvas.drawPath(star, cyan);
    canvas.drawCircle(c, 4, Paint()..color = const Color(0xFF55E6CD));
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
