import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

class HomeMenuCard extends StatefulWidget {
  const HomeMenuCard({
    required this.icon,
    required this.title,
    required this.description,
    required this.accent,
    required this.backgroundAsset,
    required this.backgroundAlignment,
    this.overlayOpacity = .52,
    required this.onTap,
    super.key,
  });

  final IconData icon;
  final String title;
  final String description;
  final Color accent;
  final String backgroundAsset;
  final Alignment backgroundAlignment;
  final double overlayOpacity;
  final VoidCallback onTap;

  @override
  State<HomeMenuCard> createState() => _HomeMenuCardState();
}

class _HomeMenuCardState extends State<HomeMenuCard> {
  bool hovered = false;
  bool pressed = false;

  @override
  Widget build(BuildContext context) {
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    return Semantics(
      button: true,
      label: '${widget.title}. ${widget.description}',
      child: FocusableActionDetector(
        mouseCursor: SystemMouseCursors.click,
        onShowHoverHighlight: (value) => setState(() => hovered = value),
        child: AnimatedScale(
          scale: pressed
              ? .98
              : hovered
              ? 1.018
              : 1,
          duration: reduceMotion
              ? Duration.zero
              : const Duration(milliseconds: 150),
          child: AnimatedContainer(
            duration: reduceMotion
                ? Duration.zero
                : const Duration(milliseconds: 180),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
              border: Border.all(
                color: hovered ? AppTheme.brightGold : AppTheme.gold,
                width: hovered ? 1.8 : 1.1,
              ),
              boxShadow: hovered
                  ? [
                      BoxShadow(
                        color: widget.accent.withValues(alpha: .28),
                        blurRadius: 18,
                      ),
                    ]
                  : null,
            ),
            child: Material(
              color: Colors.transparent,
              borderRadius: BorderRadius.circular(AppTheme.radiusMedium - 1),
              clipBehavior: Clip.antiAlias,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  IgnorePointer(
                    child: AnimatedScale(
                      scale: hovered ? 1.04 : 1,
                      duration: reduceMotion
                          ? Duration.zero
                          : const Duration(milliseconds: 180),
                      curve: Curves.easeOut,
                      child: Image.asset(
                        widget.backgroundAsset,
                        fit: BoxFit.cover,
                        alignment: widget.backgroundAlignment,
                        filterQuality: FilterQuality.medium,
                        errorBuilder: (context, error, stackTrace) =>
                            const ColoredBox(color: Color(0xFF12110E)),
                      ),
                    ),
                  ),
                  IgnorePointer(
                    child: ColoredBox(
                      color: Colors.black.withValues(
                        alpha: widget.overlayOpacity,
                      ),
                    ),
                  ),
                  InkWell(
                    onTap: widget.onTap,
                    onHighlightChanged: (value) =>
                        setState(() => pressed = value),
                    splashColor: widget.accent.withValues(alpha: .24),
                    focusColor: AppTheme.gold.withValues(alpha: .14),
                    child: Padding(
                      padding: const EdgeInsets.all(AppTheme.spaceMd),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            widget.icon,
                            color: widget.accent,
                            size: 42,
                            shadows: const [
                              Shadow(
                                blurRadius: 6,
                                offset: Offset(0, 2),
                                color: Colors.black,
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Text(
                            widget.title.toUpperCase(),
                            textAlign: TextAlign.center,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.titleMedium
                                ?.copyWith(
                                  color: widget.accent,
                                  fontWeight: FontWeight.w800,
                                  shadows: const [
                                    Shadow(
                                      blurRadius: 6,
                                      offset: Offset(0, 2),
                                      color: Colors.black,
                                    ),
                                  ],
                                ),
                          ),
                          const SizedBox(height: 6),
                          Flexible(
                            child: Text(
                              widget.description,
                              textAlign: TextAlign.center,
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(
                                    color: AppTheme.parchment.withValues(
                                      alpha: .9,
                                    ),
                                    shadows: const [
                                      Shadow(
                                        blurRadius: 4,
                                        offset: Offset(0, 1),
                                        color: Colors.black,
                                      ),
                                    ],
                                  ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
