import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('3D jester page uses external image analysis with no app AI backend', () {
    final screen = File(
      'lib/screens/card_transcription_screen.dart',
    ).readAsStringSync();
    final sheet = File(
      'lib/widgets/transcription_ai_provider_sheet.dart',
    ).readAsStringSync();

    expect(screen, contains('TranscriptionJesterScene'));
    expect(screen, contains('showTranscriptionAiProviderSheet'));
    expect(screen, contains('CardAiHandoffMode.transcribe'));
    expect(screen, contains('CardAiHandoffMode.diy'));
    expect(screen, contains("title: 'TRANSCRIBE CARD'"));
    expect(screen, contains("title: 'DISCUSS WITH AI'"));
    expect(screen, contains('publicImageUrlFor'));
    expect(screen, contains('No app AI backend is used.'));
    expect(screen, isNot(contains('CardAiProvider')));
    expect(screen, isNot(contains('requireRealAuthentication')));
    expect(screen, isNot(contains('.transcribe(')));

    expect(sheet, contains('required CardAiHandoffMode mode'));
    expect(sheet, contains('ExternalAiProvider.values'));
    expect(sheet, contains("Text('COPY PROMPT')"));
    expect(sheet, contains('direct public card-image URL'));
    expect(sheet, contains('No app AI backend is used.'));
    expect(sheet, isNot(contains('Transcribe the card before discussing it')));
    expect(sheet, isNot(contains('transcriptionOverride: transcription')));
  });

  test('Browse AI compatibility entry cannot trigger app transcription', () {
    final adapter = File(
      'lib/widgets/external_ai_handoff_sheet.dart',
    ).readAsStringSync();

    expect(adapter, contains('CardTranscriptionScreen(cardId: card.id)'));
    expect(adapter, isNot(contains('.transcribe(')));
    expect(adapter, isNot(contains('_showProviderChooser')));
  });

  test('dedicated transcription route is restored in app router', () {
    final router = File('lib/core/app_router.dart').readAsStringSync();

    expect(
      router,
      contains(
        "static String transcription(String id) => '\$cards/\$id/transcription';",
      ),
    );
    expect(router, contains("path: ':cardId/transcription'"));
    expect(router, contains('CardTranscriptionScreen('));
    expect(router, isNot(contains('never navigate to the retired in-app')));
  });
}
