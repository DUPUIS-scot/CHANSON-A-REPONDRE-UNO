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

  static Uri publicImageUrlFor({
    required CardImageModel card,
    Uri? applicationUri,
  }) => PublicCardShareService.publicImageUrlFor(
    card: card,
    applicationUri: applicationUri,
  );

  static Uri previewImageUrlFor({
    required String cardId,
    required String deckId,
    Uri? applicationUri,
  }) {
    final shareUrl = PublicCardShareService.shareUrlFor(
      cardId: cardId,
      deckId: deckId,
      applicationUri: applicationUri,
    );
    final segments = shareUrl.pathSegments
        .where((segment) => segment.isNotEmpty)
        .toList(growable: false);
    final slug = segments.isEmpty ? cardId : segments.last;
    final root = segments.length >= 2
        ? segments.sublist(0, segments.length - 2)
        : const <String>[];
    return shareUrl.replace(
      pathSegments: [...root, 'assets', 'share-previews', '$slug.jpg'],
      query: null,
      fragment: null,
    );
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
    final previewUrl = previewImageUrlFor(
      cardId: card.id,
      deckId: deck.id,
      applicationUri: applicationUri,
    );
    final imageUrl = publicImageUrlFor(
      card: card,
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
      'REFERENCE LINK:',
      '$shareUrl',
      'LIGHTWEIGHT CARD PREVIEW:',
      '$previewUrl',
      'ORIGINAL FULL-RESOLUTION CARD IMAGE:',
      '$imageUrl',
      '',
      'If this prompt arrived with an actual image attachment, use the attachment as the primary visual source.',
      'The preview and original image URLs are reference fallbacks for environments that can fetch external images. Do not claim you viewed either URL unless your environment actually opened it.',
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
          'If the supplied text appears incomplete, say so instead of asking the user to upload the image merely because you cannot fetch the reference URLs.',
        ].join('\n');
      }

      return <String>[
        ...metadata,
        'No extracted card text is available in the app for this card.',
        'If an image attachment is present, transcribe that image directly.',
        'If there is no attachment and you cannot fetch the preview/original URLs, say that an actual image attachment is required for visual transcription.',
      ].join('\n');
    }

    if (existingTranscription.isNotEmpty) {
      return <String>[
        ...metadata,
        'CARD TEXT PROVIDED BY THE APP:',
        existingTranscription,
        '',
        'Discuss this card using the supplied card text as the primary source.',
        'You may interpret, translate, fact-check, research, critique, or brainstorm from this text.',
        'Use the links only as optional references; do not require opening them before discussing the card.',
      ].join('\n');
    }

    return <String>[
      ...metadata,
      'No extracted card text is available in the app for this card.',
      'If an image attachment is present, analyze that image directly.',
      'Otherwise, you may discuss the metadata above, but do not pretend to have viewed the preview or original image URL unless you actually fetched it.',
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
