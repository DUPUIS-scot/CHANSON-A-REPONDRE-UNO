import 'package:flutter/material.dart';

class CardCategoryDefinition {
  const CardCategoryDefinition({
    required this.id,
    required this.label,
    required this.emoji,
    required this.colour,
    required this.versoAsset,
  });

  final String id;
  final String label;
  final String emoji;
  final String colour;
  final String versoAsset;

  String get badge => '$emoji $label';
}

const cardCategories = <CardCategoryDefinition>[
  CardCategoryDefinition(
    id: 'classique',
    label: 'CLASSIQUE',
    emoji: '🎭',
    colour: 'red',
    versoAsset: 'assets/cards/category_versos/classique.png',
  ),
  CardCategoryDefinition(
    id: 'sauvage',
    label: 'SAUVAGE',
    emoji: '🌿',
    colour: 'green',
    versoAsset: 'assets/cards/category_versos/sauvage.png',
  ),
  CardCategoryDefinition(
    id: 'poesie',
    label: 'POÉSIE',
    emoji: '🎵',
    colour: 'yellow',
    versoAsset: 'assets/cards/category_versos/poesie.png',
  ),
  CardCategoryDefinition(
    id: 'cyberpunk',
    label: 'CYBERPUNK',
    emoji: '🤖',
    colour: 'blue',
    versoAsset: 'assets/cards/category_versos/cyberpunk.png',
  ),
  CardCategoryDefinition(
    id: 'art-contemporain',
    label: 'ART CONTEMPORAIN',
    emoji: '🎨',
    colour: 'black',
    versoAsset: 'assets/cards/category_versos/art_contemporain.png',
  ),
];

final defaultCardCategory = cardCategories.first;

CardCategoryDefinition cardCategoryAt(int index) =>
    cardCategories[index % cardCategories.length];

CardCategoryDefinition cardCategoryFor(String? value) {
  final normalized = _normalize(value);
  return cardCategories.firstWhere(
    (category) =>
        _normalize(category.id) == normalized ||
        _normalize(category.label) == normalized,
    orElse: () => defaultCardCategory,
  );
}

bool isKnownCardCategory(String? value) {
  final normalized = _normalize(value);
  return cardCategories.any(
    (category) =>
        _normalize(category.id) == normalized ||
        _normalize(category.label) == normalized,
  );
}

String normalizeCardCategoryLabel(String? value) =>
    cardCategoryFor(value).label;

Color cardCategoryTint(String? value) => switch (cardCategoryFor(value).id) {
  'classique' => const Color(0xFFE23A2E),
  'sauvage' => const Color(0xFF60C94B),
  'poesie' => const Color(0xFFB76DFF),
  'cyberpunk' => const Color(0xFF25B9FF),
  'art-contemporain' => const Color(0xFFFFC928),
  _ => const Color(0xFFFFC928),
};

String _normalize(String? value) => (value ?? '')
    .trim()
    .toLowerCase()
    .replaceAll('é', 'e')
    .replaceAll('è', 'e')
    .replaceAll('ê', 'e')
    .replaceAll('à', 'a')
    .replaceAll(' ', '-')
    .replaceAll('_', '-');
