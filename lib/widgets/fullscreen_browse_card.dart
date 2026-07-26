import 'package:flutter/material.dart';

import '../models/card_image_model.dart';
import 'stored_image.dart';
import 'zoomable_card_view.dart';

class FullscreenBrowseCard extends StatelessWidget {
  const FullscreenBrowseCard({
    required this.card,
    required this.position,
    required this.total,
    required this.deckName,
    required this.onZoomChanged,
    super.key,
  });
  final CardImageModel card;
  final int position;
  final int total;
  final String deckName;
  final ValueChanged<bool> onZoomChanged;

  @override
  Widget build(BuildContext context) => Semantics(
    label:
        'Card $position of $total, ${card.displayTitle}, $deckName, '
        '${card.isFavourite ? 'favourite' : 'not favourite'}, '
        '${card.transcription == null && card.cleanedTranscription == null ? 'not transcribed' : 'transcribed'}',
    child: ZoomableCardView(
      onZoomChanged: onZoomChanged,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(72, 84, 72, 72),
        child: Center(
          child: Hero(
            tag: 'browse-hand-card-${card.id}',
            child: AspectRatio(
              aspectRatio: card.aspectRatio,
              child: StoredImage(
                source: card.imagePath,
                fit: BoxFit.contain,
                errorBuilder: (_, _, _) => const ColoredBox(
                  color: Color(0xFF24170F),
                  child: Center(
                    child: Icon(Icons.broken_image_outlined, size: 64),
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
