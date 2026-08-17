import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/card_image_model.dart';
import '../models/deck_model.dart';
import 'card_share_identity.dart';
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

  static Uri previewImageUrlFor({
    required CardImageModel card,
    required Deck deck,
    Uri? applicationUri,
  }) {
    final source = applicationUri ?? Uri.base;
    final base = Uri(
      scheme: source.scheme,
      userInfo: source.userInfo,
      host: source.host,
      port: source.hasPort ? source.port : null,
      path: source.path,
    );
    final root = base.pathSegments.where((segment) => segment.isNotEmpty);
    final slug = CardShareIdentity.canonicalSlugFor(
      cardId: card.id,
      deckId: deck.id,
    );
    return base.replace(
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
    final previewImageUrl = previewImageUrlFor(
      card: card,
      deck: deck,
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
      'CARD:',
      '$shareUrl',
      '',
      'CARD IMAGE:',
      '$previewImageUrl',
      '',
      'Read the CARD IMAGE directly. Do not rely on Open Graph or Twitter metadata as the visual source.',
      'If your environment cannot access the CARD IMAGE URL, say so instead of pretending to have viewed it.',
      '',
    ];

    if (mode == CardAiHandoffMode.transcribe) {
      if (existingTranscription.isNotEmpty) {
        return <String>[
          ...metadata,
          'CARD TEXT PROVIDED BY THE APP:',
          existingTranscription,
          '',
          'Return a faithful transcription of the supplied card text and compare it with the CARD IMAGE when accessible.',
          'Preserve the original language, accents, spelling, punctuation, capitalization, headings, lists, and meaningful line breaks.',
          'Do not summarize, rewrite, translate, or invent missing text.',
        ].join('\n');
      }

      return <String>[
        ...metadata,
        'No extracted card text is available in the app for this card.',
        'Transcribe the CARD IMAGE directly if your environment can access it.',
        'Do not infer the card text from the canonical page or its metadata.',
      ].join('\n');
    }

    if (existingTranscription.isNotEmpty) {
      return <String>[
        ...metadata,
        'CARD TEXT PROVIDED BY THE APP:',
        existingTranscription,
        '',
        'Discuss this card using the supplied card text as the primary textual source and the CARD IMAGE as the visual source when accessible.',
        'You may interpret, translate, fact-check, research, critique, or brainstorm from the supplied text and accessible card image.',
      ].join('\n');
    }

    return <String>[
      ...metadata,
      'No extracted card text is available in the app for this card.',
      'Discuss the card from the CARD IMAGE if your environment can access it.',
      'Do not infer visual details from the canonical page or its metadata when the CARD IMAGE itself is unavailable.',
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
