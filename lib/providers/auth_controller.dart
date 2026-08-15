import 'dart:async';
import 'package:flutter/foundation.dart';

import '../models/auth_user.dart';
import '../services/auth_service.dart';

enum AuthStatus { loading, authenticated, unauthenticated }

enum AuthenticationMode {
  loading,
  unauthenticated,
  developmentBypass,
  authenticated,
  configurationError,
}

class AuthController extends ChangeNotifier {
  AuthController(
    this.service, {
    this.developmentBypassEnabled = false,
    this.configurationError = false,
    this.anonymousGuestEnabled = false,
  }) {
    _user = service.currentUser;
    status = _user != null
        ? AuthStatus.authenticated
        : anonymousGuestEnabled &&
              !configurationError &&
              !developmentBypassEnabled
        ? AuthStatus.loading
        : AuthStatus.unauthenticated;
    _subscription = service.authStateChanges.listen(_onAuthState);
    if (_user == null && status == AuthStatus.loading) {
      unawaited(_startGuestSession());
    }
  }

  final AuthService service;
  final bool developmentBypassEnabled;
  final bool configurationError;
  final bool anonymousGuestEnabled;
  late final StreamSubscription<AuthUser?> _subscription;
  AuthStatus status = AuthStatus.loading;
  AuthUser? _user;
  AuthUser? get user => _user;
  bool get isAnonymous => _user?.isAnonymous ?? false;
  AuthenticationMode get mode {
    if (status == AuthStatus.loading) return AuthenticationMode.loading;
    if (_user != null) return AuthenticationMode.authenticated;
    if (configurationError) return AuthenticationMode.configurationError;
    if (developmentBypassEnabled && !_bypassSuppressed) {
      return AuthenticationMode.developmentBypass;
    }
    return AuthenticationMode.unauthenticated;
  }

  bool get canUseProtectedAi => mode == AuthenticationMode.authenticated;
  bool _bypassSuppressed = false;
  bool busy = false;
  String? error;

  void showRealSignIn() {
    _bypassSuppressed = true;
    notifyListeners();
  }

  Future<bool> signIn(String email, String password) =>
      _execute(() => service.signIn(email: email, password: password));
  Future<bool> register(String email, String password) =>
      _execute(() => service.register(email: email, password: password));

  Future<bool> sendPasswordReset(String email) async {
    busy = true;
    error = null;
    notifyListeners();
    try {
      await service.sendPasswordReset(email: email);
      return true;
    } on AuthException catch (exception) {
      error = exception.message;
      return false;
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    await service.signOut();
    _onAuthState(null);
    if (anonymousGuestEnabled &&
        !configurationError &&
        !developmentBypassEnabled) {
      await _startGuestSession();
    }
  }

  Future<bool> refreshSession() async {
    error = null;
    try {
      final token = await service.refreshAccessToken();
      if (token == null || token.isEmpty) {
        throw const AuthException('Your session could not be refreshed.');
      }
      return true;
    } on AuthException catch (exception) {
      error = exception.message;
      notifyListeners();
      return false;
    }
  }

  Future<bool> ensureAnonymousSession() async {
    if (_user != null) return true;
    if (!anonymousGuestEnabled || configurationError || developmentBypassEnabled) {
      return false;
    }
    return _startGuestSession();
  }

  Future<bool> _startGuestSession() async {
    if (_user != null) return true;
    status = AuthStatus.loading;
    error = null;
    notifyListeners();
    try {
      _onAuthState(await service.signInAnonymously());
      return true;
    } on AuthException catch (exception) {
      status = AuthStatus.unauthenticated;
      error = 'Guest session unavailable. ${exception.message}';
      notifyListeners();
      return false;
    }
  }

  Future<bool> _execute(Future<AuthUser> Function() action) async {
    if (busy) return false;
    busy = true;
    error = null;
    notifyListeners();
    try {
      _onAuthState(await action());
      return true;
    } on AuthException catch (exception) {
      error = exception.message;
      return false;
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  void clearError() {
    error = null;
    notifyListeners();
  }

  void _onAuthState(AuthUser? value) {
    _user = value;
    status = value == null
        ? AuthStatus.unauthenticated
        : AuthStatus.authenticated;
    notifyListeners();
  }

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}
