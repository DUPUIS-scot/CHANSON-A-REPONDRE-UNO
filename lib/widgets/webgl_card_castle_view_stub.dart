import 'package:flutter/material.dart';

import '../models/card_image_model.dart';

class WebGlCardCastleView extends StatelessWidget {
  const WebGlCardCastleView({
    required this.cards,
    required this.focusedCardId,
    required this.shuffleSeed,
    required this.onCardSelected,
    required this.onCardOpened,
    required this.fallback,
    super.key,
  });

  final List<CardImageModel> cards;
  final String? focusedCardId;
  final int shuffleSeed;
  final ValueChanged<String> onCardSelected;
  final ValueChanged<String> onCardOpened;
  final Widget fallback;

  @override
  Widget build(BuildContext context) => fallback;
}
