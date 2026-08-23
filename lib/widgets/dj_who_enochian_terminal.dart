import 'dart:async';

import 'package:flutter/material.dart';

import '../providers/dj_who_player_provider.dart';

class DjWhoEnochianTerminal extends StatefulWidget {
  const DjWhoEnochianTerminal({
    super.key,
    required this.player,
  });

  final DjWhoPlayerProvider player;

  @override
  State<DjWhoEnochianTerminal> createState() =>
      _DjWhoEnochianTerminalState();
}

class _DjWhoEnochianTerminalState extends State<DjWhoEnochianTerminal> {
  static const _enochianNames = <String>[
    'UN',
    'PA',
    'VEH',
    'GAL',
    'GRAPH',
    'OR',
    'NA',
    'GON',
    'UR',
    'TAL',
    'GISA',
    'FAM',
    'GED',
    'DON',
    'MED',
    'MALS',
    'GER',
    'DRUX',
    'PAL',
    'CEPH',
    'VAN',
  ];

  Timer? _timer;
  double _seconds = 0;
  int _frame = 0;
  final List<String> _history = <String>[];

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(milliseconds: 120), (_) {
      unawaited(_sample());
    });
  }

  @override
  void didUpdateWidget(covariant DjWhoEnochianTerminal oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.player.selectedIndex != widget.player.selectedIndex) {
      _history.clear();
      _frame = 0;
      _seconds = 0;
    }
  }

  Future<void> _sample() async {
    if (!mounted) return;

    final controller = widget.player.controller;
    if (controller == null) return;

    double seconds;
    try {
      seconds = await controller.currentTime;
    } catch (_) {
      return;
    }
    if (!mounted) return;

    final video = widget.player.selectedVideo;
    if (video == null) return;

    final tick = (seconds * 8).floor();
    final seed = _stableHash(video.videoId);
    final mixed = _mix(seed, tick, _frame);
    final byte = mixed & 0xff;
    final glyph = _enochianNames[byte % _enochianNames.length];
    final bits = byte.toRadixString(2).padLeft(8, '0');
    final entry = '$bits  →  $glyph';

    setState(() {
      _seconds = seconds;
      _frame++;
      if (_history.isEmpty || _history.last != entry) {
        _history.add(entry);
        if (_history.length > 7) {
          _history.removeAt(0);
        }
      }
    });
  }

  int _stableHash(String value) {
    var hash = 2166136261;
    for (final unit in value.codeUnits) {
      hash ^= unit;
      hash = (hash * 16777619) & 0x7fffffff;
    }
    return hash;
  }

  int _mix(int seed, int tick, int frame) {
    var value = seed ^ (tick * 1103515245) ^ (frame * 12345);
    value ^= value >> 13;
    value = (value * 1274126177) & 0x7fffffff;
    value ^= value >> 16;
    return value;
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final lines = _history.isEmpty
        ? const <String>['00000000  →  UN']
        : _history.reversed.toList(growable: false);

    return Container(
      key: const Key('dj-who-enochian-terminal'),
      decoration: BoxDecoration(
        color: Colors.black,
        border: Border.all(color: theme.colorScheme.primary.withValues(alpha: .55)),
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
          const Text(
            'PLAYBACK CLOCK → BINARY BYTE → ENOCHIAN LETTER',
            style: TextStyle(
              color: Colors.white54,
              fontFamily: 'monospace',
              fontSize: 10,
              letterSpacing: .7,
            ),
          ),
          const SizedBox(height: 8),
          for (final line in lines)
            Text(
              line,
              maxLines: 1,
              overflow: TextOverflow.fade,
              softWrap: false,
              style: const TextStyle(
                color: Colors.white,
                fontFamily: 'monospace',
                fontSize: 13,
                height: 1.35,
              ),
            ),
        ],
      ),
    );
  }

  String _formatTime(double seconds) {
    final total = seconds.floor();
    final minutes = total ~/ 60;
    final remainder = total % 60;
    return '${minutes.toString().padLeft(2, '0')}:${remainder.toString().padLeft(2, '0')}';
  }
}
