import 'package:flutter/material.dart';

import '../models/card_image_model.dart';
import '../models/deck_model.dart';
import '../services/external_ai_handoff_service.dart';
import '../services/native_share.dart';
import '../services/native_share_result.dart';
import '../services/public_card_share_service.dart';

const _gold = Color(0xFFE7A62C);
const _brightGold = Color(0xFFFFD980);
const _cream = Color(0xFFFFE8B4);

Future<void> showTranscriptionAiProviderSheet({
  required BuildContext context,
  required CardImageModel card,
  required Deck deck,
  required CardAiHandoffMode mode,
  ExternalAiHandoffService service = const ExternalAiHandoffService(),
}) async {
  final prompt = ExternalAiHandoffService.buildPrompt(
    mode: mode,
    card: card,
    deck: deck,
  );

  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    barrierColor: const Color(0xCC000000),
    backgroundColor: const Color(0xFF0A0806),
    builder: (_) => _TranscriptionAiProviderSheet(
      card: card,
      deck: deck,
      mode: mode,
      prompt: prompt,
      service: service,
    ),
  );
}

class _TranscriptionAiProviderSheet extends StatelessWidget {
  const _TranscriptionAiProviderSheet({
    required this.card,
    required this.deck,
    required this.mode,
    required this.prompt,
    required this.service,
  });

  final CardImageModel card;
  final Deck deck;
  final CardAiHandoffMode mode;
  final String prompt;
  final ExternalAiHandoffService service;

  String get _title => mode == CardAiHandoffMode.transcribe
      ? 'TRANSCRIBE WITH AI'
      : 'DISCUSS WITH AI';

  String get _description => mode == CardAiHandoffMode.transcribe
      ? '${card.displayTitle} · Share the selected card image to an AI app, or open a provider and paste the copied card context.'
      : '${card.displayTitle} · Share the selected card image to an AI app for visual discussion, or open a provider and paste the copied card context.';

  IconData _iconFor(ExternalAiProvider provider) => switch (provider) {
        ExternalAiProvider.chatgpt => Icons.auto_awesome_rounded,
        ExternalAiProvider.gemini => Icons.diamond_outlined,
        ExternalAiProvider.claude => Icons.psychology_alt_outlined,
        ExternalAiProvider.copilot => Icons.assistant_outlined,
      };

  void _showCopiedConfirmation(BuildContext context) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        const SnackBar(
          content: Text('Prompt + card links copied. Paste them in the AI app.'),
        ),
      );
  }

  Future<void> _confirmCopyOnly(BuildContext context) async {
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: const Color(0xFF120D08),
        title: const Text(
          'PROMPT + CARD LINKS COPIED',
          style: TextStyle(
            color: _brightGold,
            fontWeight: FontWeight.w900,
          ),
        ),
        content: const Text(
          'The prompt, canonical card link and preview image link were copied successfully to your clipboard.\n\nPaste them into your AI conversation.',
          style: TextStyle(color: _cream, height: 1.35),
        ),
        actions: [
          FilledButton(
            style: FilledButton.styleFrom(
              foregroundColor: const Color(0xFF090604),
              backgroundColor: _gold,
            ),
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  Future<bool> _confirmCopiedBeforeProvider(
    BuildContext context,
    ExternalAiProvider provider,
  ) async {
    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: const Color(0xFF120D08),
        title: const Text(
          'PROMPT + CARD LINKS COPIED',
          style: TextStyle(
            color: _brightGold,
            fontWeight: FontWeight.w900,
          ),
        ),
        content: Text(
          'The prompt, canonical card link and preview image link are copied to your clipboard.\n\nTap CONTINUE to open ${provider.label}, then paste the copied prompt into the conversation.',
          style: const TextStyle(color: _cream, height: 1.35),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('CANCEL'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              foregroundColor: const Color(0xFF090604),
              backgroundColor: _gold,
            ),
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: Text('CONTINUE TO ${provider.label.toUpperCase()}'),
          ),
        ],
      ),
    );
    return result ?? false;
  }

  Future<void> _openProvider(
    BuildContext context,
    ExternalAiProvider provider,
  ) async {
    try {
      await service.copyPrompt(prompt);
      if (!context.mounted) return;
      final confirmed = await _confirmCopiedBeforeProvider(context, provider);
      if (!confirmed || !context.mounted) return;
      await service.openProviderWithoutCopy(provider: provider);
    } on Object {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Prompt + card links copied, but ${provider.label} could not be opened automatically.',
          ),
        ),
      );
    }
  }

  Future<void> _shareCardImage(BuildContext context) async {
    await service.copyPrompt(prompt);
    if (!context.mounted) return;
    _showCopiedConfirmation(context);
    final shareUrl = PublicCardShareService.shareUrlFor(
      cardId: card.id,
      deckId: deck.id,
    ).toString();
    final result = await sharePublicCard(
      title: '${deck.name} — ${card.displayTitle}',
      text: prompt,
      url: shareUrl,
      imagePath: card.imagePath,
    );

    if (!context.mounted || result == NativeShareResult.cancelled) return;

    final message = switch (result) {
      NativeShareResult.shared =>
        'Card image shared. Choose your AI app in the system share sheet.',
      NativeShareResult.unavailable =>
        'Image sharing is unavailable in this browser. The prompt + card links are copied; attach the card image manually.',
      NativeShareResult.failed =>
        'The card image could not be shared. The prompt + card links are copied; attach the card image manually.',
      NativeShareResult.cancelled => '',
    };

    if (message.isNotEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    }
  }

  Future<void> _copy(BuildContext context) async {
    await service.copyPrompt(prompt);
    if (!context.mounted) return;
    await _confirmCopyOnly(context);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          8,
          20,
          20 + MediaQuery.viewInsetsOf(context).bottom,
        ),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 720),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  _title,
                  textAlign: TextAlign.center,
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w900,
                    color: _cream,
                    letterSpacing: .4,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _description,
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: _cream,
                    height: 1.35,
                  ),
                ),
                const SizedBox(height: 18),
                FilledButton.icon(
                  style: FilledButton.styleFrom(
                    foregroundColor: const Color(0xFF090604),
                    backgroundColor: _gold,
                    side: const BorderSide(color: _brightGold),
                  ),
                  onPressed: () => _shareCardImage(context),
                  icon: const Icon(Icons.ios_share_rounded),
                  label: const Padding(
                    padding: EdgeInsets.symmetric(vertical: 14),
                    child: Text('SHARE CARD IMAGE TO AI'),
                  ),
                ),
                const SizedBox(height: 12),
                LayoutBuilder(
                  builder: (context, constraints) {
                    final itemWidth = constraints.maxWidth < 520
                        ? constraints.maxWidth
                        : (constraints.maxWidth - 12) / 2;
                    return Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: ExternalAiProvider.values
                          .map(
                            (provider) => SizedBox(
                              width: itemWidth,
                              child: FilledButton.tonalIcon(
                                style: FilledButton.styleFrom(
                                  foregroundColor: _brightGold,
                                  backgroundColor: const Color(0xFF21170D),
                                  side: const BorderSide(
                                    color: Color(0x88E7A62C),
                                  ),
                                ),
                                onPressed: () =>
                                    _openProvider(context, provider),
                                icon: Icon(_iconFor(provider)),
                                label: Padding(
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 14,
                                  ),
                                  child: Text(provider.label),
                                ),
                              ),
                            ),
                          )
                          .toList(growable: false),
                    );
                  },
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: _gold,
                    side: const BorderSide(color: _gold),
                  ),
                  onPressed: () => _copy(context),
                  icon: const Icon(Icons.content_copy_rounded),
                  label: const Padding(
                    padding: EdgeInsets.symmetric(vertical: 14),
                    child: Text('COPY PROMPT'),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'No app AI backend is used. Provider buttons copy the prompt + card links, require confirmation that the copy succeeded, then open the selected AI. COPY PROMPT also shows a persistent confirmation dialog after copying. SHARE CARD IMAGE TO AI uses the browser/system share sheet so supported AI apps can receive the actual selected card image.',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: const Color(0xCCFFE8B4),
                    height: 1.35,
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
