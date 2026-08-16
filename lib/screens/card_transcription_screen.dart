import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/app_router.dart';
import '../providers/auth_controller.dart';
import '../providers/card_ai_provider.dart';
import '../providers/deck_provider.dart';
import '../services/card_ai_service.dart';
import '../services/protected_ai_guard.dart';
import '../widgets/ai_consent_dialog.dart';
import '../widgets/home_navigation_button.dart';
import '../widgets/transcription_jester_scene.dart';

const _gold = Color(0xFFE7A62C);
const _brightGold = Color(0xFFFFD980);
const _cream = Color(0xFFFFE8B4);
const _ink = Color(0xFF090604);
const _buildSha = String.fromEnvironment('APP_BUILD_SHA', defaultValue: 'dev');

class CardTranscriptionScreen extends StatefulWidget {
  const CardTranscriptionScreen({required this.cardId, super.key});
  final String cardId;

  @override
  State<CardTranscriptionScreen> createState() => _CardTranscriptionScreenState();
}

class _CardTranscriptionScreenState extends State<CardTranscriptionScreen> {
  Future<bool> _consent() async {
    final provider = context.read<CardAiProvider>();
    if (await provider.hasConsent()) return true;
    if (!mounted) return false;
    final choice = await showAiConsentDialog(context);
    if (choice == AiConsentChoice.remember) await provider.rememberConsent();
    return choice != AiConsentChoice.cancel;
  }

  Future<void> _transcribe() async {
    if (!await requireRealAuthentication(context, featureName: 'Card Transcription') || !mounted) return;
    if (!await _consent() || !mounted) return;
    await context.read<CardAiProvider>().transcribe(widget.cardId, TranscriptionMode.exact);
  }

  ButtonStyle _primaryButtonStyle() => FilledButton.styleFrom(
        backgroundColor: _gold,
        foregroundColor: _ink,
        disabledBackgroundColor: const Color(0x66352A1B),
        disabledForegroundColor: const Color(0x888F816A),
        minimumSize: const Size.fromHeight(88),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
        side: const BorderSide(color: _brightGold, width: 1.4),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      );

  ButtonStyle _secondaryButtonStyle() => OutlinedButton.styleFrom(
        foregroundColor: _gold,
        disabledForegroundColor: const Color(0x887F735F),
        backgroundColor: const Color(0xE20A0806),
        minimumSize: const Size.fromHeight(88),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
        side: const BorderSide(color: _gold, width: 1.4),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      );

  Widget _background() {
    if (!kIsWeb) {
      return Image.asset(
        'assets/images/transcription_gothic_background.jpg',
        fit: BoxFit.cover,
        alignment: Alignment.topCenter,
        filterQuality: FilterQuality.high,
      );
    }

    final uri = Uri.base.resolve(
      'assets/assets/images/transcription_gothic_background.jpg?v=$_buildSha',
    );
    return Image.network(
      uri.toString(),
      fit: BoxFit.cover,
      alignment: Alignment.topCenter,
      filterQuality: FilterQuality.high,
      gaplessPlayback: true,
      errorBuilder: (_, _, _) => Container(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(0, -0.45),
            radius: 1.15,
            colors: [Color(0xFF6D1F0D), Color(0xFF260A08), Color(0xFF090604)],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final card = context.watch<DeckProvider>().cardById(widget.cardId);
    final ai = context.watch<CardAiProvider>();
    final auth = context.watch<AuthController>();
    final canUseAi = auth.canUseProtectedAi;

    if (card == null) {
      return const Scaffold(body: Center(child: Text('This card no longer exists.')));
    }

    final transcription = (card.transcription ?? card.cleanedTranscription ?? '').trim();
    final hasText = transcription.isNotEmpty;

    return Scaffold(
      backgroundColor: _ink,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        toolbarHeight: 82,
        elevation: 0,
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        foregroundColor: _brightGold,
        title: const SizedBox.shrink(),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 12),
            child: HomeNavigationButton(),
          ),
        ],
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          Positioned.fill(child: IgnorePointer(child: _background())),
          const Positioned.fill(
            child: IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Color(0x00000000),
                      Color(0x08000000),
                      Color(0x36080302),
                      Color(0x8A080302),
                    ],
                    stops: [0, .50, .78, 1],
                  ),
                ),
              ),
            ),
          ),
          LayoutBuilder(
            builder: (context, box) {
              final mobile = box.maxWidth < 760;
              return Positioned(
                left: mobile ? -70 : -20,
                top: mobile ? 18 : 12,
                width: mobile ? 500 : 720,
                height: mobile ? 720 : box.maxHeight * .86,
                child: const Opacity(opacity: 1, child: TranscriptionJesterScene()),
              );
            },
          ),
          SafeArea(
            child: LayoutBuilder(
              builder: (context, box) {
                final compact = box.maxWidth < 760;
                return SingleChildScrollView(
                  padding: EdgeInsets.fromLTRB(
                    compact ? 18 : 36,
                    compact ? 430 : 470,
                    compact ? 18 : 36,
                    36,
                  ),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 920),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _TranscriptionPanel(
                            text: hasText ? transcription : 'Select a card and transcribe it to reveal its text here.',
                            hasText: hasText,
                          ),
                          if (!canUseAi || !ai.isConfigured || ai.error != null) ...[
                            const SizedBox(height: 14),
                            _StatusBar(
                              message: ai.error != null
                                  ? 'Sorry, not available for the moment. Cheers !'
                                  : !ai.isConfigured
                                      ? 'AI is not configured for this build.'
                                      : 'Guest AI session unavailable. Retry the anonymous session or reload the app.',
                              action: !ai.isConfigured
                                  ? TextButton.icon(
                                      onPressed: () => context.go(AppRoutes.settings),
                                      icon: const Icon(Icons.settings_outlined),
                                      label: const Text('Settings'),
                                    )
                                  : !canUseAi
                                      ? TextButton.icon(
                                          onPressed: () => requireRealAuthentication(context, featureName: 'Card Transcription'),
                                          icon: const Icon(Icons.refresh_rounded),
                                          label: const Text('Retry'),
                                        )
                                      : null,
                            ),
                          ],
                          if (ai.isLoading) ...[
                            const SizedBox(height: 14),
                            const LinearProgressIndicator(
                              color: _brightGold,
                              backgroundColor: Color(0x552F2418),
                            ),
                          ],
                          const SizedBox(height: 18),
                          if (compact)
                            Column(
                              children: [
                                _TranscribeButton(
                                  style: _primaryButtonStyle(),
                                  enabled: ai.isConfigured && !ai.isLoading && canUseAi,
                                  onPressed: _transcribe,
                                ),
                                const SizedBox(height: 14),
                                _DiscussButton(
                                  style: _secondaryButtonStyle(),
                                  enabled: hasText,
                                  onPressed: () => context.go(AppRoutes.cardChat(card.id)),
                                ),
                              ],
                            )
                          else
                            Row(
                              children: [
                                Expanded(
                                  child: _TranscribeButton(
                                    style: _primaryButtonStyle(),
                                    enabled: ai.isConfigured && !ai.isLoading && canUseAi,
                                    onPressed: _transcribe,
                                  ),
                                ),
                                const SizedBox(width: 18),
                                Expanded(
                                  child: _DiscussButton(
                                    style: _secondaryButtonStyle(),
                                    enabled: hasText,
                                    onPressed: () => context.go(AppRoutes.cardChat(card.id)),
                                  ),
                                ),
                              ],
                            ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _TranscriptionPanel extends StatelessWidget {
  const _TranscriptionPanel({required this.text, required this.hasText});
  final String text;
  final bool hasText;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.fromLTRB(28, 24, 28, 28),
        decoration: BoxDecoration(
          color: const Color(0xD80A0806),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: _gold, width: 1.25),
          boxShadow: const [
            BoxShadow(color: Color(0xA0000000), blurRadius: 28, offset: Offset(0, 14)),
          ],
        ),
        child: Column(
          children: [
            const Text(
              'TRANSCRIPTION',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: _cream,
                fontFamily: 'serif',
                fontSize: 24,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 14),
            Container(height: 1, color: const Color(0x77E7A62C)),
            const SizedBox(height: 18),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                text,
                style: TextStyle(
                  color: hasText ? _cream : const Color(0xAAFFE8B4),
                  fontSize: 21,
                  height: 1.42,
                  fontStyle: hasText ? FontStyle.normal : FontStyle.italic,
                ),
              ),
            ),
          ],
        ),
      );
}

class _TranscribeButton extends StatelessWidget {
  const _TranscribeButton({required this.style, required this.enabled, required this.onPressed});
  final ButtonStyle style;
  final bool enabled;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) => FilledButton(
        style: style,
        onPressed: enabled ? onPressed : null,
        child: const _ActionButtonLabel(
          icon: Icons.document_scanner_rounded,
          title: 'TRANSCRIBE CARD',
          subtitle: 'Select a card and extract the text',
        ),
      );
}

class _DiscussButton extends StatelessWidget {
  const _DiscussButton({required this.style, required this.enabled, required this.onPressed});
  final ButtonStyle style;
  final bool enabled;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) => OutlinedButton(
        style: style,
        onPressed: enabled ? onPressed : null,
        child: const _ActionButtonLabel(
          icon: Icons.forum_rounded,
          title: 'DISCUSS WITH AI',
          subtitle: 'Chat about this transcription',
        ),
      );
}

class _ActionButtonLabel extends StatelessWidget {
  const _ActionButtonLabel({required this.icon, required this.title, required this.subtitle});
  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) => Row(
        children: [
          Icon(icon, size: 34),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: .3),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, height: 1.2),
                ),
              ],
            ),
          ),
        ],
      );
}

class _StatusBar extends StatelessWidget {
  const _StatusBar({required this.message, this.action});
  final String message;
  final Widget? action;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0xD90A0705),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0x88E7A62C)),
        ),
        child: Row(
          children: [
            Expanded(child: Text(message, style: const TextStyle(color: _cream, height: 1.3))),
            if (action != null) ...[
              const SizedBox(width: 8),
              Theme(
                data: Theme.of(context).copyWith(
                  textButtonTheme: TextButtonThemeData(
                    style: TextButton.styleFrom(foregroundColor: _brightGold),
                  ),
                ),
                child: action!,
              ),
            ],
          ],
        ),
      );
}
