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
    ]) {
      final text = value?.trim() ?? '';
      if (text.isNotEmpty) return text;
    }
    return '';
  }

  static Uri publicImageUrlFor({
    required CardImageModel card,
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
    final imageSegments = card.imagePath
        .split('/')
        .where((segment) => segment.isNotEmpty);
    return base.replace(
      pathSegments: [...root, 'assets', ...imageSegments],
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
    final imageUrl = publicImageUrlFor(
      card: card,
      applicationUri: applicationUri,
    );
    final existingTranscription = transcriptionFor(
      card,
      transcriptionOverride: transcriptionOverride,
    );
    final heading = <String>[
      '${deck.name} — ${card.displayTitle}',
      'Card ID: ${card.id}',
      'SOURCE CARD:',
      '$shareUrl',
      'CARD IMAGE:',
      '$imageUrl',
      '',
    ];

    if (mode == CardAiHandoffMode.transcribe) {
      return <String>[
        ...heading,
        'Open and analyze the CARD IMAGE directly. The image is the primary source.',
        'Transcribe every readable word from the image.',
        'Preserve the original language, accents, spelling, punctuation, capitalization, headings, lists, and meaningful line breaks.',
        'Do not summarize, rewrite, translate, or invent missing text. Mark anything you cannot read confidently as [unclear].',
        'Do not depend on an app backend or on scraping the Flutter source page.',
        if (existingTranscription.isNotEmpty) ...[
          '',
          'OPTIONAL EXISTING TEXT FOR COMPARISON:',
          existingTranscription,
          'Use the image to correct this text rather than treating it as authoritative.',
        ],
      ].join('\n');
    }

    return <String>[
      ...heading,
      'Open and analyze the CARD IMAGE directly. Treat the image itself as the primary source.',
      'Discuss this card with me based on what you can read and see in the image.',
      'You can transcribe, interpret, translate, fact-check, research, critique, or brainstorm from the card.',
      'Do not depend on an app backend or on scraping the Flutter source page.',
      if (existingTranscription.isNotEmpty) ...[
        '',
        'OPTIONAL EXISTING TEXT FOR COMPARISON:',
        existingTranscription,
        'Verify it against the image before relying on it.',
      ],
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
