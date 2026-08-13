import 'card_image_model.dart';

class Deck {
  const Deck({
    required this.id,
    required this.name,
    this.description = '',
    this.coverPath = '',
    this.cardBack = '',
    this.cards = const [],
    this.createdAt,
  });

  final String id;
  final String name;
  final String description;
  final String coverPath;
  final String cardBack;
  final List<CardImageModel> cards;
  final DateTime? createdAt;

  // Kept for compatibility with the bundled catalog.
  String get image => coverPath;

  factory Deck.fromJson(Map<String, dynamic> json) => Deck(
    id: json['id'] as String? ?? '',
    name: json['name'] as String? ?? '',
    description: json['description'] as String? ?? '',
    coverPath: json['coverPath'] as String? ?? json['image'] as String? ?? '',
    cardBack: json['cardBack'] as String? ?? '',
    cards: (json['cards'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(CardImageModel.fromJson)
        .toList(),
    createdAt: DateTime.tryParse(json['createdAt'] as String? ?? ''),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'description': description,
    'coverPath': coverPath,
    'cardBack': cardBack,
    'cards': cards.map((card) => card.toJson()).toList(),
    'createdAt': createdAt?.toIso8601String(),
  };

  Deck copyWith({
    String? name,
    String? coverPath,
    String? cardBack,
    List<CardImageModel>? cards,
  }) => Deck(
    id: id,
    name: name ?? this.name,
    description: description,
    coverPath: coverPath ?? this.coverPath,
    cardBack: cardBack ?? this.cardBack,
    cards: cards ?? this.cards,
    createdAt: createdAt,
  );
}
