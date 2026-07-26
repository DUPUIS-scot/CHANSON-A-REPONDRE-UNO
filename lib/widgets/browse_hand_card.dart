import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../models/card_image_model.dart';
import '../theme/app_theme.dart';
import 'category_badge.dart';
import 'stored_image.dart';

class BrowseHandCard extends StatefulWidget {
  const BrowseHandCard({
    required this.card,
    required this.position,
    required this.total,
    required this.deckName,
    required this.rotationDegrees,
    required this.selected,
    required this.onTap,
    required this.onOpen,
    this.onLongPress,
    super.key,
  });
  final CardImageModel card;
  final int position;
  final int total;
  final String deckName;
  final double rotationDegrees;
  final bool selected;
  final VoidCallback onTap;
  final VoidCallback onOpen;
  final VoidCallback? onLongPress;

  @override
  State<BrowseHandCard> createState() => _BrowseHandCardState();
}

class _BrowseHandCardState extends State<BrowseHandCard> {
  bool hovered = false;
  bool focused = false;

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    selected: widget.selected,
    label:
        'Card ${widget.position} of ${widget.total}, ${widget.card.displayTitle}, ${widget.deckName}, ${widget.selected ? 'selected' : 'not selected'}, ${widget.card.isFavourite ? 'favourite' : 'not favourite'}, ${widget.card.transcriptionReviewed ? 'transcribed' : 'not transcribed'}. Press and hold to open the five-card full-screen viewer.',
    child: FocusableActionDetector(
      mouseCursor: SystemMouseCursors.click,
      onShowHoverHighlight: (value) => setState(() => hovered = value),
      onShowFocusHighlight: (value) => setState(() => focused = value),
      child: AnimatedSlide(
        offset: Offset(
          0,
          widget.selected
              ? -.10
              : hovered
              ? -.05
              : 0,
        ),
        duration: const Duration(milliseconds: 170),
        child: AnimatedScale(
          scale: hovered ? 1.03 : 1,
          duration: const Duration(milliseconds: 170),
          child: Transform.rotate(
            angle: widget.rotationDegrees * math.pi / 180,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 170),
              decoration: BoxDecoration(
                color: const Color(0xFF090806),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: widget.selected || focused
                      ? AppTheme.brightGold
                      : AppTheme.gold,
                  width: widget.selected || focused ? 3 : 1,
                ),
                boxShadow: widget.selected || hovered
                    ? const [
                        BoxShadow(color: Color(0x88FFC928), blurRadius: 18),
                      ]
                    : null,
              ),
              clipBehavior: Clip.antiAlias,
              child: GestureDetector(
                onTap: widget.onTap,
                onDoubleTap: widget.onOpen,
                onLongPress: widget.onLongPress,
                child: AspectRatio(
                  aspectRatio: widget.card.aspectRatio,
                  child: Hero(
                    tag: 'browse-hand-card-${widget.card.id}',
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        StoredImage(
                          source: widget.card.imagePath,
                          fit: BoxFit.contain,
                          errorBuilder: (_, _, _) => const ColoredBox(
                            color: Color(0xFF24170F),
                            child: Center(
                              child: Icon(
                                Icons.broken_image_outlined,
                                color: AppTheme.gold,
                                size: 42,
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          left: 8,
                          top: 8,
                          child: CategoryBadge(
                            category: widget.card.category,
                            compact: true,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}
