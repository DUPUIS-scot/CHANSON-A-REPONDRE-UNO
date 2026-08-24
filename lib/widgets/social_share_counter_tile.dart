import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class SocialShareCounterTile extends StatefulWidget {
  const SocialShareCounterTile({super.key});

  @override
  State<SocialShareCounterTile> createState() => _SocialShareCounterTileState();
}

class _SocialShareCounterTileState extends State<SocialShareCounterTile> {
  int? _count;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final value = await Supabase.instance.client.rpc(
        'get_social_preview_share_count',
      );
      if (!mounted) return;
      setState(() => _count = value is num ? value.toInt() : int.tryParse('$value'));
    } on Object {
      if (!mounted) return;
      setState(() => _count = null);
    }
  }

  String get _formatted {
    final value = _count;
    if (value == null) return '—';
    return value.toString().replaceAllMapped(
      RegExp(r'\B(?=(\d{3})+(?!\d))'),
      (_) => ',',
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: const Icon(Icons.share_outlined),
      title: const Text('Social preview shares'),
      subtitle: const Text(
        'Global successful shares or copied social-preview links across Chanson à Répondre UNO.',
      ),
      trailing: Text(
        _formatted,
        key: const ValueKey('social-preview-share-count'),
        style: const TextStyle(
          color: Color(0xFFFFC928),
          fontSize: 22,
          fontWeight: FontWeight.w900,
        ),
      ),
      onTap: _load,
    );
  }
}
