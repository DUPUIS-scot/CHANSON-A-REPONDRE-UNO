import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/app_router.dart';
import '../models/card_image_model.dart';
import '../providers/auth_controller.dart';
import '../providers/card_ai_provider.dart';
import '../providers/deck_provider.dart';
import '../services/card_ai_service.dart';
import '../services/navigation_guard_service.dart';
import '../services/protected_ai_guard.dart';
import '../widgets/ai_consent_dialog.dart';
import '../widgets/home_navigation_button.dart';
import '../widgets/stored_image.dart';
import '../widgets/transcription_editor.dart';
import '../widgets/utility_page_background.dart';
import '../widgets/transcription_jester_scene.dart';

const _gold = Color(0xFFE7A62C);
const _brightGold = Color(0xFFFFD980);
const _cream = Color(0xFFFFE8B4);
const _ink = Color(0xFF090604);

class CardTranscriptionScreen extends StatefulWidget {
  const CardTranscriptionScreen({required this.cardId, super.key});

  final String cardId;

  @override
  State<CardTranscriptionScreen> createState() =>
      _CardTranscriptionScreenState();
}

class _CardTranscriptionScreenState extends State<CardTranscriptionScreen> {
  final controller = TextEditingController();
  TranscriptionMode mode = TranscriptionMode.exact;
  bool initialized = false;

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  Future<bool> _consent() async {
    final provider = context.read<CardAiProvider>();
    if (await provider.hasConsent()) return true;
    if (!mounted) return false;
    final choice = await showAiConsentDialog(context);
    if (choice == AiConsentChoice.remember) await provider.rememberConsent();
    return choice != AiConsentChoice.cancel;
  }

  Future<void> _transcribe() async {
    if (!await requireRealAuthentication(
          context,
          featureName: 'Card Transcription',
        ) ||
        !mounted) {
      return;
    }
    if (!await _consent() || !mounted) return;
    final result = await context.read<CardAiProvider>().transcribe(
      widget.cardId,
      mode,
    );
    if (result != null && mounted) {
      setState(
        () => controller.text = mode == TranscriptionMode.exact
            ? result.transcription ?? ''
            : result.cleanedTranscription ?? '',
      );
    }
  }

  Future<bool> _guardHome(CardImageModel card) async {
    final ai = context.read<CardAiProvider>();
    final saved = mode == TranscriptionMode.exact
        ? card.transcription ?? ''
        : card.cleanedTranscription ?? '';
    if (controller.text == saved) return true;
    final choice = await NavigationGuardService.confirm(
      context,
      title: 'Unsaved transcription',
      message: 'Your transcription contains unsaved edits.',
      discardLabel: 'Discard Changes',
      saveLabel: 'Save and Return Home',
    );
    if (choice == GuardChoice.save) {
      await ai.saveTranscription(
        widget.cardId,
        text: controller.text.trim(),
        mode: mode,
      );
      return true;
    }
    return choice == GuardChoice.discard;
  }

  ButtonStyle _filledStyle() => FilledButton.styleFrom(
    backgroundColor: _gold,
    foregroundColor: _ink,
    disabledBackgroundColor: const Color(0x66352A1B),
    disabledForegroundColor: const Color(0x888F816A),
    padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 18),
    side: const BorderSide(color: _brightGold, width: 1.2),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    textStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
  );

  ButtonStyle _outlinedStyle() => OutlinedButton.styleFrom(
    foregroundColor: _cream,
    disabledForegroundColor: const Color(0x887F735F),
    backgroundColor: const Color(0xC9090705),
    padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 18),
    side: const BorderSide(color: _gold, width: 1.2),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    textStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
  );

  @override
  Widget build(BuildContext context) {
    final card = context.watch<DeckProvider>().cardById(widget.cardId);
    final ai = context.watch<CardAiProvider>();
    final auth = context.watch<AuthController>();
    final canUseAi = auth.canUseProtectedAi;

    if (card == null) {
      return const Scaffold(
        body: Center(child: Text('This card no longer exists.')),
      );
    }

    if (!initialized) {
      initialized = true;
      controller.text = card.transcription ?? card.cleanedTranscription ?? '';
    }
    final hasText = controller.text.trim().isNotEmpty;

    return Scaffold(
      backgroundColor: _ink,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        toolbarHeight: 84,
        elevation: 0,
        backgroundColor: const Color(0x8A050302),
        surfaceTintColor: Colors.transparent,
        foregroundColor: _brightGold,
        title: const Text(
          'Card Transcription',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            color: _cream,
            fontFamily: 'serif',
            fontSize: 27,
            fontWeight: FontWeight.w700,
            letterSpacing: .2,
            shadows: [Shadow(color: Colors.black, blurRadius: 10)],
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: HomeNavigationButton(
              navigationGuard: () => _guardHome(card),
            ),
          ),
        ],
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          const Positioned.fill(
            child: IgnorePointer(
              child: Image(
                image: AssetImage(UtilityPageBackground.assetPath),
                fit: BoxFit.cover,
                alignment: Alignment.center,
              ),
            ),
          ),
          const Positioned.fill(
            child: IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Color(0x19000000),
                      Color(0x66000000),
                      Color(0xD9050302),
                    ],
                    stops: [0.0, .46, 1.0],
                  ),
                ),
              ),
            ),
          ),
          LayoutBuilder(
            builder: (context, constraints) {
              final desktop = constraints.maxWidth >= 760;
              if (desktop) {
                return Positioned(
                  left: -42,
                  top: 68,
                  bottom: 30,
                  width: constraints.maxWidth.clamp(330.0, 470.0) * .92,
                  child: const Opacity(
                    opacity: .96,
                    child: TranscriptionJesterScene(),
                  ),
                );
              }
              return const Positioned(
                left: -150,
                top: 92,
                width: 390,
                height: 540,
                child: Opacity(
                  opacity: .78,
                  child: TranscriptionJesterScene(),
                ),
              );
            },
          ),
          SafeArea(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 22, 16, 44),
              children: [
                Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 820),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Center(
                          child: Container(
                            padding: const EdgeInsets.all(13),
                            decoration: BoxDecoration(
                              color: const Color(0xD10A0705),
                              borderRadius: BorderRadius.circular(24),
                              border: Border.all(color: _gold, width: 1.3),
                              boxShadow: const [
                                BoxShadow(
                                  color: Color(0x88FF9A1F),
                                  blurRadius: 26,
                                  spreadRadius: -10,
                                ),
                                BoxShadow(
                                  color: Colors.black,
                                  blurRadius: 28,
                                  offset: Offset(0, 12),
                                ),
                              ],
                            ),
                            child: SizedBox(
                              height: 300,
                              child: StoredImage(
                                source: card.path,
                                fit: BoxFit.contain,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 22),
                        _GoldPanel(
                          padding: const EdgeInsets.all(8),
                          child: Theme(
                            data: Theme.of(context).copyWith(
                              colorScheme: Theme.of(context).colorScheme.copyWith(
                                primary: _gold,
                                onPrimary: _ink,
                                surface: const Color(0xFF120B07),
                                onSurface: _cream,
                                outline: _gold,
                              ),
                            ),
                            child: SegmentedButton<TranscriptionMode>(
                              showSelectedIcon: true,
                              segments: const [
                                ButtonSegment(
                                  value: TranscriptionMode.exact,
                                  label: Text('Exact transcription'),
                                  icon: Icon(Icons.check_rounded),
                                ),
                                ButtonSegment(
                                  value: TranscriptionMode.clean,
                                  label: Text('Clean transcription'),
                                  icon: Icon(Icons.auto_fix_high_rounded),
                                ),
                              ],
                              selected: {mode},
                              onSelectionChanged: (value) {
                                setState(() {
                                  mode = value.first;
                                  controller.text = mode == TranscriptionMode.exact
                                      ? card.transcription ?? ''
                                      : card.cleanedTranscription ?? '';
                                });
                              },
                            ),
                          ),
                        ),
                        if (!canUseAi) ...[
                          const SizedBox(height: 16),
                          _StatusPanel(
                            icon: Icons.wifi_tethering_error_rounded,
                            message:
                                'Guest AI session unavailable. No sign-in is required. Retry the anonymous session or reload the app.',
                            action: TextButton.icon(
                              onPressed: () => requireRealAuthentication(
                                context,
                                featureName: 'Card Transcription',
                              ),
                              icon: const Icon(Icons.refresh),
                              label: const Text('Retry guest session'),
                            ),
                          ),
                        ],
                        if (!ai.isConfigured) ...[
                          const SizedBox(height: 16),
                          _StatusPanel(
                            icon: Icons.settings_outlined,
                            message: 'No AI backend configured.',
                            action: TextButton.icon(
                              onPressed: () => context.go(AppRoutes.settings),
                              icon: const Icon(Icons.settings_outlined),
                              label: const Text('Open Settings'),
                            ),
                          ),
                        ],
                        if (ai.isLoading) ...[
                          const SizedBox(height: 16),
                          const LinearProgressIndicator(
                            color: _brightGold,
                            backgroundColor: Color(0x552F2418),
                          ),
                        ],
                        if (ai.error != null) ...[
                          const SizedBox(height: 12),
                          _GoldPanel(
                            child: Text(
                              ai.error!,
                              style: const TextStyle(
                                color: Color(0xFFFFB7A8),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                        const SizedBox(height: 18),
                        _GoldPanel(
                          padding: const EdgeInsets.all(10),
                          child: TranscriptionEditor(
                            controller: controller,
                            onChanged: (_) => setState(() {}),
                          ),
                        ),
                        const SizedBox(height: 18),
                        Wrap(
                          spacing: 12,
                          runSpacing: 12,
                          alignment: WrapAlignment.center,
                          children: [
                            FilledButton.icon(
                              style: _filledStyle(),
                              onPressed: !ai.isConfigured || ai.isLoading
                                  ? null
                                  : canUseAi
                                  ? _transcribe
                                  : () => requireRealAuthentication(
                                      context,
                                      featureName: 'Card Transcription',
                                    ),
                              icon: const Icon(Icons.document_scanner_rounded),
                              label: Text(hasText ? 'Retry' : 'Transcribe card'),
                            ),
                            OutlinedButton.icon(
                              style: _outlinedStyle(),
                              onPressed: !hasText
                                  ? null
                                  : () => context
                                        .read<CardAiProvider>()
                                        .saveTranscription(
                                          widget.cardId,
                                          text: controller.text.trim(),
                                          mode: mode,
                                        ),
                              icon: const Icon(Icons.save_rounded),
                              label: const Text('Save'),
                            ),
                            OutlinedButton.icon(
                              style: _outlinedStyle(),
                              onPressed: !hasText
                                  ? null
                                  : () {
                                      Clipboard.setData(
                                        ClipboardData(text: controller.text),
                                      );
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(
                                          content: Text('Transcription copied.'),
                                        ),
                                      );
                                    },
                              icon: const Icon(Icons.copy_rounded),
                              label: const Text('Copy'),
                            ),
                            OutlinedButton.icon(
                              style: _outlinedStyle(),
                              onPressed: !hasText
                                  ? null
                                  : () async {
                                      final yes =
                                          await showDialog<bool>(
                                            context: context,
                                            builder: (context) => AlertDialog(
                                              title: const Text(
                                                'Clear transcription?',
                                              ),
                                              content: const Text(
                                                'This removes transcription and card chat history, but keeps the original PNG.',
                                              ),
                                              actions: [
                                                TextButton(
                                                  onPressed: () => Navigator.pop(
                                                    context,
                                                    false,
                                                  ),
                                                  child: const Text('Cancel'),
                                                ),
                                                FilledButton(
                                                  onPressed: () => Navigator.pop(
                                                    context,
                                                    true,
                                                  ),
                                                  child: const Text('Clear'),
                                                ),
                                              ],
                                            ),
                                          ) ??
                                          false;
                                      if (yes && context.mounted) {
                                        await context
                                            .read<CardAiProvider>()
                                            .deleteAiData(widget.cardId);
                                        controller.clear();
                                        setState(() {});
                                      }
                                    },
                              icon: const Icon(Icons.delete_outline_rounded),
                              label: const Text('Clear'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        FilledButton.tonalIcon(
                          style: FilledButton.styleFrom(
                            backgroundColor: const Color(0xD9292118),
                            foregroundColor: _cream,
                            disabledBackgroundColor: const Color(0xAA211C15),
                            disabledForegroundColor: const Color(0x887F735F),
                            minimumSize: const Size.fromHeight(60),
                            side: const BorderSide(color: _gold, width: 1.15),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            textStyle: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          onPressed: !card.transcriptionReviewed
                              ? null
                              : () => context.go(AppRoutes.cardChat(card.id)),
                          icon: const Icon(Icons.forum_rounded),
                          label: const Text('Discuss this card'),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _GoldPanel extends StatelessWidget {
  const _GoldPanel({required this.child, this.padding = const EdgeInsets.all(16)});

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) => Container(
    padding: padding,
    decoration: BoxDecoration(
      color: const Color(0xD10A0705),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: const Color(0xBFE7A62C), width: 1.15),
      boxShadow: const [
        BoxShadow(color: Color(0x99000000), blurRadius: 24, offset: Offset(0, 10)),
        BoxShadow(color: Color(0x22FFA22D), blurRadius: 14),
      ],
    ),
    child: child,
  );
}

class _StatusPanel extends StatelessWidget {
  const _StatusPanel({required this.icon, required this.message, required this.action});

  final IconData icon;
  final String message;
  final Widget action;

  @override
  Widget build(BuildContext context) => _GoldPanel(
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(width: 2),
        Icon(icon, color: _brightGold),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                message,
                style: const TextStyle(color: _cream, height: 1.35),
              ),
              const SizedBox(height: 6),
              Theme(
                data: Theme.of(context).copyWith(
                  textButtonTheme: TextButtonThemeData(
                    style: TextButton.styleFrom(foregroundColor: _brightGold),
                  ),
                ),
                child: action,
              ),
            ],
          ),
        ),
      ],
    ),
  );
}
