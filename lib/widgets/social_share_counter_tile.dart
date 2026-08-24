import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SocialShareCounterTile extends StatefulWidget {
  const SocialShareCounterTile({super.key});

  @override
  State<SocialShareCounterTile> createState() => _SocialShareCounterTileState();
}

class _SocialShareCounterTileState extends State<SocialShareCounterTile> {
  static const _key = 'social_preview_share_count';
  int? _count;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final preferences = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() => _count = preferences.getInt(_key) ?? 0);
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
        'Successful shares or copied social-preview links across Chanson à Répondre UNO.',
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
