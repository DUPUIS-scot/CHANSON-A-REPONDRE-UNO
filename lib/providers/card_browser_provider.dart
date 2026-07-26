import 'dart:math';

import 'package:flutter/foundation.dart';

import '../models/card_image_model.dart';

class CardBrowserProvider extends ChangeNotifier {
  CardBrowserProvider({Random? random}) : _random = random ?? Random.secure();
  final Random _random;

  List<CardImageModel> _sourceCards = const [];
  List<CardImageModel> availableCards = const [];
  List<CardImageModel> visibleHand = const [];
  String? selectedCardId;
  String? deckId;
  bool isShuffling = false;
  int shuffleGeneration = 0;
  String? categoryFilter;
  String titleFilter = '';
  bool favouritesOnly = false;
  bool transcribedOnly = false;
  int _operationToken = 0;

  void initializeForDeck(String deckId, List<CardImageModel> cards) {
    final idsChanged = !listEquals(
      _sourceCards.map((card) => card.id).toList(),
      cards.map((card) => card.id).toList(),
    );
    if (this.deckId == deckId && !idsChanged) return;
    this.deckId = deckId;
    _sourceCards = List.unmodifiable(cards);
    selectedCardId = null;
    _applyFilters(notify: false);
    generateRandomHand();
  }

  Future<void> generateRandomHand({int count = 5}) async {
    if (isShuffling) return;
    final token = ++_operationToken;
    isShuffling = true;
    selectedCardId = null;
    notifyListeners();
    await Future<void>.delayed(const Duration(milliseconds: 180));
    if (token != _operationToken) return;
    final shuffled = List<CardImageModel>.from(availableCards)
      ..shuffle(_random);
    visibleHand = List.unmodifiable(shuffled.take(count));
    shuffleGeneration++;
    isShuffling = false;
    notifyListeners();
  }

  void resetToFirstCards({int count = 5}) {
    if (isShuffling) return;
    selectedCardId = null;
    visibleHand = List.unmodifiable(availableCards.take(count));
    shuffleGeneration++;
    notifyListeners();
  }

  void focusCard(String cardId, {String? category, int count = 5}) {
    final card = _sourceCards.where((item) => item.id == cardId).firstOrNull;
    if (card == null) return;
    _operationToken++;
    isShuffling = false;
    categoryFilter = (category?.isEmpty ?? true) ? null : category;
    _applyFilters(notify: false);
    if (!availableCards.any((item) => item.id == cardId)) {
      categoryFilter = null;
      _applyFilters(notify: false);
    }
    visibleHand = List.unmodifiable([
      card,
      ...availableCards.where((item) => item.id != cardId).take(count - 1),
    ]);
    selectedCardId = cardId;
    shuffleGeneration++;
    notifyListeners();
  }

  void selectCard(String cardId) {
    if (!visibleHand.any((card) => card.id == cardId)) return;
    selectedCardId = selectedCardId == cardId ? null : cardId;
    notifyListeners();
  }

  void selectRelative(int offset) {
    if (visibleHand.isEmpty) return;
    final current = visibleHand.indexWhere((card) => card.id == selectedCardId);
    final next = current < 0
        ? (offset > 0 ? 0 : visibleHand.length - 1)
        : (current + offset).clamp(0, visibleHand.length - 1);
    selectedCardId = visibleHand[next].id;
    notifyListeners();
  }

  void clearSelection() {
    selectedCardId = null;
    notifyListeners();
  }

  void applyFilters({
    String? category,
    String? title,
    bool? favourites,
    bool? transcribed,
    bool clearCategory = false,
  }) {
    categoryFilter = clearCategory ? null : category ?? categoryFilter;
    titleFilter = title ?? titleFilter;
    favouritesOnly = favourites ?? favouritesOnly;
    transcribedOnly = transcribed ?? transcribedOnly;
    _applyFilters(notify: false);
    generateRandomHand();
  }

  void _applyFilters({required bool notify}) {
    final needle = titleFilter.trim().toLowerCase();
    availableCards = List.unmodifiable(
      _sourceCards.where((card) {
        return (categoryFilter == null || card.category == categoryFilter) &&
            (needle.isEmpty || card.title.toLowerCase().contains(needle)) &&
            (!favouritesOnly || card.isFavourite) &&
            (!transcribedOnly ||
                card.transcription != null ||
                card.cleanedTranscription != null);
      }),
    );
    if (notify) notifyListeners();
  }

  void refreshAfterCardMovedOrDeleted(List<CardImageModel> cards) {
    final visibleIds = visibleHand.map((card) => card.id).toSet();
    _sourceCards = List.unmodifiable(cards);
    _applyFilters(notify: false);
    if (!availableCards.any((card) => card.id == selectedCardId)) {
      selectedCardId = null;
    }
    if (!visibleIds.every(
      (id) => availableCards.any((card) => card.id == id),
    )) {
      generateRandomHand();
    } else {
      visibleHand = visibleHand
          .map((old) => availableCards.firstWhere((card) => card.id == old.id))
          .toList();
      notifyListeners();
    }
  }
}
