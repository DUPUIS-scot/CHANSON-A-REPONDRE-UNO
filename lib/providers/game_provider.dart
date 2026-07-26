import 'dart:math';

import 'package:flutter/foundation.dart';

import '../models/card_image_model.dart';
import '../models/deck_model.dart';
import '../models/game_state_model.dart';
import '../models/player_model.dart';
import '../services/game_storage_service.dart';

class GameProvider extends ChangeNotifier {
  GameProvider(this._storage);
  final GameStorageService _storage;
  GameStateModel? _state;
  String? _message;
  GameStateModel? get state => _state;
  String? get message => _message;
  bool get hasSavedGame => _state != null;

  Future<void> load() async {
    _state = await _storage.load();
    notifyListeners();
  }

  Future<bool> start(Deck deck, {int playerCount = 2}) async {
    const handSize = 5;
    if (deck.cards.length < playerCount * handSize + 1) {
      _message =
          'This deck needs at least ${playerCount * handSize + 1} cards.';
      notifyListeners();
      return false;
    }
    final shuffled = [...deck.cards]..shuffle(Random.secure());
    final hands = List.generate(playerCount, (_) => <CardImageModel>[]);
    for (var round = 0; round < handSize; round++) {
      for (final hand in hands) {
        hand.add(shuffled.removeLast());
      }
    }
    final top = shuffled.removeLast();
    _state = GameStateModel(
      deckId: deck.id,
      topCard: top,
      currentColour: _colour(top.colour),
      currentCategory: top.category,
      playDirection: PlayDirection.clockwise,
      drawPile: shuffled,
      discardPile: [top],
      players: List.generate(
        playerCount,
        (index) => PlayerModel(
          id: 'player-$index',
          name: 'Player ${index + 1}',
          hand: hands[index],
        ),
      ),
      currentPlayerIndex: 0,
    );
    _message = null;
    await _save();
    return true;
  }

  bool canPlay(CardImageModel card) {
    final state = _state;
    if (state == null) return false;
    if (card.category.toLowerCase() == 'sauvage' ||
        card.colour.toLowerCase() == 'black') {
      return true;
    }
    return switch (state.matchRule) {
      MatchRule.colourOnly => _colour(card.colour) == state.currentColour,
      MatchRule.categoryOnly => card.category == state.currentCategory,
      MatchRule.colourOrCategory =>
        _colour(card.colour) == state.currentColour ||
            card.category == state.currentCategory,
    };
  }

  Future<bool> play(
    CardImageModel card, {
    CardColour? wildColour,
    String? wildCategory,
  }) async {
    final state = _state;
    if (state == null) return false;
    if (!canPlay(card)) {
      _message =
          'Illegal play: match ${state.matchRule == MatchRule.colourOnly
              ? 'the colour'
              : state.matchRule == MatchRule.categoryOnly
              ? 'the category'
              : 'the colour or category'}, or play a Sauvage card.';
      notifyListeners();
      return false;
    }
    final players = [...state.players];
    final player = players[state.currentPlayerIndex];
    final hand = [...player.hand]..removeWhere((item) => item.id == card.id);
    players[state.currentPlayerIndex] = player.copyWith(hand: hand);
    final isWild =
        card.category.toLowerCase() == 'sauvage' ||
        card.colour.toLowerCase() == 'black';
    var next = _advance(state);
    _state = state.copyWith(
      topCard: card,
      currentColour: isWild
          ? (wildColour ?? state.currentColour)
          : _colour(card.colour),
      currentCategory: isWild
          ? (wildCategory ?? state.currentCategory)
          : card.category,
      discardPile: [...state.discardPile, card],
      players: players,
      currentPlayerIndex: next,
      winnerName: hand.isEmpty && !state.collaborativeMode ? player.name : null,
    );
    _message = hand.isEmpty
        ? (state.collaborativeMode
              ? 'The group completed the deck.'
              : '${player.name} wins!')
        : null;
    await _save();
    return true;
  }

  Future<void> draw() async {
    var state = _state;
    if (state == null) return;
    var drawPile = [...state.drawPile];
    var discard = [...state.discardPile];
    if (drawPile.isEmpty && discard.length > 1) {
      final top = discard.removeLast();
      drawPile = discard..shuffle();
      discard = [top];
    }
    if (drawPile.isEmpty) {
      _message = 'There are no cards left to draw.';
      notifyListeners();
      return;
    }
    final players = [...state.players];
    final player = players[state.currentPlayerIndex];
    final hand = [...player.hand];
    do {
      hand.add(drawPile.removeLast());
    } while (state.drawRule == DrawRule.drawUntilPlayable &&
        drawPile.isNotEmpty &&
        !canPlay(hand.last));
    players[state.currentPlayerIndex] = player.copyWith(hand: hand);
    state = state.copyWith(
      drawPile: drawPile,
      discardPile: discard,
      players: players,
      currentPlayerIndex: _advance(state),
    );
    _state = state;
    _message =
        '${player.name} drew ${hand.length - player.hand.length} card(s).';
    await _save();
  }

  int _advance(GameStateModel state, {bool skip = false}) {
    final step =
        (state.playDirection == PlayDirection.clockwise ? 1 : -1) *
        (skip ? 2 : 1);
    return (state.currentPlayerIndex + step) % state.players.length;
  }

  CardColour _colour(String value) =>
      CardColour.values
          .where((colour) => colour.name == value.toLowerCase())
          .firstOrNull ??
      CardColour.custom;
  Future<void> updateRules({
    DrawRule? drawRule,
    MatchRule? matchRule,
    bool? stacking,
    bool? timed,
    bool? collaborative,
    bool? conversation,
    bool? journal,
  }) async {
    if (_state == null) return;
    _state = _state!.copyWith(
      drawRule: drawRule,
      matchRule: matchRule,
      allowStacking: stacking,
      timedTurns: timed,
      collaborativeMode: collaborative,
      conversationMode: conversation,
      journalMode: journal,
    );
    await _save();
  }

  Future<void> _save() async {
    if (_state != null) await _storage.save(_state!);
    notifyListeners();
  }

  Future<void> saveCurrent() => _save();

  Future<void> clear() async {
    _state = null;
    _message = null;
    await _storage.clear();
    notifyListeners();
  }
}
