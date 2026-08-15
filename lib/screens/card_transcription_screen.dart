import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/app_router.dart';
import '../models/card_image_model.dart';
import '../providers/card_ai_provider.dart';
import '../providers/auth_controller.dart';
import '../providers/deck_provider.dart';
import '../services/card_ai_service.dart';
import '../widgets/ai_consent_dialog.dart';
import '../widgets/stored_image.dart';
import '../widgets/transcription_editor.dart';
import '../widgets/home_navigation_button.dart';
import '../services/navigation_guard_service.dart';
import '../services/protected_ai_guard.dart';

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
      appBar: AppBar(
        title: const Text('Card Transcription'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: HomeNavigationButton(
              navigationGuard: () => _guardHome(card),
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Center(
            child: SizedBox(
              height: 260,
              child: StoredImage(source: card.path, fit: BoxFit.contain),
            ),
          ),
          const SizedBox(height: 16),
          SegmentedButton<TranscriptionMode>(
            segments: const [
              ButtonSegment(
                value: TranscriptionMode.exact,
                label: Text('Exact transcription'),
              ),
              ButtonSegment(
                value: TranscriptionMode.clean,
                label: Text('Clean transcription'),
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
          const SizedBox(height: 12),
          if (!canUseAi)
            Card(
              color: Theme.of(context).colorScheme.errorContainer,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    const Text(
                      'Guest AI session unavailable.\n\n'
                      'No sign-in is required. Retry the anonymous session or reload the app.',
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    TextButton.icon(
                      onPressed: () => requireRealAuthentication(
                        context,
                        featureName: 'Card Transcription',
                      ),
                      icon: const Icon(Icons.refresh),
                      label: const Text('Retry guest session'),
                    ),
                  ],
                ),
              ),
            ),
          if (!ai.isConfigured)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    const Text('No AI backend configured.'),
                    const SizedBox(height: 8),
                    TextButton.icon(
                      onPressed: () => context.go(AppRoutes.settings),
                      icon: const Icon(Icons.settings_outlined),
                      label: const Text('Open Settings'),
                    ),
                  ],
                ),
              ),
            ),
          if (ai.isLoading) const LinearProgressIndicator(),
          if (ai.error != null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text(
                ai.error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ),
          const SizedBox(height: 12),
          TranscriptionEditor(controller: controller),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              FilledButton.icon(
                onPressed: !ai.isConfigured || ai.isLoading
                    ? null
                    : canUseAi
                    ? _transcribe
                    : () => requireRealAuthentication(
                        context,
                        featureName: 'Card Transcription',
                      ),
                icon: const Icon(Icons.document_scanner),
                label: Text(hasText ? 'Retry' : 'Transcribe card'),
              ),
              OutlinedButton.icon(
                onPressed: !hasText
                    ? null
                    : () => context.read<CardAiProvider>().saveTranscription(
                        widget.cardId,
                        text: controller.text.trim(),
                        mode: mode,
                      ),
                icon: const Icon(Icons.save),
                label: const Text('Save'),
              ),
              OutlinedButton.icon(
                onPressed: !hasText
                    ? null
                    : () {
                        Clipboard.setData(ClipboardData(text: controller.text));
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Transcription copied.'),
                          ),
                        );
                      },
                icon: const Icon(Icons.copy),
                label: const Text('Copy'),
              ),
              OutlinedButton.icon(
                onPressed: !hasText
                    ? null
                    : () async {
                        final yes =
                            await showDialog<bool>(
                              context: context,
                              builder: (context) => AlertDialog(
                                title: const Text('Clear transcription?'),
                                content: const Text(
                                  'This removes transcription and card chat history, but keeps the original PNG.',
                                ),
                                actions: [
                                  TextButton(
                                    onPressed: () =>
                                        Navigator.pop(context, false),
                                    child: const Text('Cancel'),
                                  ),
                                  FilledButton(
                                    onPressed: () =>
                                        Navigator.pop(context, true),
                                    child: const Text('Clear'),
                                  ),
                                ],
                              ),
                            ) ??
                            false;
                        if (yes && context.mounted) {
                          await context.read<CardAiProvider>().deleteAiData(
                            widget.cardId,
                          );
                          controller.clear();
                          setState(() {});
                        }
                      },
                icon: const Icon(Icons.delete_outline),
                label: const Text('Clear'),
              ),
              FilledButton.tonalIcon(
                onPressed: !card.transcriptionReviewed
                    ? null
                    : () => context.go(AppRoutes.cardChat(card.id)),
                icon: const Icon(Icons.forum),
                label: const Text('Discuss this card'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
