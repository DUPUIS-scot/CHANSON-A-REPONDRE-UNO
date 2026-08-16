import 'package:flutter_test/flutter_test.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:uno_chanson_2/models/card_image_model.dart';
import 'package:uno_chanson_2/models/deck_model.dart';
import 'package:uno_chanson_2/services/external_ai_handoff_service.dart';

void main() {
  const applicationUri = Uri(
    scheme: 'https',
    host: 'www.chanson-a-repondre-uno.scot',
    path: '/',
  );

  test('transcription handoff uses the canonical BRIO share URL', () {
    final prompt = ExternalAiHandoffService.buildPrompt(
      mode: CardAiHandoffMode.transcribe,
      card: _card(),
      deck: _deck(),
      applicationUri: applicationUri,
    );

    expect(
      prompt,
      contains('https://www.chanson-a-repondre-uno.scot/share/BRIO-013/'),
    );
    expect(prompt, contains('transcribe all visible text'));
    expect(prompt, contains('Do not summarize, rewrite, translate'));
  });

  test('DIY handoff includes an existing transcription when available', () {
    final prompt = ExternalAiHandoffService.buildPrompt(
      mode: CardAiHandoffMode.diy,
      card: _card(transcription: 'LE KRAKEN\nLe Kraken rêve.'),
      deck: _deck(),
      applicationUri: applicationUri,
    );

    expect(prompt, contains('Existing transcription:'));
    expect(prompt, contains('LE KRAKEN\nLe Kraken rêve.'));
    expect(prompt, contains('Help me explore this card DIY'));
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
