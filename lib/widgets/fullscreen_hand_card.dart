import 'package:flutter/material.dart';

import '../data/card_categories.dart';
import '../models/card_image_model.dart';
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
        child: ClipRect(
          child: InteractiveViewer(
            transformationController: _transform,
            minScale: 1,
            maxScale: 5,
            panEnabled: _zoomed,
            constrained: true,
            boundaryMargin: EdgeInsets.zero,
            clipBehavior: Clip.hardEdge,
            onInteractionEnd: (_) {
              final zoomed = _transform.value.getMaxScaleOnAxis() > 1.01;
              if (zoomed != _zoomed) setState(() => _zoomed = zoomed);
            },
            child: SizedBox.expand(
              child: Hero(
                tag: 'play-hand-card-${widget.card.id}',
                child: widget.faceUp
                    ? StoredImage(
                        source: widget.card.imagePath,
                        fit: BoxFit.contain,
                        errorBuilder: (_, _, _) => const _MissingCard(),
                      )
                    : widget.backImagePath.isNotEmpty
                    ? Image.asset(
                        widget.backImagePath,
                        fit: BoxFit.contain,
                        errorBuilder: (_, _, _) => const _MissingCard(),
                      )
                    : Image.asset(
                        cardCategoryFor(widget.card.category).versoAsset,
                        fit: BoxFit.contain,
                        errorBuilder: (_, _, _) => const _MissingCard(),
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
