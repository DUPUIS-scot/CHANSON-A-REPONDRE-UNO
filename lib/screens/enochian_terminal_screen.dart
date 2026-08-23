import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/app_router.dart';
import '../theme/app_theme.dart';

class EnochianTerminalScreen extends StatelessWidget {
  const EnochianTerminalScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Stack(
          children: [
            Positioned(
              top: 8,
              left: 8,
              child: IconButton(
                tooltip: 'Home',
                onPressed: () => context.go(AppRoutes.home),
                icon: const Icon(Icons.home_rounded, color: AppTheme.brightGold),
              ),
            ),
            Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.terminal_rounded,
                      size: 58,
                      color: AppTheme.brightGold,
                    ),
                    const SizedBox(height: 18),
                    const Text(
                      'ENOCHIAN TERMINAL',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 26,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2.4,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'AUDIO → BINARY → ENOCHIAN',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppTheme.gold.withValues(alpha: .85),
                        fontSize: 13,
                        letterSpacing: 1.8,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
