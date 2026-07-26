import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/app_config.dart';
import '../core/app_router.dart';
import '../providers/auth_controller.dart';
import '../providers/background_provider.dart';
import '../providers/card_ai_provider.dart';
import '../providers/home_experience_provider.dart';
import '../providers/settings_provider.dart';
import '../providers/startup_video_provider.dart';
import '../widgets/ai_connection_status.dart';
import '../widgets/home_navigation_button.dart';
import '../widgets/settings_action_tile.dart';
import '../widgets/settings_dropdown_tile.dart';
import '../widgets/settings_section.dart';
import '../widgets/settings_toggle_tile.dart';
import '../widgets/startup_video_viewport.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  Future<void> _previewStartupVideo(BuildContext context) async {
    await context.read<StartupVideoProvider>().pause();
    if (!context.mounted) return;
    await showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Startup video preview'),
        content: const SizedBox(
          width: 620,
          height: 360,
          child: StartupVideoViewport(compact: true),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Close'),
          ),
        ],
      ),
    );
    if (context.mounted) await context.read<StartupVideoProvider>().pause();
  }

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>();
    final advanced = settings.advanced;
    final background = context.watch<BackgroundProvider>();
    final home = context.watch<HomeExperienceProvider>();
    final startup = context.watch<StartupVideoProvider>();
    final ai = context.watch<CardAiProvider>();
    final auth = context.watch<AuthController>();
    final backendUrl = AppConfig.aiBackendUrl;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        actions: [
          IconButton(
            tooltip: 'Profile',
            onPressed: () => AppRouter.router.go(AppRoutes.profile),
            icon: const Icon(Icons.person_outline),
          ),
          const Padding(
            padding: EdgeInsets.only(right: 8),
            child: HomeNavigationButton(),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SettingsSection(
            title: 'General',
            icon: Icons.tune_rounded,
            children: [
              const ListTile(
                title: Text('Application version'),
                trailing: Text('1.0.0+1'),
              ),
              ListTile(
                title: const Text('Build'),
                trailing: Text(AppConfig.shortBuildSha),
              ),
              ListTile(
                title: const Text('Platform'),
                trailing: Text(defaultTargetPlatform.name),
              ),
              SettingsDropdownTile<String>(
                title: 'Language',
                value: settings.language,
                items: const {
                  'English': 'English',
                  'French': 'Francais',
                  'Polish': 'Polski',
                },
                onChanged: (value) => settings.update(locale: value),
              ),
              SettingsDropdownTile<ThemeMode>(
                title: 'Theme',
                value: settings.themeMode,
                items: const {
                  ThemeMode.system: 'System',
                  ThemeMode.light: 'Light',
                  ThemeMode.dark: 'Dark',
                },
                onChanged: (value) => settings.update(theme: value),
              ),
              SettingsActionTile(
                title: 'Reset all settings',
                icon: Icons.restart_alt_rounded,
                onTap: settings.reset,
              ),
            ],
          ),
          const SizedBox(height: 16),
          SettingsSection(
            title: 'Home Screen',
            icon: Icons.home_outlined,
            children: [
              ListTile(
                leading: Icon(
                  background.mode == BackgroundMode.sauvage
                      ? Icons.movie_outlined
                      : Icons.image_outlined,
                ),
                title: const Text('Current background'),
                subtitle: Text(background.currentFilename),
              ),
              SettingsDropdownTile<BackgroundMode>(
                title: 'Background mode',
                value: background.mode,
                items: const {
                  BackgroundMode.sauvage: 'Sauvage',
                  BackgroundMode.staticPng: 'Default',
                },
                onChanged: background.setMode,
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.ondemand_video_outlined),
                title: const Text('Startup video'),
                subtitle: Text(startup.currentFileName),
              ),
              SettingsActionTile(
                title: 'Preview startup video',
                icon: Icons.play_circle_outline,
                onTap: startup.loading
                    ? null
                    : () => _previewStartupVideo(context),
              ),
              SettingsToggleTile(
                title: 'Enable curtain intro',
                value: advanced.curtainIntroEnabled,
                onChanged: (v) => settings.updateAdvanced(
                  advanced.copyWith(curtainIntroEnabled: v),
                ),
              ),
              SettingsToggleTile(
                title: 'Auto-open after video',
                value: home.autoOpenAfterPlayback,
                onChanged: home.setAutoOpen,
              ),
              SettingsToggleTile(
                title: 'Skip intro on startup',
                value: home.skipIntroOnStartup,
                onChanged: home.setSkipIntro,
              ),
            ],
          ),
          const SizedBox(height: 16),
          SettingsSection(
            title: 'AI',
            icon: Icons.smart_toy_outlined,
            children: [
              AiConnectionStatus(configured: ai.isConfigured),
              SettingsToggleTile(
                title: 'Enable AI features',
                value: ai.aiEnabled,
                onChanged: ai.setAiEnabled,
              ),
              SettingsActionTile(
                title: 'Test AI connection',
                icon: Icons.wifi_tethering_rounded,
                onTap: !ai.isConfigured || ai.connectionChecking
                    ? null
                    : ai.testConnection,
              ),
              ListTile(
                leading: const Icon(Icons.link),
                title: const Text('AI backend URL'),
                subtitle: Text(
                  backendUrl.isEmpty ? 'Not configured' : backendUrl,
                ),
              ),
              ListTile(
                leading: const Icon(Icons.privacy_tip_outlined),
                title: const Text('Privacy notice'),
                subtitle: const Text(
                  'Card images and extracted text are sent only after explicit consent.',
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SettingsSection(
            title: 'Application Configuration',
            icon: Icons.security_outlined,
            children: [
              ListTile(
                title: const Text('Authentication mode'),
                trailing: Text(switch (auth.mode) {
                  AuthenticationMode.developmentBypass =>
                    'Development UI bypass',
                  AuthenticationMode.authenticated => 'Authenticated',
                  AuthenticationMode.unauthenticated => 'Signed out',
                  AuthenticationMode.loading => 'Loading',
                  AuthenticationMode.configurationError =>
                    'Configuration error',
                }),
              ),
              ListTile(
                title: const Text('Supabase URL'),
                trailing: Text(
                  AppConfig.isValidSupabaseUrl(AppConfig.supabaseUrl)
                      ? 'Configured'
                      : 'Not configured',
                ),
              ),
              ListTile(
                title: const Text('Supabase client key'),
                trailing: Text(
                  AppConfig.isValidSupabaseClientKey(AppConfig.supabaseClientKey)
                      ? 'Configured'
                      : 'Missing or placeholder',
                ),
              ),
              ListTile(
                title: const Text('Protected AI requests'),
                trailing: Text(auth.canUseProtectedAi ? 'Enabled' : 'Disabled'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
