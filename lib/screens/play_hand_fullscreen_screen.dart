import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/card_image_model.dart';
import '../widgets/fullscreen_hand_card.dart';
import '../widgets/fullscreen_hand_toolbar.dart';
import '../widgets/fullscreen_page_indicator.dart';

class PlayHandFullscreenScreen extends StatefulWidget {
  PlayHandFullscreenScreen({
    required List<CardImageModel> cards,
    required List<bool> faceUp,
    required this.initialIndex,
    super.key,
  }) : cards = List.unmodifiable(cards),
       faceUp = List.unmodifiable(faceUp);

  final List<CardImageModel> cards;
  final List<bool> faceUp;
  final int initialIndex;

  @override
  State<PlayHandFullscreenScreen> createState() =>
      _PlayHandFullscreenScreenState();
}

class _PlayHandFullscreenScreenState extends State<PlayHandFullscreenScreen> {
  late final PageController _pages;
  late int _index;

  @override
  void initState() {
    super.initState();
    _index = widget.cards.isEmpty
        ? 0
        : widget.initialIndex.clamp(0, widget.cards.length - 1);
    _pages = PageController(initialPage: _index);
  }

  @override
  void dispose() {
    _pages.dispose();
    super.dispose();
  }

  void _goTo(int index) {
    if (widget.cards.isEmpty) return;
    final target = index.clamp(0, widget.cards.length - 1);
    _pages.animateToPage(
      target,
      duration: MediaQuery.disableAnimationsOf(context)
          ? Duration.zero
          : const Duration(milliseconds: 260),
      curve: Curves.easeOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.cards.isEmpty) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(child: Text('No cards to preview.')),
      );
    }
    return CallbackShortcuts(
      bindings: {
        const SingleActivator(LogicalKeyboardKey.escape): () =>
            Navigator.maybePop(context),
        const SingleActivator(LogicalKeyboardKey.arrowLeft): () =>
            _goTo(_index - 1),
        const SingleActivator(LogicalKeyboardKey.arrowRight): () =>
            _goTo(_index + 1),
        const SingleActivator(LogicalKeyboardKey.home): () => _goTo(0),
        const SingleActivator(LogicalKeyboardKey.end): () =>
            _goTo(widget.cards.length - 1),
      },
      child: Focus(
        autofocus: true,
        child: Scaffold(
          backgroundColor: Colors.black,
          body: SafeArea(
            child: Stack(
              children: [
                PageView.builder(
                  controller: _pages,
                  itemCount: widget.cards.length,
                  onPageChanged: (value) => setState(() => _index = value),
                  itemBuilder: (context, index) => FullscreenHandCard(
                    card: widget.cards[index],
                    position: index + 1,
                    total: widget.cards.length,
                    faceUp: index < widget.faceUp.length
                        ? widget.faceUp[index]
                        : true,
                  ),
                ),
                Align(
                  alignment: Alignment.topCenter,
                  child: FullscreenHandToolbar(
                    title: widget.cards[_index].category.toUpperCase(),
                    onClose: () => Navigator.pop(context),
                  ),
                ),
                Align(
                  alignment: Alignment.bottomCenter,
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: FullscreenPageIndicator(
                      current: _index + 1,
                      total: widget.cards.length,
                    ),
                  ),
                ),
                if (_index > 0)
                  Align(
                    alignment: Alignment.centerLeft,
                    child: IconButton(
                      tooltip: 'Previous card',
                      onPressed: () => _goTo(_index - 1),
                      icon: const Icon(Icons.chevron_left_rounded, size: 44),
                    ),
                  ),
                if (_index < widget.cards.length - 1)
                  Align(
                    alignment: Alignment.centerRight,
                    child: IconButton(
                      tooltip: 'Next card',
                      onPressed: () => _goTo(_index + 1),
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
