import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:flutter/foundation.dart';

import '../models/ai_health_status.dart';
import '../models/card_chat_message.dart';
import '../models/card_chat_response.dart';
import '../models/card_transcription_response.dart';
import '../core/app_config.dart';
import 'ai_api_exception.dart';
import 'auth_service.dart';
import 'card_ai_service.dart';

class AiRestClient {
  AiRestClient({
    required String baseUrl,
    http.Client? client,
    this._authService,
  }) : baseUrl = baseUrl.replaceAll(RegExp(r'/+$'), ''),
       _client = client ?? http.Client(),
       _ownsClient = client == null;

  final String baseUrl;
  final http.Client _client;
  final AuthService? _authService;
  final bool _ownsClient;

  bool get isConfigured => baseUrl.isNotEmpty;
  Uri endpointUri(String path) => _uri(path);

  Future<AiHealthStatus> checkHealth() async => AiHealthStatus.fromJson(
    await getJson(
      '/health',
      timeout: const Duration(seconds: 10),
      authenticated: false,
    ),
  );

  Future<CardTranscriptionResponse> transcribeCard({
    required Uint8List imageBytes,
    required String cardId,
    required String deckId,
    required String title,
    required String mimeType,
    required TranscriptionMode mode,
  }) async => CardTranscriptionResponse.fromJson(
    await postMultipart(
      '/api/card-transcription',
      fields: {
        'cardId': cardId,
        'deckId': deckId,
        'title': title,
        'mode': mode.name,
      },
      bytes: imageBytes,
      mimeType: mimeType,
      filename:
          '$cardId.${mimeType == 'image/png'
              ? 'png'
              : mimeType == 'image/webp'
              ? 'webp'
              : 'jpg'}',
    ),
  );

  Future<CardChatResponse> discussCard({
    required String cardId,
    required String deckId,
    required String title,
    required String deckName,
    required String transcription,
    required String userMessage,
    required CardDiscussionMode mode,
    required List<CardChatMessage> history,
    String category = '',
    List<String> tags = const [],
  }) async => CardChatResponse.fromJson(
    await postJson('/api/chat', {
      'cardId': cardId,
      'deckId': deckId,
      'title': title,
      'cardTitle': title,
      'deckName': deckName,
      'category': category,
      'tags': tags,
      'transcription': transcription,
      'mode': mode.name,
      'message': userMessage,
      'history': history
          .map((message) => {'role': message.role, 'content': message.content})
          .toList(),
    }, timeout: const Duration(seconds: 60)),
  );

  Uri _uri(String path) {
    if (!isConfigured) {
      throw const AiApiException(
        AiApiErrorType.configuration,
        'No AI backend configured.',
      );
    }
    final base = Uri.parse(baseUrl);
    final basePath = base.path.replaceAll(RegExp(r'/+$'), '');
    final endpointPath = path.replaceFirst(RegExp(r'^/+'), '');
    return base.replace(path: '$basePath/$endpointPath');
  }

  Future<Map<String, dynamic>> getJson(
    String path, {
    Duration timeout = const Duration(seconds: 10),
    bool authenticated = true,
  }) async {
    final uri = _uri(path);
    _logRequest('GET', uri);
    if (!authenticated) {
      return _decode(await _run(() => _client.get(uri), timeout));
    }
    return _decode(
      await _runAuthenticated(
        (headers) => _client.get(uri, headers: headers),
        timeout,
      ),
    );
  }

  Future<Map<String, dynamic>> postJson(
    String path,
    Map<String, dynamic> body, {
    Duration timeout = const Duration(seconds: 60),
  }) async {
    final uri = _uri(path);
    _logRequest('POST', uri);
    return _decode(
      await _runAuthenticated(
        (authHeaders) => _client.post(
          uri,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...authHeaders,
          },
          body: jsonEncode(body),
        ),
        timeout,
      ),
    );
  }

  Future<Map<String, dynamic>> putJson(
    String path,
    Map<String, dynamic> body, {
    Duration timeout = const Duration(seconds: 60),
  }) async {
    final uri = _uri(path);
    _logRequest('PUT', uri);
    return _decode(
      await _runAuthenticated(
        (authHeaders) => _client.put(
          uri,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...authHeaders,
          },
          body: jsonEncode(body),
        ),
        timeout,
      ),
    );
  }

  Future<void> delete(
    String path, {
    Duration timeout = const Duration(seconds: 30),
  }) async {
    final uri = _uri(path);
    _logRequest('DELETE', uri);
    final response = await _runAuthenticated(
      (headers) => _client.delete(uri, headers: headers),
      timeout,
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      _decode(response);
    }
  }

  Future<Map<String, dynamic>> postMultipart(
    String path, {
    required Map<String, String> fields,
    required Uint8List bytes,
    required String mimeType,
    required String filename,
    Duration timeout = const Duration(seconds: 90),
  }) async {
    final uri = _uri(path);
    _logRequest('POST multipart', uri);
    final response = await _runAuthenticated((headers) async {
      final request = http.MultipartRequest('POST', uri)
        ..headers.addAll(headers)
        ..fields.addAll(fields)
        ..files.add(
          http.MultipartFile.fromBytes(
            'image',
            bytes,
            filename: filename,
            contentType: MediaType.parse(mimeType),
          ),
        );
      return http.Response.fromStream(await _client.send(request));
    }, timeout);
    return _decode(response);
  }

  Future<http.Response> _runAuthenticated(
    Future<http.Response> Function(Map<String, String> headers) request,
    Duration timeout,
  ) async {
    var headers = await _authorizationHeaders();
    var response = await _run(() => request(headers), timeout);
    if (response.statusCode != 401 || _authService == null) return response;

    final wasAnonymous = _authService.currentUser?.isAnonymous ?? false;
    final refreshed = await _authService.refreshAccessToken();
    if (refreshed == null || refreshed.isEmpty) {
      await _authService.signOut();
      throw AiApiException(
        AiApiErrorType.unauthorized,
        wasAnonymous
            ? 'Your guest AI session expired. Please retry the card action or reload the app.'
            : 'Your session has expired. Please sign in again.',
        statusCode: 401,
      );
    }
    headers = {'Authorization': 'Bearer $refreshed'};
    response = await _run(() => request(headers), timeout);
    if (response.statusCode == 401) await _authService.signOut();
    return response;
  }

  Future<Map<String, String>> _authorizationHeaders() async {
    if (_authService == null) return const {};
    final token = await _authService.getAccessToken();
    if (token == null || token.isEmpty) {
      final anonymous = _authService.currentUser?.isAnonymous ?? false;
      throw AiApiException(
        AiApiErrorType.unauthorized,
        anonymous
            ? 'Guest AI session is unavailable. Please retry the card action or reload the app.'
            : AppConfig.shouldSkipAuthentication
            ? 'AI authentication is unavailable in development mode.'
            : 'Authentication is required.',
      );
    }
    return {'Authorization': 'Bearer $token'};
  }

  Future<T> _run<T>(Future<T> Function() request, Duration timeout) async {
    try {
      return await request().timeout(timeout);
    } on TimeoutException {
      throw const AiApiException(
        AiApiErrorType.timeout,
        'The AI backend did not respond before the request timed out.',
      );
    } on AiApiException {
      rethrow;
    } on Object catch (error) {
      if (kDebugMode) {
        debugPrint('AI backend client error: ${error.runtimeType}');
      }
      final healthUrl = endpointUri('/health');
      throw AiApiException(
        AiApiErrorType.connection,
        kIsWeb
            ? 'The browser could not reach the AI backend. Check CORS and verify $healthUrl.'
            : 'The AI backend is not running or cannot be reached. Configured URL: $baseUrl. Start the backend and verify $healthUrl.',
      );
    }
  }

  Map<String, dynamic> _decode(http.Response response) {
    if (kDebugMode) {
      debugPrint(
        'AI backend response: ${response.statusCode} ${response.request?.url ?? ''}',
      );
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final base = _statusError(response.statusCode);
      String? backendMessage;
      try {
        final body = jsonDecode(utf8.decode(response.bodyBytes));
        if (body is Map<String, dynamic>) {
          final error = body['error'];
          backendMessage = error is String
              ? error
              : error is Map<String, dynamic> && error['message'] is String
              ? error['message'] as String
              : null;
        }
      } on FormatException {
        // A non-JSON error body still maps safely from its HTTP status.
      }
      final endpoint = response.request?.url;
      throw AiApiException(
        base.type,
        '${base.message}${backendMessage == null ? '' : ' $backendMessage'}${endpoint == null ? '' : ' Endpoint: $endpoint'}',
        statusCode: response.statusCode,
      );
    }
    try {
      final decoded = jsonDecode(utf8.decode(response.bodyBytes));
      if (decoded is! Map<String, dynamic>) {
        throw const FormatException();
      }
      return decoded;
    } on FormatException {
      throw const AiApiException(
        AiApiErrorType.malformedJson,
        'The AI backend returned an invalid response.',
      );
    }
  }

  AiApiException _statusError(int status) => switch (status) {
    400 => const AiApiException(
      AiApiErrorType.invalidRequest,
      'Invalid AI request.',
      statusCode: 400,
    ),
    401 => const AiApiException(
      AiApiErrorType.unauthorized,
      'The AI backend rejected this session.',
      statusCode: 401,
    ),
    403 => const AiApiException(
      AiApiErrorType.unauthorized,
      'You do not have permission to perform this action.',
      statusCode: 403,
    ),
    402 => const AiApiException(
      AiApiErrorType.quota,
      'AI billing or usage allowance is unavailable.',
      statusCode: 402,
    ),
    413 => const AiApiException(
      AiApiErrorType.payloadTooLarge,
      'Card image is too large.',
      statusCode: 413,
    ),
    415 => const AiApiException(
      AiApiErrorType.unsupportedMedia,
      'Unsupported card-image format.',
      statusCode: 415,
    ),
    429 => const AiApiException(
      AiApiErrorType.rateLimited,
      'AI service rate limit reached.',
      statusCode: 429,
    ),
    >= 500 => AiApiException(
      AiApiErrorType.server,
      'AI service unavailable.',
      statusCode: status,
    ),
    _ => AiApiException(
      AiApiErrorType.server,
      'AI request failed.',
      statusCode: status,
    ),
  };

  void close() {
    if (_ownsClient) _client.close();
  }

  void _logRequest(String method, Uri uri) {
    if (!kDebugMode) return;
    debugPrint('AI backend: $baseUrl');
    debugPrint('AI request: $method $uri (web: $kIsWeb)');
  }
}
