import 'package:flutter/foundation.dart';

import '../models/openai_connection_status.dart';
import '../services/ai_api_exception.dart';
import '../services/openai_profile_service.dart';
import 'auth_controller.dart';

class OpenAiConnectionController extends ChangeNotifier {
  OpenAiConnectionController(this._service, this._auth) {
    _auth.addListener(_handleAuthChange);
    _userId = _auth.user?.id;
  }

  final OpenAiProfileService _service;
  final AuthController _auth;
  String? _userId;

  OpenAiConnectionStatus status = OpenAiConnectionStatus.disconnected;
  bool loading = false;
  String? message;
  String? error;

  bool get connected => _auth.user != null && status.connected;

  Future<void> refresh() async {
    final expectedUser = _auth.user?.id;
    if (expectedUser == null) {
      _clear();
      return;
    }
    loading = true;
    error = null;
    notifyListeners();
    try {
      final next = await _service.status();
      if (_auth.user?.id == expectedUser) status = next;
    } on Object catch (exception) {
      if (_auth.user?.id == expectedUser) error = _safeMessage(exception);
    } finally {
      if (_auth.user?.id == expectedUser) {
        loading = false;
        notifyListeners();
      }
    }
  }

  Future<bool> connect(String apiKey, {bool replace = false}) async {
    if (_auth.user == null) return false;
    loading = true;
    error = null;
    message = null;
    notifyListeners();
    try {
      status = replace
          ? await _service.replace(apiKey)
          : await _service.connect(apiKey);
      message = 'Your OpenAI API account is ready for AI features.';
      return true;
    } on Object catch (exception) {
      error = _safeMessage(exception);
      return false;
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> testConnection() async {
    loading = true;
    error = null;
    message = null;
    notifyListeners();
    try {
      message = await _service.test();
    } on Object catch (exception) {
      error = _safeMessage(exception);
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<bool> disconnect() async {
    loading = true;
    error = null;
    message = null;
    notifyListeners();
    try {
      await _service.disconnect();
      status = OpenAiConnectionStatus.disconnected;
      message = 'OpenAI has been disconnected.';
      return true;
    } on Object catch (exception) {
      error = _safeMessage(exception);
      return false;
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  void _handleAuthChange() {
    final nextUserId = _auth.user?.id;
    if (nextUserId == _userId) return;
    _userId = nextUserId;
    _clear();
  }

  void _clear() {
    status = OpenAiConnectionStatus.disconnected;
    loading = false;
    message = null;
    error = null;
    notifyListeners();
  }

  String _safeMessage(Object exception) => exception is AiApiException
      ? exception.message
      : 'The OpenAI connection could not be updated. Try again.';

  @override
  void dispose() {
    _auth.removeListener(_handleAuthChange);
    super.dispose();
  }
}
