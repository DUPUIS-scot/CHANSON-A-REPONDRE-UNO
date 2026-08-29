import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class LubiakScreen extends StatefulWidget {
  const LubiakScreen({super.key});

  @override
  State<LubiakScreen> createState() => _LubiakScreenState();
}

class _LubiakScreenState extends State<LubiakScreen> {
  bool _launched = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_launched) return;
    _launched = true;
    WidgetsBinding.instance.addPostFrameCallback((_) => _openLubiak());
  }

  Future<void> _openLubiak() async {
    if (!kIsWeb) return;
    await launchUrl(
      Uri.base.resolve('/lubiak/'),
      webOnlyWindowName: '_self',
    );
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Colors.black,
      body: Center(child: CircularProgressIndicator()),
    );
  }
}
