import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../providers/dj_who_player_provider.dart';

class DjWhoEnochianTerminal extends StatefulWidget {
  const DjWhoEnochianTerminal({super.key, required this.player});

  final DjWhoPlayerProvider player;

  @override
  State<DjWhoEnochianTerminal> createState() =>
      _DjWhoEnochianTerminalState();
}

class _DjWhoEnochianTerminalState extends State<DjWhoEnochianTerminal> {
  static const _enochianNames = <String>[
    'UN', 'PA', 'VEH', 'GAL', 'GRAPH', 'OR', 'NA', 'GON', 'UR', 'TAL',
    'GISA', 'FAM', 'GED', 'DON', 'MED', 'MALS', 'GER', 'DRUX', 'PAL',
    'CEPH', 'VAN',
  ];

  Timer? _timer;
  List<List<int>> _frames = const [];
  double _sampleHz = 0;
  double _seconds = 0;
  bool _usingRealSignal = false;
  List<int> _current = const [0, 0, 0, 0];

  @override
  void initState() {
    super.initState();
    unawaited(_loadSignal());
    _timer = Timer.periodic(const Duration(milliseconds: 160), (_) {
      unawaited(_sample());
    });
  }

  Future<void> _loadSignal() async {
    try {
      final raw = await rootBundle.loadString(
        'assets/json/ai_comptroller_enochian.json',
      );
      final decoded = jsonDecode(raw) as Map<String, dynamic>;
      final frames = (decoded['frames'] as List<dynamic>)
          .map((frame) => (frame as List<dynamic>)
              .map((value) => (value as num).round())
              .toList(growable: false))
          .toList(growable: false);
      if (!mounted) return;
      setState(() {
        _frames = frames;
        _sampleHz = (decoded['sampleHz'] as num).toDouble();
      });
    } catch (_) {
      // Other tracks keep the deterministic fallback until analysed data exists.
    }
  }

  Future<void> _sample() async {
    final controller = widget.player.controller;
    final video = widget.player.selectedVideo;
    if (!mounted || controller == null || video == null) return;

    double seconds;
    try {
      seconds = await controller.currentTime;
    } catch (_) {
      return;
    }
    if (!mounted) return;

    final hasRealSignal =
        video.videoId == 'C0zocqpnIpY' && _frames.isNotEmpty && _sampleHz > 0;
    final values = hasRealSignal
        ? _frames[(seconds * _sampleHz)
            .floor()
            .clamp(0, _frames.length - 1)]
        : _fallbackValues(video.videoId, seconds);

    setState(() {
      _seconds = seconds;
      _usingRealSignal = hasRealSignal;
      _current = values;
    });
  }

  List<int> _fallbackValues(String videoId, double seconds) {
    var seed = 2166136261;
    for (final unit in videoId.codeUnits) {
      seed ^= unit;
      seed = (seed * 16777619) & 0x7fffffff;
    }
    final tick = (seconds * 8).floor();
    int value(int salt) {
      var mixed = seed ^ (tick * 1103515245) ^ salt;
      mixed ^= mixed >> 13;
      mixed = (mixed * 1274126177) & 0x7fffffff;
      mixed ^= mixed >> 16;
      return mixed & 0xff;
    }
    return [value(17), value(37), value(73), value(109)];
  }

  String _line(String label, int value) {
    final bits = value.toRadixString(2).padLeft(8, '0');
    final glyph = _enochianNames[value % _enochianNames.length];
    return '${label.padRight(5)} $bits  →  $glyph';
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      key: const Key('dj-who-enochian-terminal'),
      decoration: BoxDecoration(
        color: Colors.black,
        border: Border.all(
          color: theme.colorScheme.primary.withValues(alpha: .55),
        ),
        borderRadius: BorderRadius.circular(10),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'DJ WHO · ENOCHIAN TERMINAL',
                  style: TextStyle(
                    color: Colors.white,
                    fontFamily: 'monospace',
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.1,
                  ),
                ),
              ),
              Text(
                _formatTime(_seconds),
                style: const TextStyle(
                  color: Colors.white70,
                  fontFamily: 'monospace',
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            _usingRealSignal
                ? 'REAL MP3 FFT → BINARY → ENOCHIAN'
                : 'PLAYBACK CLOCK → BINARY → ENOCHIAN',
            style: const TextStyle(
              color: Colors.white54,
              fontFamily: 'monospace',
              fontSize: 10,
              letterSpacing: .7,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _line('BASS', _current[0]),
            style: _terminalStyle,
          ),
          Text(
            _line('MID', _current[1]),
            style: _terminalStyle,
          ),
          Text(
            _line('HIGH', _current[2]),
            style: _terminalStyle,
          ),
          Text(
            _line('BEAT', _current[3]),
            style: _terminalStyle,
          ),
        ],
      ),
    );
  }

  static const _terminalStyle = TextStyle(
    color: Colors.white,
    fontFamily: 'monospace',
    fontSize: 13,
    height: 1.35,
  );

  String _formatTime(double seconds) {
    final total = seconds.floor();
    final minutes = total ~/ 60;
    final remainder = total % 60;
    return '${minutes.toString().padLeft(2, '0')}:${remainder.toString().padLeft(2, '0')}';
  }
}
