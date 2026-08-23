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
  late final AnimationController _rotation;
  Timer? _clock;
  double _seconds = 0;
  double _pitch = 0;
  double _speed = 1;
  bool _sync = true;
  bool _scratch = true;
  final _english = TextEditingController(text: 'HELLO WORLD');
  final _enochian = TextEditingController();

  static const _glyphs = <String>[
    'ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚹ','ᚺ','ᚾ','ᛁ','ᛃ','ᛇ','ᛈ','ᛉ','ᛋ','ᛏ','ᛒ','ᛖ','ᛗ','ᛚ','ᛜ','ᛞ','ᛟ','ᚪ','ᚫ',
  ];

  @override
  void initState() {
    super.initState();
    _rotation = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 12),
    )..repeat();
    _enochian.text = _encode(_english.text);
    _clock = Timer.periodic(const Duration(milliseconds: 250), (_) => _tick());
  }

  Future<void> _tick() async {
    if (!mounted) return;
    final player = context.read<DjWhoPlayerProvider>();
    final controller = player.controller;
    double? next;
    if (_sync && controller != null && player.isPlaying) {
      try {
        next = await controller.currentTime;
      } catch (_) {}
    }
    if (!mounted) return;
    setState(() {
      _seconds = next ?? (_seconds + .25 * _speed);
    });
  }

  String _encode(String input) {
    final buffer = StringBuffer();
    for (final rune in input.toUpperCase().runes) {
      final c = String.fromCharCode(rune);
      if (c.codeUnitAt(0) >= 65 && c.codeUnitAt(0) <= 90) {
        buffer.write(_glyphs[c.codeUnitAt(0) - 65]);
      } else {
        buffer.write(c);
      }
    }
    return buffer.toString();
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
      backgroundColor: const Color(0xFF050807),
      body: SafeArea(
        child: Consumer<DjWhoPlayerProvider>(
          builder: (context, player, _) {
            final video = player.selectedVideo;
            return SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 32),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 1180),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _topBar(context),
                      const SizedBox(height: 14),
                      LayoutBuilder(
                        builder: (context, constraints) {
                          final desktop = constraints.maxWidth >= 900;
                          if (desktop) {
                            return Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                SizedBox(width: 235, child: _leftDeck(player)),
                                const SizedBox(width: 14),
                                Expanded(child: _centerDeck(player)),
                                const SizedBox(width: 14),
                                SizedBox(width: 170, child: _rightDeck()),
                              ],
                            );
                          }
                          return Column(
                            children: [
                              _leftDeck(player),
                              const SizedBox(height: 14),
                              _centerDeck(player),
                              const SizedBox(height: 14),
                              _rightDeck(),
                            ],
                          );
                        },
                      ),
                      const SizedBox(height: 16),
                      _trackSelector(player),
                      const SizedBox(height: 16),
                      _translationPanel(),
                      const SizedBox(height: 16),
                      DjWhoEnochianTerminal(player: player),
                      const SizedBox(height: 14),
                      Text(
                        video == null
                            ? 'THE LANGUAGE IS NOT DEAD. IT WAITS FOR INTERPRETERS.'
                            : '${video.title.toUpperCase()} · THE LANGUAGE IS NOT DEAD. IT WAITS FOR INTERPRETERS.',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: Color(0xFF6ED9C8),
                          fontFamily: 'monospace',
                          fontSize: 10,
                          letterSpacing: 2.2,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _topBar(BuildContext context) => Row(
    children: [
      IconButton(
        tooltip: 'Home',
        onPressed: () => context.go(AppRoutes.home),
        icon: const Icon(Icons.home_rounded, color: AppTheme.brightGold),
      ),
      const SizedBox(width: 4),
      const Expanded(
        child: Text(
          'ENOCHIAN TERMINAL · DJ WHO LABORATORY',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Color(0xFF9CE9DD),
            fontFamily: 'monospace',
            fontWeight: FontWeight.w700,
            letterSpacing: 3,
          ),
        ),
      ),
      _toggleChip('SYNC', _sync, () => setState(() => _sync = !_sync)),
    ],
  );

  Widget _leftDeck(DjWhoPlayerProvider player) => _panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text('DJ WHO', style: TextStyle(color: Color(0xFF9CE9DD), fontSize: 28, fontWeight: FontWeight.w900)),
        const SizedBox(height: 14),
        const Text('NOW PLAYING', style: _micro),
        const SizedBox(height: 5),
        Text(player.selectedVideo?.title ?? 'No track', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        Text('${_time(_seconds)}  /  LIVE', style: const TextStyle(color: Colors.white70, fontFamily: 'monospace')),
        const SizedBox(height: 8),
        LinearProgressIndicator(value: ((_seconds % 180) / 180).clamp(0.0, 1.0).toDouble(), minHeight: 3),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _squareButton(Icons.skip_previous_rounded, () => unawaited(player.previous())),
            _squareButton(player.isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded, () => unawaited(player.togglePlayback())),
            _squareButton(Icons.skip_next_rounded, () => unawaited(player.next())),
          ],
        ),
        const SizedBox(height: 18),
        const Text('PITCH', style: _micro),
        Slider(value: _pitch, min: -8, max: 8, onChanged: (v) => setState(() => _pitch = v)),
        Text('${_pitch.toStringAsFixed(2)}%', textAlign: TextAlign.center, style: const TextStyle(color: Colors.white70, fontFamily: 'monospace')),
        const SizedBox(height: 12),
        const Text('SPEED', style: _micro),
        Wrap(
          spacing: 6,
          children: [.5, 1.0, 2.0].map((value) => ChoiceChip(
            label: Text('${value}x'),
            selected: _speed == value,
            onSelected: (_) => setState(() => _speed = value),
          )).toList(),
        ),
      ],
    ),
  );

  Widget _centerDeck(DjWhoPlayerProvider player) => _panel(
    child: Column(
      children: [
        const Text('ENOCHIAN CODING WAVE', style: TextStyle(color: Color(0xFF9CE9DD), fontFamily: 'monospace', letterSpacing: 4)),
        const SizedBox(height: 10),
        SizedBox(height: 170, child: CustomPaint(painter: _WavePainter(_seconds))),
        const SizedBox(height: 8),
        AspectRatio(
          aspectRatio: 1,
          child: AnimatedBuilder(
            animation: _rotation,
            builder: (context, child) => Transform.rotate(
              angle: _rotation.value * math.pi * 2 * _speed,
              child: child,
            ),
            child: CustomPaint(painter: _PlatterPainter()),
          ),
        ),
        const SizedBox(height: 8),
        Text(player.selectedVideo?.title.toUpperCase() ?? 'DJ WHO', style: const TextStyle(color: AppTheme.brightGold, letterSpacing: 2)),
      ],
    ),
  );

  Widget _rightDeck() => _panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text('TIME', style: _micro),
        Text(_time(_seconds), style: const TextStyle(color: Colors.white, fontFamily: 'monospace', fontSize: 20)),
        const SizedBox(height: 16),
        const Text('MODE', style: _micro),
        const Text('VISUAL SYNC', style: TextStyle(color: Colors.white70, fontFamily: 'monospace')),
        const SizedBox(height: 16),
        const Text('SIGNAL', style: _micro),
        SizedBox(height: 70, child: CustomPaint(painter: _MeterPainter(_seconds))),
        const SizedBox(height: 18),
        _toggleChip('SCRATCH', _scratch, () => setState(() => _scratch = !_scratch)),
        const SizedBox(height: 10),
        OutlinedButton(
          onPressed: () => setState(() { _pitch = 0; _speed = 1; }),
          child: const Text('RESET DECK'),
        ),
      ],
    ),
  );

  Widget _trackSelector(DjWhoPlayerProvider player) => _panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('DJ WHO SIGNAL SOURCE', style: _micro),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: List.generate(player.videos.length, (index) {
            final selected = index == player.selectedIndex;
            return ChoiceChip(
              label: Text(player.videos[index].title),
              selected: selected,
              onSelected: (_) => unawaited(player.selectVideo(index)),
            );
          }),
        ),
      ],
    ),
  );

  Widget _translationPanel() => _panel(
    child: LayoutBuilder(
      builder: (context, constraints) {
        final wide = constraints.maxWidth >= 760;
        final english = _translatorBox(
          title: 'ENGLISH → ENOCHIAN',
          controller: _english,
          onChanged: (value) => setState(() => _enochian.text = _encode(value)),
          output: _enochian.text,
        );
        final enochian = _translatorBox(
          title: 'ENOCHIAN OUTPUT',
          controller: _enochian,
          onChanged: (_) {},
          output: _enochian.text,
          readOnly: true,
        );
        if (!wide) return Column(children: [english, const SizedBox(height: 12), enochian]);
        return Row(children: [Expanded(child: english), const SizedBox(width: 12), Expanded(child: enochian)]);
      },
    ),
  );

  Widget _translatorBox({
    required String title,
    required TextEditingController controller,
    required ValueChanged<String> onChanged,
    required String output,
    bool readOnly = false,
  }) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Text(title, style: _micro),
      const SizedBox(height: 8),
      TextField(
        controller: controller,
        readOnly: readOnly,
        onChanged: onChanged,
        style: TextStyle(color: readOnly ? const Color(0xFF89E6D8) : Colors.white, fontFamily: 'monospace', fontSize: readOnly ? 24 : 16, letterSpacing: readOnly ? 3 : 1),
        decoration: const InputDecoration(border: OutlineInputBorder()),
      ),
      const SizedBox(height: 8),
      Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          TextButton(onPressed: () { controller.clear(); if (!readOnly) setState(() => _enochian.clear()); }, child: const Text('CLEAR')),
          const SizedBox(width: 8),
          TextButton.icon(onPressed: () => Clipboard.setData(ClipboardData(text: output)), icon: const Icon(Icons.copy_rounded, size: 16), label: const Text('COPY')),
        ],
      ),
    ],
  );

  Widget _panel({required Widget child}) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: const Color(0xFF080C0B),
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: const Color(0xFF315C55)),
      boxShadow: const [BoxShadow(color: Colors.black54, blurRadius: 18)],
    ),
    child: child,
  );

  Widget _toggleChip(String label, bool value, VoidCallback onTap) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(8),
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: value ? const Color(0xFF082B24) : Colors.black,
        border: Border.all(color: value ? const Color(0xFF33D8B8) : Colors.white24),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text('$label ${value ? 'ON' : 'OFF'}', style: TextStyle(color: value ? const Color(0xFF63F0D5) : Colors.white54, fontFamily: 'monospace', fontWeight: FontWeight.w700)),
    ),
  );

  Widget _squareButton(IconData icon, VoidCallback onTap) => IconButton.filledTonal(onPressed: onTap, icon: Icon(icon));

  static const _micro = TextStyle(color: Color(0xFF7EB8AE), fontFamily: 'monospace', fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.5);
}

class _WavePainter extends CustomPainter {
  _WavePainter(this.t);
  final double t;

  @override
  void paint(Canvas canvas, Size size) {
    final grid = Paint()..color = const Color(0xFF12352F)..strokeWidth = 1;
    for (var i = 1; i < 10; i++) {
      final x = size.width * i / 10;
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), grid);
    }
    for (var i = 1; i < 5; i++) {
      final y = size.height * i / 5;
      canvas.drawLine(Offset(0, y), Offset(size.width, y), grid);
    }
    final paint = Paint()..color = const Color(0xFF4DE5C6)..strokeWidth = 2..style = PaintingStyle.stroke;
    final path = Path();
    for (var x = 0.0; x <= size.width; x += 3) {
      final n = math.sin((x * .065) + t * 3.1) * 14 + math.sin((x * .19) - t * 5.2) * 7;
      final spike = ((x + t * 50) % 137 < 7) ? math.sin(x) * 30 : 0;
      final y = size.height * .58 + n + spike;
      if (x == 0) path.moveTo(x, y); else path.lineTo(x, y);
    }
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _WavePainter oldDelegate) => oldDelegate.t != t;
}

class _PlatterPainter extends CustomPainter {
  static const glyphs = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛋᛏᛒᛖᛗᛚᛜᛞᛟ';

  @override
  void paint(Canvas canvas, Size size) {
    final c = Offset(size.width / 2, size.height / 2);
    final r = math.min(size.width, size.height) / 2 - 8;
    canvas.drawCircle(c, r, Paint()..color = const Color(0xFF050707));
    for (final factor in [.96, .84, .72, .60, .48, .34]) {
      canvas.drawCircle(c, r * factor, Paint()..color = const Color(0xFF315C55)..style = PaintingStyle.stroke..strokeWidth = factor == .96 ? 3 : 1);
    }
    final gold = Paint()..color = const Color(0xFFD5A94B)..style = PaintingStyle.stroke..strokeWidth = 2;
    canvas.drawCircle(c, r * .78, gold);
    final textPainter = TextPainter(textDirection: TextDirection.ltr);
    for (var i = 0; i < glyphs.length; i++) {
      final angle = (math.pi * 2 * i / glyphs.length) - math.pi / 2;
      final pos = Offset(c.dx + math.cos(angle) * r * .72, c.dy + math.sin(angle) * r * .72);
      textPainter.text = TextSpan(text: glyphs[i], style: const TextStyle(color: Color(0xFFD7B15B), fontSize: 18));
      textPainter.layout();
      canvas.save();
      canvas.translate(pos.dx, pos.dy);
      canvas.rotate(angle + math.pi / 2);
      textPainter.paint(canvas, Offset(-textPainter.width / 2, -textPainter.height / 2));
      canvas.restore();
    }
    final cyan = Paint()..color = const Color(0xFF55E6CD)..style = PaintingStyle.stroke..strokeWidth = 2;
    final star = Path();
    for (var i = 0; i < 14; i++) {
      final angle = -math.pi / 2 + i * math.pi / 7;
      final rr = i.isEven ? r * .20 : r * .09;
      final p = Offset(c.dx + math.cos(angle) * rr, c.dy + math.sin(angle) * rr);
      if (i == 0) star.moveTo(p.dx, p.dy); else star.lineTo(p.dx, p.dy);
    }
    star.close();
    canvas.drawPath(star, cyan);
    canvas.drawCircle(c, 4, Paint()..color = const Color(0xFF55E6CD));
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _MeterPainter extends CustomPainter {
  _MeterPainter(this.t);
  final double t;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = const Color(0xFF4DE5C6);
    final count = 14;
    final w = size.width / count;
    for (var i = 0; i < count; i++) {
      final amp = .2 + .8 * ((math.sin(t * 2.8 + i * .7) + 1) / 2);
      final h = size.height * amp;
      canvas.drawRect(Rect.fromLTWH(i * w + 1, size.height - h, math.max(2.0, w - 3).toDouble(), h), paint);
    }
  }

  @override
  bool shouldRepaint(covariant _MeterPainter oldDelegate) => oldDelegate.t != t;
}
