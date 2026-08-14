import 'package:flutter/foundation.dart';

class AppConfig {
  const AppConfig._();

  static const rawAiBackendUrl = String.fromEnvironment(
    'AI_BACKEND_URL',
    defaultValue: '',
  );
  static const supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: '',
  );
  static const supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: '',
  );
  static const supabasePublishableKey = String.fromEnvironment(
    'SUPABASE_PUBLISHABLE_KEY',
    defaultValue: '',
  );
  static const skipAuthForDevelopment = bool.fromEnvironment(
    'SKIP_AUTH_FOR_DEVELOPMENT',
    defaultValue: false,
  );
  static const appBuildSha = String.fromEnvironment(
    'APP_BUILD_SHA',
    defaultValue: 'local',
  );

  static String get shortBuildSha =>
      appBuildSha.length > 7 ? appBuildSha.substring(0, 7) : appBuildSha;

  static bool get shouldSkipAuthentication =>
      skipAuthForDevelopment && !kReleaseMode;

  static bool get hasAuthConfiguration =>
      isValidSupabaseUrl(supabaseUrl) &&
      isValidSupabaseClientKey(supabaseClientKey);

  static String get supabaseClientKey {
    final publishable = supabasePublishableKey.trim();
    if (publishable.isNotEmpty) return publishable;
    return supabaseAnonKey.trim();
  }

  static bool isPlaceholder(String value) {
    final normalized = value.trim().toLowerCase();
    return normalized.isEmpty ||
        normalized.contains('real_project_id') ||
        normalized.contains('real_publishable_key') ||
        normalized.contains('your_project') ||
        normalized.contains('your_public_anon_key') ||
        normalized.contains('your-project') ||
        normalized.contains('your_real') ||
        normalized.contains('replace_with') ||
        normalized.contains('placeholder') ||
        normalized.contains('example') ||
        normalized.contains('dummy');
  }

  static bool isValidSupabaseClientKey(String value) {
    final normalized = value.trim();
    if (isPlaceholder(normalized) ||
        normalized.contains(RegExp(r'\s')) ||
        normalized.startsWith('sb_secret_') ||
        normalized.toLowerCase().contains('service_role')) {
      return false;
    }
    final modernPublishable =
        normalized.startsWith('sb_publishable_') && normalized.length >= 32;
    final legacyAnonJwt =
        normalized.startsWith('eyJ') && normalized.split('.').length == 3;
    return modernPublishable || legacyAnonJwt;
  }

  static bool isValidSupabaseUrl(String value) {
    if (isPlaceholder(value)) return false;
    final uri = Uri.tryParse(value.trim());
    return uri != null &&
        uri.scheme == 'https' &&
        uri.host.endsWith('.supabase.co');
  }

  static String get aiBackendUrl => normalizeAiBackendUrl(rawAiBackendUrl);

  static String get normalizedAiBackendUrl => aiBackendUrl;

  static String normalizeAiBackendUrl(String value) =>
      value.trim().replaceAll(RegExp(r'/+$'), '');

  static bool isValidAiBackendUrl(String value) {
    final normalized = normalizeAiBackendUrl(value);
    if (normalized.isEmpty) return false;
    final uri = Uri.tryParse(normalized);
    return uri != null &&
        (uri.scheme == 'http' || uri.scheme == 'https') &&
        uri.host.isNotEmpty;
  }

  static Uri? get aiBackendUri {
    final value = aiBackendUrl;
    return isValidAiBackendUrl(value) ? Uri.parse(value) : null;
  }

  static bool get hasValidAiBackend => aiBackendUri != null;
  static bool get hasUsableAiBackend =>
      hasValidAiBackend && !isInsecureProductionWebBackend;
  static bool get isInsecureProductionWebBackend =>
      kIsWeb && kReleaseMode && aiBackendUri?.scheme == 'http';

  static String? get aiBackendConfigurationError {
    if (aiBackendUrl.isEmpty) {
      return 'AI backend is not configured.';
    }
    if (!hasValidAiBackend) {
      return 'AI backend URL is invalid.';
    }
    if (isInsecureProductionWebBackend) {
      return 'A production Web build requires an HTTPS AI backend. Browsers block insecure mixed-content requests.';
    }
    return null;
  }

  static const productionProfileRedirect =
      'https://jameshpdy-dev.github.io/CHANSON-A-REPONDRE-UNO/#/profile';

  static String get authenticationRedirectUrl {
    if (kIsWeb && kReleaseMode) return productionProfileRedirect;
    final base = Uri.base;
    return base.replace(fragment: '/profile').toString();
  }
}
