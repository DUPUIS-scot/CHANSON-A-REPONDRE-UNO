import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/app_router.dart';
import '../providers/deck_provider.dart';
import '../services/public_card_share_service.dart';
import '../widgets/stored_image.dart';
import '../widgets/home_navigation_button.dart';

class CardFullscreenScreen extends StatefulWidget {
  const CardFullscreenScreen({required this.cardId, super.key});
  final String cardId;
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

  Future<void> _share(String cardId) async {
    final result = await PublicCardShareService.share(cardId: cardId);
    if (!mounted || result != CardShareResult.copied) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Link copied')));
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
      appBar: AppBar(
        title: Text(card.category.toUpperCase()),
        backgroundColor: Colors.black,
        leading: IconButton(
          tooltip: 'Close fullscreen card',
          onPressed: _close,
          icon: const Icon(Icons.close_rounded),
        ),
        actions: [
          IconButton(
            tooltip: 'Share card',
            onPressed: () => _share(card.id),
            icon: const Icon(Icons.share_outlined),
          ),
          const Padding(
            padding: EdgeInsets.only(right: 8),
            child: HomeNavigationButton(),
          ),
        ],
      ),
      body: CallbackShortcuts(
        bindings: {const SingleActivator(LogicalKeyboardKey.escape): _close},
        child: Focus(
          autofocus: true,
          child: PageView.builder(
            controller: controller,
            itemCount: cards.length,
            onPageChanged: (index) => setState(() => currentIndex = index),
            itemBuilder: (_, index) => LayoutBuilder(
              builder: (context, constraints) => Stack(
                fit: StackFit.expand,
                children: [
                  GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: _close,
                  ),
                  Center(
                    child: GestureDetector(
                      onTap: () {},
                      child: ConstrainedBox(
                        constraints: BoxConstraints(
                          maxWidth: constraints.maxWidth * .92,
                          maxHeight: constraints.maxHeight * .92,
                        ),
                        child: AspectRatio(
                          aspectRatio: cards[index].aspectRatio,
                          child: InteractiveViewer(
                            minScale: .75,
                            maxScale: 5,
                            child: StoredImage(
                              source: cards[index].path,
                              fit: BoxFit.contain,
                              errorBuilder: (_, _, _) =>
                                  const Icon(Icons.broken_image, size: 80),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: ColoredBox(
          color: Colors.black,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Wrap(
              alignment: WrapAlignment.center,
              spacing: 8,
              runSpacing: 8,
              children: [
                FilledButton.icon(
                  onPressed: () => _share(card.id),
                  icon: const Icon(Icons.share_outlined),
                  label: const Text('Share'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
