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
  bool _launchFailed = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_launched) return;
    _launched = true;
    WidgetsBinding.instance.addPostFrameCallback((_) => _openLubiak());
  }

  Future<void> _openLubiak() async {
    final uri = kIsWeb
        ? Uri.base.resolve('/lubiak/')
        : Uri.parse('https://www.chanson-a-repondre-uno.scot/lubiak/');

    final opened = await launchUrl(
      uri,
      mode: kIsWeb ? LaunchMode.platformDefault : LaunchMode.externalApplication,
      webOnlyWindowName: kIsWeb ? '_self' : null,
    );

    if (!opened && mounted) {
      setState(() => _launchFailed = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Center(
        child: _launchFailed
            ? Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'Unable to open LUBIAK.',
                    style: TextStyle(color: Colors.white),
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: _openLubiak,
                    child: const Text('TRY AGAIN'),
                  ),
                ],
              )
            : const CircularProgressIndicator(),
      ),
    );
  }
}
