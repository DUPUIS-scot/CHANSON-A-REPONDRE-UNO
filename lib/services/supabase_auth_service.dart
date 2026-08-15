import 'package:supabase_flutter/supabase_flutter.dart' as supabase;

import '../models/auth_user.dart';
import '../core/app_config.dart';
import 'auth_service.dart';

class SupabaseAuthService implements AuthService {
  SupabaseAuthService(this._client);
  final supabase.SupabaseClient _client;

  @override
  Stream<AuthUser?> get authStateChanges => _client.auth.onAuthStateChange.map(
    (event) => _toUser(event.session?.user),
  );

  @override
  AuthUser? get currentUser => _toUser(_client.auth.currentUser);

  @override
  Future<AuthUser> signInAnonymously() async {
    try {
      final current = _client.auth.currentUser;
      if (current != null) return _requireUser(current);
      final response = await _client.auth.signInAnonymously();
      final session = response.session ?? _client.auth.currentSession;
      if (session == null || session.accessToken.trim().isEmpty) {
        throw const AuthException(
          'Guest authentication succeeded without a valid session.',
        );
      }
      return _requireUser(response.user ?? session.user);
    } on supabase.AuthException catch (error) {
      throw AuthException(_friendly(error));
    }
  }

  @override
  Future<AuthUser> signIn({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _client.auth.signInWithPassword(
        email: email.trim(),
        password: password,
      );
      final session = response.session ?? _client.auth.currentSession;
      if (session == null || session.accessToken.trim().isEmpty) {
        throw const AuthException(
          'Authentication succeeded without a valid session. Sign in again.',
        );
      }
      return _requireUser(response.user);
    } on supabase.AuthException catch (error) {
      throw AuthException(_friendly(error, login: true));
    }
  }

  @override
  Future<AuthUser> register({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _client.auth.signUp(
        email: email.trim(),
        password: password,
        emailRedirectTo: AppConfig.authenticationRedirectUrl,
      );
      final user = _requireUser(response.user);
      if (response.session == null) {
        throw const EmailConfirmationRequiredException();
      }
      return user;
    } on supabase.AuthException catch (error) {
      throw AuthException(_friendly(error));
    }
  }

  @override
  Future<void> sendPasswordReset({required String email}) async {
    try {
      await _client.auth.resetPasswordForEmail(
        email.trim(),
        redirectTo: AppConfig.authenticationRedirectUrl,
      );
    } on supabase.AuthException catch (error) {
      throw AuthException(_friendly(error));
    }
  }

  @override
  Future<void> signOut() => _client.auth.signOut();

  @override
  Future<void> deleteAccount() async {
    throw const AuthException(
      'Account deletion requires the secure backend account endpoint.',
    );
  }

  @override
  Future<String?> getAccessToken() async =>
      _client.auth.currentSession?.accessToken;

  @override
  Future<String?> refreshAccessToken() async {
    try {
      return (await _client.auth.refreshSession()).session?.accessToken;
    } on supabase.AuthException {
      return null;
    }
  }

  AuthUser _requireUser(supabase.User? user) {
    final mapped = _toUser(user);
    if (mapped == null) {
      throw const AuthException('The authentication service is unavailable.');
    }
    return mapped;
  }

  AuthUser? _toUser(supabase.User? user) {
    if (user == null) return null;
    return AuthUser(
      id: user.id,
      email: user.email ?? '',
      displayName: user.userMetadata?['display_name'] as String?,
      provider: user.isAnonymous
          ? 'anonymous'
          : user.appMetadata['provider']?.toString() ?? 'email',
      isAnonymous: user.isAnonymous,
    );
  }

  String _friendly(supabase.AuthException error, {bool login = false}) {
    final value = error.message.toLowerCase();
    if (value.contains('rate') || value.contains('too many')) {
      return 'Too many attempts. Try again later.';
    }
    if (value.contains('already') || value.contains('registered')) {
      return 'This email is already registered.';
    }
    if (value.contains('confirm') || value.contains('verified')) {
      return 'Confirm your email before signing in.';
    }
    if (login) return 'Incorrect email or password.';
    return 'The authentication service is unavailable.';
  }
}
