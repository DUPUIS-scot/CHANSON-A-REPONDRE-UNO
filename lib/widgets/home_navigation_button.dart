import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/app_router.dart';
import '../providers/game_provider.dart';
import '../services/navigation_guard_service.dart';
import '../theme/app_theme.dart';
import 'dj_who_avatar.dart';

class HomeNavigationButton extends StatefulWidget {
  const HomeNavigationButton({
    this.confirmActiveGame = false,
    this.showDjWho = true,
    this.beforeNavigate,
    this.navigationGuard,
    super.key,
  });

  final bool confirmActiveGame;
  final bool showDjWho;
  final VoidCallback? beforeNavigate;
  final Future<bool> Function()? navigationGuard;

  @override
  State<HomeNavigationButton> createState() => _HomeNavigationButtonState();
}

class _HomeNavigationButtonState extends State<HomeNavigationButton> {
  bool hovered = false;
  bool focused = false;
  bool djHovered = false;
  bool djFocused = false;

  Future<void> navigateHome() async {
    if (widget.navigationGuard != null && !await widget.navigationGuard!()) {
      return;
    }
    if (!mounted) return;
    if (widget.confirmActiveGame) {
      final game = context.read<GameProvider>();
      if (game.state != null) {
        final choice = await NavigationGuardService.confirm(
          context,
          title: 'Return to Home?',
          message: 'Your current game will be saved so you can continue later.',
          stayLabel: 'Cancel',
          discardLabel: 'Return Without Saving',
          saveLabel: 'Save and Return',
        );
        if (choice == GuardChoice.stay || !mounted) return;
        if (choice == GuardChoice.save) await game.saveCurrent();
      }
    }
    widget.beforeNavigate?.call();
    if (mounted) context.go(AppRoutes.home);
  }

  @override
  Widget build(BuildContext context) {
    final currentPath =
        AppRouter.router.routeInformationProvider.value.uri.path;
    final isDjWhoActive = currentPath == AppRoutes.djWhoVideos;

    final showLabel = MediaQuery.sizeOf(context).width >= 600;
    final djWidth = showLabel ? 152.0 : 48.0;
    return SizedBox(
      height: 48,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _HomeControl(
            hovered: hovered,
            focused: focused,
            onHover: (value) => setState(() => hovered = value),
            onFocus: (value) => setState(() => focused = value),
            onPressed: navigateHome,
          ),
          if (widget.showDjWho) ...[
            const SizedBox(width: 8),
            _DjWhoControl(
              active: isDjWhoActive,
              hovered: djHovered,
              focused: djFocused,
              showLabel: showLabel,
              width: djWidth,
              onHover: (value) => setState(() => djHovered = value),
              onFocus: (value) => setState(() => djFocused = value),
              onPressed: () => context.go(AppRoutes.djWhoVideos),
            ),
          ],
        ],
      ),
    );
  }
}

class _HomeControl extends StatelessWidget {
  const _HomeControl({
    required this.hovered,
    required this.focused,
    required this.onHover,
    required this.onFocus,
    required this.onPressed,
  });

  final bool hovered;
  final bool focused;
  final ValueChanged<bool> onHover;
  final ValueChanged<bool> onFocus;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    label: 'Return to Home',
    child: MouseRegion(
      onEnter: (_) => onHover(true),
      onExit: (_) => onHover(false),
      child: Focus(
        onFocusChange: onFocus,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
          decoration: BoxDecoration(
            color: hovered ? const Color(0xDD33210F) : const Color(0xAA100C08),
            shape: BoxShape.circle,
            border: Border.all(
              color: focused ? AppTheme.brightGold : AppTheme.gold,
              width: focused ? 2 : 1,
            ),
            boxShadow: hovered
                ? const [BoxShadow(color: Color(0x66FFC928), blurRadius: 12)]
                : null,
          ),
          child: IconButton(
            tooltip: 'Return to Home',
            onPressed: onPressed,
            icon: const Icon(Icons.home_rounded, color: AppTheme.brightGold),
          ),
        ),
      ),
    ),
  );
}

class _DjWhoControl extends StatelessWidget {
  const _DjWhoControl({
    required this.active,
    required this.hovered,
    required this.focused,
    required this.showLabel,
    required this.width,
    required this.onHover,
    required this.onFocus,
    required this.onPressed,
  });

  final bool active;
  final bool hovered;
  final bool focused;
  final bool showLabel;
  final double width;
  final ValueChanged<bool> onHover;
  final ValueChanged<bool> onFocus;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final foreground = active ? colors.onPrimaryContainer : colors.primary;
    return Semantics(
      button: true,
      selected: active,
      label: 'Open DJ WHO Videos',
      child: MouseRegion(
        onEnter: (_) => onHover(true),
        onExit: (_) => onHover(false),
        child: Focus(
          onFocusChange: onFocus,
          child: SizedBox(
            width: width,
            height: 48,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              decoration: BoxDecoration(
                color: active
                    ? colors.primaryContainer.withValues(alpha: 0.72)
                    : hovered
                    ? const Color(0xDD33210F)
                    : const Color(0xAA100C08),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: focused || active ? colors.primary : AppTheme.gold,
                  width: focused || active ? 2 : 1,
                ),
                boxShadow: hovered || active
                    ? const [
                        BoxShadow(color: Color(0x66FFC928), blurRadius: 12),
                      ]
                    : null,
              ),
              child: Tooltip(
                message: 'Open DJ WHO Videos',
                child: TextButton(
                  onPressed: onPressed,
                  style: TextButton.styleFrom(
                    foregroundColor: foreground,
                    minimumSize: const Size(48, 48),
                    padding: EdgeInsets.symmetric(
                      horizontal: showLabel ? 12 : 0,
                    ),
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    textStyle: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const DjWhoAvatar(size: 32),
                      if (showLabel) ...[
                        const SizedBox(width: 8),
                        const Text('DJ WHO'),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
