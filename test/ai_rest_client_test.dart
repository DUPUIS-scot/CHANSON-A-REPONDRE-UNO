import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:uno_chanson_2/models/ai_health_status.dart';
import 'package:uno_chanson_2/models/card_chat_response.dart';
import 'package:uno_chanson_2/models/card_transcription_response.dart';
import 'package:uno_chanson_2/services/ai_api_exception.dart';
import 'package:uno_chanson_2/services/ai_rest_client.dart';
import 'package:uno_chanson_2/services/auth_service.dart';
import 'package:uno_chanson_2/models/auth_user.dart';

void main() {
  test('health response is typed and URL slashes are normalized', () async {
    final client = AiRestClient(
      baseUrl: 'http://127.0.0.1:3000/',
      client: MockClient((request) async {
        expect(request.url.toString(), 'http://127.0.0.1:3000/health');
        return http.Response(
          jsonEncode({
            'status': 'ok',
            'service': 'card-ai',
            'version': '1.0.0',
          }),
          200,
        );
      }),
    );
    final status = AiHealthStatus.fromJson(await client.getJson('/health'));
    expect(status.status, 'ok');
    expect(status.service, 'card-ai');
  });

  for (final entry in const {
    401: AiApiErrorType.unauthorized,
    429: AiApiErrorType.rateLimited,
    500: AiApiErrorType.server,
  }.entries) {
    test('status ${entry.key} maps to ${entry.value.name}', () async {
      final client = AiRestClient(
        baseUrl: 'https://api.example',
        client: MockClient((_) async => http.Response('{}', entry.key)),
      );
      await expectLater(
        client.getJson('/health'),
        throwsA(
          isA<AiApiException>().having((e) => e.type, 'type', entry.value),
        ),
      );
    });
  }

  test('typed transcription accepts missing cleaned text', () {
    final response = CardTranscriptionResponse.fromJson({
      'cardId': 'card-1',
      'exactText': 'Bonjour',
      'detectedLanguage': 'fr',
      'status': 'needsReview',
      'model': 'model',
      'createdAt': '2026-07-16T18:00:00Z',
    });
    expect(response.cleanedText, isNull);
    expect(response.exactText, 'Bonjour');
  });

  test('malformed transcription is rejected', () {
    expect(
      () => CardTranscriptionResponse.fromJson(const {'cardId': 'card-1'}),
      throwsFormatException,
    );
  });

  test('chat post contains only supplied card context', () async {
    final client = AiRestClient(
      baseUrl: 'https://api.example',
      client: MockClient((request) async {
        final body = jsonDecode(request.body) as Map<String, dynamic>;
        expect(body['cardId'], 'card-1');
        expect(body.containsKey('allCards'), isFalse);
        expect(body.containsKey('journal'), isFalse);
        return http.Response(
          jsonEncode({
            'cardId': 'card-1',
            'message': 'Answer',
            'model': 'model',
            'createdAt': '2026-07-16T18:05:00Z',
          }),
          200,
        );
      }),
    );
    final response = CardChatResponse.fromJson(
      await client.postJson('/api/cards/chat', {
        'cardId': 'card-1',
        'transcription': 'Text',
        'message': 'Question',
      }),
    );
    expect(response.message, 'Answer');
  });

  test('missing configuration never attempts a request', () async {
    final client = AiRestClient(
      baseUrl: '',
      client: MockClient((_) async => throw StateError('called')),
    );
    await expectLater(
      client.getJson('/health'),
      throwsA(
        isA<AiApiException>().having(
          (e) => e.type,
          'type',
          AiApiErrorType.configuration,
        ),
      ),
    );
  });

  test('401 refreshes the token and retries exactly once', () async {
    var requests = 0;
    final auth = _FakeAuthService(token: 'expired', refreshed: 'fresh');
    final client = AiRestClient(
      baseUrl: 'https://api.example',
      authService: auth,
      client: MockClient((request) async {
        requests++;
        if (requests == 1) {
          expect(request.headers['authorization'], 'Bearer expired');
          return http.Response('{}', 401);
        }
        expect(request.headers['authorization'], 'Bearer fresh');
        return http.Response('{"status":"ok"}', 200);
      }),
    );
    expect((await client.getJson('/health'))['status'], 'ok');
    expect(requests, 2);
    expect(auth.refreshes, 1);
    expect(auth.signedOut, isFalse);
  });

  test('failed token refresh signs the user out', () async {
    final auth = _FakeAuthService(token: 'expired', refreshed: null);
    final client = AiRestClient(
      baseUrl: 'https://api.example',
      authService: auth,
      client: MockClient((_) async => http.Response('{}', 401)),
    );
    await expectLater(
      client.getJson('/health'),
      throwsA(isA<AiApiException>()),
    );
    expect(auth.signedOut, isTrue);
  });

  test('missing real token never sends a backend request', () async {
    var called = false;
    final auth = _FakeAuthService(token: null, refreshed: null);
    final client = AiRestClient(
      baseUrl: 'https://api.example',
      authService: auth,
      client: MockClient((_) async {
        called = true;
        return http.Response('{}', 200);
      }),
    );
    await expectLater(
      client.getJson('/health'),
      throwsA(isA<AiApiException>()),
    );
    expect(called, isFalse);
  });
}

class _FakeAuthService implements AuthService {
  _FakeAuthService({required this.token, required this.refreshed});
  String? token;
  final String? refreshed;
  int refreshes = 0;
  bool signedOut = false;

  @override
  Stream<AuthUser?> get authStateChanges => const Stream.empty();
  @override
  AuthUser? get currentUser =>
      const AuthUser(id: 'user-1', email: 'user@example.com');
  @override
  Future<AuthUser> signInAnonymously() => throw UnimplementedError();
  @override
  Future<String?> getAccessToken() async => token;
  @override
  Future<String?> refreshAccessToken() async {
    refreshes++;
    token = refreshed;
    return refreshed;
  }

  @override
  Future<void> signOut() async => signedOut = true;
  @override
  Future<AuthUser> register({
    required String email,
    required String password,
  }) => throw UnimplementedError();
  @override
  Future<void> sendPasswordReset({required String email}) =>
      throw UnimplementedError();
  @override
  Future<AuthUser> signIn({required String email, required String password}) =>
      throw UnimplementedError();
  @override
  Future<void> deleteAccount() => throw UnimplementedError();
}
