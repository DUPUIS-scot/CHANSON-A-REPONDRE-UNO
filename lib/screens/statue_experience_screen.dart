import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/app_router.dart';
import '../widgets/statue_scene_view.dart';

class StatueExperienceScreen extends StatelessWidget {
  const StatueExperienceScreen({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: const Color(0xFF090604),
    body: Stack(
      fit: StackFit.expand,
      children: [
        const StatueSceneView(),
        SafeArea(
          child: Align(
            alignment: Alignment.topLeft,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: FilledButton.tonalIcon(
                key: const ValueKey('statue-back-to-settings'),
                onPressed: () => context.go(AppRoutes.settings),
                icon: const Icon(Icons.arrow_back_rounded),
                label: const Text('BACK TO SETTINGS'),
              ),
            ),
          ),
        ),
      ],
    ),
  );
}

