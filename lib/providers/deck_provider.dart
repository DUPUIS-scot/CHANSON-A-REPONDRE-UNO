import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../data/card_categories.dart';
import '../models/card_image_model.dart';
import '../models/deck_model.dart';
import '../services/local_storage_service.dart';

const String chansonARepondreUnoDeckId = 'chanson-a-repondre-uno';
const String chansonARepondreUnoDeckName = 'CHANSON À RÉPONDRE UNO';
const int chansonARepondreUnoCardCount = 67;

class DeckProvider extends ChangeNotifier {
  DeckProvider(this._storage);
  static Deck get permanentDeck => _permanentDeck;

  final LocalStorageService _storage;
  static const _decksKey = 'decks';
  static const _activeKey = 'active_deck';
  static const _selectedCategoryKey = 'selected_card_category';

  List<Deck> _decks = [];
  String? _activeDeckId;
  String? _selectedCategory;
  bool _loading = true;
  String? _error;

  List<Deck> get decks => List.unmodifiable([_permanentDeck, ..._decks]);
  bool get loading => _loading;
  String? get error => _error;
  String? get activeDeckId => _activeDeckId;
  String? get selectedCategory => _selectedCategory;
  Deck? get activeDeck =>
      decks.where((deck) => deck.id == _activeDeckId).firstOrNull;
  List<CardImageModel> get cards => decks.expand((deck) => deck.cards).toList();

  Future<void> load() async {
    try {
      final source = await _storage.read(_decksKey);
      _decks = (jsonDecode(source ?? '[]') as List<dynamic>)
          .whereType<Map<String, dynamic>>()
          .map(Deck.fromJson)
          .where((deck) => deck.id != chansonARepondreUnoDeckId)
          .toList();
      _activeDeckId = _decodeStoredString(await _storage.read(_activeKey));
      if (activeDeck == null) _activeDeckId = chansonARepondreUnoDeckId;
      final savedCategory = _decodeStoredString(
        await _storage.read(_selectedCategoryKey),
      );
      _selectedCategory = isKnownCardCategory(savedCategory)
          ? normalizeCardCategoryLabel(savedCategory)
          : null;
    } on Object catch (error) {
      _decks = [];
      _error = 'Stored decks could not be loaded: $error';
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> _persist() async {
    await _storage.write(
      _decksKey,
      _decks.map((deck) => deck.toJson()).toList(),
    );
    if (_activeDeckId != null) await _storage.write(_activeKey, _activeDeckId!);
    notifyListeners();
  }

  Future<void> select(String id) async {
    _activeDeckId = id;
    await _persist();
  }

  Future<void> setSelectedCategory(String? category) async {
    _selectedCategory = category == null
        ? null
        : normalizeCardCategoryLabel(category);
    if (_selectedCategory == null) {
      await _storage.remove(_selectedCategoryKey);
    } else {
      await _storage.write(_selectedCategoryKey, _selectedCategory!);
    }
    notifyListeners();
  }

  Future<void> toggleFavourite(String cardId) async {
    _decks = _decks
        .map(
          (deck) => deck.copyWith(
            cards: deck.cards
                .map(
                  (card) => card.id == cardId
                      ? card.copyWith(isFavourite: !card.isFavourite)
                      : card,
                )
                .toList(),
          ),
        )
        .toList();
    await _persist();
  }

  CardImageModel? cardById(String cardId) =>
      cards.where((card) => card.id == cardId).firstOrNull;

  Deck? deckForCard(String cardId) => decks
      .where((deck) => deck.cards.any((card) => card.id == cardId))
      .firstOrNull;

  List<Deck> assignableDecksFor(CardImageModel card) => _decks
      .where((deck) => !deck.cards.any((item) => item.path == card.path))
      .toList(growable: false);

  Future<bool> assignCardToDeck(
    CardImageModel card,
    String targetDeckId,
  ) async {
    if (targetDeckId == chansonARepondreUnoDeckId) return false;
    final index = _decks.indexWhere((deck) => deck.id == targetDeckId);
    if (index < 0) return false;
    final deck = _decks[index];
    if (deck.cards.any((item) => item.path == card.path)) return false;

    final assignedCard = card.copyWith(
      id: '$targetDeckId-${card.id}',
      deckId: targetDeckId,
      title: card.displayTitle,
      category: normalizeCardCategoryLabel(card.category),
    );
    _decks[index] = deck.copyWith(
      coverPath: deck.coverPath.isEmpty ? assignedCard.path : deck.coverPath,
      cards: [...deck.cards, assignedCard],
    );
    await _persist();
    return true;
  }

  Future<void> updateCard(CardImageModel updated) async {
    if (updated.deckId == chansonARepondreUnoDeckId) return;
    _decks = _decks
        .map(
          (deck) => deck.copyWith(
            cards: deck.cards
                .map((card) => card.id == updated.id ? updated : card)
                .toList(),
            coverPath: deck.cards.firstOrNull?.id == updated.id
                ? updated.path
                : deck.coverPath,
          ),
        )
        .toList();
    await _persist();
  }

  Future<void> deleteAiData(String cardId) async {
    final card = cardById(cardId);
    if (card != null) await updateCard(card.copyWith(clearAiData: true));
  }

  static final Deck _permanentDeck = Deck(
    id: chansonARepondreUnoDeckId,
    name: chansonARepondreUnoDeckName,
    description: 'Permanent bundled 67-card Chanson à Répondre UNO deck.',
    coverPath: 'assets/cards/chanson_a_repondre_uno/card_001.png',
    createdAt: DateTime(2026),
    cards: List.generate(chansonARepondreUnoCardCount, (index) {
      final sequence = index + 1;
      final padded = sequence.toString().padLeft(3, '0');
      final category = cardCategoryAt(index);
      return CardImageModel(
        id: 'chanson-a-repondre-uno-$padded',
        deckId: chansonARepondreUnoDeckId,
        title: 'Carte UNO $sequence',
        path: 'assets/cards/chanson_a_repondre_uno/card_$padded.png',
        category: category.label,
        colour: category.colour,
        importedAt: DateTime(2026),
        tags: ['bundled', 'permanent', category.id],
      );
    }, growable: false),
  );

  static String? _decodeStoredString(String? raw) {
    if (raw == null) return null;
    try {
      final decoded = jsonDecode(raw);
      return decoded is String ? decoded : raw;
    } on Object {
      return raw;
    }
  }
}
