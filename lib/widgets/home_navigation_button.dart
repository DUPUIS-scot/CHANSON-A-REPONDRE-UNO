import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/app_router.dart';
import '../providers/game_provider.dart';
import '../services/navigation_guard_service.dart';
import '../theme/app_design_tokens.dart';
import '../theme/app_theme.dart';
import 'dj_who_avatar.dart';

class HomeNavigationButton extends StatefulWidget {
  const HomeNavigationButton({
    this.confirmActiveGame = false,
    this.showDjWho = true,
    this.theatricalSplit = false,
    this.beforeNavigate,
    this.navigationGuard,
    super.key,
  });

  final bool confirmActiveGame;
  final bool showDjWho;
  final bool theatricalSplit;
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

  Future<void> navigateDjWho() async {
    if (widget.navigationGuard != null && !await widget.navigationGuard!()) {
      return;
    }
    if (!mounted) return;
    if (widget.confirmActiveGame) {
      final game = context.read<GameProvider>();
      if (game.state != null) {
        final choice = await NavigationGuardService.confirm(
          context,
          title: 'Open DJ WHO?',
          message: 'Your current game will be saved so you can continue later.',
          stayLabel: 'Cancel',
          discardLabel: 'Continue Without Saving',
          saveLabel: 'Save and Continue',
        );
        if (choice == GuardChoice.stay || !mounted) return;
        if (choice == GuardChoice.save) await game.saveCurrent();
      }
    }
    widget.beforeNavigate?.call();
    if (mounted) context.go(AppRoutes.djWhoVideos);
  }

  @override
  Widget build(BuildContext context) {
    final currentPath =
        AppRouter.router.routeInformationProvider.value.uri.path;
    final isDjWhoActive = currentPath == AppRoutes.djWhoVideos;

    return SizedBox(
      width: widget.theatricalSplit ? double.infinity : null,
      height: AppTouchTarget.minimum,
      child: Row(
        mainAxisSize: widget.theatricalSplit
            ? MainAxisSize.max
            : MainAxisSize.min,
        mainAxisAlignment: widget.theatricalSplit
            ? MainAxisAlignment.spaceBetween
            : MainAxisAlignment.start,
        children: [
          _HomeControl(
            theatrical: widget.theatricalSplit,
            hovered: hovered,
            focused: focused,
            onHover: (value) => setState(() => hovered = value),
            onFocus: (value) => setState(() => focused = value),
            onPressed: navigateHome,
          ),
          if (widget.showDjWho) ...[
            if (!widget.theatricalSplit)
              const SizedBox(width: AppSpacing.small),
            _DjWhoControl(
              theatrical: widget.theatricalSplit,
              active: isDjWhoActive,
              hovered: djHovered,
              focused: djFocused,
              onHover: (value) => setState(() => djHovered = value),
              onFocus: (value) => setState(() => djFocused = value),
              onPressed: navigateDjWho,
            ),
          ],
        ],
      ),
    );
  }
}

class _HomeControl extends StatelessWidget {
  const _HomeControl({
    required this.theatrical,
    required this.hovered,
    required this.focused,
    required this.onHover,
    required this.onFocus,
    required this.onPressed,
  });

  final bool theatrical;
  final bool hovered;
  final bool focused;
  final ValueChanged<bool> onHover;
  final ValueChanged<bool> onFocus;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.sizeOf(context).width;
    final width = theatrical
        ? screenWidth < 380
              ? 92.0
              : screenWidth < 600
              ? 110.0
              : 170.0
        : AppTouchTarget.minimum;
    final radius = BorderRadius.circular(theatrical ? 15 : 999);
    final shape = theatrical
        ? RoundedRectangleBorder(borderRadius: radius)
        : const CircleBorder();
    return Semantics(
      button: true,
      label: 'Return to Home',
      child: MouseRegion(
        onEnter: (_) => onHover(true),
        onExit: (_) => onHover(false),
        child: Focus(
          onFocusChange: onFocus,
          child: SizedBox(
            width: width,
            height: AppTouchTarget.minimum,
            child: AnimatedContainer(
              duration: AppMotion.responsive(context, AppMotion.quick),
              decoration: BoxDecoration(
                color: hovered
                    ? const Color(0xDD33210F)
                    : const Color(0xEE080604),
                shape: theatrical ? BoxShape.rectangle : BoxShape.circle,
                borderRadius: theatrical ? radius : null,
                border: Border.all(
                  color: focused ? AppTheme.brightGold : AppTheme.gold,
                  width: focused ? 2 : 1.2,
                ),
                boxShadow: hovered
                    ? const [
                        BoxShadow(color: Color(0x66FFC928), blurRadius: 12),
                      ]
                    : null,
              ),
              child: Tooltip(
                message: 'Return to Home',
                child: TextButton(
                  onPressed: onPressed,
                  style: TextButton.styleFrom(
                    foregroundColor: AppTheme.brightGold,
                    minimumSize: Size(width, AppTouchTarget.minimum),
                    padding: theatrical
                        ? const EdgeInsets.symmetric(horizontal: 10)
                        : EdgeInsets.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    shape: shape,
                  ),
                  child: theatrical
                      ? const FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.home_rounded, size: 24),
                              SizedBox(width: 9),
                              Text(
                                'HOME',
                                style: TextStyle(
                                  fontFamily: 'Georgia',
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: .7,
                                ),
                              ),
                            ],
                          ),
                        )
                      : const Icon(Icons.home_rounded, size: 22),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _DjWhoControl extends StatelessWidget {
  const _DjWhoControl({
    required this.theatrical,
    required this.active,
    required this.hovered,
    required this.focused,
    required this.onHover,
    required this.onFocus,
    required this.onPressed,
  });

  final bool theatrical;
  final bool active;
  final bool hovered;
  final bool focused;
  final ValueChanged<bool> onHover;
  final ValueChanged<bool> onFocus;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final screenWidth = MediaQuery.sizeOf(context).width;
    final width = theatrical
        ? screenWidth < 380
              ? 92.0
              : screenWidth < 600
              ? 110.0
              : 170.0
        : AppTouchTarget.minimum;
    final radius = BorderRadius.circular(theatrical ? 15 : 999);
    final shape = theatrical
        ? RoundedRectangleBorder(borderRadius: radius)
        : const CircleBorder();
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
            height: AppTouchTarget.minimum,
            child: AnimatedContainer(
              duration: AppMotion.responsive(context, AppMotion.quick),
              decoration: BoxDecoration(
                color: active
                    ? colors.primaryContainer.withValues(alpha: 0.72)
                    : hovered
                    ? const Color(0xDD33210F)
                    : const Color(0xEE080604),
                shape: theatrical ? BoxShape.rectangle : BoxShape.circle,
                borderRadius: theatrical ? radius : null,
                border: Border.all(
                  color: focused || active ? colors.primary : AppTheme.gold,
                  width: focused || active ? 2 : 1.2,
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
                    minimumSize: Size(width, AppTouchTarget.minimum),
                    padding: theatrical
                        ? const EdgeInsets.symmetric(horizontal: 10)
                        : EdgeInsets.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    shape: shape,
                  ),
                  child: theatrical
                      ? const FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text(
                            'DJ WHO',
                            style: TextStyle(
                              color: AppTheme.brightGold,
                              fontFamily: 'Georgia',
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              letterSpacing: .7,
                            ),
                          ),
                        )
                      : const DjWhoAvatar(size: 32),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
