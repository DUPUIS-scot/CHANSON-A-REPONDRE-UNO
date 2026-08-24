import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class EnochianTerminalScreen extends StatefulWidget {
  const EnochianTerminalScreen({super.key});

  @override
  State<EnochianTerminalScreen> createState() => _EnochianTerminalScreenState();
}

class _EnochianTerminalScreenState extends State<EnochianTerminalScreen> {
  bool _launched = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_launched) return;
    _launched = true;
    WidgetsBinding.instance.addPostFrameCallback((_) => _openTerminal());
  }

  Future<void> _openTerminal() async {
    if (!kIsWeb) return;
    final uri = Uri.base.resolve('/enochian-terminal/');
    await launchUrl(uri, webOnlyWindowName: '_self');
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Colors.black,
      body: Center(child: CircularProgressIndicator()),
    );
  }
}
