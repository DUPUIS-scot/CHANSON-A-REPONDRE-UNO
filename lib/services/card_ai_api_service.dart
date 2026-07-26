import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';

import '../models/ai_health_status.dart';
import '../models/card_chat_message.dart';
import '../models/card_chat_response.dart';
import '../models/card_image_model.dart';
import '../models/card_transcription_response.dart';
import '../models/card_transcription_result.dart';
import 'ai_api_exception.dart';
import 'ai_rest_client.dart';
import 'card_ai_service.dart';

class CardAiApiService implements CardAiService {
  CardAiApiService({required this._client});
  final AiRestClient _client;

  @override
  bool get isConfigured => _client.isConfigured;
  @override
  String get model => 'backend-managed';

  Future<AiHealthStatus> checkConnection() => _client.checkHealth();

  Future<CardTranscriptionResponse> transcribeCard({
    required CardImageModel card,
    required Uint8List imageBytes,
    required String mimeType,
    required TranscriptionMode mode,
  }) async {
    if (kDebugMode) {
      debugPrint('Card transcription backend: ${_client.baseUrl}');
      debugPrint(
        'Card transcription endpoint: ${_client.endpointUri('/api/card-transcription')}',
      );
      debugPrint('Card transcription request: POST multipart (web: $kIsWeb)');
    }
    if (imageBytes.isEmpty) {
      throw const AiApiException(
        AiApiErrorType.invalidRequest,
        'The card image could not be read.',
      );
    }
    if (imageBytes.length > 20 * 1024 * 1024) {
      throw const AiApiException(
        AiApiErrorType.payloadTooLarge,
        'Card image is too large.',
      );
    }
    if (!const {'image/png', 'image/jpeg', 'image/webp'}.contains(mimeType)) {
      throw const AiApiException(
        AiApiErrorType.unsupportedMedia,
        'Unsupported card-image format.',
      );
    }
    return CardTranscriptionResponse.fromJson(
      await _client.postMultipart(
        '/api/card-transcription',
        fields: {
          'cardId': card.id,
          'deckId': card.deckId,
          'title': card.title,
          'mode': mode.name,
        },
        bytes: imageBytes,
        mimeType: mimeType,
        filename:
            '${card.id}.${mimeType == 'image/png'
                ? 'png'
                : mimeType == 'image/webp'
                ? 'webp'
                : 'jpg'}',
      ),
    );
  }

  Future<CardChatResponse> discussCardTyped({
    required CardImageModel card,
    required String transcription,
    required String userMessage,
    required CardDiscussionMode mode,
    required List<CardChatMessage> recentHistory,
  }) async => CardChatResponse.fromJson(
    await _client.postJson('/api/chat', {
      'cardId': card.id,
      'deckId': card.deckId,
      'cardTitle': card.title,
      'deckName': '',
      'category': card.category,
      'tags': card.tags,
      'transcription': transcription,
      'mode': mode.name,
      'message': userMessage,
      'history': recentHistory
          .map((item) => {'role': item.role, 'content': item.content})
          .toList(),
    }, timeout: const Duration(seconds: 60)),
  );

  @override
  Future<CardTranscriptionResult> transcribeCardImage(
    CardImageModel card, {
    TranscriptionMode mode = TranscriptionMode.exact,
  }) async {
    final bytes = await _readBytes(card);
    final mime = _detectMime(bytes);
    final response = await transcribeCard(
      card: card,
      imageBytes: bytes,
      mimeType: mime,
      mode: mode,
    );
    return CardTranscriptionResult(
      exactText: response.exactText,
      cleanedText: response.cleanedText,
      detectedLanguage: response.detectedLanguage,
      createdAt: response.createdAt,
      model: response.model,
      requestId: response.requestId,
    );
  }

  @override
  Future<String> discussCard({
    required CardImageModel card,
    required String prompt,
    required DiscussionMode mode,
    required List<CardChatMessage> history,
    String? targetLanguage,
    String? summaryLength,
  }) async => (await discussCardTyped(
    card: card,
    transcription: card.cleanedTranscription ?? card.transcription ?? '',
    userMessage: prompt,
    mode: mode,
    recentHistory: history.length > 12
        ? history.sublist(history.length - 12)
        : history,
  )).message;

  Future<Uint8List> _readBytes(CardImageModel card) async {
    if (card.path.startsWith('data:image/')) {
      final comma = card.path.indexOf(',');
      if (comma < 0) throw const FormatException('Invalid image data.');
      return base64Decode(card.path.substring(comma + 1));
    }
    if (kIsWeb) {
      throw const AiApiException(
        AiApiErrorType.invalidRequest,
        'The card image could not be read in this browser.',
      );
    }
    final file = File(card.path);
    if (!await file.exists()) {
      throw const AiApiException(
        AiApiErrorType.invalidRequest,
        'The card image could not be read.',
      );
    }
    return file.readAsBytes();
  }

  String _detectMime(Uint8List bytes) {
    if (bytes.length >= 4 &&
        bytes[0] == 0x89 &&
        bytes[1] == 0x50 &&
        bytes[2] == 0x4e &&
        bytes[3] == 0x47) {
      return 'image/png';
    }
    if (bytes.length >= 3 &&
        bytes[0] == 0xff &&
        bytes[1] == 0xd8 &&
        bytes[2] == 0xff) {
      return 'image/jpeg';
    }
    if (bytes.length >= 12 &&
        ascii.decode(bytes.sublist(0, 4), allowInvalid: true) == 'RIFF' &&
        ascii.decode(bytes.sublist(8, 12), allowInvalid: true) == 'WEBP') {
      return 'image/webp';
    }
    throw const AiApiException(
      AiApiErrorType.unsupportedMedia,
      'Unsupported card-image format.',
    );
  }
}
