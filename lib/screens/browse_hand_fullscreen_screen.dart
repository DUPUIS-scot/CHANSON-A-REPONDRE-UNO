import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../models/browse_hand_preview_args.dart';
import '../models/card_image_model.dart';
import '../providers/deck_provider.dart';
import '../widgets/fullscreen_browse_card.dart';
import '../widgets/fullscreen_card_page_indicator.dart';
import '../widgets/fullscreen_card_toolbar.dart';
import 'ai_chat_screen.dart';
import 'card_transcription_screen.dart';

class BrowseHandFullscreenScreen extends StatefulWidget {
  const BrowseHandFullscreenScreen({required this.args, super.key});
  final BrowseHandPreviewArgs args;

  @override
  State<BrowseHandFullscreenScreen> createState() =>
      _BrowseHandFullscreenScreenState();
}

class _BrowseHandFullscreenScreenState
    extends State<BrowseHandFullscreenScreen> {
  late final PageController pages;
  late final List<CardImageModel> cards;
  late int index;
  bool zoomed = false;

  @override
  void initState() {
    super.initState();
    cards = List.of(widget.args.cards);
    index = widget.args.initialIndex;
    pages = PageController(initialPage: index);
  }

  @override
  void dispose() {
    pages.dispose();
    super.dispose();
  }

  void go(int value) {
    if (cards.isEmpty) return;
    pages.animateToPage(
      value.clamp(0, cards.length - 1),
      duration: MediaQuery.disableAnimationsOf(context)
          ? Duration.zero
          : const Duration(milliseconds: 260),
      curve: Curves.easeOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) {
    if (cards.isEmpty) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: FilledButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Return to Browse Cards'),
          ),
        ),
      );
    }
    final card = cards[index];
    return CallbackShortcuts(
      bindings: {
        const SingleActivator(LogicalKeyboardKey.escape): () =>
            Navigator.maybePop(context),
        const SingleActivator(LogicalKeyboardKey.arrowLeft): () =>
            go(index - 1),
        const SingleActivator(LogicalKeyboardKey.arrowRight): () =>
            go(index + 1),
        const SingleActivator(LogicalKeyboardKey.home): () => go(0),
        const SingleActivator(LogicalKeyboardKey.end): () =>
            go(cards.length - 1),
      },
      child: Focus(
        autofocus: true,
        child: Scaffold(
          backgroundColor: Colors.black,
          body: SafeArea(
            child: Stack(
              children: [
                PageView.builder(
                  controller: pages,
                  physics: zoomed
                      ? const NeverScrollableScrollPhysics()
                      : const PageScrollPhysics(),
                  itemCount: cards.length,
                  onPageChanged: (value) => setState(() {
                    index = value;
                    zoomed = false;
                  }),
                  itemBuilder: (_, page) => FullscreenBrowseCard(
                    card: cards[page],
                    position: page + 1,
                    total: cards.length,
                    deckName: widget.args.deckName,
                    onZoomChanged: (value) {
                      if (page == index && zoomed != value) {
                        setState(() => zoomed = value);
                      }
                    },
                  ),
                ),
                Align(
                  alignment: Alignment.topCenter,
                  child: FullscreenCardToolbar(
                    title: card.displayTitle,
                    favourite: card.isFavourite,
                    onClose: () => Navigator.pop(context),
                    onFavourite: () async {
                      final decks = context.read<DeckProvider>();
                      await decks.toggleFavourite(card.id);
                      final updated = decks.cardById(card.id);
                      if (updated != null && mounted) {
                        setState(() => cards[index] = updated);
                      }
                    },
                    onTranscribe: () => Navigator.push<void>(
                      context,
                      MaterialPageRoute(
                        builder: (_) =>
                            CardTranscriptionScreen(cardId: card.id),
                      ),
                    ),
                    onDiscuss:
                        card.transcription == null &&
                            card.cleanedTranscription == null
                        ? null
                        : () => Navigator.push<void>(
                            context,
                            MaterialPageRoute(
                              builder: (_) => AiChatScreen(cardId: card.id),
                            ),
                          ),
                  ),
                ),
                Align(
                  alignment: Alignment.bottomCenter,
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: FullscreenCardPageIndicator(
                      page: index + 1,
                      total: cards.length,
                    ),
                  ),
                ),
                if (index > 0)
                  Align(
                    alignment: Alignment.centerLeft,
                    child: IconButton(
                      tooltip: 'Previous card',
                      onPressed: () => go(index - 1),
                      icon: const Icon(Icons.chevron_left_rounded, size: 44),
                    ),
                  ),
                if (index < cards.length - 1)
                  Align(
                    alignment: Alignment.centerRight,
                    child: IconButton(
                      tooltip: 'Next card',
                      onPressed: () => go(index + 1),
                      icon: const Icon(Icons.chevron_right_rounded, size: 44),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
