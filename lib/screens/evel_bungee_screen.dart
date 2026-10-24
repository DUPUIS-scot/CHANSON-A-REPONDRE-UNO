import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/app_router.dart';
import '../widgets/evel_bungee_view.dart';

class EvelBungeeScreen extends StatelessWidget {
  const EvelBungeeScreen({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: const Color(0xFF090604),
    body: Stack(
      fit: StackFit.expand,
      children: [
        const EvelBungeeView(),
        SafeArea(
          child: Align(
            alignment: Alignment.topLeft,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: FilledButton.tonalIcon(
                key: const ValueKey('evel-bungee-back-home'),
                onPressed: () => context.go(AppRoutes.home),
                icon: const Icon(Icons.arrow_back_rounded),
                label: const Text('BACK TO HOME'),
              ),
            ),
          ),
        ),
      ],
    ),
  );
}
