import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/app_router.dart';
import '../data/card_categories.dart';

class RulesScreen extends StatelessWidget {
  const RulesScreen({super.key});

  static const _categoryOrder = <String>[
    'classique',
    'art-contemporain',
    'cyberpunk',
    'poesie',
    'sauvage',
  ];

  static const _categoryDescriptions = <String, String>{
    'classique': 'Familiar references and shared culture.',
    'art-contemporain': 'Ideas, images and creative perspectives.',
    'cyberpunk': 'Technology, futures and imagined worlds.',
    'poesie': 'Words, rhythm and poetic expression.',
    'sauvage': 'Surprising prompts and open exploration.',
  };

  @override
  Widget build(BuildContext context) {
    final categories = _categoryOrder.map(cardCategoryFor).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('RULES'),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 8),
            child: _RulesHomeButton(),
          ),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 800),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
              children: [
                const _SectionHeading(number: '1', title: 'HOW TO PLAY'),
                const SizedBox(height: 18),
                const _HowToPlaySteps(),
                const SizedBox(height: 36),
                const _SectionHeading(number: '2', title: 'CARD CATEGORIES'),
                const SizedBox(height: 18),
                LayoutBuilder(
                  builder: (context, constraints) {
                    final columns = constraints.maxWidth >= 560 ? 2 : 1;
                    const gap = 12.0;
                    final tileWidth =
                        (constraints.maxWidth - gap * (columns - 1)) / columns;
                    return Wrap(
                      spacing: gap,
                      runSpacing: gap,
                      children: [
                        for (final category in categories)
                          SizedBox(
                            width: tileWidth,
                            child: _CategoryTile(
                              category: category,
                              description:
                                  _categoryDescriptions[category.id] ?? '',
                            ),
                          ),
                      ],
                    );
                  },
                ),
                const SizedBox(height: 36),
                const _SectionHeading(
                  number: '3',
                  title: 'BASIC CARD INTERACTION',
                ),
                const SizedBox(height: 18),
                const _InteractionRow(
                  icon: Icons.touch_app_rounded,
                  action: 'Click / tap',
                  result: 'Interact with the card',
                ),
                const SizedBox(height: 12),
                const _InteractionRow(
                  icon: Icons.fullscreen_rounded,
                  action: 'Long-click / long-press',
                  result: 'View the card fullscreen',
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RulesHomeButton extends StatelessWidget {
  const _RulesHomeButton();

  @override
  Widget build(BuildContext context) => IconButton(
    tooltip: 'Return to Home',
    onPressed: () => context.go(AppRoutes.home),
    icon: const Icon(Icons.home_rounded),
  );
}

class _SectionHeading extends StatelessWidget {
  const _SectionHeading({required this.number, required this.title});

  final String number;
  final String title;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Row(
      children: [
        Text(
          number.padLeft(2, '0'),
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
            color: colors.primary,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.5,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            title,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              color: colors.onSurface,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.1,
            ),
          ),
        ),
        const SizedBox(width: 16),
        SizedBox(
          width: 48,
          child: Divider(color: colors.outline.withValues(alpha: 0.55)),
        ),
      ],
    );
  }
}

class _HowToPlaySteps extends StatelessWidget {
  const _HowToPlaySteps();

  static const steps = <String>[
    'Each player starts with 5 cards.',
    'Tap or click a card to interact with it on the Play screen.',
    'Cards belong to one of five categories.',
    'Play, respond, discuss and continue through the deck.',
    'Use the card prompts as the centre of the experience.',
  ];

  @override
  Widget build(BuildContext context) => Column(
    children: [
      for (var index = 0; index < steps.length; index++) ...[
        _StepRow(number: index + 1, text: steps[index]),
        if (index != steps.length - 1) const SizedBox(height: 14),
      ],
    ],
  );
}

class _StepRow extends StatelessWidget {
  const _StepRow({required this.number, required this.text});

  final int number;
  final String text;

  @override
  Widget build(BuildContext context) => Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      SizedBox(
        width: 34,
        child: Text(
          number.toString().padLeft(2, '0'),
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            color: Theme.of(context).colorScheme.primary,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
      const SizedBox(width: 10),
      Expanded(
        child: Text(
          text,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.35),
        ),
      ),
    ],
  );
}

class _CategoryTile extends StatelessWidget {
  const _CategoryTile({required this.category, required this.description});

  final CardCategoryDefinition category;
  final String description;

  @override
  Widget build(BuildContext context) {
    final tint = cardCategoryTint(category.id);
    return DecoratedBox(
      decoration: BoxDecoration(
        color: tint.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border(left: BorderSide(color: tint, width: 3)),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            Text(category.emoji, style: const TextStyle(fontSize: 20)),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    category.label,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurface,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    description,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(
                        context,
                      ).colorScheme.onSurface.withValues(alpha: 0.78),
                      height: 1.25,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InteractionRow extends StatelessWidget {
  const _InteractionRow({
    required this.icon,
    required this.action,
    required this.result,
  });

  final IconData icon;
  final String action;
  final String result;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Icon(icon, size: 22, color: Theme.of(context).colorScheme.primary),
      const SizedBox(width: 12),
      Expanded(
        child: Wrap(
          spacing: 8,
          runSpacing: 2,
          children: [
            Text(
              action,
              style: Theme.of(
                context,
              ).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w700),
            ),
            Text(
              '→  $result',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: Theme.of(
                  context,
                ).colorScheme.onSurface.withValues(alpha: 0.8),
              ),
            ),
          ],
        ),
      ),
    ],
  );
}
