import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/card_image_model.dart';
import '../models/deck_model.dart';
import 'public_card_share_service.dart';

typedef ExternalAiUrlLauncher =
    Future<bool> Function(Uri uri, {required LaunchMode mode});
typedef ExternalAiPromptCopier = Future<void> Function(String value);

enum CardAiHandoffMode { transcribe, diy }

enum ExternalAiProvider { chatgpt, gemini, claude, copilot }

extension ExternalAiProviderDetails on ExternalAiProvider {
  String get label => switch (this) {
    ExternalAiProvider.chatgpt => 'ChatGPT',
    ExternalAiProvider.gemini => 'Gemini',
    ExternalAiProvider.claude => 'Claude',
    ExternalAiProvider.copilot => 'Copilot',
  };

  Uri get uri => switch (this) {
    ExternalAiProvider.chatgpt => Uri.parse('https://chatgpt.com/'),
    ExternalAiProvider.gemini => Uri.parse('https://gemini.google.com/app'),
    ExternalAiProvider.claude => Uri.parse('https://claude.ai/new'),
    ExternalAiProvider.copilot => Uri.parse('https://copilot.microsoft.com/'),
  };
}

class ExternalAiHandoffService {
  const ExternalAiHandoffService({
    ExternalAiUrlLauncher? launcher,
    ExternalAiPromptCopier? promptCopier,
  }) : _launcher = launcher ?? launchUrl,
       _promptCopier = promptCopier ?? _copyPrompt;

  final ExternalAiUrlLauncher _launcher;
  final ExternalAiPromptCopier _promptCopier;

  static String buildPrompt({
    required CardAiHandoffMode mode,
    required CardImageModel card,
    required Deck deck,
    Uri? applicationUri,
  }) {
    final shareUrl = PublicCardShareService.shareUrlFor(
      cardId: card.id,
      deckId: deck.id,
      applicationUri: applicationUri,
    );
    final heading = <String>[
      'Chanson à Répondre',
      'Deck: ${deck.name}',
      'Card: ${card.displayTitle} (${card.id})',
      'Public card link: $shareUrl',
      '',
    ];

    if (mode == CardAiHandoffMode.transcribe) {
      return <String>[
        ...heading,
        'Open the public card link and transcribe all visible text on the card accurately.',
        'Preserve the original language, accents, punctuation, capitalization, headings, and meaningful line breaks.',
        'Do not summarize, rewrite, translate, or invent missing text. If a word cannot be read confidently, mark it as [unclear].',
      ].join('\n');
    }

    final transcription =
        (card.cleanedTranscription ?? card.transcription ?? '').trim();
    return <String>[
      ...heading,
      if (transcription.isNotEmpty) ...[
        'Existing transcription:',
        '---',
        transcription,
        '---',
        '',
      ] else ...[
        'There is no saved transcription yet. Inspect the public card link first if you can access it.',
        '',
      ],
      'Help me explore this card DIY using the public card link and any transcription above as context.',
      'Start by asking what I want to do with it (for example: discuss, interpret, translate, fact-check, research, critique, or brainstorm), then help with that task.',
    ].join('\n');
  }

  Future<void> copyPrompt(String prompt) => _promptCopier(prompt);

  Future<void> openProvider({
    required ExternalAiProvider provider,
    required String prompt,
  }) async {
    // Start both operations inside the original tap/click event so Web browsers
    // do not treat the external tab as an unsolicited popup after an await.
    final copyFuture = _promptCopier(prompt);
    final launchFuture = _launcher(
      provider.uri,
      mode: LaunchMode.externalApplication,
    );
    final launched = await launchFuture;
    await copyFuture;
    if (!launched) {
      throw StateError('Could not open ${provider.label}.');
    }
  }

  static Future<void> _copyPrompt(String value) =>
      Clipboard.setData(ClipboardData(text: value));
}
