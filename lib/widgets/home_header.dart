import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class HomeHeader extends StatelessWidget {
  const HomeHeader({
    required this.onProfile,
    required this.onSettings,
    this.logoPath = 'assets/images/app_logo.png',
    this.showActions = true,
    super.key,
  });
  final VoidCallback onProfile;
  final VoidCallback onSettings;
  final String logoPath;
  final bool showActions;

  @override
  Widget build(BuildContext context) => Stack(
    alignment: Alignment.center,
    children: [
      if (showActions)
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _HeaderButton(
              icon: Icons.person_rounded,
              tooltip: 'Profile',
              onPressed: onProfile,
            ),
            _HeaderButton(
              icon: Icons.settings_rounded,
              tooltip: 'Settings',
              onPressed: onSettings,
            ),
          ],
        ),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 58),
        child: LayoutBuilder(
          builder: (context, constraints) {
            final logoWidth = constraints.maxWidth > 1100
                ? 700.0
                : constraints.maxWidth > 600
                ? constraints.maxWidth * .62
                : constraints.maxWidth * .88;
            final maxHeight = constraints.maxWidth > 600 ? 220.0 : 170.0;
            return Column(
              children: [
                Semantics(
                  image: true,
                  label: 'Chanson à Répondre application logo',
                  child: SizedBox(
                    width: logoWidth,
                    height: maxHeight,
                    child: Image.asset(
                      logoPath,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) {
                        debugPrint(
                          'Unable to load Home logo at $logoPath: $error',
                        );
                        return const Center(
                          child: Text(
                            'Chanson à Répondre',
                            textAlign: TextAlign.center,
                          ),
                        );
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  "L’ART DE LA PAROLE PARTAGÉE",
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: AppTheme.gold,
                    letterSpacing: 1.2,
                  ),
                ),
              ],
            );
          },
        ),
      ),
    ],
  );
}

class _HeaderButton extends StatefulWidget {
  const _HeaderButton({
    required this.icon,
    required this.tooltip,
    required this.onPressed,
  });
  final IconData icon;
  final String tooltip;
  final VoidCallback onPressed;
  @override
  State<_HeaderButton> createState() => _HeaderButtonState();
}

class _HeaderButtonState extends State<_HeaderButton> {
  bool hovered = false;
  @override
  Widget build(BuildContext context) => MouseRegion(
    onEnter: (_) => setState(() => hovered = true),
    onExit: (_) => setState(() => hovered = false),
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: const Color(0xAA090806),
        border: Border.all(color: AppTheme.gold),
        boxShadow: hovered
            ? const [BoxShadow(color: Color(0x66FFC928), blurRadius: 14)]
            : null,
      ),
      child: IconButton(
        tooltip: widget.tooltip,
        onPressed: widget.onPressed,
        icon: Icon(widget.icon, color: AppTheme.brightGold),
      ),
    ),
  );
}
