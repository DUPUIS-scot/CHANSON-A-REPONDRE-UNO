import '../core/app_constants.dart';

abstract final class CardShareIdentity {
  static final RegExp _unoCardPattern = RegExp(r'^final-84-(\d{2})$');
  static final RegExp _brioCardPattern = RegExp(r'^brio-(\d{3})$');

  static String canonicalSlugFor({
    required String cardId,
    required String deckId,
  }) {
    if (deckId == AppConstants.productionDeckId) {
      final number = _numberFrom(_unoCardPattern, cardId);
      if (number == null || number < 1 || number > 84) {
        throw FormatException('Invalid built-in UNO card id: $cardId');
      }
      return 'UNO-${number.toString().padLeft(3, '0')}';
    }
    if (deckId == AppConstants.brioDeckId) {
      final number = _numberFrom(_brioCardPattern, cardId);
      if (number == null || number < 1 || number > 16) {
        throw FormatException('Invalid built-in BRIO card id: $cardId');
      }
      return 'BRIO-${number.toString().padLeft(3, '0')}';
    }
    return cardId;
  }

  static String? legacySlugFor({
    required String cardId,
    required String deckId,
  }) => deckId == AppConstants.productionDeckId ? cardId : null;

  static String deckShareNameFor({
    required String deckId,
    required String fallbackName,
  }) {
    if (deckId == AppConstants.productionDeckId) {
      return 'Chanson à répondre UNO';
    }
    if (deckId == AppConstants.brioDeckId) {
      return 'Chanson à répondre BRIO';
    }
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
    if (number != null) {
      return '$name — Carte ${number.toString().padLeft(3, '0')}';
    }
    final fallback = cardDisplayTitle.trim();
    return '$name — ${fallback.isEmpty ? 'Carte' : fallback}';
  }

  static int? numberFor({required String cardId, required String deckId}) {
    if (deckId == AppConstants.productionDeckId) {
      return _numberFrom(_unoCardPattern, cardId);
    }
    if (deckId == AppConstants.brioDeckId) {
      return _numberFrom(_brioCardPattern, cardId);
    }
    final match = RegExp(r'(\d+)$').firstMatch(cardId);
    return int.tryParse(match?.group(1) ?? '');
  }

  static int? _numberFrom(RegExp pattern, String cardId) {
    final match = pattern.firstMatch(cardId);
    return int.tryParse(match?.group(1) ?? '');
  }
}
