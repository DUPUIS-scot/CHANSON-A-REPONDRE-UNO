import 'package:flutter/material.dart';

import '../models/card_image_model.dart';
import '../models/deck_model.dart';
import '../screens/card_transcription_screen.dart';
import '../services/external_ai_handoff_service.dart';

/// Compatibility entry point used by Browse card actions.
///
/// Browse previously opened a second jester implementation that could silently
/// call the transcription backend from both TRANSCRIBE and DIY. Keep the public
/// entry point stable, but route every card AI action to the canonical
/// [CardTranscriptionScreen] instead. That screen owns the intended flow:
/// transcribe once, store/display the result, then enable external AI discussion
/// without another backend transcription request.
Future<void> showExternalAiHandoffSheet({
  required BuildContext context,
  required CardImageModel card,
  required Deck deck,
  required CardAiHandoffMode mode,
  ExternalAiHandoffService service = const ExternalAiHandoffService(),
}) async {
  await Navigator.of(context).push<void>(
    PageRouteBuilder<void>(
      opaque: true,
      transitionDuration: const Duration(milliseconds: 260),
      reverseTransitionDuration: const Duration(milliseconds: 220),
      pageBuilder: (_, _, _) => CardTranscriptionScreen(cardId: card.id),
      transitionsBuilder: (_, animation, _, child) =>
          FadeTransition(opacity: animation, child: child),
    ),
  );
}
