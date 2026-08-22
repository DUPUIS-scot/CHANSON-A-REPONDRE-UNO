import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/app_router.dart';
import '../models/card_image_model.dart';
import '../providers/deck_provider.dart';
import '../services/public_card_share_service.dart';
import '../widgets/stored_image.dart';

class CardFullscreenScreen extends StatelessWidget {
  const CardFullscreenScreen({required this.cardId, this.shareCard, super.key});
  final String cardId;
  final Future<CardShareResult> Function(CardImageModel card)? shareCard;

  void _close(BuildContext context) => context.canPop() ? context.pop() : context.go(AppRoutes.cards);

  @override
  Widget build(BuildContext context) {
    final decks = context.watch<DeckProvider>();
    final cards = decks.cards;
    if (decks.loading) {
      return const Scaffold(backgroundColor: Colors.black, body: Center(child: CircularProgressIndicator()));
    }
    final index = cards.indexWhere((card) => card.id == cardId);
    if (index < 0) {
      return Scaffold(backgroundColor: Colors.black, body: GestureDetector(behavior: HitTestBehavior.opaque, onTap: () => _close(context), child: const SizedBox.expand(child: Center(child: Text('Card not found.')))));
    }
    final card = cards[index];

    return Scaffold(
      backgroundColor: Colors.black,
      body: CallbackShortcuts(
        bindings: {const SingleActivator(LogicalKeyboardKey.escape): () => _close(context)},
        child: Focus(
          autofocus: true,
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => _close(context),
            child: SizedBox.expand(
              child: SafeArea(
                child: Center(
                  child: StoredImage(
                    source: card.imagePath,
                    fit: BoxFit.contain,
                    errorBuilder: (_, _, _) => const Icon(Icons.broken_image, size: 80),
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
