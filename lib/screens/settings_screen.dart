import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/background_provider.dart';
import '../providers/home_experience_provider.dart';
import '../providers/settings_provider.dart';
import '../providers/startup_video_provider.dart';
import '../models/visitor_stats.dart';
import '../services/background_import_service.dart';
import '../services/visitor_analytics_service.dart';
import '../widgets/home_navigation_button.dart';
import '../widgets/settings_action_tile.dart';
import '../widgets/settings_section.dart';
import '../widgets/startup_video_viewport.dart';
import '../widgets/utility_page_background.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  VisitorStats? _visitorStats;
  bool _visitorStatsLoading = true;
  bool _visitorStatsLoaded = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_visitorStatsLoaded) return;
    _visitorStatsLoaded = true;
    _loadVisitorStats();
  }

  Future<void> _loadVisitorStats() async {
    if (mounted) setState(() => _visitorStatsLoading = true);
    try {
      final stats = await context.read<VisitorAnalyticsService>().getStats();
      if (mounted) setState(() => _visitorStats = stats);
    } on Object {
      if (mounted) setState(() => _visitorStats = null);
    } finally {
      if (mounted) setState(() => _visitorStatsLoading = false);
    }
  }

  Future<bool> _confirm(
    BuildContext context, {
    required String title,
    required String message,
  }) async =>
      await showDialog<bool>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: Text(title),
          content: Text(message),
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
      ) ??
      false;

  Future<void> _previewStartupVideo(BuildContext context) async {
    await showDialog<void>(
      context: context,
      builder: (dialogContext) => Dialog.fullscreen(
        backgroundColor: Colors.black,
        child: Stack(
          children: [
            const Positioned.fill(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: StartupVideoViewport(compact: true),
              ),
            ),
            SafeArea(
              child: Align(
                alignment: Alignment.topRight,
                child: IconButton.filledTonal(
                  tooltip: 'Close preview',
                  onPressed: () => Navigator.pop(dialogContext),
                  icon: const Icon(Icons.close_rounded),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final background = context.watch<BackgroundProvider>();
    final settings = context.watch<SettingsProvider>();
    final startup = context.watch<StartupVideoProvider>();
    final home = context.watch<HomeExperienceProvider>();
    final advanced = settings.advanced;

    return UtilityPageScaffold(
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
          constraints: const BoxConstraints(maxWidth: 760),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              SettingsSection(
                title: 'GENERAL',
                icon: Icons.tune_rounded,
                initiallyExpanded: false,
                children: [
                  ListTile(
                    leading: const Icon(Icons.language_rounded),
                    title: const Text('Language'),
                    trailing: DropdownButton<String>(
                      value: settings.language,
                      items: const [
                        DropdownMenuItem(
                          value: 'English',
                          child: Text('English'),
                        ),
                        DropdownMenuItem(
                          value: 'Français',
                          child: Text('Français'),
                        ),
                      ],
                      onChanged: (value) {
                        if (value != null) settings.update(locale: value);
                      },
                    ),
                  ),
                  SwitchListTile(
                    secondary: const Icon(Icons.motion_photos_off_outlined),
                    title: const Text('Reduced motion'),
                    subtitle: const Text('Limit decorative animation.'),
                    value: advanced.reducedMotion,
                    onChanged: (value) => settings.updateAdvanced(
                      advanced.copyWith(
                        reducedMotion: value,
                        animationsEnabled: !value,
                      ),
                    ),
                  ),
                ],
              ),
              SettingsSection(
                title: 'VISITORS',
                icon: Icons.groups_outlined,
                initiallyExpanded: true,
                children: [
                  VisitorStatsPanel(
                    stats: _visitorStats,
                    loading: _visitorStatsLoading,
                  ),
                ],
              ),
              SettingsSection(
                title: 'HOME',
                icon: Icons.home_outlined,
                initiallyExpanded: false,
                children: [
                  const ListTile(
                    title: Text('Home background'),
                    subtitle: Text('Applies to the Home screen only.'),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                    child: SegmentedButton<BackgroundMediaType>(
                      segments: const [
                        ButtonSegment(
                          value: BackgroundMediaType.image,
                          icon: Icon(Icons.image_outlined),
                          label: Text('DEFAULT'),
                        ),
                        ButtonSegment(
                          value: BackgroundMediaType.video,
                          icon: Icon(Icons.movie_outlined),
                          label: Text('SAUVAGE'),
                        ),
                      ],
                      selected: {background.type},
                      onSelectionChanged: (selection) {
                        final type = selection.first;
                        if (type == BackgroundMediaType.video) {
                          background.useSauvageVideo();
                        } else {
                          background.restoreDefault();
                        }
                      },
                    ),
                  ),
                  SwitchListTile(
                    secondary: Icon(
                      background.muteVideo
                          ? Icons.volume_off_outlined
                          : Icons.volume_up_outlined,
                    ),
                    title: const Text('SAUVAGE sound'),
                    value: !background.muteVideo,
                    onChanged: (value) => background.setMuteVideo(!value),
                  ),
                  ListTile(
                    leading: const Icon(Icons.contrast_rounded),
                    title: const Text('Dark overlay'),
                    subtitle: Slider(
                      value: background.darkOverlay,
                      min: 0,
                      max: .6,
                      divisions: 12,
                      label: '${(background.darkOverlay * 100).round()}%',
                      onChanged: background.setOverlay,
                    ),
                    trailing: Text(
                      '${(background.darkOverlay * 100).round()}%',
                    ),
                  ),
                  SwitchListTile(
                    secondary: const Icon(Icons.threesixty_rounded),
                    title: const Text('Startup 360° rotation'),
                    value: advanced.rotationEnabled,
                    onChanged: (value) => settings.updateAdvanced(
                      advanced.copyWith(rotationEnabled: value),
                    ),
                  ),
                  ListTile(
                    leading: const Icon(Icons.speed_rounded),
                    title: const Text('Rotation speed'),
                    subtitle: Slider(
                      value: advanced.rotationSpeed,
                      min: 8,
                      max: 24,
                      divisions: 16,
                      label: '${advanced.rotationSpeed.round()} s',
                      onChanged: (value) => settings.updateAdvanced(
                        advanced.copyWith(rotationSpeed: value),
                      ),
                    ),
                  ),
                  SwitchListTile(
                    secondary: const Icon(Icons.auto_awesome_outlined),
                    title: const Text('Auto-open curtain'),
                    value: home.autoOpenAfterPlayback,
                    onChanged: home.setAutoOpen,
                  ),
                  SettingsActionTile(
                    title: 'Preview startup video',
                    subtitle: startup.currentFileName,
                    icon: Icons.play_circle_outline,
                    onTap: startup.loading
                        ? null
                        : () => _previewStartupVideo(context),
                  ),
                ],
              ),
              SettingsSection(
                title: 'RESTORE',
                icon: Icons.restore_rounded,
                initiallyExpanded: false,
                children: [
                  SettingsActionTile(
                    title: 'Restore default Home background',
                    icon: Icons.image_outlined,
                    onTap: () async {
                      if (await _confirm(
                            context,
                            title: 'Restore default Home background?',
                            message:
                                'The bundled default image will replace the current Home background.',
                          ) &&
                          context.mounted) {
                        await context
                            .read<BackgroundProvider>()
                            .restoreDefault();
                      }
                    },
                  ),
                  SettingsActionTile(
                    title: 'Restore bundled startup video',
                    icon: Icons.ondemand_video_outlined,
                    onTap: () async {
                      if (await _confirm(
                            context,
                            title: 'Restore bundled startup video?',
                            message:
                                'The foreground curtain video will return to the bundled version.',
                          ) &&
                          context.mounted) {
                        await context
                            .read<StartupVideoProvider>()
                            .restoreDefault();
                      }
                    },
                  ),
                  SettingsActionTile(
                    title: 'Reset settings',
                    icon: Icons.restart_alt_rounded,
                    onTap: () async {
                      if (await _confirm(
                            context,
                            title: 'Reset settings?',
                            message:
                                'General and Home settings will return to their defaults.',
                          ) &&
                          context.mounted) {
                        await context.read<SettingsProvider>().reset();
                        if (context.mounted) {
                          await context
                              .read<BackgroundProvider>()
                              .restoreDefault();
                        }
                      }
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class VisitorStatsPanel extends StatelessWidget {
  const VisitorStatsPanel({required this.stats, required this.loading, super.key});

  final VisitorStats? stats;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final values = <(String, int?)>[
      ('7 DAYS', stats?.sevenDays),
      ('90 DAYS', stats?.ninetyDays),
      ('1 YEAR', stats?.oneYear),
    ];
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Approximate unique visitors to the web app.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 12),
          LayoutBuilder(
            builder: (context, constraints) {
              final compact = constraints.maxWidth < 340;
              if (compact) {
                return Column(
                  children: [
                    for (final value in values)
                      _VisitorStat(label: value.$1, value: value.$2, horizontal: true),
                  ],
                );
              }
              return Row(
                children: [
                  for (final value in values)
                    Expanded(child: _VisitorStat(label: value.$1, value: value.$2)),
                ],
              );
            },
          ),
          if (!loading && stats == null)
            const Padding(
              padding: EdgeInsets.only(top: 8),
              child: Text(
                'Visitor statistics unavailable',
                textAlign: TextAlign.center,
              ),
            ),
        ],
      ),
    );
  }
}

class _VisitorStat extends StatelessWidget {
  const _VisitorStat({required this.label, required this.value, this.horizontal = false});

  final String label;
  final int? value;
  final bool horizontal;

  String get formattedValue {
    if (value == null) return '—';
    return value.toString().replaceAllMapped(
      RegExp(r'\B(?=(\d{3})+(?!\d))'),
      (_) => ',',
    );
  }

  @override
  Widget build(BuildContext context) {
    final labelWidget = Text(
      label,
      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1),
    );
    final valueWidget = Text(
      formattedValue,
      key: ValueKey('visitor-stat-$label'),
      style: const TextStyle(
        color: Color(0xFFFFC928),
        fontSize: 22,
        fontWeight: FontWeight.w900,
      ),
    );
    return SizedBox(
      height: horizontal ? 48 : 58,
      child: horizontal
          ? Row(children: [Expanded(child: labelWidget), valueWidget])
          : Column(mainAxisAlignment: MainAxisAlignment.center, children: [labelWidget, valueWidget]),
    );
  }
}
