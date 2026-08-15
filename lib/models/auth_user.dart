class AuthUser {
  const AuthUser({
    required this.id,
    required this.email,
    this.displayName,
    this.provider = 'Email',
    this.isAnonymous = false,
  });

  final String id;
  final String email;
  final String? displayName;
  final String provider;
  final bool isAnonymous;
}
