import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../core/app_router.dart';

class CreditsScreen extends StatefulWidget {
  const CreditsScreen({super.key});

  @override
  State<CreditsScreen> createState() => _CreditsScreenState();
}

class _CreditsScreenState extends State<CreditsScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _curtainController;
  String _version = '…';
  bool _showCredits = false;

  @override
  void initState() {
    super.initState();
    _curtainController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1150),
    );
    unawaited(_loadVersion());
    WidgetsBinding.instance.addPostFrameCallback((_) => _closeCurtain());
  }

  Future<void> _loadVersion() async {
    try {
      final info = await PackageInfo.fromPlatform();
      if (!mounted) return;
      final build = info.buildNumber.trim();
      setState(() {
        _version = build.isEmpty ? info.version : '${info.version}+$build';
      });
    } on Object {
      if (mounted) setState(() => _version = 'Unavailable');
    }
  }

  Future<void> _closeCurtain() async {
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    if (reduceMotion) {
      _curtainController.value = 1;
    } else {
      await _curtainController.forward();
    }
    if (mounted) setState(() => _showCredits = true);
  }

  @override
  void dispose() {
    _curtainController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: const Color(0xFF160302),
    body: AnimatedBuilder(
      animation: _curtainController,
      builder: (context, child) => LayoutBuilder(
        builder: (context, constraints) {
          final width = constraints.maxWidth * .58;
          final openOffset = width;
          final travel = openOffset * (1 - _curtainController.value);
          return Stack(
            fit: StackFit.expand,
            children: [
              const ColoredBox(color: Color(0xFF090201)),
              Transform.translate(
                offset: Offset(-travel, 0),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: _CreditsCurtainPanel(width: width, left: true),
                ),
              ),
              Transform.translate(
                offset: Offset(travel, 0),
                child: Align(
                  alignment: Alignment.centerRight,
                  child: _CreditsCurtainPanel(width: width, left: false),
                ),
              ),
              AnimatedOpacity(
                key: const ValueKey('credits-content'),
                opacity: _showCredits ? 1 : 0,
                duration: const Duration(milliseconds: 650),
                curve: Curves.easeOut,
                child: IgnorePointer(
                  ignoring: !_showCredits,
                  child: SafeArea(child: _CreditsBody(version: _version)),
                ),
              ),
            ],
          );
        },
      ),
    ),
  );
}

class _CreditsBody extends StatelessWidget {
  const _CreditsBody({required this.version});

  final String version;

  @override
  Widget build(BuildContext context) => Center(
    child: ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 720),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: const Color(0xCC2A0705),
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: const Color(0xFFC18A27), width: 2),
            boxShadow: const [
              BoxShadow(color: Color(0x99000000), blurRadius: 28),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: DefaultTextStyle(
              style: const TextStyle(color: Color(0xFFFFF4D2), height: 1.35),
              textAlign: TextAlign.center,
              child: Column(
                children: [
                  const Text(
                    'GÉNÉRIQUE / CREDITS',
                    style: TextStyle(
                      color: Color(0xFFFFC928),
                      fontSize: 30,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'CHANSON À RÉPONDRE UNO',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 24),
                  const _CreditLine(
                    label: 'Concept & Artistic Direction',
                    value: 'DUPUIS*',
                  ),
                  const _CreditLine(
                    label: 'Design & Development',
                    value: 'DUPUIS*',
                  ),
                  const _CreditLine(label: 'Music / Sound', value: 'DJ WHO'),
                  const _CreditLine(
                    label: '3D / Interactive Environments',
                    value: 'DUPUIS*',
                  ),
                  const _CreditLine(
                    label: 'AI-assisted development & creative tools',
                    value:
                        'OpenAI / ChatGPT and other credited tools where applicable',
                  ),
                  const SizedBox(height: 16),
                  const SelectableText(
                    'www.chanson-a-repondre-uno.scot',
                    style: TextStyle(
                      color: Color(0xFFFFC928),
                      decoration: TextDecoration.underline,
                      decorationColor: Color(0xFFFFC928),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Version: $version',
                    key: const ValueKey('credits-version'),
                  ),
                  const SizedBox(height: 10),
                  const Text('© 2026 DUPUIS*'),
                  const SizedBox(height: 10),
                  const Text(
                    'Technologies: Flutter, Three.js, GoRouter, Provider, '
                    'Supabase, OpenAI APIs and the supporting packages used by the app.',
                  ),
                  const SizedBox(height: 26),
                  FilledButton.tonalIcon(
                    key: const ValueKey('credits-back-to-settings'),
                    onPressed: () => context.go(AppRoutes.settings),
                    icon: const Icon(Icons.arrow_back_rounded),
                    label: const Text('BACK TO SETTINGS'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

class _CreditLine extends StatelessWidget {
  const _CreditLine({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 5),
    child: Text.rich(
      TextSpan(
        children: [
          TextSpan(
            text: '$label: ',
            style: const TextStyle(fontWeight: FontWeight.w800),
          ),
          TextSpan(text: value),
        ],
      ),
    ),
  );
}

class _CreditsCurtainPanel extends StatelessWidget {
  const _CreditsCurtainPanel({required this.width, required this.left});

  final double width;
  final bool left;

  @override
  Widget build(BuildContext context) => SizedBox(
    width: width,
    height: double.infinity,
    child: CustomPaint(painter: _CreditsCurtainPainter(left: left)),
  );
}

class _CreditsCurtainPainter extends CustomPainter {
  const _CreditsCurtainPainter({required this.left});

  final bool left;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(
      Offset.zero & size,
      Paint()..color = const Color(0xFF65150F),
    );
    for (var index = 0; index < 10; index++) {
      final rect = Rect.fromLTWH(
        index * size.width / 10,
        0,
        size.width / 10 + 2,
        size.height,
      );
      canvas.drawRect(
        rect,
        Paint()
          ..color = index.isEven
              ? const Color(0xFF8D251A)
              : const Color(0xFF3D0C09),
      );
    }
    final x = left ? size.width - 2 : 2.0;
    canvas.drawLine(
      Offset(x, 0),
      Offset(x, size.height),
      Paint()
        ..color = const Color(0xFFC18A27)
        ..strokeWidth = 3,
    );
  }

  @override
  bool shouldRepaint(covariant _CreditsCurtainPainter oldDelegate) =>
      oldDelegate.left != left;
}

