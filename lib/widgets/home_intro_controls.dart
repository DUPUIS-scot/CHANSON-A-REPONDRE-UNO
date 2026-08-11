import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/home_experience_provider.dart';

class HomeIntroControls extends StatelessWidget {
  const HomeIntroControls({super.key});

  @override
  Widget build(BuildContext context) {
    final experience = context.watch<HomeExperienceProvider>();
    if (experience.stage == HomeStage.home) return const SizedBox.shrink();
    return Align(
      alignment: Alignment.bottomCenter,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: FilledButton.icon(
            onPressed: experience.openCurtains,
            icon: const Icon(Icons.theater_comedy_rounded),
            label: const Text('ENTER'),
          ),
        ),
      ),
    );
  }
}
