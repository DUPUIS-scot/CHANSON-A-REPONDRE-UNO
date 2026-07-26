import 'dart:convert';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:uuid/uuid.dart';

import '../core/app_constants.dart';
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
      _activeDeckId = await _storage.read(_activeKey);
      if (activeDeck == null ||
          _activeDeckId != AppConstants.productionDeckId) {
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
    final deck = rawDecks
        .whereType<Map<String, dynamic>>()
        .map(Deck.fromJson)
        .firstWhere((deck) => deck.id == AppConstants.productionDeckId);
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

  Future<void> _persist({bool notify = true}) async {
    await _storage.write(
      _decksKey,
      _decks.map((deck) => deck.toJson()).toList(),
    );
    if (_activeDeckId != null) await _storage.write(_activeKey, _activeDeckId!);
    if (notify) notifyListeners();
  }

  Future<void> select(String id) async {
    _activeDeckId = id;
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
    await _persist();
  }

  Future<void> rename(String id, String name) async {
    if (name.trim().isEmpty) return;
    _decks = _decks
        .map((deck) => deck.id == id ? deck.copyWith(name: name.trim()) : deck)
        .toList();
    await _persist();
  }

  Future<void> delete(String id) async {
    final deck = _decks.where((item) => item.id == id).firstOrNull;
    if (deck == null) return;
    await _importer.deleteFiles(deck);
    _decks = _decks.where((item) => item.id != id).toList();
    if (_activeDeckId == id) _activeDeckId = _decks.firstOrNull?.id;
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
