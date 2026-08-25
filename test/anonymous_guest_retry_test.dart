import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:uno_chanson_2/models/auth_user.dart';
import 'package:uno_chanson_2/providers/auth_controller.dart';
import 'package:uno_chanson_2/services/auth_service.dart';

void main() {
  const guest = AuthUser(
    id: 'guest-retry',
    email: '',
    provider: 'anonymous',
    isAnonymous: true,
  );

  test('guest auth is deferred until protected AI is requested', () async {
    final service = _RetryGuestAuthService(guest);
    final controller = AuthController(
      service,
      anonymousGuestEnabled: true,
    );
    addTearDown(controller.dispose);
    addTearDown(service.dispose);

    expect(controller.status, AuthStatus.unauthenticated);
    expect(controller.canUseProtectedAi, isFalse);
    expect(service.attempts, 0);

    expect(await controller.ensureAnonymousSession(), isFalse);
    expect(controller.status, AuthStatus.unauthenticated);
    expect(service.attempts, 1);

    expect(await controller.ensureAnonymousSession(), isTrue);
    expect(controller.status, AuthStatus.authenticated);
    expect(controller.isAnonymous, isTrue);
    expect(controller.canUseProtectedAi, isTrue);
    expect(service.attempts, 2);
  });
}

class _RetryGuestAuthService implements AuthService {
  _RetryGuestAuthService(this.guest);

  final AuthUser guest;
  final _changes = StreamController<AuthUser?>.broadcast();
  int attempts = 0;

  void dispose() => _changes.close();

  @override
  Stream<AuthUser?> get authStateChanges => _changes.stream;

  @override
  AuthUser? get currentUser => null;

  @override
  Future<AuthUser> signInAnonymously() async {
    attempts++;
    if (attempts == 1) {
      throw const AuthException('Temporary guest auth failure.');
    }
    _changes.add(guest);
    return guest;
  }

  @override
  Future<String?> getAccessToken() async => 'guest-token';

  @override
  Future<String?> refreshAccessToken() async => 'guest-token';

  @override
  Future<AuthUser> signIn({
    required String email,
    required String password,
  }) => throw const AuthException('Interactive sign-in should not be used.');

  @override
  Future<AuthUser> register({
    required String email,
    required String password,
  }) => throw const AuthException('Registration should not be used.');

  @override
  Future<void> sendPasswordReset({required String email}) async {}

  @override
  Future<void> signOut() async {
    _changes.add(null);
  }

  @override
  Future<void> deleteAccount() async {}
}
