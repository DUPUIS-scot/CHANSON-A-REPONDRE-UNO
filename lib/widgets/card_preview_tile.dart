import 'package:flutter/material.dart';

import '../models/card_model.dart';
import '../theme/app_theme.dart';

class CardPreviewTile extends StatelessWidget {
  const CardPreviewTile({required this.card, required this.onTap, super.key});

  final ChansonCard card;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      card.category.toUpperCase(),
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: AppTheme.brightGold,
                      ),
                    ),
                  ),
                  if (card.favorite)
                    const Icon(Icons.favorite, color: AppTheme.burgundy),
                ],
              ),
              const SizedBox(height: 8),
              Text(card.question, maxLines: 4, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 14),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: card.tags
                    .take(3)
                    .map((tag) => Chip(label: Text(tag)))
                    .toList(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
