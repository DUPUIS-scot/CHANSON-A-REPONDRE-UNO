import 'package:flutter/material.dart';

import 'social_share_counter_tile.dart';

class SettingsSection extends StatelessWidget {
  const SettingsSection({
    required this.title,
    required this.icon,
    required this.children,
    this.initiallyExpanded = false,
    super.key,
  });
  final String title;
  final IconData icon;
  final List<Widget> children;
  final bool initiallyExpanded;

  @override
  Widget build(BuildContext context) => Card(
    child: ExpansionTile(
      leading: Icon(icon),
      title: Text(title),
      initiallyExpanded: initiallyExpanded,
      childrenPadding: const EdgeInsets.only(bottom: 8),
      children: [
        ...children,
        if (title == 'VISITORS') const SocialShareCounterTile(),
      ],
    ),
  );
}
