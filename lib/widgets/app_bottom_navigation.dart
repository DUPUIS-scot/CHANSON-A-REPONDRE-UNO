import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../core/app_router.dart';

class AppBottomNavigation extends StatelessWidget {
  const AppBottomNavigation({this.selectedIndex = 0, super.key});
  final int selectedIndex;

  void select(BuildContext context, int index) {
    if (index == 4) {
      showModalBottomSheet<void>(
        context: context,
        builder: (sheetContext) => SafeArea(
          child: Wrap(
            children: [
              ListTile(
                leading: const Icon(Icons.search),
                title: const Text('Search'),
                onTap: () {
                  Navigator.pop(sheetContext);
                  context.go(AppRoutes.search);
                },
              ),
              ListTile(
                leading: const Icon(Icons.smart_toy),
                title: const Text('AI Chat'),
                onTap: () {
                  Navigator.pop(sheetContext);
                  context.go(AppRoutes.aiChat);
                },
              ),
              ListTile(
                leading: const Icon(Icons.gavel),
                title: const Text('Rules'),
                onTap: () {
                  Navigator.pop(sheetContext);
                  context.go(AppRoutes.rules);
                },
              ),
              ListTile(
                leading: const Icon(Icons.settings),
                title: const Text('Settings'),
                onTap: () {
                  Navigator.pop(sheetContext);
                  context.go(AppRoutes.settings);
                },
              ),
              ListTile(
                leading: const Icon(Icons.person),
                title: const Text('Profile'),
                onTap: () {
                  Navigator.pop(sheetContext);
                  context.go('/profile');
                },
              ),
            ],
          ),
        ),
      );
      return;
    }
    context.go(switch (index) {
      0 => AppRoutes.home,
      1 => AppRoutes.decks,
      2 => AppRoutes.play,
      3 => AppRoutes.journal,
      _ => AppRoutes.home,
    });
  }

  @override
  Widget build(BuildContext context) => NavigationBar(
    selectedIndex: selectedIndex,
    onDestinationSelected: (index) => select(context, index),
    destinations: const [
      NavigationDestination(icon: Icon(Icons.home_rounded), label: 'HOME'),
      NavigationDestination(icon: Icon(Icons.style_rounded), label: 'DECK'),
      NavigationDestination(
        icon: Icon(Icons.play_circle_fill, size: 40),
        label: 'PLAY',
      ),
      NavigationDestination(icon: Icon(Icons.book_rounded), label: 'JOURNAL'),
      NavigationDestination(
        icon: Icon(Icons.more_horiz_rounded),
        label: 'MORE',
      ),
    ],
  );
}
