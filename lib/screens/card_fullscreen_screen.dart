import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/app_router.dart';
import '../models/card_image_model.dart';
import '../providers/deck_provider.dart';
import '../services/public_card_share_service.dart';
import '../widgets/stored_image.dart';
import '../widgets/home_navigation_button.dart';

class CardFullscreenScreen extends StatefulWidget {
  const CardFullscreenScreen({required this.cardId, this.shareCard, super.key});
  final String cardId;
  final Future<CardShareResult> Function(CardImageModel card)? shareCard;
  @override
  State<CardFullscreenScreen> createState() => _CardFullscreenScreenState();
}

class _CardFullscreenScreenState extends State<CardFullscreenScreen> {
  PageController? controller;
  int currentIndex = 0;

  @override
  void dispose() {
    controller?.dispose();
    super.dispose();
  }

  void _close() =>
      context.canPop() ? context.pop() : context.go(AppRoutes.cards);

  Future<void> _share(CardImageModel card) async {
    final customShare = widget.shareCard;
    final deck = context.read<DeckProvider>().deckForCard(card.id);
    if (customShare == null && deck == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Unable to share this card')),
        );
      }
      return;
    }
    final result = customShare != null
        ? await customShare(card)
        : await PublicCardShareService.share(card: card, deck: deck!);
    if (!mounted) return;
    if (result == CardShareResult.copied) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Link copied')));
    } else if (result == CardShareResult.failed) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to share this card')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final decks = context.watch<DeckProvider>();
    final cards = decks.cards;
    if (decks.loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final requestedIndex = cards.indexWhere((card) => card.id == widget.cardId);
    if (requestedIndex < 0) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(
            tooltip: 'Return to cards',
            onPressed: _close,
            icon: const Icon(Icons.arrow_back_rounded),
          ),
        ),
        body: const Center(child: Text('Card not found.')),
      );
    }
    if (controller == null) {
      currentIndex = requestedIndex;
      controller = PageController(initialPage: currentIndex);
    }
    if (currentIndex >= cards.length) currentIndex = cards.length - 1;
    final card = cards[currentIndex];

    return Scaffold(
      backgroundColor: Colors.black,
      body: CallbackShortcuts(
        bindings: {const SingleActivator(LogicalKeyboardKey.escape): _close},
        child: Focus(
          autofocus: true,
          child: Stack(
            fit: StackFit.expand,
            children: [
              PageView.builder(
                controller: controller,
                itemCount: cards.length,
                onPageChanged: (index) => setState(() => currentIndex = index),
                itemBuilder: (_, index) => Stack(
                  fit: StackFit.expand,
                  children: [
                    GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: _close,
                    ),
                    GestureDetector(
                      onTap: () {},
                      child: InteractiveViewer(
                        minScale: .75,
                        maxScale: 5,
                        child: SizedBox.expand(
                          child: StoredImage(
                            source: cards[index].imagePath,
                            fit: BoxFit.contain,
                            errorBuilder: (_, _, _) =>
                                const Icon(Icons.broken_image, size: 80),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              SafeArea(
                child: Align(
                  alignment: Alignment.topCenter,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    child: Row(
                      children: [
                        IconButton.filledTonal(
                          tooltip: 'Close fullscreen card',
                          onPressed: _close,
                          icon: const Icon(Icons.close_rounded),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Align(
                            alignment: Alignment.centerLeft,
                            child: DecoratedBox(
                              decoration: BoxDecoration(
                                color: Colors.black.withValues(alpha: .62),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 8,
                                ),
                                child: Text(
                                  card.category.toUpperCase(),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        const HomeNavigationButton(),
                      ],
                    ),
                  ),
                ),
              ),
              SafeArea(
                child: Align(
                  alignment: Alignment.bottomCenter,
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: FilledButton.icon(
                      onPressed: () => _share(card),
                      icon: const Icon(Icons.share_outlined),
                      label: const Text('Share'),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
