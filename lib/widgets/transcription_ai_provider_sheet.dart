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

  // The primary handoff is the real selected image file, not a remote image
  // URL. This works identically for UNO, BRIO, and any other deck because the
  // selected card's own imagePath is always the source of truth.
  await service.copyPrompt(prompt);
  final shareUrl = PublicCardShareService.shareUrlFor(
    cardId: card.id,
    deckId: deck.id,
  ).toString();
  final shareResult = await sharePublicCard(
    title: '${deck.name} — ${card.displayTitle}',
    text: prompt,
    url: shareUrl,
    imagePath: card.imagePath,
  );

  // When the browser/system share sheet accepted the file, the user can pick
  // ChatGPT, Gemini, Claude, Copilot, or another compatible AI target there.
  // Do not open a second provider URL afterwards: that would lose the file.
  if (shareResult == NativeShareResult.shared ||
      shareResult == NativeShareResult.cancelled) {
    return;
  }

  // Fallback only: browsers that cannot share files still get provider links
  // plus the copied card context, with an explicit manual-attachment warning.
  if (!context.mounted) return;
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
      ? '${card.displayTitle} · Your browser could not pass the selected card image as a file. Open an AI provider below and attach the card image manually.'
      : '${card.displayTitle} · Your browser could not pass the selected card image as a file. Open an AI provider below and attach the card image manually for visual discussion.';

  IconData _iconFor(ExternalAiProvider provider) => switch (provider) {
        ExternalAiProvider.chatgpt => Icons.auto_awesome_rounded,
        ExternalAiProvider.gemini => Icons.diamond_outlined,
        ExternalAiProvider.claude => Icons.psychology_alt_outlined,
        ExternalAiProvider.copilot => Icons.assistant_outlined,
      };

  Future<void> _openProvider(
    BuildContext context,
    ExternalAiProvider provider,
  ) async {
    try {
      await service.openProvider(provider: provider, prompt: prompt);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Card context copied. Paste it in ${provider.label} and attach the selected card image manually.',
          ),
        ),
      );
    } on Object {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Card context copied, but ${provider.label} could not be opened automatically.',
          ),
        ),
      );
    }
  }

  Future<void> _shareCardImage(BuildContext context) async {
    await service.copyPrompt(prompt);
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
        'Card image shared as a real file. Choose your AI app in the system share sheet; the card context is also copied.',
      NativeShareResult.unavailable =>
        'Image-file sharing is unavailable in this browser. Attach the selected card image manually in the AI provider.',
      NativeShareResult.failed =>
        'The selected card image file could not be shared. Attach it manually in the AI provider.',
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
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('AI card context copied')),
    );
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
                    child: Text('TRY SHARING CARD IMAGE AGAIN'),
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
                                  child: Text('OPEN ${provider.label} WITHOUT IMAGE'),
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
                  'No app AI backend is used. The primary Transcribe/Discuss action shares the actual selected card file first. Provider links appear only as a fallback when this browser cannot hand off image files.',
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
