import '../models/auth_user.dart';

abstract interface class AuthService {
  Stream<AuthUser?> get authStateChanges;
  AuthUser? get currentUser;

  Future<AuthUser> signInAnonymously();
  Future<AuthUser> signIn({required String email, required String password});
  Future<AuthUser> register({required String email, required String password});
  Future<void> sendPasswordReset({required String email});
  Future<void> signOut();
  Future<void> deleteAccount();
  Future<String?> getAccessToken();
  Future<String?> refreshAccessToken();
}

class AuthException implements Exception {
  const AuthException(this.message);
  final String message;
  @override
  String toString() => message;
}

class EmailConfirmationRequiredException extends AuthException {
  const EmailConfirmationRequiredException()
    : super(
        'Account created. Check your email and confirm your address before signing in.',
      );
}
