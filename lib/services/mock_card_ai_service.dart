import '../models/card_chat_message.dart';
import '../models/card_image_model.dart';
import '../models/card_transcription_result.dart';
import 'card_ai_service.dart';

class MockCardAiService implements CardAiService {
  const MockCardAiService();

  @override
  bool get isConfigured => true;
  @override
  String get model => 'mock-card-ai';

  @override
  Future<CardTranscriptionResult> transcribeCardImage(
    CardImageModel card, {
    TranscriptionMode mode = TranscriptionMode.exact,
  }) async => CardTranscriptionResult(
    exactText: mode == TranscriptionMode.exact ? 'Mock transcription' : '',
    cleanedText: mode == TranscriptionMode.clean ? 'Mock transcription' : null,
    detectedLanguage: 'und',
    createdAt: DateTime.now(),
    model: model,
  );

  @override
  Future<String> discussCard({
    required CardImageModel card,
    required String prompt,
    required DiscussionMode mode,
    required List<CardChatMessage> history,
    String? targetLanguage,
    String? summaryLength,
  }) async => 'Mock response grounded in the selected ${card.category} card.';

  Stream<String> discussCardStream({
    required CardImageModel card,
    required String prompt,
    required DiscussionMode mode,
    required List<CardChatMessage> history,
    String? targetLanguage,
    String? summaryLength,
  }) async* {
    yield 'Mock response ';
    yield 'grounded in the selected ${card.category} card.';
  }
}
