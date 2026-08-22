import 'dart:convert';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:uuid/uuid.dart';

import '../core/app_constants.dart';
import '../data/card_categories.dart';
import '../models/card_image_model.dart';
import '../models/deck_model.dart';
import '../services/deck_import_service.dart';
import '../services/local_storage_service.dart';

class DeckProvider extends ChangeNotifier {
  DeckProvider(this._storage, this._importer);
  final LocalStorageService _storage;
  final DeckImportService _importer;
  static const _uuid = Uuid();
  static const _decksKey = 'decks';
  static const _activeKey = 'active_deck';
  static const _searchStateKey = 'search_path_state_v1';

  List<Deck> _decks = [];
  String? _activeDeckId;
  bool _loading = true;
  String? _error;

  List<Deck> get decks => List.unmodifiable(_decks);
  bool get loading => _loading;
  String? get error => _error;
  String? get activeDeckId => _activeDeckId;
  Deck? get activeDeck =>
      _decks.where((deck) => deck.id == _activeDeckId).firstOrNull;
  List<CardImageModel> get cards =>
      _decks.expand((deck) => deck.cards).toList();

  Future<void> load() async {
    try {
      final source = await _storage.read(_decksKey);
      if (source != null) {
        _decks = (jsonDecode(source) as List<dynamic>)
            .whereType<Map<String, dynamic>>()
            .map(Deck.fromJson)
            .toList();
      }
      await _installProductionDeck();
      await _installBrioDeck();
      await _installHpDeck();
      _activeDeckId = _decodeStoredId(await _storage.read(_activeKey));
      if (activeDeck == null) {
        _activeDeckId = AppConstants.productionDeckId;
      }
      await _persist(notify: false);
    } on Object catch (error) {
      _decks = [];
      _error = 'Stored decks could not be loaded: $error';
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  String? _decodeStoredId(String? source) {
    if (source == null || source.isEmpty) return null;
    try {
      final decoded = jsonDecode(source);
      return decoded is String ? decoded : source;
    } on FormatException {
      return source;
    }
  }

  Future<void> _installProductionDeck() async {
    final source = await rootBundle.loadString(AppConstants.cardsAsset);
    final decoded = jsonDecode(source);
    if (decoded is! Map<String, dynamic>) {
      throw const FormatException('The bundled card catalog is invalid.');
    }
    final rawDecks = decoded['decks'];
    if (rawDecks is! List<dynamic>) {
      throw const FormatException('The bundled card catalog has no decks.');
    }
    final sourceDeck = rawDecks
        .whereType<Map<String, dynamic>>()
        .map(Deck.fromJson)
        .firstWhere((deck) => deck.id == AppConstants.productionDeckId);
    final deck = sourceDeck.copyWith(
      coverPath: AppConstants.productionDeckCover,
      cards: [
        for (var index = 0; index < sourceDeck.cards.length; index++)
          sourceDeck.cards[index].copyWith(
            category: cardCategoryAt(index).label,
            colour: cardCategoryAt(index).colour,
          ),
      ],
    );
    final ids = deck.cards.map((card) => card.id).toSet();
    if (deck.cards.length != AppConstants.productionDeckSize ||
        ids.length != AppConstants.productionDeckSize) {
      throw FormatException(
        'The production deck must contain exactly '
        '${AppConstants.productionDeckSize} unique cards.',
      );
    }
    _decks = [
      deck,
      ..._decks.where((item) => item.id != AppConstants.productionDeckId),
    ];
  }

  Future<void> _installBrioDeck() async {
    final source = await rootBundle.loadString(AppConstants.brioDeckAsset);
    final decoded = jsonDecode(source);
    if (decoded is! Map<String, dynamic>) {
      throw const FormatException('The bundled BRIO deck is invalid.');
    }
    final id = decoded['id'] as String?;
    final name = decoded['name'] as String?;
    final cardBack = decoded['cardBack'] as String?;
    final rawCards = decoded['cards'];
    if (id != AppConstants.brioDeckId ||
        name == null ||
        cardBack == null ||
        rawCards is! List<dynamic>) {
      throw const FormatException('The bundled BRIO deck is incomplete.');
    }
    final cards = <CardImageModel>[];
    for (var index = 0; index < rawCards.length; index++) {
      final card = rawCards[index];
      if (card is! Map<String, dynamic>) continue;
      final cardId = card['id'] as String?;
      final image = card['image'] as String?;
      if (cardId == null || image == null) continue;
      final category = cardCategoryAt(index);
      cards.add(
        CardImageModel(
          id: cardId,
          deckId: AppConstants.brioDeckId,
          title: 'BRIO ${(index + 1).toString().padLeft(3, '0')}',
          path: image,
          category: category.label,
          colour: category.colour,
          importedAt: DateTime.utc(2026, 8, 13),
        ),
      );
    }
    final ids = cards.map((card) => card.id).toSet();
    if (cards.length != 16 || ids.length != 16) {
      throw const FormatException(
        'The bundled BRIO deck must contain exactly 16 unique cards.',
      );
    }
    final deck = Deck(
      id: AppConstants.brioDeckId,
      name: name,
      coverPath: cardBack,
      cardBack: cardBack,
      cards: cards,
      hasExplicitCategories: true,
    );
    _decks = [
      ..._decks.where((item) => item.id != AppConstants.brioDeckId),
      deck,
    ];
  }

  Future<void> _installHpDeck() async {
    const paths = [
      'assets/hp/ChatGPT Image Aug 22, 2026, 10_59_05 AM.png',
      'assets/hp/ChatGPT Image Aug 22, 2026, 11_00_51 AM.png',
      'assets/hp/ChatGPT Image Aug 22, 2026, 11_08_07 AM.png',
      'assets/hp/ChatGPT Image Aug 22, 2026, 11_12_32 AM.png',
    ];
    final cards = <CardImageModel>[
      for (var index = 0; index < paths.length; index++)
        CardImageModel(
          id: 'hp-${(index + 1).toString().padLeft(3, '0')}',
          deckId: AppConstants.hpDeckId,
          title: 'HP ${(index + 1).toString().padLeft(3, '0')}',
          path: paths[index],
          category: cardCategoryAt(index).label,
          colour: cardCategoryAt(index).colour,
          importedAt: DateTime.utc(2026, 8, 22),
        ),
    ];
    final deck = Deck(
      id: AppConstants.hpDeckId,
      name: 'CHANSON A REPONDRE HP',
      coverPath: AppConstants.hpDeckCover,
      cardBack: AppConstants.hpDeckCover,
      cards: cards,
      hasExplicitCategories: true,
    );
    _decks = [
      ..._decks.where((item) => item.id != AppConstants.hpDeckId),
      deck,
    ];
  }

  Future<void> _persist({bool notify = true}) async {
    await _storage.write(
      _decksKey,
      _decks.map((deck) => deck.toJson()).toList(),
    );
    if (_activeDeckId != null) await _storage.write(_activeKey, _activeDeckId!);
    if (notify) notifyListeners();
  }

  Future<void> select(String id) async {
    if (!_decks.any((deck) => deck.id == id)) return;
    final deckChanged = _activeDeckId != id;
    _activeDeckId = id;
    if (deckChanged) await _storage.remove(_searchStateKey);
    await _persist();
  }

  Future<void> create(String name) async {
    if (name.trim().isEmpty) return;
    final deck = Deck(
      id: _uuid.v4(),
      name: name.trim(),
      createdAt: DateTime.now(),
    );
    _decks = [..._decks, deck];
    _activeDeckId ??= deck.id;
    await _persist();
  }

  Future<void> import(String name, List<PlatformFile> files) async {
    final deck = await _importer.import(name, files);
    _decks = [..._decks, deck];
    _activeDeckId = deck.id;
    await _storage.remove(_searchStateKey);
    await _persist();
  }

  Future<void> rename(String id, String name) async {
    if (name.trim().isEmpty) return;
    if (AppConstants.builtInDeckIds.contains(id)) return;
    _decks = _decks
        .map((deck) => deck.id == id ? deck.copyWith(name: name.trim()) : deck)
        .toList();
    await _persist();
  }

  Future<void> delete(String id) async {
    if (AppConstants.builtInDeckIds.contains(id)) return;
    final deck = _decks.where((item) => item.id == id).firstOrNull;
    if (deck == null) return;
    await _importer.deleteFiles(deck);
    _decks = _decks.where((item) => item.id != id).toList();
    if (_activeDeckId == id) {
      _activeDeckId = _decks.firstOrNull?.id;
      await _storage.remove(_searchStateKey);
    }
    await _persist();
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

  Deck? deckForCard(String cardId) => _decks
      .where((deck) => deck.cards.any((card) => card.id == cardId))
      .firstOrNull;

  Future<void> updateCard(CardImageModel updated) async {
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
}
