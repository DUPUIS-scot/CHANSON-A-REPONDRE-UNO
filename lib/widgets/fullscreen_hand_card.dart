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
    super.key,
  });

  final CardImageModel card;
  final int position;
  final int total;
  final bool faceUp;

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
    final title = widget.faceUp ? widget.card.displayTitle : 'Face-down card';
    return Semantics(
      label:
          'Card ${widget.position} of ${widget.total}, $title, '
          '${widget.card.isFavourite ? 'favourite' : 'not favourite'}, '
          '${widget.card.transcription == null ? 'not transcribed' : 'transcribed'}',
      child: Center(
        child: GestureDetector(
          onDoubleTap: _resetZoom,
          child: InteractiveViewer(
            transformationController: _transform,
            minScale: 1,
            maxScale: 5,
            panEnabled: _zoomed,
            onInteractionEnd: (_) {
              final zoomed = _transform.value.getMaxScaleOnAxis() > 1.01;
              if (zoomed != _zoomed) setState(() => _zoomed = zoomed);
            },
            child: Padding(
              padding: const EdgeInsets.fromLTRB(72, 88, 72, 76),
              child: Hero(
                tag: 'play-hand-card-${widget.card.id}',
                child: AspectRatio(
                  aspectRatio: widget.card.aspectRatio,
                  child: widget.faceUp
                      ? Stack(
                          fit: StackFit.expand,
                          children: [
                            StoredImage(
                              source: widget.card.imagePath,
                              fit: BoxFit.contain,
                              errorBuilder: (_, _, _) => const _MissingCard(),
                            ),
                            Positioned(
                              left: 12,
                              top: 12,
                              child: CategoryBadge(
                                category: widget.card.category,
                              ),
                            ),
                          ],
                        )
                      : Image.asset(
                          cardCategoryFor(widget.card.category).versoAsset,
                          fit: BoxFit.contain,
                          errorBuilder: (_, _, _) => Image.asset(
                            'assets/images/card_back.png',
                            fit: BoxFit.contain,
                            errorBuilder: (_, _, _) => const _MissingCard(),
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
