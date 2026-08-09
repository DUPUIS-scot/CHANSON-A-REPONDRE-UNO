import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/card_ai_provider.dart';
import '../providers/home_experience_provider.dart';
import '../providers/settings_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/app_page_shell.dart';
import '../widgets/settings_section.dart';
import '../widgets/settings_dropdown_tile.dart';
import '../widgets/settings_slider_tile.dart';
import '../widgets/settings_toggle_tile.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  Future<void> _resetSettings(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Reset preferences?'),
        content: const Text(
          'Appearance, motion, sound, and gameplay preferences will return to their defaults.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Reset'),
          ),
        ],
      ),
    );
    if (confirmed == true && context.mounted) {
      await context.read<SettingsProvider>().reset();
    }
  }

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>();
    final home = context.watch<HomeExperienceProvider>();
    final ai = context.watch<CardAiProvider>();
    final advanced = settings.advanced;

    return AppPageShell(
      title: 'Settings',
      child: ListView(
        padding: const EdgeInsets.all(AppTheme.spaceMd),
        children: [
          Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 760),
              child: Column(
                children: [
                  SettingsSection(
                    title: 'Appearance',
                    icon: Icons.auto_awesome_outlined,
                    children: [
                      SwitchListTile.adaptive(
                        title: const Text('Dark theatrical theme'),
                        subtitle: const Text(
                          'Use the moonlit presentation designed for this artwork.',
                        ),
                        value: settings.themeMode != ThemeMode.light,
                        onChanged: (dark) => settings.update(
                          theme: dark ? ThemeMode.dark : ThemeMode.light,
                        ),
                      ),
                      SettingsSliderTile(
                        title: 'Text size',
                        value: settings.textScale,
                        min: .85,
                        max: 1.3,
                        divisions: 9,
                        label: '${(settings.textScale * 100).round()}%',
                        onChanged: (value) => settings.update(scale: value),
                      ),
                      SettingsToggleTile(
                        title: 'Animations',
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
                    ],
                  ),
                  const SizedBox(height: AppTheme.spaceMd),
                  SettingsSection(
                    title: 'Home experience',
                    icon: Icons.theater_comedy_outlined,
                    children: [
                      SettingsDropdownTile<HomeBackgroundMode>(
                        title: 'Home background',
                        value: home.backgroundMode,
                        items: const {
                          HomeBackgroundMode.defaultMode: 'Default',
                          HomeBackgroundMode.sauvage: 'SAUVAGE',
                        },
                        onChanged: home.setBackgroundMode,
                      ),
                      SettingsToggleTile(
                        title: 'Auto-open curtain after the intro',
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
                  const SizedBox(height: AppTheme.spaceMd),
                  SettingsSection(
                    title: 'Sound',
                    icon: Icons.volume_up_outlined,
                    children: [
                      SettingsToggleTile(
                        title: 'Sound enabled',
                        value: settings.soundEnabled,
                        onChanged: (value) => settings.update(sound: value),
                      ),
                      SettingsSliderTile(
                        title: 'Volume',
                        value: settings.volume,
                        min: 0,
                        max: 1,
                        divisions: 10,
                        label: '${(settings.volume * 100).round()}%',
                        onChanged: settings.soundEnabled
                            ? (value) => settings.update(audioVolume: value)
                            : null,
                      ),
                    ],
                  ),
                  const SizedBox(height: AppTheme.spaceMd),
                  SettingsSection(
                    title: 'Play',
                    icon: Icons.casino_outlined,
                    children: [
                      SettingsToggleTile(
                        title: 'Keep flipped cards face up',
                        value: settings.keepRevealedCardsFaceUp,
                        onChanged: (value) =>
                            settings.update(keepRevealed: value),
                      ),
                      SettingsToggleTile(
                        title: 'Hide revealed cards after a turn',
                        value: settings.hidePlayerHandAfterTurn,
                        onChanged: (value) =>
                            settings.update(hideAfterTurn: value),
                      ),
                      const ListTile(
                        leading: Icon(Icons.touch_app_outlined),
                        title: Text('Card controls'),
                        subtitle: Text(
                          'Tap to select, hold to flip, and double-tap to view fullscreen.',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppTheme.spaceMd),
                  SettingsSection(
                    title: 'AI Chat',
                    icon: Icons.smart_toy_outlined,
                    children: [
                      SettingsToggleTile(
                        title: 'AI features',
                        value: ai.aiEnabled,
                        onChanged: ai.setAiEnabled,
                      ),
                      const ListTile(
                        leading: Icon(Icons.privacy_tip_outlined),
                        title: Text('Privacy'),
                        subtitle: Text(
                          'Card content is sent only after you provide consent.',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppTheme.spaceLg),
                  OutlinedButton.icon(
                    onPressed: () => _resetSettings(context),
                    icon: const Icon(Icons.restart_alt_rounded),
                    label: const Text('Reset preferences'),
                  ),
                  const SizedBox(height: AppTheme.spaceLg),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
