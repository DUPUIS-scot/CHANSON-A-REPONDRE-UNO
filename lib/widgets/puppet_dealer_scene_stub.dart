import 'package:flutter/material.dart';

import 'played_card_pile.dart';
import 'puppet_dealer_controller.dart';

class PuppetDealerScene extends StatelessWidget {
  const PuppetDealerScene({
    required this.controller,
    required this.quality,
    super.key,
  });

  final PuppetDealerController controller;
  final PuppetQuality quality;

  @override
  Widget build(BuildContext context) => const PlayedCardPile();
}
