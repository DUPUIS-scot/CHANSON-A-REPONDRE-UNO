import 'package:flutter/material.dart';
import '../models/game_state_model.dart';

class GameStatusPanel extends StatelessWidget {
  const GameStatusPanel({required this.state, super.key});
  final GameStateModel state;
  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Wrap(
        spacing: 24,
        runSpacing: 12,
        children: [
          _Value('Top card', state.topCard.displayTitle),
          _Value('Colour', state.currentColour.name),
          _Value('Category', state.currentCategory),
          _Value('Direction', state.playDirection.name),
          _Value('Draw pile', '${state.drawPile.length}'),
          _Value('Discard pile', '${state.discardPile.length}'),
          _Value(
            'Current player',
            state.players[state.currentPlayerIndex].name,
          ),
        ],
      ),
    ),
  );
}

class _Value extends StatelessWidget {
  const _Value(this.label, this.value);
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) => SizedBox(
    width: 140,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.labelMedium),
        Text(value, style: Theme.of(context).textTheme.titleMedium),
      ],
    ),
  );
}
