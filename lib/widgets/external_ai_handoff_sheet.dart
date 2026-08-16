import 'package:flutter/material.dart';

import '../models/card_image_model.dart';
import '../models/deck_model.dart';
import '../services/external_ai_handoff_service.dart';

Future<void> showExternalAiHandoffSheet({
  required BuildContext context,
  required CardImageModel card,
  required Deck deck,
  required CardAiHandoffMode mode,
  ExternalAiHandoffService service = const ExternalAiHandoffService(),
}) {
  final prompt = ExternalAiHandoffService.buildPrompt(
    mode: mode,
    card: card,
    deck: deck,
  );
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (sheetContext) => _ExternalAiHandoffSheet(
      card: card,
      mode: mode,
      prompt: prompt,
      service: service,
    ),
  );
}

class _ExternalAiHandoffSheet extends StatelessWidget {
  const _ExternalAiHandoffSheet({
    required this.card,
    required this.mode,
    required this.prompt,
    required this.service,
  });

  final CardImageModel card;
  final CardAiHandoffMode mode;
  final String prompt;
  final ExternalAiHandoffService service;

  String get _purpose => mode == CardAiHandoffMode.transcribe
      ? 'Transcribe this card with your AI'
      : 'DIY with your AI';

  IconData _iconFor(ExternalAiProvider provider) => switch (provider) {
    ExternalAiProvider.chatgpt => Icons.auto_awesome_rounded,
    ExternalAiProvider.gemini => Icons.diamond_outlined,
    ExternalAiProvider.claude => Icons.psychology_alt_outlined,
    ExternalAiProvider.copilot => Icons.assistant_outlined,
  };

  Future<void> _open(
    BuildContext context,
    ExternalAiProvider provider,
  ) async {
    try {
      await service.openProvider(provider: provider, prompt: prompt);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Prompt copied. Paste it in ${provider.label} if it is not inserted automatically.',
          ),
        ),
      );
    } on Object {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Prompt copied, but ${provider.label} could not be opened automatically.',
          ),
        ),
      );
    }
  }

  Future<void> _copy(BuildContext context) async {
    await service.copyPrompt(prompt);
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('AI prompt copied')),
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
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 720),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                _purpose,
                textAlign: TextAlign.center,
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '${card.displayTitle} · The card link and a prepared prompt will be handed to the AI you choose.',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium,
              ),
              const SizedBox(height: 18),
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
                              onPressed: () => _open(context, provider),
                              icon: Icon(_iconFor(provider)),
                              label: Padding(
                                padding: const EdgeInsets.symmetric(vertical: 14),
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
                onPressed: () => _copy(context),
                icon: const Icon(Icons.content_copy_rounded),
                label: const Padding(
                  padding: EdgeInsets.symmetric(vertical: 14),
                  child: Text('COPY PROMPT'),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Nothing is sent to an external AI until you choose a provider. The prompt is copied locally so you stay in control of the handoff.',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodySmall,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
