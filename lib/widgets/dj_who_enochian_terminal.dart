import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../providers/dj_who_player_provider.dart';

class DjWhoEnochianTerminal extends StatefulWidget {
  const DjWhoEnochianTerminal({super.key, required this.player});
  final DjWhoPlayerProvider player;

  @override
  State<DjWhoEnochianTerminal> createState() => _DjWhoEnochianTerminalState();
}

class _SignalTrack {
  const _SignalTrack(this.sampleHz, this.frames);
  final double sampleHz;
  final List<List<int>> frames;
}

class _DjWhoEnochianTerminalState extends State<DjWhoEnochianTerminal> {
  static const _names = <String>[
    'UN','PA','VEH','GAL','GRAPH','OR','NA','GON','UR','TAL','GISA','FAM','GED','DON','MED','MALS','GER','DRUX','PAL','CEPH','VAN'
  ];
  static const _assets = <String,String>{
    'C0zocqpnIpY': 'assets/json/ai_comptroller_enochian.json',
    '6v3YRGccqZE': 'assets/json/caesar_spitter_enochian_compact.json',
    'XT60H_iOIvQ': 'assets/json/the_kraken_enochian_compact.json',
    'lw4S2kb1_Ew': 'assets/json/heliogabal_design_enochian_compact.json',
    'IV2IY5Faldc': 'assets/json/vivid_void_enochian_compact.json',
  };

  Timer? _timer;
  final Map<String,_SignalTrack> _signals = {};
  double _seconds = 0;
  double _independentSeconds = 0;
  bool _real = false;
  List<int> _raw = const [0,0,0,0];
  final _log = <String>[];
  final _scroll = ScrollController();
  int _lastFrame = -1;
  String? _lastVideoId;
  double _bass = 1, _mid = 1, _high = 1, _beat = 1, _cross = .5;

  @override
  void initState() {
    super.initState();
    unawaited(_loadSignals());
    _timer = Timer.periodic(const Duration(milliseconds: 160), (_) => unawaited(_sample()));
  }

  Future<void> _loadSignals() async {
    for (final entry in _assets.entries) {
      try {
        final data = jsonDecode(await rootBundle.loadString(entry.value)) as Map<String,dynamic>;
        final sampleHz = (data['sampleHz'] as num).toDouble();
        List<List<int>> frames;
        if (data['encoding'] == 'u8x4-base64') {
          final bytes = base64Decode(data['data'] as String);
          frames = List.generate(bytes.length ~/ 4, (i) {
            final o = i * 4;
            return [bytes[o], bytes[o + 1], bytes[o + 2], bytes[o + 3]];
          }, growable: false);
        } else {
          frames = (data['frames'] as List).map((f) =>
            (f as List).map((v) => (v as num).round()).toList(growable:false)
          ).toList(growable:false);
        }
        _signals[entry.key] = _SignalTrack(sampleHz, frames);
      } catch (_) {}
    }
    if (mounted) setState(() {});
  }

  Future<void> _sample() async {
    final v = widget.player.selectedVideo;
    if (!mounted || v == null) return;

    if (_lastVideoId != v.videoId) {
      _lastVideoId = v.videoId;
      _lastFrame = -1;
      _log.clear();
      _independentSeconds = 0;
    }

    double s;
    final c = widget.player.controller;
    if (c != null && widget.player.isPlaying) {
      try {
        s = await c.currentTime;
        _independentSeconds = s;
      } catch (_) {
        _independentSeconds += .16;
        s = _independentSeconds;
      }
    } else {
      // The Enochian Terminal is an independent route. When DJ WHO has not
      // been opened (or is paused), advance through the pre-analysed MP3
      // signal locally so the terminal remains live without embedding or
      // starting the YouTube player.
      _independentSeconds += .16;
      s = _independentSeconds;
    }
    if (!mounted) return;

    final signal = _signals[v.videoId];
    late final int index;
    late final List<int> values;
    final bool real;
    if (signal != null && signal.frames.isNotEmpty && signal.sampleHz > 0) {
      real = true;
      final duration = signal.frames.length / signal.sampleHz;
      if (duration > 0 && s >= duration) {
        s %= duration;
        _independentSeconds = s;
        _lastFrame = -1;
        _log.clear();
      }
      index = (s * signal.sampleHz).floor().clamp(0, signal.frames.length - 1);
      values = signal.frames[index];
    } else {
      real = false;
      index = (s * 8).floor();
      values = _fallback(v.videoId, s);
    }

    setState(() {
      _seconds = s; _real = real; _raw = values;
      if (index != _lastFrame) {
        _lastFrame = index;
        final fx = _fx(values);
        _log.add('${_time(s)}  ${_word(fx[0])} ${_word(fx[1])} ${_word(fx[2])} ${_word(fx[3])}');
        if (_log.length > 120) _log.removeAt(0);
      }
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) _scroll.jumpTo(_scroll.position.maxScrollExtent);
    });
  }

  List<int> _fx(List<int> v) {
    int scale(int n, double gain) => (n * gain).round().clamp(0,255);
    final a = scale(v[0], _bass), b = scale(v[1], _mid), c = scale(v[2], _high), d = scale(v[3], _beat);
    final left = (a * (1 - _cross) + b * _cross).round().clamp(0,255);
    final right = (c * _cross + d * (1 - _cross)).round().clamp(0,255);
    return [left,b,right,d];
  }

  List<int> _fallback(String id, double s) {
    var seed = 2166136261;
    for (final u in id.codeUnits) { seed ^= u; seed = (seed * 16777619) & 0x7fffffff; }
    final tick = (s * 8).floor();
    int val(int salt) { var x = seed ^ (tick * 1103515245) ^ salt; x ^= x >> 13; x = (x * 1274126177) & 0x7fffffff; x ^= x >> 16; return x & 255; }
    return [val(17),val(37),val(73),val(109)];
  }

  String _word(int v) => _names[v % _names.length];
  String _signal(String label, int v) => '${label.padRight(5)} ${v.toRadixString(2).padLeft(8,'0')} → ${_word(v)}';

  @override
  void dispose() { _timer?.cancel(); _scroll.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final fx = _fx(_raw);
    return Container(
      key: const Key('dj-who-enochian-terminal'),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.black, border: Border.all(color: Theme.of(context).colorScheme.primary.withValues(alpha:.55)), borderRadius: BorderRadius.circular(10)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Row(children: [
          const Expanded(child: Text('DJ WHO · ENOCHIAN TURNTABLE', style: TextStyle(color:Colors.white,fontFamily:'monospace',fontWeight:FontWeight.w700,letterSpacing:1.1))),
          Text(_time(_seconds), style: const TextStyle(color:Colors.white70,fontFamily:'monospace',fontSize:12)),
        ]),
        const SizedBox(height:6),
        Text(_real ? 'LIVE MP3 SIGNAL · FFT · MIX FX · BINARY · ENOCHIAN' : 'LIVE PLAYBACK SIGNAL · MIX FX · BINARY · ENOCHIAN', style: const TextStyle(color:Colors.white54,fontFamily:'monospace',fontSize:10)),
        const SizedBox(height:8),
        Row(children:[Expanded(child:_meter('BASS',fx[0])),const SizedBox(width:6),Expanded(child:_meter('MID',fx[1])),const SizedBox(width:6),Expanded(child:_meter('HIGH',fx[2])),const SizedBox(width:6),Expanded(child:_meter('BEAT',fx[3]))]),
        const SizedBox(height:8),
        Text(_signal('BASS',fx[0]),style:_style), Text(_signal('MID',fx[1]),style:_style), Text(_signal('HIGH',fx[2]),style:_style), Text(_signal('BEAT',fx[3]),style:_style),
        const SizedBox(height:10),
        const Text('MIX FX',style:TextStyle(color:Colors.white70,fontFamily:'monospace',fontSize:11,fontWeight:FontWeight.bold)),
        _slider('LOW',_bass,(v)=>setState(()=>_bass=v)),
        _slider('MID',_mid,(v)=>setState(()=>_mid=v)),
        _slider('HIGH',_high,(v)=>setState(()=>_high=v)),
        _slider('BEAT',_beat,(v)=>setState(()=>_beat=v)),
        _slider('XFADE',_cross,(v)=>setState(()=>_cross=v), max:1),
        const SizedBox(height:8),
        Container(height:105,padding:const EdgeInsets.all(7),decoration:BoxDecoration(border:Border.all(color:Colors.white24),borderRadius:BorderRadius.circular(6)),child:ListView.builder(controller:_scroll,itemCount:_log.length,itemBuilder:(context,i)=>Text(_log[i],style:const TextStyle(color:Colors.white60,fontFamily:'monospace',fontSize:10,height:1.25)))),
      ]),
    );
  }

  Widget _meter(String label,int value) => Column(children:[Text(label,style:const TextStyle(color:Colors.white54,fontFamily:'monospace',fontSize:9)),const SizedBox(height:3),LinearProgressIndicator(value:value/255,minHeight:5)]);
  Widget _slider(String label,double value,ValueChanged<double> changed,{double max=2}) => Row(children:[SizedBox(width:42,child:Text(label,style:const TextStyle(color:Colors.white60,fontFamily:'monospace',fontSize:9))),Expanded(child:Slider(value:value,min:0,max:max,onChanged:changed)),SizedBox(width:34,child:Text(value.toStringAsFixed(1),style:const TextStyle(color:Colors.white54,fontFamily:'monospace',fontSize:9)))]);
  static const _style = TextStyle(color:Colors.white,fontFamily:'monospace',fontSize:12,height:1.3);
  String _time(double s) { final ms=(s*1000).round(); final m=ms~/60000; final sec=(ms%60000)~/1000; final tenth=(ms%1000)~/100; return '${m.toString().padLeft(2,'0')}:${sec.toString().padLeft(2,'0')}.$tenth'; }
}
