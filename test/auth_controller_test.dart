import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:uno_chanson_2/models/auth_user.dart';
import 'package:uno_chanson_2/providers/auth_controller.dart';
import 'package:uno_chanson_2/services/auth_service.dart';

void main() {
  const user = AuthUser(id: 'user-1', email: 'user@example.com');
  const guest = AuthUser(
    id: 'guest-1',
    email: '',
    provider: 'anonymous',
    isAnonymous: true,
  );

  test('restores an existing authenticated user', () {
    final controller = AuthController(_FakeAuthService(current: user));
    expect(controller.status, AuthStatus.authenticated);
    expect(controller.user?.id, user.id);
    controller.dispose();
  });

  test('anonymous guest session is created only for a protected action', () async {
    final service = _FakeAuthService(guestResult: guest);
    final controller = AuthController(
      service,
      anonymousGuestEnabled: true,
    );
    expect(controller.status, AuthStatus.unauthenticated);
    expect(service.guestSignIns, 0);
    expect(await controller.ensureAnonymousSession(), isTrue);
    expect(controller.status, AuthStatus.authenticated);
    expect(controller.isAnonymous, isTrue);
    expect(controller.canUseProtectedAi, isTrue);
    expect(service.guestSignIns, 1);
    controller.dispose();
  });

  test('successful login authenticates the controller', () async {
    final controller = AuthController(_FakeAuthService(signInResult: user));
    expect(await controller.signIn(user.email, 'password'), isTrue);
    expect(controller.status, AuthStatus.authenticated);
    controller.dispose();
  });

  test('invalid credentials expose a safe error', () async {
    final controller = AuthController(
      _FakeAuthService(
        signInError: const AuthException('Incorrect email or password.'),
      ),
    );
    expect(await controller.signIn(user.email, 'wrong'), isFalse);
    expect(controller.error, 'Incorrect email or password.');
    controller.dispose();
  });

  test('email confirmation does not authenticate registration', () async {
    final controller = AuthController(
      _FakeAuthService(
        registerError: const EmailConfirmationRequiredException(),
      ),
    );
    expect(await controller.register(user.email, 'password'), isFalse);
    expect(controller.status, AuthStatus.unauthenticated);
    expect(controller.error, contains('confirm your address'));
    controller.dispose();
  });

  test('logout returns to unauthenticated state when guest mode is off', () async {
    final service = _FakeAuthService(current: user);
    final controller = AuthController(service);
    await controller.signOut();
    expect(service.signedOut, isTrue);
    expect(controller.status, AuthStatus.unauthenticated);
    controller.dispose();
  });

  test('logout keeps guest creation deferred when guest mode is on', () async {
    final service = _FakeAuthService(current: user, guestResult: guest);
    final controller = AuthController(
      service,
      anonymousGuestEnabled: true,
    );
    await controller.signOut();
    expect(service.signedOut, isTrue);
    expect(controller.status, AuthStatus.unauthenticated);
    expect(controller.isAnonymous, isFalse);
    expect(service.guestSignIns, 0);
    controller.dispose();
  });

  test('development bypass is not authenticated', () {
    final controller = AuthController(
      _FakeAuthService(),
      developmentBypassEnabled: true,
    );
    expect(controller.mode, AuthenticationMode.developmentBypass);
    expect(controller.canUseProtectedAi, isFalse);
    controller.dispose();
  });

  test('real session takes precedence over development bypass', () {
    final controller = AuthController(
      _FakeAuthService(current: user),
      developmentBypassEnabled: true,
    );
    expect(controller.mode, AuthenticationMode.authenticated);
    expect(controller.canUseProtectedAi, isTrue);
    controller.dispose();
  });

  test('real session takes precedence over configuration error', () {
    final controller = AuthController(
      _FakeAuthService(current: user),
      configurationError: true,
    );
    expect(controller.mode, AuthenticationMode.authenticated);
    expect(controller.canUseProtectedAi, isTrue);
    controller.dispose();
  });

  test('development bypass can transition to real sign in', () {
    final controller = AuthController(
      _FakeAuthService(),
      developmentBypassEnabled: true,
    );
    controller.showRealSignIn();
    expect(controller.mode, AuthenticationMode.unauthenticated);
    controller.dispose();
  });
}

class _FakeAuthService implements AuthService {
  _FakeAuthService({
    this.current,
    this.guestResult,
    this.signInResult,
    this.signInError,
    this.registerError,
  });

  final AuthUser? current;
  final AuthUser? guestResult;
  final AuthUser? signInResult;
  final AuthException? signInError;
  final AuthException? registerError;
  final _changes = StreamController<AuthUser?>.broadcast();
  bool signedOut = false;
  int guestSignIns = 0;

  @override
  Stream<AuthUser?> get authStateChanges => _changes.stream;
  @override
  AuthUser? get currentUser => current;
  @override
  Future<AuthUser> signInAnonymously() async {
    guestSignIns++;
    final result = guestResult;
    if (result == null) {
      throw const AuthException('Guest authentication unavailable.');
    }
    _changes.add(result);
    return result;
  }

  @override
  Future<AuthUser> signIn({
    required String email,
    required String password,
  }) async {
    if (signInError != null) throw signInError!;
    return signInResult!;
  }

  @override
  Future<AuthUser> register({
    required String email,
    required String password,
  }) async {
    if (registerError != null) throw registerError!;
    return signInResult!;
  }

  @override
  Future<void> signOut() async {
    signedOut = true;
    _changes.add(null);
  }

  @override
  Future<void> sendPasswordReset({required String email}) async {}
  @override
  Future<String?> getAccessToken() async => 'token';
  @override
  Future<String?> refreshAccessToken() async => 'token';
  @override
  Future<void> deleteAccount() async {}
}
