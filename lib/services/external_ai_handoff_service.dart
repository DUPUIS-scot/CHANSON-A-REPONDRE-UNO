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

  static String transcriptionFor(
    CardImageModel card, {
    String? transcriptionOverride,
  }) {
    for (final value in <String?>[
      transcriptionOverride,
      card.cleanedTranscription,
      card.transcription,
      card.question,
      card.answer,
    ]) {
      final text = value?.trim() ?? '';
      if (text.isNotEmpty) return text;
    }
    return '';
  }

  static String buildPrompt({
    required CardAiHandoffMode mode,
    required CardImageModel card,
    required Deck deck,
    String? transcriptionOverride,
    Uri? applicationUri,
  }) {
    final shareUrl = PublicCardShareService.shareUrlFor(
      cardId: card.id,
      deckId: deck.id,
      applicationUri: applicationUri,
    );
    final existingTranscription = transcriptionFor(
      card,
      transcriptionOverride: transcriptionOverride,
    );
    final metadata = <String>[
      '${deck.name} — ${card.displayTitle}',
      'Card ID: ${card.id}',
      if (card.category.trim().isNotEmpty) 'Category: ${card.category.trim()}',
      if (card.author.trim().isNotEmpty) 'Author: ${card.author.trim()}',
      if (card.theme.trim().isNotEmpty) 'Theme: ${card.theme.trim()}',
      '',
      'CARD LINK:',
      '$shareUrl',
      '',
      'Open this canonical card link and read the social preview image metadata (Open Graph/Twitter image) for the selected card.',
      'Use only that preview image metadata as the visual source unless an actual image attachment is also present.',
      'Do not claim you viewed the preview image unless your environment actually accessed the link metadata/image.',
      '',
    ];

    if (mode == CardAiHandoffMode.transcribe) {
      if (existingTranscription.isNotEmpty) {
        return <String>[
          ...metadata,
          'CARD TEXT PROVIDED BY THE APP:',
          existingTranscription,
          '',
          'Return a faithful transcription of the supplied card text.',
          'Preserve the original language, accents, spelling, punctuation, capitalization, headings, lists, and meaningful line breaks.',
          'Do not summarize, rewrite, translate, or invent missing text.',
          'If the supplied text appears incomplete, read the social preview image metadata from the card link and transcribe that preview image if your environment can access it.',
        ].join('\n');
      }

      return <String>[
        ...metadata,
        'No extracted card text is available in the app for this card.',
        'Read the social preview image metadata from the canonical card link and transcribe the preview image if your environment can access it.',
        'If you cannot access the social preview metadata/image, say so instead of pretending to have viewed it.',
      ].join('\n');
    }

    if (existingTranscription.isNotEmpty) {
      return <String>[
        ...metadata,
        'CARD TEXT PROVIDED BY THE APP:',
        existingTranscription,
        '',
        'Discuss this card using the supplied card text as the primary source.',
        'Also read the social preview image metadata from the card link and use that preview image only if your environment can access it.',
        'You may interpret, translate, fact-check, research, critique, or brainstorm from the supplied text and accessible preview image.',
      ].join('\n');
    }

    return <String>[
      ...metadata,
      'No extracted card text is available in the app for this card.',
      'Read the social preview image metadata from the canonical card link and discuss the card from that preview image if your environment can access it.',
      'If you cannot access the social preview metadata/image, say so instead of pretending to have viewed it.',
    ].join('\n');
  }

  Future<void> copyPrompt(String prompt) => _promptCopier(prompt);

  Future<void> openProvider({
    required ExternalAiProvider provider,
    required String prompt,
  }) async {
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
