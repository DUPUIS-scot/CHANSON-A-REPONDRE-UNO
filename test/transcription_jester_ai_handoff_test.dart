import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('3D jester transcription page hands saved text to external AI chooser', () {
    final screen = File(
      'lib/screens/card_transcription_screen.dart',
    ).readAsStringSync();
    final sheet = File(
      'lib/widgets/transcription_ai_provider_sheet.dart',
    ).readAsStringSync();

    expect(screen, contains('TranscriptionJesterScene'));
    expect(screen, contains('showTranscriptionAiProviderSheet'));
    expect(screen, contains("title: 'DISCUSS WITH AI'"));
    expect(screen, contains('enabled: canDiscuss'));
    expect(screen, isNot(contains('AppRoutes.cardChat(card.id)')));

    expect(sheet, contains('ExternalAiHandoffService.transcriptionFor(card)'));
    expect(sheet, contains('CardAiHandoffMode.diy'));
    expect(sheet, contains('transcriptionOverride: transcription'));
    expect(sheet, contains('ExternalAiProvider.values'));
    expect(sheet, contains("Text('COPY PROMPT')"));
    expect(
      sheet,
      contains('never needs to scrape the card page'),
    );
  });
}
