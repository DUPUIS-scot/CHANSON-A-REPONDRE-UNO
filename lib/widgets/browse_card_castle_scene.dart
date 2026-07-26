import 'dart:math' as math;

import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';

import '../models/card_image_model.dart';
import '../theme/app_theme.dart';
import 'browse_hand_card.dart';
import 'category_badge.dart';
import 'stored_image.dart';
import 'webgl_card_castle_view.dart';

class BrowseCardCastleScene extends StatelessWidget {
  const BrowseCardCastleScene({
    required this.cards,
    required this.visibleCards,
    required this.pageStart,
    required this.deckName,
    required this.selectedCardId,
    required this.shuffleGeneration,
    required this.onCardSelected,
    required this.onCardOpened,
    required this.onCardLongPressed,
    required this.onPrevious,
    required this.onNext,
    required this.canGoPrevious,
    required this.canGoNext,
    super.key,
  });

  final List<CardImageModel> cards;
  final List<CardImageModel> visibleCards;
  final int pageStart;
  final String deckName;
  final String? selectedCardId;
  final int shuffleGeneration;
  final ValueChanged<String> onCardSelected;
  final ValueChanged<CardImageModel> onCardOpened;
  final ValueChanged<int> onCardLongPressed;
  final VoidCallback onPrevious;
  final VoidCallback onNext;
  final bool canGoPrevious;
  final bool canGoNext;

  @override
  Widget build(BuildContext context) {
    final selected = [
      ...visibleCards,
      ...cards,
    ].where((card) => card.id == selectedCardId).firstOrNull;

    return FocusableActionDetector(
      mouseCursor: SystemMouseCursors.grab,
      child: Listener(
        onPointerSignal: (signal) {
          if (signal is PointerScrollEvent) {
            final delta =
                signal.scrollDelta.dx.abs() > signal.scrollDelta.dy.abs()
                ? signal.scrollDelta.dx
                : signal.scrollDelta.dy;
            if (delta > 0 && canGoNext) onNext();
            if (delta < 0 && canGoPrevious) onPrevious();
          }
        },
        child: GestureDetector(
          onHorizontalDragEnd: (details) {
            final velocity = details.primaryVelocity ?? 0;
            if (velocity < -120 && canGoNext) onNext();
            if (velocity > 120 && canGoPrevious) onPrevious();
          },
          child: LayoutBuilder(
            builder: (context, constraints) {
              final compact = constraints.maxWidth < 760;
              final castleHeight =
                  constraints.maxHeight * (compact ? .48 : .56);
              return Stack(
                fit: StackFit.expand,
                children: [
                  const _CastleAtmosphere(),
                  Positioned.fill(
                    bottom: constraints.maxHeight * (compact ? .34 : .30),
                    child: WebGlCardCastleView(
                      cards: cards,
                      focusedCardId: selectedCardId,
                      shuffleSeed: shuffleGeneration,
                      onCardSelected: onCardSelected,
                      onCardOpened: (id) {
                        final card = cards
                            .where((candidate) => candidate.id == id)
                            .firstOrNull;
                        if (card != null) onCardOpened(card);
                      },
                      fallback: _CastleArchitecture(
                        cards: cards,
                        pageStart: pageStart,
                        selectedCardId: selectedCardId,
                        shuffleGeneration: shuffleGeneration,
                        onSelected: onCardSelected,
                        onOpened: onCardOpened,
                      ),
                    ),
                  ),
                  Align(
                    alignment: compact
                        ? const Alignment(-.98, -.05)
                        : const Alignment(-.98, .02),
                    child: _NavButton(
                      icon: Icons.arrow_back_rounded,
                      enabled: canGoPrevious,
                      onPressed: onPrevious,
                      label: 'Previous castle section',
                    ),
                  ),
                  Align(
                    alignment: compact
                        ? const Alignment(.98, -.05)
                        : const Alignment(.98, .02),
                    child: _NavButton(
                      icon: Icons.arrow_forward_rounded,
                      enabled: canGoNext,
                      onPressed: onNext,
                      label: 'Next castle section',
                    ),
                  ),
                  if (!compact && selected != null)
                    Positioned(
                      right: 12,
                      top: 14,
                      width: 220,
                      child: _SelectedCardPanel(card: selected),
                    ),
                  Positioned(
                    left: compact ? 10 : 22,
                    right: compact ? 10 : 22,
                    bottom: 0,
                    height: constraints.maxHeight - castleHeight + 64,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xDD090806),
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(color: AppTheme.gold),
                          ),
                          child: Text(
                            '5 CARTES ACTIVES  •  POSITION ${pageStart + 1}/${cards.length}',
                            style: const TextStyle(
                              color: AppTheme.brightGold,
                              fontWeight: FontWeight.w800,
                              letterSpacing: .7,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Expanded(
                          child: _ActiveCastleHand(
                            cards: visibleCards,
                            deckName: deckName,
                            selectedCardId: selectedCardId,
                            shuffleGeneration: shuffleGeneration,
                            onCardSelected: onCardSelected,
                            onCardOpened: onCardOpened,
                            onCardLongPressed: onCardLongPressed,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _CastleArchitecture extends StatelessWidget {
  const _CastleArchitecture({
    required this.cards,
    required this.pageStart,
    required this.selectedCardId,
    required this.shuffleGeneration,
    required this.onSelected,
    required this.onOpened,
  });

  final List<CardImageModel> cards;
  final int pageStart;
  final String? selectedCardId;
  final int shuffleGeneration;
  final ValueChanged<String> onSelected;
  final ValueChanged<CardImageModel> onOpened;

  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, constraints) {
      final span = constraints.maxWidth;
      final start = math.max(0, pageStart - 10);
      final castleCards = cards.skip(start).take(28).toList();
      if (castleCards.isEmpty) return const SizedBox.shrink();
      return Stack(
        alignment: Alignment.bottomCenter,
        children: [
          Positioned(
            bottom: 0,
            width: span * .78,
            height: constraints.maxHeight * .46,
            child: _StoneBlock(borderRadius: 22),
          ),
          Positioned(
            bottom: constraints.maxHeight * .26,
            width: span * .46,
            height: constraints.maxHeight * .44,
            child: _StoneBlock(borderRadius: 18),
          ),
          Positioned(
            bottom: constraints.maxHeight * .18,
            left: span * .07,
            width: span * .24,
            height: constraints.maxHeight * .34,
            child: _StoneBlock(borderRadius: 18),
          ),
          Positioned(
            bottom: constraints.maxHeight * .18,
            right: span * .07,
            width: span * .24,
            height: constraints.maxHeight * .34,
            child: _StoneBlock(borderRadius: 18),
          ),
          for (var i = 0; i < castleCards.length; i++)
            _CastleThumbnail(
              key: ValueKey('castle-$shuffleGeneration-${castleCards[i].id}'),
              card: castleCards[i],
              selected: castleCards[i].id == selectedCardId,
              x: _x(i, span),
              y: _y(i, constraints.maxHeight),
              scale: _scale(i),
              angle: _angle(i),
              onTap: () => onSelected(castleCards[i].id),
              onLongPress: () => onOpened(castleCards[i]),
            ),
        ],
      );
    },
  );

  double _x(int i, double width) {
    final layer = i % 14;
    final center = width / 2;
    final spread = width * .036;
    return center + (layer - 6.5) * spread + math.sin(i) * 12;
  }

  double _y(int i, double height) {
    final row = i ~/ 7;
    final wave = math.sin(i * 1.7) * 10;
    return height * (.68 - row * .14) + wave;
  }

  double _scale(int i) => .52 + (i % 5) * .035;
  double _angle(int i) => ((i % 7) - 3) * 2.0;
}

class _CastleThumbnail extends StatelessWidget {
  const _CastleThumbnail({
    required this.card,
    required this.selected,
    required this.x,
    required this.y,
    required this.scale,
    required this.angle,
    required this.onTap,
    required this.onLongPress,
    super.key,
  });

  final CardImageModel card;
  final bool selected;
  final double x;
  final double y;
  final double scale;
  final double angle;
  final VoidCallback onTap;
  final VoidCallback onLongPress;

  @override
  Widget build(BuildContext context) {
    const baseWidth = 58.0;
    return Positioned(
      left: x - baseWidth / 2,
      top: y,
      width: baseWidth,
      child: Transform.scale(
        scale: scale,
        alignment: Alignment.bottomCenter,
        child: Transform(
          alignment: Alignment.bottomCenter,
          transform: Matrix4.identity()
            ..setEntry(3, 2, .0012)
            ..rotateY(angle * math.pi / 360),
          child: Semantics(
            button: true,
            selected: selected,
            label: '${card.displayTitle}, castle card thumbnail',
            child: GestureDetector(
              onTap: onTap,
              onLongPress: onLongPress,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 160),
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  color: const Color(0xFF080604),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: selected ? AppTheme.brightGold : Colors.white70,
                    width: selected ? 2 : 1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: selected
                          ? const Color(0xAAFFC928)
                          : const Color(0x88000000),
                      blurRadius: selected ? 14 : 8,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: AspectRatio(
                  aspectRatio: card.aspectRatio,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: StoredImage(
                      source: card.imagePath,
                      fit: BoxFit.cover,
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
}

class _ActiveCastleHand extends StatelessWidget {
  const _ActiveCastleHand({
    required this.cards,
    required this.deckName,
    required this.selectedCardId,
    required this.shuffleGeneration,
    required this.onCardSelected,
    required this.onCardOpened,
    required this.onCardLongPressed,
  });

  final List<CardImageModel> cards;
  final String deckName;
  final String? selectedCardId;
  final int shuffleGeneration;
  final ValueChanged<String> onCardSelected;
  final ValueChanged<CardImageModel> onCardOpened;
  final ValueChanged<int> onCardLongPressed;

  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, constraints) {
      final gap = constraints.maxWidth > 760 ? 14.0 : 10.0;
      final cardWidth = ((constraints.maxWidth - gap * 4) / 5).clamp(
        90.0,
        160.0,
      );
      final row = Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          for (var i = 0; i < cards.length; i++) ...[
            SizedBox(
              width: cardWidth,
              height: constraints.maxHeight,
              child: BrowseHandCard(
                key: ValueKey('active-$shuffleGeneration-${cards[i].id}'),
                card: cards[i],
                position: i + 1,
                total: cards.length,
                deckName: deckName,
                rotationDegrees: (i - 2) * 2,
                selected: cards[i].id == selectedCardId,
                onTap: () => onCardSelected(cards[i].id),
                onOpen: () => onCardOpened(cards[i]),
                onLongPress: () => onCardLongPressed(i),
              ),
            ),
            if (i != cards.length - 1) SizedBox(width: gap),
          ],
        ],
      );
      return SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: SizedBox(
          width: math.max(
            constraints.maxWidth,
            cardWidth * cards.length + gap * 4,
          ),
          child: row,
        ),
      );
    },
  );
}

class _SelectedCardPanel extends StatelessWidget {
  const _SelectedCardPanel({required this.card});
  final CardImageModel card;

  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: BoxDecoration(
      color: const Color(0xDD080604),
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: AppTheme.gold),
    ),
    child: Padding(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          SizedBox(
            width: 54,
            child: AspectRatio(
              aspectRatio: card.aspectRatio,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: StoredImage(source: card.imagePath, fit: BoxFit.cover),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  card.displayTitle,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 6),
                CategoryBadge(category: card.category, compact: true),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

class _NavButton extends StatelessWidget {
  const _NavButton({
    required this.icon,
    required this.enabled,
    required this.onPressed,
    required this.label,
  });

  final IconData icon;
  final bool enabled;
  final VoidCallback onPressed;
  final String label;

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    label: label,
    child: IconButton.filled(
      style: IconButton.styleFrom(
        backgroundColor: const Color(0xDD0B0906),
        foregroundColor: AppTheme.brightGold,
        disabledForegroundColor: Colors.white24,
        side: const BorderSide(color: AppTheme.gold),
        padding: const EdgeInsets.all(18),
      ),
      onPressed: enabled ? onPressed : null,
      icon: Icon(icon, size: 34),
    ),
  );
}

class _StoneBlock extends StatelessWidget {
  const _StoneBlock({required this.borderRadius});
  final double borderRadius;

  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(borderRadius),
      gradient: const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0x88473425), Color(0xDD15110C)],
      ),
      border: Border.all(color: Color(0x66886D39)),
      boxShadow: const [
        BoxShadow(
          color: Color(0xAA000000),
          blurRadius: 26,
          offset: Offset(0, 16),
        ),
      ],
    ),
  );
}

class _CastleAtmosphere extends StatelessWidget {
  const _CastleAtmosphere();

  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: BoxDecoration(
      gradient: RadialGradient(
        center: const Alignment(0, -.25),
        radius: 1.1,
        colors: [
          AppTheme.brightGold.withValues(alpha: .12),
          const Color(0xFF10161A),
          const Color(0xFF050403),
        ],
      ),
    ),
  );
}
