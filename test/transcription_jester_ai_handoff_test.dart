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

  test('Browse AI compatibility entry cannot trigger a second transcription', () {
    final adapter = File(
      'lib/widgets/external_ai_handoff_sheet.dart',
    ).readAsStringSync();

    expect(adapter, contains('CardTranscriptionScreen(cardId: card.id)'));
    expect(adapter, isNot(contains('.transcribe(')));
    expect(adapter, isNot(contains('_showProviderChooser')));
    expect(adapter, isNot(contains("title: 'DIY WITH AI'")));
  });

  test('dedicated transcription route is restored in app router', () {
    final router = File('lib/core/app_router.dart').readAsStringSync();

    expect(router, contains("static String transcription(String id) => '\$cards/\$id/transcription';"));
    expect(router, contains("path: ':cardId/transcription'"));
    expect(router, contains('CardTranscriptionScreen('));
    expect(router, isNot(contains('never navigate to the retired in-app')));
  });
}
