import 'package:flutter/material.dart';

import '../widgets/evel_bungee_view.dart';
import '../widgets/home_navigation_button.dart';

class EvelBungeeScreen extends StatelessWidget {
  const EvelBungeeScreen({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: const Color(0xFF090604),
    body: Stack(
      fit: StackFit.expand,
      children: [const EvelBungeeView(), const _EvelBungeeNavigation()],
    ),
  );
}

class _EvelBungeeNavigation extends StatelessWidget {
  const _EvelBungeeNavigation();

  static const _compactBreakpoint = 600.0;
  static const _edgeInset = 12.0;

  // The embedded experience's compact instruction panel occupies the first
  // 187 logical pixels. Keep the shared navigation beneath it with breathing
  // room instead of covering its heading and instructions.
  static const _compactTopClearance = 187.0;

  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, constraints) {
      final compact = constraints.maxWidth < _compactBreakpoint;

      return SafeArea(
        minimum: const EdgeInsets.all(_edgeInset),
        child: Align(
          alignment: compact ? Alignment.topLeft : Alignment.topRight,
          child: Padding(
            padding: EdgeInsets.only(top: compact ? _compactTopClearance : 0),
            child: const HomeNavigationButton(
              key: ValueKey('evel-bungee-navigation'),
            ),
          ),
        ),
      );
    },
  );
}
