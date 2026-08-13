import 'package:flutter/material.dart';

import '../models/card_image_model.dart';

class WebGlCardCastleView extends StatelessWidget {
  const WebGlCardCastleView({
    required this.cards,
    required this.matchingCardIds,
    required this.focusedCardId,
    required this.shuffleSeed,
    required this.activeCategory,
    required this.fullscreenRequestId,
    required this.onCardSelected,
    required this.onCardOpened,
    required this.onFullscreenChanged,
    required this.fallback,
    super.key,
  });

  final List<CardImageModel> cards;
  final Set<String> matchingCardIds;
  final String? focusedCardId;
  final int shuffleSeed;
  final String activeCategory;
  final int fullscreenRequestId;
  final ValueChanged<String> onCardSelected;
  final Future<void> Function(String) onCardOpened;
  final ValueChanged<bool> onFullscreenChanged;
  final Widget fallback;

  @override
  Widget build(BuildContext context) => fallback;
}
