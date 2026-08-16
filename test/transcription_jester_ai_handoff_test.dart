import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('3D jester page uses external AI without claiming URL image access', () {
    final screen = File(
      'lib/screens/card_transcription_screen.dart',
    ).readAsStringSync();
    final sheet = File(
      'lib/widgets/transcription_ai_provider_sheet.dart',
    ).readAsStringSync();
    final service = File(
      'lib/services/external_ai_handoff_service.dart',
    ).readAsStringSync();

    expect(screen, contains('TranscriptionJesterScene'));
    expect(screen, contains('showTranscriptionAiProviderSheet'));
    expect(screen, contains('CardAiHandoffMode.transcribe'));
    expect(screen, contains('CardAiHandoffMode.diy'));
    expect(screen, contains("'TRANSCRIBE CARD'"));
    expect(screen, contains("'DISCUSS WITH AI'"));
    expect(screen, isNot(contains('CardAiProvider')));
    expect(screen, isNot(contains('requireRealAuthentication')));
    expect(screen, isNot(contains('.transcribe(')));

    expect(sheet, contains('required CardAiHandoffMode mode'));
    expect(sheet, contains('ExternalAiHandoffService.buildPrompt'));
    expect(sheet, contains('ExternalAiProvider.values'));
    expect(sheet, contains("Text('COPY PROMPT')"));
    expect(sheet, contains('selected card image'));
    expect(sheet, contains('No app AI backend is used.'));
    expect(sheet, isNot(contains('receives the direct public card-image URL')));

    expect(service, contains('publicImageUrlFor'));
    expect(service, contains('previewImageUrlFor'));
    expect(service, contains('PublicCardShareService.shareUrlFor'));
    expect(service, contains("'LIGHTWEIGHT CARD PREVIEW:'"));
    expect(service, contains("'ORIGINAL FULL-RESOLUTION CARD IMAGE:'"));
    expect(service, contains("'CARD TEXT PROVIDED BY THE APP:'"));
    expect(service, contains('actual image attachment'));
    expect(service, contains('card.question'));
    expect(service, contains('card.answer'));
    expect(service, isNot(contains('Open and analyze the CARD IMAGE directly')));
  });

  test('AI preview URL is canonical-slug based and deck agnostic', () {
    final service = File(
      'lib/services/external_ai_handoff_service.dart',
    ).readAsStringSync();

    expect(service, contains("'assets', 'share-previews', '\$slug.jpg'"));
    expect(service, contains('cardId: card.id'));
    expect(service, contains('deckId: deck.id'));
    expect(service, isNot(contains('UNO-')));
    expect(service, isNot(contains('BRIO-')));
  });

  test('transcription AI provider flow is deck agnostic for UNO and BRIO', () {
    final sheet = File(
      'lib/widgets/transcription_ai_provider_sheet.dart',
    ).readAsStringSync();
    final screen = File(
      'lib/screens/card_transcription_screen.dart',
    ).readAsStringSync();

    expect(screen, contains('deckForCard(cardId)'));
    expect(sheet, contains('card: card'));
    expect(sheet, contains('deck: deck'));
    expect(sheet, contains('imagePath: card.imagePath'));
    expect(sheet, contains('PublicCardShareService.shareUrlFor'));
    expect(sheet, isNot(contains('AppConstants.productionDeckId')));
    expect(sheet, isNot(contains('AppConstants.brioDeckId')));
    expect(sheet, isNot(contains("deck.id == '")));
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
