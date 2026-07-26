import 'package:flutter/material.dart';

import '../data/card_categories.dart';

class CategoryBadge extends StatelessWidget {
  const CategoryBadge({
    required this.category,
    this.compact = false,
    super.key,
  });

  final String category;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final definition = cardCategoryFor(category);
    final tint = cardCategoryTint(category);
    return DecoratedBox(
      decoration: BoxDecoration(
        color: const Color(0xDD080604),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: tint.withValues(alpha: .78)),
        boxShadow: [
          BoxShadow(color: tint.withValues(alpha: .22), blurRadius: 12),
        ],
      ),
      child: Padding(
        padding: EdgeInsets.symmetric(
          horizontal: compact ? 7 : 10,
          vertical: compact ? 3 : 5,
        ),
        child: Text(
          compact ? definition.emoji : definition.badge,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            color: tint,
            fontSize: compact ? 13 : 11,
            fontWeight: FontWeight.w800,
            letterSpacing: .4,
          ),
        ),
      ),
    );
  }
}
