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
      children: [
        const EvelBungeeView(),
        const SafeArea(
          child: Align(
            alignment: Alignment.topLeft,
            child: Padding(
              padding: EdgeInsets.all(12),
              child: HomeNavigationButton(),
            ),
          ),
        ),
      ],
    ),
  );
}
