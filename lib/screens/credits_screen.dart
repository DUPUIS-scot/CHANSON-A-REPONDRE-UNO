import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../core/app_router.dart';
import '../widgets/statue_scene_view.dart';

class CreditsScreen extends StatefulWidget {
  const CreditsScreen({super.key});

  @override
  State<CreditsScreen> createState() => _CreditsScreenState();
}

class _CreditsScreenState extends State<CreditsScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _curtainController;
  String _version = '…';
  bool _leaving = false;

  @override
  void initState() {
    super.initState();
    _curtainController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
      value: 0,
    );
    unawaited(_loadVersion());
  }

  Future<void> _loadVersion() async {
    try {
      final info = await PackageInfo.fromPlatform();
      if (!mounted) return;
      final build = info.buildNumber.trim();
      setState(() => _version = build.isEmpty ? info.version : '${info.version}+$build');
    } on Object {
      if (mounted) setState(() => _version = 'Unavailable');
    }
  }

  void _dragCurtain(double delta, double width, bool left) {
    if (_leaving || width <= 0) return;
    _curtainController.stop();
    final outward = left ? -delta : delta;
    _curtainController.value =
        (_curtainController.value + outward / (width * .5)).clamp(0.0, 1.0);
  }

  Future<void> _settleCurtain(double velocity, bool left) async {
    if (_leaving) return;
    final outwardVelocity = left ? -velocity : velocity;
    final open = outwardVelocity.abs() > 220
        ? outwardVelocity > 0
        : _curtainController.value >= .5;
    await _curtainController.animateTo(
      open ? 1 : 0,
      curve: Curves.easeOutCubic,
      duration: const Duration(milliseconds: 420),
    );
  }

  Future<void> _toggleCurtain() async {
    if (_leaving) return;
    await _curtainController.animateTo(
      _curtainController.value >= .5 ? 0 : 1,
      curve: Curves.easeInOutCubic,
      duration: const Duration(milliseconds: 520),
    );
  }

  Future<void> _openCurtain() async {
    if (_leaving || _curtainController.value >= .985) return;
    await _curtainController.animateTo(
      1,
      curve: Curves.easeOutCubic,
      duration: const Duration(milliseconds: 620),
    );
  }

  Future<void> _backToSettings() async {
    if (_leaving) return;
    setState(() => _leaving = true);
    if (MediaQuery.disableAnimationsOf(context)) {
      _curtainController.value = 0;
    } else {
      await _curtainController.animateTo(
        0,
        curve: Curves.easeInOutCubic,
        duration: const Duration(milliseconds: 900),
      );
    }
    if (mounted) context.go(AppRoutes.settings);
  }

  @override
  void dispose() {
    _curtainController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: const Color(0xFF090201),
        body: AnimatedBuilder(
          animation: _curtainController,
          builder: (context, child) => LayoutBuilder(
            builder: (context, constraints) {
              final progress = _curtainController.value;
              final fullWidth = constraints.maxWidth;
              final panelWidth = fullWidth * .5;
              final statueInteractive = progress >= .985 && !_leaving;
              return Stack(
                fit: StackFit.expand,
                children: [
                  const ColoredBox(color: Color(0xFF090201)),
                  Padding(
                    padding: const EdgeInsets.only(left: 34),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: SizedBox(
                        width: (fullWidth * .54 - 34).clamp(0.0, fullWidth),
                        height: double.infinity,
                        child: StatueSceneView(interactive: statueInteractive),
                      ),
                    ),
                  ),
                  AnimatedOpacity(
                    key: const ValueKey('credits-content'),
                    opacity: progress > .58 && !_leaving ? 1 : 0,
                    duration: const Duration(milliseconds: 350),
                    child: IgnorePointer(
                      ignoring: progress <= .72 || _leaving,
                      child: SafeArea(
                        child: _CreditsBody(version: _version, onBack: _backToSettings),
                      ),
                    ),
                  ),
                  _curtainPanel(
                    left: true,
                    panelWidth: panelWidth,
                    fullWidth: fullWidth,
                    offset: -panelWidth * progress,
                  ),
                  _curtainPanel(
                    left: false,
                    panelWidth: panelWidth,
                    fullWidth: fullWidth,
                    offset: panelWidth * progress,
                  ),
                  if (progress <= .04)
                    Positioned.fill(
                      child: Semantics(
                        button: true,
                        label: 'Open credits curtain',
                        child: GestureDetector(
                          key: const ValueKey('credits-curtain-open-surface'),
                          behavior: HitTestBehavior.opaque,
                          onTap: _openCurtain,
                          onHorizontalDragEnd: (details) {
                            final velocity = details.primaryVelocity ?? 0;
                            if (velocity.abs() > 120) _openCurtain();
                          },
                        ),
                      ),
                    )
                  else if (progress < .985) ...[
                    Positioned(
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: panelWidth * (1 - progress) + 28,
                      child: GestureDetector(
                        key: const ValueKey('credits-curtain-left'),
                        behavior: HitTestBehavior.translucent,
                        onTap: _toggleCurtain,
                        onHorizontalDragUpdate: (e) =>
                            _dragCurtain(e.delta.dx, fullWidth, true),
                        onHorizontalDragEnd: (e) =>
                            _settleCurtain(e.primaryVelocity ?? 0, true),
                      ),
                    ),
                    Positioned(
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: panelWidth * (1 - progress) + 28,
                      child: GestureDetector(
                        key: const ValueKey('credits-curtain-right'),
                        behavior: HitTestBehavior.translucent,
                        onTap: _toggleCurtain,
                        onHorizontalDragUpdate: (e) =>
                            _dragCurtain(e.delta.dx, fullWidth, false),
                        onHorizontalDragEnd: (e) =>
                            _settleCurtain(e.primaryVelocity ?? 0, false),
                      ),
                    ),
                  ] else ...[
                    Align(
                      alignment: Alignment.centerLeft,
                      child: SizedBox(
                        width: 34,
                        height: double.infinity,
                        child: GestureDetector(
                          key: const ValueKey('credits-curtain-open-left-edge'),
                          behavior: HitTestBehavior.opaque,
                          onTap: _toggleCurtain,
                          onHorizontalDragUpdate: (e) =>
                              _dragCurtain(e.delta.dx, fullWidth, true),
                          onHorizontalDragEnd: (e) =>
                              _settleCurtain(e.primaryVelocity ?? 0, true),
                        ),
                      ),
                    ),
                    Align(
                      alignment: Alignment.centerRight,
                      child: SizedBox(
                        width: 34,
                        height: double.infinity,
                        child: GestureDetector(
                          key: const ValueKey('credits-curtain-open-right-edge'),
                          behavior: HitTestBehavior.opaque,
                          onTap: _toggleCurtain,
                          onHorizontalDragUpdate: (e) =>
                              _dragCurtain(e.delta.dx, fullWidth, false),
                          onHorizontalDragEnd: (e) =>
                              _settleCurtain(e.primaryVelocity ?? 0, false),
                        ),
                      ),
                    ),
                  ],
                ],
              );
            },
          ),
        ),
      );

  Widget _curtainPanel({
    required bool left,
    required double panelWidth,
    required double fullWidth,
    required double offset,
  }) => Transform.translate(
        offset: Offset(offset, 0),
        child: Align(
          alignment: left ? Alignment.centerLeft : Alignment.centerRight,
          child: ClipRect(
            child: SizedBox(
              width: panelWidth,
              height: double.infinity,
              child: OverflowBox(
                alignment: left ? Alignment.centerLeft : Alignment.centerRight,
                minWidth: fullWidth,
                maxWidth: fullWidth,
                child: Image.asset(
                  'assets/images/closed_curtains.png',
                  width: fullWidth,
                  height: double.infinity,
                  fit: BoxFit.cover,
                  alignment: Alignment.center,
                  errorBuilder: (_, _, _) =>
                      const ColoredBox(color: Color(0xFF65150F)),
                ),
              ),
            ),
          ),
        ),
      );
}

class _CreditsBody extends StatelessWidget {
  const _CreditsBody({required this.version, required this.onBack});
  final String version;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) => Align(
        alignment: Alignment.centerRight,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 600),
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: const Color(0xB82A0705),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: const Color(0xFFC18A27), width: 2),
                boxShadow: const [BoxShadow(color: Color(0x99000000), blurRadius: 28)],
              ),
              child: Padding(
                padding: const EdgeInsets.all(28),
                child: DefaultTextStyle(
                  style: const TextStyle(color: Color(0xFFFFF4D2), height: 1.35),
                  textAlign: TextAlign.center,
                  child: Column(children: [
                    const Text('GÉNÉRIQUE / CREDITS', style: TextStyle(color: Color(0xFFFFC928), fontSize: 30, fontWeight: FontWeight.w900, letterSpacing: 1.2)),
                    const SizedBox(height: 8),
                    const Text('CHANSON À RÉPONDRE UNO', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 24),
                    const _CreditLine(label: 'Concept & Artistic Direction', value: 'DUPUIS*'),
                    const _CreditLine(label: 'Design & Development', value: 'DUPUIS*'),
                    const _CreditLine(label: 'Music / Sound', value: 'DJ WHO'),
                    const _CreditLine(label: '3D / Interactive Environments', value: 'DUPUIS*'),
                    const _CreditLine(label: 'AI-assisted development & creative tools', value: 'OpenAI / ChatGPT and other credited tools where applicable'),
                    const SizedBox(height: 16),
                    const SelectableText('www.chanson-a-repondre-uno.scot', style: TextStyle(color: Color(0xFFFFC928), decoration: TextDecoration.underline, decorationColor: Color(0xFFFFC928))),
                    const SizedBox(height: 10),
                    Text('Version: $version', key: const ValueKey('credits-version')),
                    const SizedBox(height: 10),
                    const Text('© 2026 DUPUIS*'),
                    const SizedBox(height: 10),
                    const Text('Technologies: Flutter, Three.js, GoRouter, Provider, Supabase, OpenAI APIs and the supporting packages used by the app.'),
                    const SizedBox(height: 26),
                    FilledButton.tonalIcon(
                      key: const ValueKey('credits-back-to-settings'),
                      onPressed: onBack,
                      icon: const Icon(Icons.arrow_back_rounded),
                      label: const Text('BACK TO SETTINGS'),
                    ),
                  ]),
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
        child: Text.rich(TextSpan(children: [
          TextSpan(text: '$label: ', style: const TextStyle(fontWeight: FontWeight.w800)),
          TextSpan(text: value),
        ])),
      );
}
