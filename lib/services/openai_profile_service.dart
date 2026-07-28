import '../models/openai_connection_status.dart';
import 'ai_rest_client.dart';

class OpenAiProfileService {
  const OpenAiProfileService(this._client);

  final AiRestClient _client;

  Future<OpenAiConnectionStatus> status() async =>
      OpenAiConnectionStatus.fromJson(
        await _client.getJson('/api/profile/openai-status'),
      );

  Future<OpenAiConnectionStatus> connect(String apiKey) async =>
      OpenAiConnectionStatus.fromJson(
        await _client.postJson(
          '/api/profile/openai-credential',
          {'apiKey': apiKey},
        ),
      );

  Future<OpenAiConnectionStatus> replace(String apiKey) async =>
      OpenAiConnectionStatus.fromJson(
        await _client.putJson(
          '/api/profile/openai-credential',
          {'apiKey': apiKey},
        ),
      );

  Future<String> test() async =>
      (await _client.postJson('/api/profile/openai-test', const {}))['message']
          as String? ??
      'OpenAI connection successful.';

  Future<void> disconnect() =>
      _client.delete('/api/profile/openai-credential');
}
