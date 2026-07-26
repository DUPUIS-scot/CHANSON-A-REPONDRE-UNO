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
  int pageStart = 0;
  String? categoryFilter;
  String titleFilter = '';
  bool favouritesOnly = false;
  bool transcribedOnly = false;

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
    resetToFirstCards();
  }

  Future<void> generateRandomHand({int? count}) async {
    if (isShuffling) return;
    isShuffling = true;
    selectedCardId = null;
    notifyListeners();
    await Future<void>.delayed(const Duration(milliseconds: 180));
    availableCards = List<CardImageModel>.unmodifiable(
      List<CardImageModel>.from(availableCards)..shuffle(_random),
    );
    pageStart = 0;
    _setVisibleHand(count: count);
    shuffleGeneration++;
    isShuffling = false;
    notifyListeners();
  }

  void resetToFirstCards({int? count}) {
    if (isShuffling) return;
    selectedCardId = null;
    pageStart = 0;
    _applyFilters(notify: false);
    _setVisibleHand(count: count);
    shuffleGeneration++;
    notifyListeners();
  }

  bool get canGoPrevious => pageStart > 0;
  bool get canGoNext => pageStart + 5 < availableCards.length;
  int get pageNumber => availableCards.isEmpty ? 0 : pageStart ~/ 5 + 1;
  int get pageCount =>
      availableCards.isEmpty ? 0 : ((availableCards.length - 1) ~/ 5) + 1;

  void previousPage() {
    if (!canGoPrevious || isShuffling) return;
    selectedCardId = null;
    pageStart = (pageStart - 5).clamp(0, availableCards.length).toInt();
    _setVisibleHand();
    shuffleGeneration++;
    notifyListeners();
  }

  void nextPage() {
    if (!canGoNext || isShuffling) return;
    selectedCardId = null;
    pageStart = (pageStart + 5).clamp(0, availableCards.length).toInt();
    _setVisibleHand();
    shuffleGeneration++;
    notifyListeners();
  }

  void selectCard(String cardId) {
    if (!visibleHand.any((card) => card.id == cardId)) return;
    selectedCardId = selectedCardId == cardId ? null : cardId;
    notifyListeners();
  }

  void focusCard(String cardId) {
    final index = availableCards.indexWhere((card) => card.id == cardId);
    if (index < 0) return;
    pageStart = (index ~/ 5) * 5;
    _setVisibleHand();
    selectedCardId = cardId;
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
    pageStart = 0;
    _applyFilters(notify: false);
    _setVisibleHand();
    shuffleGeneration++;
    notifyListeners();
  }

  void _applyFilters({required bool notify}) {
    final needle = titleFilter.trim().toLowerCase();
    availableCards = List.unmodifiable(
      _sourceCards.where((card) {
        return (categoryFilter == null || card.category == categoryFilter) &&
            (needle.isEmpty ||
                [
                  card.id,
                  card.title,
                  card.category,
                  card.author,
                  card.theme,
                  card.emotion,
                  card.transcription ?? '',
                  card.cleanedTranscription ?? '',
                  ...card.tags,
                ].join(' ').toLowerCase().contains(needle)) &&
            (!favouritesOnly || card.isFavourite) &&
            (!transcribedOnly ||
                card.transcription != null ||
                card.cleanedTranscription != null);
      }),
    );
    if (pageStart >= availableCards.length) {
      pageStart = availableCards.isEmpty
          ? 0
          : ((availableCards.length - 1) ~/ 5) * 5;
    }
    _setVisibleHand();
    if (notify) notifyListeners();
  }

  void _setVisibleHand({int? count}) {
    final pageSize = count ?? 5;
    visibleHand = List.unmodifiable(
      availableCards.skip(pageStart).take(pageSize),
    );
    if (!visibleHand.any((card) => card.id == selectedCardId)) {
      selectedCardId = null;
    }
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
      resetToFirstCards();
    } else {
      visibleHand = visibleHand
          .map((old) => availableCards.firstWhere((card) => card.id == old.id))
          .toList();
      notifyListeners();
    }
  }
}
