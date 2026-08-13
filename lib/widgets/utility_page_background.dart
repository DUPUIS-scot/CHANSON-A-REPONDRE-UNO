import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

class UtilityPageBackground extends StatelessWidget {
  const UtilityPageBackground({required this.child, super.key});

  static const assetPath = 'assets/images/utility_background.png';
  static const backgroundKey = ValueKey('utility-page-background-image');
  static const overlayKey = ValueKey('utility-page-background-overlay');

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final utilityTheme = AppTheme.dark.copyWith(
      scaffoldBackgroundColor: Colors.transparent,
      appBarTheme: AppTheme.dark.appBarTheme.copyWith(
        backgroundColor: AppTheme.darkLeather.withValues(alpha: 0.82),
      ),
      cardTheme: CardThemeData(
        color: AppTheme.leather.withValues(alpha: 0.78),
        elevation: 3,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: BorderSide(color: AppTheme.gold.withValues(alpha: 0.45)),
        ),
      ),
    );

    return Stack(
      key: const ValueKey('utility-page-background'),
      fit: StackFit.expand,
      children: [
        Positioned.fill(
          child: Image.asset(
            assetPath,
            key: backgroundKey,
            fit: BoxFit.cover,
            alignment: Alignment.center,
            excludeFromSemantics: true,
          ),
        ),
        const Positioned.fill(
          child: IgnorePointer(
            child: ColoredBox(key: overlayKey, color: Color(0x4D000000)),
          ),
        ),
        Positioned.fill(
          child: Theme(data: utilityTheme, child: child),
        ),
      ],
    );
  }
}

class UtilityPageScaffold extends StatelessWidget {
  const UtilityPageScaffold({
    required this.appBar,
    required this.body,
    this.panelBody = false,
    super.key,
  });

  final PreferredSizeWidget appBar;
  final Widget body;
  final bool panelBody;

  @override
  Widget build(BuildContext context) => UtilityPageBackground(
    child: Scaffold(
      appBar: appBar,
      body: panelBody
          ? Padding(
              padding: const EdgeInsets.all(12),
              child: UtilityPagePanel(child: body),
            )
          : body,
    ),
  );
}

class UtilityPagePanel extends StatelessWidget {
  const UtilityPagePanel({
    required this.child,
    this.padding = EdgeInsets.zero,
    super.key,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: BoxDecoration(
      color: AppTheme.leather.withValues(alpha: 0.78),
      borderRadius: BorderRadius.circular(10),
      border: Border.all(color: AppTheme.gold.withValues(alpha: 0.45)),
      boxShadow: const [
        BoxShadow(
          color: Color(0x55000000),
          blurRadius: 10,
          offset: Offset(0, 3),
        ),
      ],
    ),
    child: Padding(padding: padding, child: child),
  );
}
