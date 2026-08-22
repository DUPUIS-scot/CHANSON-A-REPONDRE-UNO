import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../core/app_router.dart';
import '../models/card_image_model.dart';
import '../providers/deck_provider.dart';
import '../widgets/stored_image.dart';

class BrowseSelectedCardScreen extends StatelessWidget {
  const BrowseSelectedCardScreen({required this.card, this.shareCard, super.key});
  final CardImageModel card;
  final Object? shareCard;

  @override
  Widget build(BuildContext context) {
    final decks = context.watch<DeckProvider>();
    final deck = decks.deckForCard(card.id);
    final matches = deck?.cards.where((candidate) => candidate.id == card.id);
    final liveCard = matches != null && matches.isNotEmpty ? matches.first : card;

    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => context.go(AppRoutes.cards),
        child: SizedBox.expand(
          child: SafeArea(
            child: Center(
              child: Hero(
                tag: 'browse-hand-card-${liveCard.id}',
                child: StoredImage(
                  source: liveCard.imagePath,
                  fit: BoxFit.contain,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
