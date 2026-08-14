import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/card_categories.dart';
import '../providers/game_provider.dart';
import '../theme/app_theme.dart';

class PlayedCardPile extends StatelessWidget {
  const PlayedCardPile({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<GameProvider>().state;
    if (state == null) return const SizedBox.shrink();
    final card = state.topCard;
    return IgnorePointer(
      child: Align(
        alignment: const Alignment(-.58, -.08),
        child: FractionallySizedBox(
          widthFactor: MediaQuery.sizeOf(context).width < 600 ? .17 : .14,
          child: AspectRatio(
            aspectRatio: 2 / 3,
            child: Semantics(
              image: true,
              label: 'Played pile, ${card.title}, face up',
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Positioned(
                    left: 10,
                    top: 9,
                    right: -10,
                    bottom: -9,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        color: const Color(0xFF2A120B),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFF8F642B)),
                        boxShadow: const [
                          BoxShadow(
                            color: Colors.black87,
                            blurRadius: 12,
                            offset: Offset(0, 7),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    left: 5,
                    top: 5,
                    right: -5,
                    bottom: -5,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFC99A49)),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.asset(
                          cardCategoryFor(card.category).versoAsset,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => const ColoredBox(
                            color: Color(0xFF47160F),
                          ),
                        ),
                      ),
                    ),
                  ),
                  Positioned.fill(
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 360),
                      switchInCurve: Curves.easeOutBack,
                      transitionBuilder: (child, animation) => ScaleTransition(
                        scale: Tween<double>(begin: .84, end: 1).animate(animation),
                        child: FadeTransition(opacity: animation, child: child),
                      ),
                      child: DecoratedBox(
                        key: ValueKey(card.id),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEDE4D0),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: const Color(0xFFF6E7BC),
                            width: 3,
                          ),
                          boxShadow: const [
                            BoxShadow(
                              color: Colors.black87,
                              blurRadius: 14,
                              offset: Offset(0, 8),
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(7),
                          child: Image.asset(
                            card.imagePath,
                            key: const Key('played-card-recto'),
                            fit: BoxFit.cover,
                            errorBuilder: (_, _, _) => const ColoredBox(
                              color: Color(0xFF5B2018),
                              child: Icon(
                                Icons.image,
                                color: AppTheme.brightGold,
                              ),
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
    );
  }
}
