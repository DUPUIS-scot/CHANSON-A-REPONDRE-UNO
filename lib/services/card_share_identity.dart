import '../core/app_constants.dart';

abstract final class CardShareIdentity {
  static final RegExp _unoCardPattern = RegExp(r'^final-(?:\d+)-(\d+)$');
  static final RegExp _brioCardPattern = RegExp(r'^brio-(\d+)$');
  static final RegExp _hpCardPattern = RegExp(r'^hp-(\d+)$');

  static String canonicalSlugFor({
    required String cardId,
    required String deckId,
  }) {
    if (deckId == AppConstants.productionDeckId) {
      final number = _numberFrom(_unoCardPattern, cardId);
      if (number == null || number < 1) {
        throw FormatException('Invalid built-in UNO card id: $cardId');
      }
      return 'UNO-${number.toString().padLeft(3, '0')}';
    }
    if (deckId == AppConstants.brioDeckId) {
      final number = _numberFrom(_brioCardPattern, cardId);
      if (number == null || number < 1) {
        throw FormatException('Invalid built-in BRIO card id: $cardId');
      }
      return 'BRIO-${number.toString().padLeft(3, '0')}';
    }
    if (deckId == AppConstants.hpDeckId) {
      final number = _numberFrom(_hpCardPattern, cardId);
      if (number == null || number < 1) {
        throw FormatException('Invalid built-in HP card id: $cardId');
      }
      return 'HP-${number.toString().padLeft(3, '0')}';
    }
    return cardId;
  }

  static String? legacySlugFor({
    required String cardId,
    required String deckId,
  }) => deckId == AppConstants.productionDeckId ? cardId : null;

  /// Built-in decks receive a compact, crawler-safe copy of every recto.
  /// Unknown/custom decks retain their original card asset instead.
  static String? previewImagePathFor({
    required String cardId,
    required String deckId,
  }) {
    if (deckId != AppConstants.productionDeckId &&
        deckId != AppConstants.brioDeckId &&
        deckId != AppConstants.hpDeckId) {
      return null;
    }
    return 'share-previews/${canonicalSlugFor(cardId: cardId, deckId: deckId)}.jpg';
  }

  static String deckShareNameFor({
    required String deckId,
    required String fallbackName,
  }) {
    if (deckId == AppConstants.productionDeckId) return 'Chanson à répondre UNO';
    if (deckId == AppConstants.brioDeckId) return 'Chanson à répondre BRIO';
    if (deckId == AppConstants.hpDeckId) return 'Chanson à répondre HP';
    return fallbackName.trim().isEmpty ? 'Chanson à répondre' : fallbackName.trim();
  }

  static String titleFor({
    required String cardId,
    required String deckId,
    required String deckName,
    String cardDisplayTitle = '',
  }) {
    final name = deckShareNameFor(deckId: deckId, fallbackName: deckName);
    final number = numberFor(cardId: cardId, deckId: deckId);
    if (number != null) return '$name — Carte ${number.toString().padLeft(3, '0')}';
    final fallback = cardDisplayTitle.trim();
    return '$name — ${fallback.isEmpty ? 'Carte' : fallback}';
  }

  static int? numberFor({required String cardId, required String deckId}) {
    if (deckId == AppConstants.productionDeckId) return _numberFrom(_unoCardPattern, cardId);
    if (deckId == AppConstants.brioDeckId) return _numberFrom(_brioCardPattern, cardId);
    if (deckId == AppConstants.hpDeckId) return _numberFrom(_hpCardPattern, cardId);
    final match = RegExp(r'(\d+)$').firstMatch(cardId);
    return int.tryParse(match?.group(1) ?? '');
  }

  static int? _numberFrom(RegExp pattern, String cardId) {
    final match = pattern.firstMatch(cardId);
    return int.tryParse(match?.group(1) ?? '');
  }
}
