import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/background_provider.dart';
import '../providers/card_ai_provider.dart';
import '../providers/deck_provider.dart';
import '../providers/home_experience_provider.dart';
import '../providers/settings_provider.dart';
import '../providers/startup_video_provider.dart';
import '../providers/auth_controller.dart';
import '../core/app_config.dart';
import '../core/app_router.dart';
import '../services/background_import_service.dart';
import '../widgets/home_navigation_button.dart';
import '../widgets/ai_connection_status.dart';
import '../widgets/settings_section.dart';
import '../widgets/settings_search.dart';
import '../widgets/settings_toggle_tile.dart';
import '../widgets/settings_slider_tile.dart';
import '../widgets/settings_dropdown_tile.dart';
import '../widgets/settings_action_tile.dart';
import '../widgets/startup_video_viewport.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  Future<void> _restore(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Restore default background?'),
        content: const Text(
          'The default Edinburgh night background will be restored.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Restore'),
          ),
        ],
      ),
    );
    if (confirmed == true && context.mounted) {
      await context.read<BackgroundProvider>().restoreDefault();
    }
  }

  @override
  Widget build(BuildContext context) =>
      _SettingsControlCenter(onRestore: () => _restore(context));

  Widget legacyBuild(BuildContext context) {
    final background = context.watch<BackgroundProvider>();
    final ai = context.watch<CardAiProvider>();
    final homeExperience = context.watch<HomeExperienceProvider>();
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
            title: 'APPLICATION CONFIGURATION',
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
                  AppConfig.isValidSupabaseClientKey(
                        AppConfig.supabaseClientKey,
                      )
                      ? 'Configured'
                      : 'Missing or placeholder',
                ),
              ),
              ListTile(
                title: const Text('Backend URL'),
                subtitle: Text(backendUrl),
              ),
              ListTile(
                title: const Text('Backend health'),
                trailing: Text(
                  ai.connectionAvailable ? 'Available' : 'Unreachable',
                ),
              ),
              ListTile(
                title: const Text('Protected AI requests'),
                trailing: Text(auth.canUseProtectedAi ? 'Enabled' : 'Disabled'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text('BACKGROUND', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 12),
          Card(
            child: ListTile(
              leading: Icon(
                background.type == BackgroundMediaType.image
                    ? Icons.image_outlined
                    : Icons.movie_outlined,
              ),
              title: const Text('Current Background'),
              subtitle: Text(
                '${background.type == BackgroundMediaType.image ? 'PNG Image' : 'MP4 Video'}\n${background.currentFilename}',
              ),
              isThreeLine: true,
            ),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: () => _restore(context),
            icon: const Icon(Icons.restore),
            label: const Text('Restore Default Background'),
          ),
          const SizedBox(height: 20),
          Text('Dark Overlay ${(background.darkOverlay * 100).round()}%'),
          Slider(
            value: background.darkOverlay,
            min: 0,
            max: .6,
            divisions: 12,
            onChanged: background.setOverlay,
          ),
          SwitchListTile(
            title: const Text('Mute Background Video'),
            value: background.muteVideo,
            onChanged: background.setMuteVideo,
          ),
          SwitchListTile(
            title: const Text('Auto-open curtains after video starts'),
            value: homeExperience.autoOpenAfterPlayback,
            onChanged: homeExperience.setAutoOpen,
          ),
          SwitchListTile(
            title: const Text('Skip Home intro on startup'),
            value: homeExperience.skipIntroOnStartup,
            onChanged: homeExperience.setSkipIntro,
          ),
          const Divider(height: 32),
          Text('AI', style: Theme.of(context).textTheme.headlineSmall),
          AiConnectionStatus(configured: ai.isConfigured),
          SwitchListTile(
            title: const Text('Enable AI features'),
            value: ai.aiEnabled,
            onChanged: ai.setAiEnabled,
          ),
          FilledButton.tonalIcon(
            onPressed: !ai.isConfigured || ai.connectionChecking
                ? null
                : ai.testConnection,
            icon: ai.connectionChecking
                ? const SizedBox.square(
                    dimension: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.wifi_tethering_rounded),
            label: const Text('Test AI Connection'),
          ),
          if (ai.healthStatus != null)
            ListTile(
              leading: const Icon(Icons.check_circle_outline),
              title: Text('Service: ${ai.healthStatus!.service}'),
              subtitle: Text('Version ${ai.healthStatus!.version}'),
            ),
          if (ai.error != null)
            Padding(
              padding: const EdgeInsets.all(12),
              child: Text(
                ai.error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ),
          ListTile(
            leading: const Icon(Icons.link),
            title: const Text('AI backend URL'),
            subtitle: Text(backendUrl.isEmpty ? 'Not configured' : backendUrl),
          ),
          ListTile(
            leading: const Icon(Icons.privacy_tip_outlined),
            title: const Text('Privacy notice'),
            subtitle: const Text(
              'Card images and extracted text are sent only after explicit consent.',
            ),
          ),
          ListTile(
            leading: const Icon(Icons.delete_sweep_outlined),
            title: const Text('Delete all local AI conversations'),
            onTap: () async {
              final cards = List.of(context.read<DeckProvider>().cards);
              for (final card in cards) {
                await ai.deleteAiData(card.id);
              }
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Local AI data deleted.')),
                );
              }
            },
          ),
        ],
      ),
    );
  }
}

class _SettingsControlCenter extends StatefulWidget {
  const _SettingsControlCenter({required this.onRestore});
  final VoidCallback onRestore;
  @override
  State<_SettingsControlCenter> createState() => _SettingsControlCenterState();
}

class _SettingsControlCenterState extends State<_SettingsControlCenter> {
  String query = '';

  bool matches(String value) =>
      query.isEmpty || value.toLowerCase().contains(query.toLowerCase());

  void unavailable(String feature) =>
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '$feature is available from its main application screen.',
          ),
        ),
      );

  Future<void> _restoreStartupVideo() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Restore the bundled startup video?'),
        content: const Text(
          'The bundled startup video will be restored for the app.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Restore default'),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      await context.read<StartupVideoProvider>().restoreDefault();
    }
  }

  Future<void> _previewStartupVideo() async {
    await context.read<StartupVideoProvider>().pause();
    if (!mounted) return;
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
    if (mounted) await context.read<StartupVideoProvider>().pause();
  }

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>();
    final advanced = settings.advanced;
    final background = context.watch<BackgroundProvider>();
    final home = context.watch<HomeExperienceProvider>();
    final startup = context.watch<StartupVideoProvider>();
    final ai = context.watch<CardAiProvider>();
    final backendUrl = AppConfig.aiBackendUrl;
    final sections = <Widget>[
      if (matches(
        'general application version platform language theme accent animations reset',
      ))
        SettingsSection(
          title: 'General',
          icon: Icons.tune_rounded,
          initiallyExpanded: query.isNotEmpty,
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
            SettingsToggleTile(
              title: 'Animations enabled',
              value: advanced.animationsEnabled,
              onChanged: (value) => settings.updateAdvanced(
                advanced.copyWith(animationsEnabled: value),
              ),
            ),
            SettingsToggleTile(
              title: 'Reduced motion',
              value: advanced.reducedMotion,
              onChanged: (value) => settings.updateAdvanced(
                advanced.copyWith(reducedMotion: value),
              ),
            ),
            SettingsActionTile(
              title: 'Reset all settings',
              icon: Icons.restart_alt_rounded,
              onTap: settings.reset,
            ),
          ],
        ),
      if (matches(
        'home background png mp4 video rotation curtain autoplay loop volume',
      ))
        SettingsSection(
          title: 'Home Screen',
          icon: Icons.home_outlined,
          initiallyExpanded: query.isNotEmpty,
          children: [
            ListTile(
              leading: Icon(
                background.type == BackgroundMediaType.image
                    ? Icons.image_outlined
                    : Icons.movie_outlined,
              ),
              title: const Text('Current background'),
              subtitle: Text(background.currentFilename),
            ),
            SettingsActionTile(
              title: 'Restore Default Background',
              icon: Icons.restore,
              onTap: widget.onRestore,
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.ondemand_video_outlined),
              title: const Text('Startup Video'),
              subtitle: Text(startup.currentFileName),
              isThreeLine: true,
              trailing: startup.importing
                  ? const SizedBox.square(
                      dimension: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : null,
            ),
            SettingsActionTile(
              title: 'Preview',
              icon: Icons.play_circle_outline,
              onTap: startup.loading ? null : _previewStartupVideo,
            ),
            SettingsActionTile(
              title: 'Restore default startup video',
              icon: Icons.restore_rounded,
              onTap: startup.isImported ? _restoreStartupVideo : null,
            ),
            SettingsToggleTile(
              title: 'Autoplay video',
              value: advanced.backgroundAutoplay,
              onChanged: (v) => settings.updateAdvanced(
                advanced.copyWith(backgroundAutoplay: v),
              ),
            ),
            SettingsToggleTile(
              title: 'Loop video',
              value: advanced.backgroundLoop,
              onChanged: (v) =>
                  settings.updateAdvanced(advanced.copyWith(backgroundLoop: v)),
            ),
            SettingsSliderTile(
              title: 'Volume',
              value: settings.volume,
              min: 0,
              max: 1,
              divisions: 10,
              label: '${(settings.volume * 100).round()}%',
              onChanged: (v) => settings.update(audioVolume: v),
            ),
            SettingsToggleTile(
              title: 'Rotation enabled',
              value: advanced.rotationEnabled,
              onChanged: (v) => settings.updateAdvanced(
                advanced.copyWith(rotationEnabled: v),
              ),
            ),
            SettingsSliderTile(
              title: 'Rotation speed',
              value: advanced.rotationSpeed,
              min: 8,
              max: 24,
              divisions: 16,
              label: '${advanced.rotationSpeed.round()} s',
              onChanged: (v) =>
                  settings.updateAdvanced(advanced.copyWith(rotationSpeed: v)),
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
            SettingsSliderTile(
              title: 'Mouse wheel sensitivity',
              value: advanced.wheelSensitivity,
              min: .5,
              max: 2,
              divisions: 6,
              onChanged: (v) => settings.updateAdvanced(
                advanced.copyWith(wheelSensitivity: v),
              ),
            ),
            SettingsSliderTile(
              title: 'Drag sensitivity',
              value: advanced.dragSensitivity,
              min: .5,
              max: 2,
              divisions: 6,
              onChanged: (v) => settings.updateAdvanced(
                advanced.copyWith(dragSensitivity: v),
              ),
            ),
          ],
        ),
      if (matches(
        'browse cards hand shuffle preview long press fullscreen zoom hero scroll',
      ))
        SettingsSection(
          title: 'Browse Cards',
          icon: Icons.view_carousel_outlined,
          initiallyExpanded: query.isNotEmpty,
          children: [
            SettingsToggleTile(
              title: 'Preview on long press',
              value: advanced.previewOnLongPress,
              onChanged: (v) => settings.updateAdvanced(
                advanced.copyWith(previewOnLongPress: v),
              ),
            ),
            SettingsToggleTile(
              title: 'Fullscreen zoom',
              value: advanced.fullscreenZoom,
              onChanged: (v) =>
                  settings.updateAdvanced(advanced.copyWith(fullscreenZoom: v)),
            ),
            SettingsSliderTile(
              title: 'Maximum zoom',
              value: advanced.maximumZoom,
              min: 2,
              max: 8,
              divisions: 6,
              label: '${advanced.maximumZoom.round()}x',
              onChanged: (v) =>
                  settings.updateAdvanced(advanced.copyWith(maximumZoom: v)),
            ),
            SettingsToggleTile(
              title: 'Enable Hero animation',
              value: advanced.heroAnimation,
              onChanged: (v) =>
                  settings.updateAdvanced(advanced.copyWith(heroAnimation: v)),
            ),
          ],
        ),
      if (matches(
        'ai backend connection model transcription discussion streaming conversation privacy',
      ))
        SettingsSection(
          title: 'AI',
          icon: Icons.smart_toy_outlined,
          initiallyExpanded: query.isNotEmpty,
          children: [
            AiConnectionStatus(configured: ai.isConfigured),
            SettingsToggleTile(
              title: 'AI enabled',
              value: ai.aiEnabled,
              onChanged: ai.setAiEnabled,
            ),
            ListTile(
              title: const Text('Backend URL'),
              subtitle: Text(
                backendUrl.isEmpty ? 'Not configured' : backendUrl,
              ),
            ),
            SettingsActionTile(
              title: 'Test Connection',
              icon: Icons.wifi_tethering,
              onTap: ai.isConfigured ? ai.testConnection : null,
            ),
            ListTile(
              title: const Text('Current model'),
              trailing: Text(ai.model),
            ),
            SettingsToggleTile(
              title: 'Streaming',
              value: advanced.streaming,
              onChanged: (v) =>
                  settings.updateAdvanced(advanced.copyWith(streaming: v)),
            ),
            SettingsSliderTile(
              title: 'Maximum stored messages',
              value: advanced.maximumMessages.toDouble(),
              min: 20,
              max: 500,
              divisions: 24,
              label: '${advanced.maximumMessages}',
              onChanged: (v) => settings.updateAdvanced(
                advanced.copyWith(maximumMessages: v.round()),
              ),
            ),
            const ListTile(
              leading: Icon(Icons.privacy_tip_outlined),
              title: Text('Privacy notice'),
              subtitle: Text(
                'Card content is sent only after explicit consent.',
              ),
            ),
            SettingsActionTile(
              title: 'Delete all AI conversations',
              icon: Icons.delete_sweep_outlined,
              onTap: () async {
                final cards = List.of(context.read<DeckProvider>().cards);
                for (final card in cards) {
                  await ai.deleteAiData(card.id);
                }
              },
            ),
          ],
        ),
      if (matches(
        'api endpoint timeout retry upload json logging rest development',
      ))
        SettingsSection(
          title: 'API',
          icon: Icons.api_outlined,
          initiallyExpanded: query.isNotEmpty,
          children: [
            const ListTile(
              title: Text('Health endpoint'),
              trailing: Text('/health'),
            ),
            SettingsSliderTile(
              title: 'Request timeout',
              value: advanced.requestTimeout,
              min: 10,
              max: 120,
              divisions: 11,
              label: '${advanced.requestTimeout.round()} s',
              onChanged: (v) =>
                  settings.updateAdvanced(advanced.copyWith(requestTimeout: v)),
            ),
            SettingsDropdownTile<int>(
              title: 'Retry attempts',
              value: advanced.retryAttempts,
              items: const {0: '0', 1: '1', 2: '2', 3: '3'},
              onChanged: (v) =>
                  settings.updateAdvanced(advanced.copyWith(retryAttempts: v)),
            ),
            SettingsSliderTile(
              title: 'Image upload limit',
              value: advanced.uploadLimitMb,
              min: 5,
              max: 20,
              divisions: 3,
              label: '${advanced.uploadLimitMb.round()} MB',
              onChanged: (v) =>
                  settings.updateAdvanced(advanced.copyWith(uploadLimitMb: v)),
            ),
            SettingsToggleTile(
              title: 'Enable debug logging',
              value: advanced.debugLogging,
              onChanged: (v) =>
                  settings.updateAdvanced(advanced.copyWith(debugLogging: v)),
            ),
          ],
        ),
      if (matches(
        'transcription language auto save editable confidence ocr unreadable retranscription',
      ))
        SettingsSection(
          title: 'Transcription',
          icon: Icons.document_scanner_outlined,
          initiallyExpanded: query.isNotEmpty,
          children: [
            SettingsToggleTile(
              title: 'Language detection',
              value: advanced.languageDetection,
              onChanged: (v) => settings.updateAdvanced(
                advanced.copyWith(languageDetection: v),
              ),
            ),
            SettingsToggleTile(
              title: 'Auto save',
              value: advanced.autoSaveTranscription,
              onChanged: (v) => settings.updateAdvanced(
                advanced.copyWith(autoSaveTranscription: v),
              ),
            ),
            SettingsToggleTile(
              title: 'Editable transcription',
              value: advanced.editableTranscription,
              onChanged: (v) => settings.updateAdvanced(
                advanced.copyWith(editableTranscription: v),
              ),
            ),
            SettingsToggleTile(
              title: 'Show OCR warnings',
              value: advanced.showOcrWarnings,
              onChanged: (v) => settings.updateAdvanced(
                advanced.copyWith(showOcrWarnings: v),
              ),
            ),
            SettingsToggleTile(
              title: 'Mark unreadable text',
              value: advanced.markUnreadableText,
              onChanged: (v) => settings.updateAdvanced(
                advanced.copyWith(markUnreadableText: v),
              ),
            ),
          ],
        ),
      if (matches('chat markdown syntax typing streaming message reset copy'))
        SettingsSection(
          title: 'Chat',
          icon: Icons.chat_bubble_outline,
          initiallyExpanded: query.isNotEmpty,
          children: [
            SettingsToggleTile(
              title: 'Markdown',
              value: advanced.markdown,
              onChanged: (v) =>
                  settings.updateAdvanced(advanced.copyWith(markdown: v)),
            ),
            SettingsToggleTile(
              title: 'Typing animation',
              value: advanced.typingAnimation,
              onChanged: (v) => settings.updateAdvanced(
                advanced.copyWith(typingAnimation: v),
              ),
            ),
            SettingsSliderTile(
              title: 'Message font size',
              value: advanced.messageFontSize,
              min: 12,
              max: 24,
              divisions: 12,
              label: '${advanced.messageFontSize.round()} px',
              onChanged: (v) => settings.updateAdvanced(
                advanced.copyWith(messageFontSize: v),
              ),
            ),
            SettingsActionTile(
              title: 'Reset conversation',
              icon: Icons.restart_alt,
              onTap: () => unavailable('Conversation reset'),
            ),
          ],
        ),
      if (matches('storage sqlite database images cache conversation vacuum'))
        SettingsSection(
          title: 'Storage',
          icon: Icons.storage_outlined,
          initiallyExpanded: query.isNotEmpty,
          children: [
            const ListTile(
              title: Text('Storage engine'),
              trailing: Text('SharedPreferences / SQLite'),
            ),
            SettingsActionTile(
              title: 'Clear cache',
              icon: Icons.cleaning_services_outlined,
              onTap: () => unavailable('Cache clearing'),
            ),
            SettingsActionTile(
              title: 'Vacuum database',
              icon: Icons.compress,
              onTap: () => unavailable('Database maintenance'),
            ),
          ],
        ),
      if (matches(
        'accessibility reduced motion large text high contrast keyboard screen reader focus',
      ))
        SettingsSection(
          title: 'Accessibility',
          icon: Icons.accessibility_new,
          initiallyExpanded: query.isNotEmpty,
          children: [
            SettingsSliderTile(
              title: 'Text size',
              value: settings.textScale,
              min: .8,
              max: 1.8,
              divisions: 10,
              label: '${(settings.textScale * 100).round()}%',
              onChanged: (v) => settings.update(scale: v),
            ),
            SettingsToggleTile(
              title: 'High contrast',
              value: advanced.highContrast,
              onChanged: (v) =>
                  settings.updateAdvanced(advanced.copyWith(highContrast: v)),
            ),
            SettingsToggleTile(
              title: 'Keyboard navigation',
              value: advanced.keyboardNavigation,
              onChanged: (v) => settings.updateAdvanced(
                advanced.copyWith(keyboardNavigation: v),
              ),
            ),
            SettingsToggleTile(
              title: 'Screen reader labels',
              value: advanced.screenReaderLabels,
              onChanged: (v) => settings.updateAdvanced(
                advanced.copyWith(screenReaderLabels: v),
              ),
            ),
            SettingsToggleTile(
              title: 'Focus indicators',
              value: advanced.focusIndicators,
              onChanged: (v) => settings.updateAdvanced(
                advanced.copyWith(focusIndicators: v),
              ),
            ),
          ],
        ),
      if (matches(
        'debug developer flutter device platform resolution memory fps route provider rest logs',
      ))
        SettingsSection(
          title: 'Debug',
          icon: Icons.bug_report_outlined,
          initiallyExpanded: query.isNotEmpty,
          children: [
            SettingsToggleTile(
              title: 'Developer mode',
              value: advanced.developerMode,
              onChanged: (v) =>
                  settings.updateAdvanced(advanced.copyWith(developerMode: v)),
            ),
            const ListTile(
              title: Text('Flutter channel'),
              trailing: Text('Stable'),
            ),
            ListTile(
              title: const Text('Screen resolution'),
              trailing: Text(
                '${MediaQuery.sizeOf(context).width.round()} x ${MediaQuery.sizeOf(context).height.round()}',
              ),
            ),
            SettingsActionTile(
              title: 'Provider state viewer',
              icon: Icons.account_tree_outlined,
              onTap: () => unavailable('Provider state viewer'),
            ),
            SettingsActionTile(
              title: 'Clear logs',
              icon: Icons.delete_outline,
              onTap: () => unavailable('Log clearing'),
            ),
          ],
        ),
      if (matches(
        'about logo application name version copyright licences privacy terms open source',
      ))
        SettingsSection(
          title: 'About',
          icon: Icons.info_outline,
          initiallyExpanded: query.isNotEmpty,
          children: [
            const ListTile(
              leading: Icon(Icons.theater_comedy_rounded, size: 40),
              title: Text('Chanson a Repondre UNO'),
              subtitle: Text('Version 1.0.0+1\nCopyright 2026'),
            ),
            SettingsActionTile(
              title: 'Privacy Policy',
              icon: Icons.privacy_tip_outlined,
              onTap: () => unavailable('Privacy policy'),
            ),
            SettingsActionTile(
              title: 'Terms',
              icon: Icons.description_outlined,
              onTap: () => unavailable('Terms'),
            ),
            SettingsActionTile(
              title: 'Open Source Licences',
              icon: Icons.code,
              onTap: () => showLicensePage(context: context),
            ),
          ],
        ),
    ];
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 8),
            child: HomeNavigationButton(),
          ),
        ],
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1100),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              SettingsSearch(
                onChanged: (value) => setState(() => query = value.trim()),
              ),
              const SizedBox(height: 12),
              if (sections.isEmpty)
                const Padding(
                  padding: EdgeInsets.all(32),
                  child: Center(child: Text('No settings match your search.')),
                ),
              LayoutBuilder(
                builder: (context, constraints) {
                  final twoColumns = constraints.maxWidth >= 850;
                  if (!twoColumns) return Column(children: sections);
                  final left = <Widget>[];
                  final right = <Widget>[];
                  for (var index = 0; index < sections.length; index++) {
                    (index.isEven ? left : right).add(sections[index]);
                  }
                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(child: Column(children: left)),
                      const SizedBox(width: 12),
                      Expanded(child: Column(children: right)),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
