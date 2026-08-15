import 'package:flutter/material.dart';

import '../data/card_categories.dart';
import '../models/card_image_model.dart';
import 'category_badge.dart';
import 'stored_image.dart';

class FullscreenHandCard extends StatefulWidget {
  const FullscreenHandCard({
    required this.card,
    required this.position,
    required this.total,
    required this.faceUp,
    this.backImagePath = '',
    super.key,
  });

  final CardImageModel card;
  final int position;
  final int total;
  final bool faceUp;
  final String backImagePath;

  @override
  State<FullscreenHandCard> createState() => _FullscreenHandCardState();
}

class _FullscreenHandCardState extends State<FullscreenHandCard> {
  final _transform = TransformationController();
  bool _zoomed = false;

  @override
  void dispose() {
    _transform.dispose();
    super.dispose();
  }

  void _resetZoom() {
    _transform.value = Matrix4.identity();
    if (_zoomed) setState(() => _zoomed = false);
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label:
          'Card ${widget.position} of ${widget.total}, '
          '${widget.card.category}, ${widget.faceUp ? 'face up' : 'face down'}, '
          '${widget.card.isFavourite ? 'favourite' : 'not favourite'}',
      child: GestureDetector(
        onDoubleTap: _resetZoom,
        child: InteractiveViewer(
          transformationController: _transform,
          minScale: 1,
          maxScale: 5,
          panEnabled: _zoomed,
          boundaryMargin: const EdgeInsets.all(24),
          onInteractionEnd: (_) {
            final zoomed = _transform.value.getMaxScaleOnAxis() > 1.01;
            if (zoomed != _zoomed) setState(() => _zoomed = zoomed);
          },
          child: SizedBox.expand(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 72, 12, 52),
              child: Hero(
                tag: 'play-hand-card-${widget.card.id}',
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (widget.faceUp)
                      StoredImage(
                        source: widget.card.imagePath,
                        fit: BoxFit.contain,
                        errorBuilder: (_, _, _) => const _MissingCard(),
                      )
                    else if (widget.backImagePath.isNotEmpty)
                      Image.asset(
                        widget.backImagePath,
                        fit: BoxFit.contain,
                        errorBuilder: (_, _, _) => const _MissingCard(),
                      )
                    else
                      Image.asset(
                        cardCategoryFor(widget.card.category).versoAsset,
                        fit: BoxFit.contain,
                        errorBuilder: (_, _, _) => const _MissingCard(),
                      ),
                    if (widget.faceUp)
                      Positioned(
                        left: 12,
                        top: 12,
                        child: CategoryBadge(category: widget.card.category),
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
}

class _MissingCard extends StatelessWidget {
  const _MissingCard();

  @override
  Widget build(BuildContext context) => const ColoredBox(
    color: Color(0xFF35170F),
    child: Center(
      child: Icon(Icons.broken_image_outlined, color: Colors.white70, size: 64),
    ),
  );
}
