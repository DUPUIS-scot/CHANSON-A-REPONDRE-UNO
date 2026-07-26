import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/card_image_model.dart';
import '../theme/app_theme.dart';
import 'stored_image.dart';

class MediumCardThumbnail extends StatefulWidget {
  const MediumCardThumbnail({required this.card, required this.onTap, super.key});

  static const double width = 156;
  static const double artworkAspectRatio = 0.7;

  final CardImageModel card;
  final VoidCallback onTap;

  @override
  State<MediumCardThumbnail> createState() => _MediumCardThumbnailState();
}

class _MediumCardThumbnailState extends State<MediumCardThumbnail> {
  bool hovered = false;
  bool focused = false;

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    label: 'Open linked card: ${widget.card.displayTitle}',
    child: Tooltip(
      message: widget.card.displayTitle,
      child: FocusableActionDetector(
        mouseCursor: SystemMouseCursors.click,
        onShowHoverHighlight: (value) => setState(() => hovered = value),
        onShowFocusHighlight: (value) => setState(() => focused = value),
        shortcuts: const {
          SingleActivator(LogicalKeyboardKey.enter): ActivateIntent(),
          SingleActivator(LogicalKeyboardKey.space): ActivateIntent(),
        },
        actions: {
          ActivateIntent: CallbackAction<ActivateIntent>(
            onInvoke: (_) {
              widget.onTap();
              return null;
            },
          ),
        },
        child: AnimatedScale(
          scale: hovered ? 1.025 : 1,
          duration: const Duration(milliseconds: 140),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 140),
            width: MediumCardThumbnail.width,
            decoration: BoxDecoration(
              color: const Color(0xEE15110D),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: focused ? AppTheme.brightGold : AppTheme.gold,
                width: focused ? 2 : 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: hovered ? const Color(0x77000000) : const Color(0x44000000),
                  blurRadius: hovered ? 14 : 7,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              onTap: widget.onTap,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: [
                  AspectRatio(
                    aspectRatio: MediumCardThumbnail.artworkAspectRatio,
                    child: StoredImage(
                      source: widget.card.path,
                      fit: BoxFit.contain,
                      errorBuilder: (_, _, _) => _ImageFallback(
                        title: widget.card.displayTitle,
                        category: widget.card.category,
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.card.displayTitle,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          widget.card.category.isEmpty
                              ? 'Uncategorised'
                              : widget.card.category,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: AppTheme.brightGold,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

class _ImageFallback extends StatelessWidget {
  const _ImageFallback({required this.title, required this.category});
  final String title;
  final String category;

  @override
  Widget build(BuildContext context) => ColoredBox(
    color: const Color(0xFF241A12),
    child: Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.image_not_supported_outlined, size: 34),
          const SizedBox(height: 8),
          Text(title, textAlign: TextAlign.center, maxLines: 3),
          if (category.isNotEmpty) Text(category, textAlign: TextAlign.center),
          const SizedBox(height: 6),
          const Text('No image available', textAlign: TextAlign.center),
        ],
      ),
    ),
  );
}
