import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart' show Supabase;

import 'core/app_constants.dart';
import 'core/app_config.dart';
import 'core/app_router.dart';
import 'models/auth_user.dart';
import 'providers/deck_provider.dart';
import 'providers/card_ai_provider.dart';
import 'providers/curtain_provider.dart';
import 'providers/background_provider.dart';
import 'providers/game_provider.dart';
import 'providers/home_experience_provider.dart';
import 'providers/journal_provider.dart';
import 'providers/settings_provider.dart';
import 'providers/startup_video_provider.dart';
import 'providers/auth_controller.dart';
import 'services/game_storage_service.dart';
import 'services/local_storage_service.dart';
import 'services/ai_rest_client.dart';
import 'services/card_ai_api_service.dart';
import 'services/navigation_guard_service.dart';
import 'services/auth_service.dart';
import 'services/supabase_auth_service.dart';
import 'features/startup_media/startup_video_storage.dart';
import 'theme/app_theme.dart';
import 'screens/configuration_error_screen.dart';
import 'widgets/development_auth_banner.dart';

class ChansonUnoApp extends StatefulWidget {
  const ChansonUnoApp({
    this.aiBackendUrlOverride,
    this.authServiceOverride,
    this.authenticationInitializationError,
    super.key,
  });
  final String? aiBackendUrlOverride;
  final AuthService? authServiceOverride;
  final String? authenticationInitializationError;
  @override
  State<ChansonUnoApp> createState() => _ChansonUnoAppState();
}

class _ChansonUnoAppState extends State<ChansonUnoApp> {
  final storage = LocalStorageService();
  late final settings = SettingsProvider(storage)..load();
  late final decks = DeckProvider(storage)..load();
  late final game = GameProvider(GameStorageService(storage))..load();
  late final journal = JournalProvider(storage)..load();
  late final curtains = CurtainProvider(storage)..initialize();
  late final backgrounds = BackgroundProvider(storage)..load();
  late final homeExperience = HomeExperienceProvider(storage)..initialize();
  late final startupVideo = StartupVideoProvider(StartupVideoStorage(storage))
    ..initialize();
  late final CardAiProvider cardAi;
  late final AuthService authService;
  late final AuthController auth;

  String get effectiveBackendUrl => AppConfig.normalizeAiBackendUrl(
    widget.aiBackendUrlOverride ?? AppConfig.rawAiBackendUrl,
  );

  @override
  void initState() {
    super.initState();
    authService =
        widget.authServiceOverride ??
        (widget.aiBackendUrlOverride != null
            ? _TestAuthService()
            : AppConfig.hasAuthConfiguration &&
                  widget.authenticationInitializationError == null
            ? SupabaseAuthService(Supabase.instance.client)
            : _DevelopmentUiAuthService());
    auth = AuthController(
      authService,
      developmentBypassEnabled:
          AppConfig.shouldSkipAuthentication &&
          widget.authServiceOverride == null &&
          widget.aiBackendUrlOverride == null,
      configurationError:
          ((!AppConfig.hasAuthConfiguration &&
              !AppConfig.shouldSkipAuthentication &&
              widget.authServiceOverride == null &&
              widget.aiBackendUrlOverride == null) ||
          widget.authenticationInitializationError != null),
    );
    cardAi = CardAiProvider(
      service: CardAiApiService(
        client: AiRestClient(
          baseUrl: effectiveBackendUrl,
          authService: authService,
        ),
      ),
      decks: decks,
      localStorage: storage,
    );
  }

  Future<void> _returnHome(BuildContext context) async {
    final path = AppRouter.router.state.uri.path;
    if (path == AppRoutes.play && game.state != null) {
      final choice = await NavigationGuardService.confirm(
        context,
        title: 'Return to Home?',
        message: 'Your current game will be saved so you can continue later.',
        stayLabel: 'Cancel',
        discardLabel: 'Return Without Saving',
        saveLabel: 'Save and Return',
      );
      if (choice == GuardChoice.stay) return;
      if (choice == GuardChoice.save) await game.saveCurrent();
    }
    if (path.startsWith(AppRoutes.aiChat)) cardAi.cancelCurrentRequest();
    AppRouter.router.go(AppRoutes.home);
  }

  @override
  Widget build(BuildContext context) {
    if ((effectiveBackendUrl.isNotEmpty &&
            !AppConfig.isValidAiBackendUrl(effectiveBackendUrl)) ||
        (widget.aiBackendUrlOverride == null &&
            AppConfig.isInsecureProductionWebBackend)) {
      return MaterialApp(
        title: AppConstants.appName,
        debugShowCheckedModeBanner: false,
        theme: AppTheme.dark,
        home: const ConfigurationErrorScreen(),
      );
    }
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: auth),
        ChangeNotifierProvider.value(value: settings),
        ChangeNotifierProvider.value(value: decks),
        ChangeNotifierProvider.value(value: game),
        ChangeNotifierProvider.value(value: journal),
        ChangeNotifierProvider.value(value: cardAi),
        ChangeNotifierProvider.value(value: curtains),
        ChangeNotifierProvider.value(value: backgrounds),
        ChangeNotifierProvider.value(value: homeExperience),
        ChangeNotifierProvider.value(value: startupVideo),
        Provider.value(value: storage),
      ],
      child: Consumer2<SettingsProvider, AuthController>(
        builder: (context, settings, auth, _) =>
            auth.mode == AuthenticationMode.loading
            ? MaterialApp(
                title: AppConstants.appName,
                theme: AppTheme.dark,
                home: const Scaffold(
                  body: Center(child: CircularProgressIndicator()),
                ),
              )
            : MaterialApp.router(
                title: AppConstants.appName,
                debugShowCheckedModeBanner: false,
                theme: AppTheme.light,
                darkTheme: AppTheme.dark,
                themeMode: settings.themeMode,
                routerConfig: AppRouter.router,
                builder: (context, child) => CallbackShortcuts(
                  bindings: {
                    const SingleActivator(
                      LogicalKeyboardKey.keyH,
                      alt: true,
                    ): () =>
                        _returnHome(context),
                    const SingleActivator(
                      LogicalKeyboardKey.arrowLeft,
                      alt: true,
                    ): () {
                      if (AppRouter.router.canPop()) {
                        AppRouter.router.pop();
                      } else {
                        AppRouter.router.go(AppRoutes.home);
                      }
                    },
                  },
                  child: Column(
                    children: [
                      if (auth.mode == AuthenticationMode.developmentBypass)
                        const DevelopmentAuthBanner(),
                      Expanded(
                        child: Focus(
                          autofocus: true,
                          child: MediaQuery(
                            data: MediaQuery.of(context).copyWith(
                              textScaler: TextScaler.linear(settings.textScale),
                            ),
                            child: child!,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
      ),
    );
  }
}

class _TestAuthService implements AuthService {
  static const _user = AuthUser(id: 'test-user', email: 'test@example.com');
  @override
  Stream<AuthUser?> get authStateChanges => const Stream.empty();
  @override
  AuthUser? get currentUser => _user;
  @override
  Future<String?> getAccessToken() async => 'test-token';
  @override
  Future<String?> refreshAccessToken() async => 'test-token';
  @override
  Future<AuthUser> register({
    required String email,
    required String password,
  }) async => _user;
  @override
  Future<void> sendPasswordReset({required String email}) async {}
  @override
  Future<AuthUser> signIn({
    required String email,
    required String password,
  }) async => _user;
  @override
  Future<void> signOut() async {}
  @override
  Future<void> deleteAccount() async {}
}

class _DevelopmentUiAuthService implements AuthService {
  @override
  Stream<AuthUser?> get authStateChanges => const Stream.empty();
  @override
  AuthUser? get currentUser => null;
  @override
  Future<String?> getAccessToken() async => null;
  @override
  Future<String?> refreshAccessToken() async => null;
  @override
  Future<AuthUser> register({
    required String email,
    required String password,
  }) => throw const AuthException(
    'Configure Supabase before creating an account.',
  );
  @override
  Future<void> sendPasswordReset({required String email}) =>
      throw const AuthException(
        'Configure Supabase before resetting a password.',
      );
  @override
  Future<AuthUser> signIn({required String email, required String password}) =>
      throw const AuthException('Configure Supabase before signing in.');
  @override
  Future<void> signOut() async {}
  @override
  Future<void> deleteAccount() async {}
}
