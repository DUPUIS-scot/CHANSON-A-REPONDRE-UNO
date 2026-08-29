import 'package:flutter/widgets.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../providers/deck_provider.dart';
import '../screens/ai_chat_screen.dart';
import '../screens/browse_selected_card_screen.dart';
import '../screens/card_browser_screen.dart';
import '../screens/card_fullscreen_screen.dart';
import '../screens/card_transcription_screen.dart';
import '../screens/deck_selection_screen.dart';
import '../screens/dj_who_videos_screen.dart';
import '../screens/enochian_terminal_screen.dart';
import '../screens/home_screen.dart';
import '../screens/journal_screen.dart';
import '../screens/lubiak_screen.dart';
import '../screens/not_found_screen.dart';
import '../screens/play_screen.dart';
import '../screens/rules_screen.dart';
import '../screens/search_screen.dart';
import '../screens/settings_screen.dart';
import '../screens/credits_screen.dart';
import '../screens/statue_experience_screen.dart';
import '../screens/account_screen.dart';
import '../screens/login_screen.dart';
import '../screens/register_screen.dart';
import '../screens/forgot_password_screen.dart';
import '../services/protected_ai_guard.dart';

abstract final class AppRoutes {
  static const home = '/home';
  static const play = '/play';
  static const decks = '/decks';
  static const cards = '/cards';
  static const search = '/search';
  static const journal = '/journal';
  static const aiChat = '/ai-chat';
  static const rules = '/rules';
  static const settings = '/settings';
  static const credits = '/settings/credits';
  static const statueExperience = '/settings/statue';
  static const profile = '/profile';
  static const djWhoVideos = '/djwho';
  static const enochianTerminal = '/enochian-terminal';
  static const lubiak = '/lubiak';
  static const login = '/login';
  static const register = '/register';
  static const forgotPassword = '/forgot-password';
  static String card(String id) => '$cards/$id';
  static String transcription(String id) => '$cards/$id/transcription';
  static String cardChat(String id) => '$aiChat/$id';
  static String cardAlias(String id) => '/card/$id';
  static String browseSelectedCard(String id) => '/browse-card/$id';
  static String deck(String id) => '/deck/$id';
  static String browseCard(String id, {String? category}) {
    final parameters = <String, String>{'focus': id};
    if (category != null && category.isNotEmpty) {
      parameters['category'] = category;
    }
    return Uri(path: cards, queryParameters: parameters).toString();
  }
}

abstract final class AppRouter {
  static final router = GoRouter(
    initialLocation: AppRoutes.home,
    errorBuilder: (_, state) => NotFoundScreen(
      message: state.error?.message ?? 'The requested route does not exist.',
    ),
    routes: [
      GoRoute(path: '/', redirect: (_, _) => AppRoutes.home),
      GoRoute(path: AppRoutes.login, builder: (_, _) => const LoginScreen()),
      GoRoute(
        path: AppRoutes.register,
        builder: (_, _) => const RegisterScreen(),
      ),
      GoRoute(
        path: AppRoutes.forgotPassword,
        builder: (_, _) => const ForgotPasswordScreen(),
      ),
      GoRoute(path: AppRoutes.home, builder: (_, _) => const HomeScreen()),
      GoRoute(path: AppRoutes.play, builder: (_, _) => const PlayScreen()),
      GoRoute(
        path: AppRoutes.decks,
        builder: (_, _) => const DeckSelectionScreen(),
      ),
      GoRoute(
        path: AppRoutes.cards,
        builder: (_, state) => CardBrowserScreen(
          focusCardId: state.uri.queryParameters['focus'],
          initialCategory: state.uri.queryParameters['category'],
        ),
        routes: [
          GoRoute(
            path: ':cardId/transcription',
            builder: (_, state) => CardTranscriptionScreen(
              cardId: state.pathParameters['cardId']!,
            ),
          ),
          GoRoute(
            path: ':cardId',
            builder: (_, state) =>
                CardFullscreenScreen(cardId: state.pathParameters['cardId']!),
          ),
        ],
      ),
      GoRoute(
        path: '${AppRoutes.aiChat}/:cardId',
        builder: (_, state) =>
            AiChatScreen(cardId: state.pathParameters['cardId']!),
      ),
      GoRoute(path: AppRoutes.search, builder: (_, _) => const SearchScreen()),
      GoRoute(
        path: AppRoutes.journal,
        builder: (_, _) => const JournalScreen(),
      ),
      GoRoute(path: AppRoutes.rules, builder: (_, _) => const RulesScreen()),
      GoRoute(
        path: AppRoutes.settings,
        builder: (_, _) => const SettingsScreen(),
      ),
      GoRoute(
        path: AppRoutes.credits,
        builder: (_, _) => const CreditsScreen(),
      ),
      GoRoute(
        path: AppRoutes.statueExperience,
        builder: (_, _) => const StatueExperienceScreen(),
      ),
      GoRoute(
        path: AppRoutes.djWhoVideos,
        builder: (_, _) => const DjWhoVideosScreen(),
      ),
      GoRoute(
        path: AppRoutes.enochianTerminal,
        builder: (_, _) => const EnochianTerminalScreen(),
      ),
      GoRoute(path: AppRoutes.lubiak, builder: (_, _) => const LubiakScreen()),
      GoRoute(
        path: AppRoutes.profile,
        builder: (_, state) => AccountScreen(
          arguments: state.extra is ProfileRouteArguments
              ? state.extra! as ProfileRouteArguments
              : null,
        ),
      ),
      GoRoute(
        path: '/deck/:deckId',
        builder: (_, state) =>
            _DeckRouteScreen(deckId: state.pathParameters['deckId']!),
      ),
      GoRoute(
        path: '/browse-card/:cardId',
        builder: (context, state) {
          final id = state.pathParameters['cardId']!;
          final decks = context.watch<DeckProvider>();
          final matches = decks.cards.where((item) => item.id == id);
          if (matches.isEmpty) return CardFullscreenScreen(cardId: id);
          return BrowseSelectedCardScreen(card: matches.first);
        },
      ),
      GoRoute(
        path: '/card/:cardId',
        builder: (_, state) =>
            CardFullscreenScreen(cardId: state.pathParameters['cardId']!),
      ),
    ],
  );
}

class _DeckRouteScreen extends StatefulWidget {
  const _DeckRouteScreen({required this.deckId});
  final String deckId;
  @override
  State<_DeckRouteScreen> createState() => _DeckRouteScreenState();
}

class _DeckRouteScreenState extends State<_DeckRouteScreen> {
  bool routed = false;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final decks = context.watch<DeckProvider>();
    if (routed || decks.loading) return;
    if (!decks.decks.any((deck) => deck.id == widget.deckId)) return;
    routed = true;
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted) return;
      await context.read<DeckProvider>().select(widget.deckId);
      if (mounted) context.go(AppRoutes.cards);
    });
  }

  @override
  Widget build(BuildContext context) {
    final decks = context.watch<DeckProvider>();
    if (decks.loading || routed) return const CardBrowserScreen();
    return NotFoundScreen(message: 'The requested deck does not exist.');
  }
}
