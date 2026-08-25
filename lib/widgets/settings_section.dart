import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/app_router.dart';
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
  Widget build(BuildContext context) {
    if (title == 'INTERACTIVE') return const SizedBox.shrink();

    if (title == 'GÉNÉRIQUE / CREDITS') {
      return Card(
        child: ListTile(
          leading: Icon(icon),
          title: Text(title),
          trailing: const Icon(Icons.chevron_right_rounded),
          onTap: () => context.push(AppRoutes.credits),
        ),
      );
    }

    return Card(
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
}
