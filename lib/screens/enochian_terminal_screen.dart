import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/app_router.dart';
import '../providers/dj_who_player_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/dj_who_enochian_terminal.dart';

class EnochianTerminalScreen extends StatelessWidget {
  const EnochianTerminalScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final player = context.watch<DjWhoPlayerProvider>();
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
            Positioned.fill(
              top: 64,
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 980),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Icon(
                          Icons.album_rounded,
                          size: 54,
                          color: AppTheme.brightGold,
                        ),
                        const SizedBox(height: 12),
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
                        const SizedBox(height: 8),
                        Text(
                          'DJ WHO SIGNAL → FFT → BINARY → ENOCHIAN',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: AppTheme.gold.withValues(alpha: .85),
                            fontSize: 13,
                            letterSpacing: 1.4,
                          ),
                        ),
                        const SizedBox(height: 20),
                        DjWhoEnochianTerminal(player: player),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
