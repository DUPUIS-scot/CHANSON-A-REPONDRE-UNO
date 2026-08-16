import 'package:flutter_test/flutter_test.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:uno_chanson_2/core/app_router.dart';
import 'package:uno_chanson_2/models/card_image_model.dart';
import 'package:uno_chanson_2/models/deck_model.dart';
import 'package:uno_chanson_2/services/external_ai_handoff_service.dart';

void main() {
  final applicationUri = Uri(
    scheme: 'https',
    host: 'www.chanson-a-repondre-uno.scot',
    path: '/',
  );

  test('transcription handoff includes stored text and canonical BRIO URL', () {
    final prompt = ExternalAiHandoffService.buildPrompt(
      mode: CardAiHandoffMode.transcribe,
      card: _card(transcription: 'LE KRAKEN\nLe Kraken rêve.'),
      deck: _deck(),
      applicationUri: applicationUri,
    );

    expect(
      prompt,
      contains('https://www.chanson-a-repondre-uno.scot/share/BRIO-013/'),
    );
    expect(prompt, contains('CARD TRANSCRIPTION:'));
    expect(prompt, contains('LE KRAKEN\nLe Kraken rêve.'));
    expect(prompt, contains('Do not summarize, rewrite, translate'));
  });

  test('DIY handoff includes transcription as primary source', () {
    final prompt = ExternalAiHandoffService.buildPrompt(
      mode: CardAiHandoffMode.diy,
      card: _card(transcription: 'LE KRAKEN\nLe Kraken rêve.'),
      deck: _deck(),
      applicationUri: applicationUri,
    );

    expect(prompt, contains('CARD TRANSCRIPTION:'));
    expect(prompt, contains('LE KRAKEN\nLe Kraken rêve.'));
    expect(
      prompt,
      contains('using the transcription above as the primary source'),
    );
    expect(prompt, contains('Do not ask me to paste or upload the card text again.'));
    expect(prompt, isNot(contains('Inspect the public card link first')));
  });

  test('DIY handoff never falls back to scraping when transcription is absent', () {
    final prompt = ExternalAiHandoffService.buildPrompt(
      mode: CardAiHandoffMode.diy,
      card: _card(),
      deck: _deck(),
      applicationUri: applicationUri,
    );

    expect(prompt, contains('[not available]'));
    expect(prompt, contains('do not depend on scraping the source webpage'));
    expect(prompt, isNot(contains('Inspect the public card link')));
  });

  test('explicit transcription override is preferred for the handoff', () {
    final prompt = ExternalAiHandoffService.buildPrompt(
      mode: CardAiHandoffMode.diy,
      card: _card(transcription: 'old text'),
      deck: _deck(),
      transcriptionOverride: 'fresh exact transcription',
      applicationUri: applicationUri,
    );

    expect(prompt, contains('fresh exact transcription'));
    expect(prompt, isNot(contains('old text')));
  });

  test('transcription navigation opens the dedicated transcription route', () {
    expect(
      AppRoutes.transcription('brio-013'),
      '/cards/brio-013/transcription',
    );
    expect(
      AppRoutes.transcription('final-84-01'),
      '/cards/final-84-01/transcription',
    );
  });

  test('provider handoff copies the prompt and opens the provider', () async {
    String? copied;
    Uri? launched;
    LaunchMode? launchMode;
    final service = ExternalAiHandoffService(
      promptCopier: (value) async => copied = value,
      launcher: (uri, {required mode}) async {
        launched = uri;
        launchMode = mode;
        return true;
      },
    );

    await service.openProvider(
      provider: ExternalAiProvider.chatgpt,
      prompt: 'prepared prompt',
    );

    expect(copied, 'prepared prompt');
    expect(launched, Uri.parse('https://chatgpt.com/'));
    expect(launchMode, LaunchMode.externalApplication);
  });

  test('all supported DIY providers have external entry URLs', () {
    expect(ExternalAiProvider.chatgpt.uri.host, 'chatgpt.com');
    expect(ExternalAiProvider.gemini.uri.host, 'gemini.google.com');
    expect(ExternalAiProvider.claude.uri.host, 'claude.ai');
    expect(ExternalAiProvider.copilot.uri.host, 'copilot.microsoft.com');
  });
}

CardImageModel _card({String? transcription}) => CardImageModel(
  id: 'brio-013',
  deckId: 'chanson-a-repondre-brio',
  title: 'Le Kraken',
  path: 'assets/decks/chanson_a_repondre_brio/cards/013.jpeg',
  category: 'CYBERPUNK',
  colour: 'green',
  importedAt: DateTime.fromMillisecondsSinceEpoch(0),
  transcription: transcription,
);

Deck _deck() => Deck(
  id: 'chanson-a-repondre-brio',
  name: 'Chanson à répondre BRIO',
  cards: [_card()],
);
