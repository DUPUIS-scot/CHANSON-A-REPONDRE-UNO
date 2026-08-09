import 'package:flutter/material.dart';

import '../core/app_constants.dart';
import '../models/deck_model.dart';
import '../models/game_state_model.dart';
import '../theme/app_theme.dart';
import 'stored_image.dart';

class ContinuePanel extends StatelessWidget {
  const ContinuePanel({
    required this.deck,
    required this.game,
    required this.onContinue,
    super.key,
  });
  final Deck deck;
  final GameStateModel? game;
  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    final explored = game?.discardPile.length ?? 0;
    final total = deck.cards.length;
    final progress = total == 0
        ? 0.0
        : (explored / total).clamp(0, 1).toDouble();
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xE610100E),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppTheme.gold),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final compact = constraints.maxWidth < 600;
          final cover = SizedBox(
            height: 116,
            child: AspectRatio(
              aspectRatio: cardAspectRatio,
              child: deck.coverPath.isEmpty
                  ? const Icon(Icons.style, size: 54, color: AppTheme.gold)
                  : StoredImage(source: deck.coverPath, fit: BoxFit.contain),
            ),
          );
          final details = Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'CONTINUE WHERE YOU LEFT OFF',
                  style: Theme.of(
                    context,
                  ).textTheme.labelLarge?.copyWith(color: AppTheme.gold),
                ),
                const SizedBox(height: 4),
                Text(
                  deck.name,
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                Text('$explored / $total cards explored'),
                const SizedBox(height: 10),
                TweenAnimationBuilder<double>(
                  tween: Tween(end: progress),
                  duration: const Duration(milliseconds: 700),
                  builder: (_, value, _) => LinearProgressIndicator(
                    value: value,
                    minHeight: 8,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ],
            ),
          );
          final button = OutlinedButton.icon(
            onPressed: onContinue,
            icon: const Icon(Icons.play_arrow),
            label: const Text('CONTINUE'),
          );
          if (compact) {
            return Column(
              children: [
                Row(children: [cover, const SizedBox(width: 14), details]),
                const SizedBox(height: 12),
                SizedBox(width: double.infinity, child: button),
              ],
            );
          }
          return Row(
            children: [
              cover,
              const SizedBox(width: 20),
              details,
              const SizedBox(width: 20),
              button,
            ],
          );
        },
      ),
    );
  }
}
