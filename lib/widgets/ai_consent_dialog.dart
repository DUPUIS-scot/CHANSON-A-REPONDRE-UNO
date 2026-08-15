import 'package:flutter/material.dart';

enum AiConsentChoice { continueOnce, remember, cancel }

Future<AiConsentChoice> showAiConsentDialog(BuildContext context) async =>
    await showDialog<AiConsentChoice>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Send card to AI?'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'This card image and its extracted text will be sent to an AI service for processing.',
            ),
            SizedBox(height: 12),
            Text(
              'USE AI RESPONSIBLY',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 6),
            Text(
              'AI responses may be incomplete, mistaken or inappropriate. Think critically, respect others, protect personal information, and never use the service to harm, threaten or deceive. Human judgment comes first.',
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, AiConsentChoice.cancel),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, AiConsentChoice.remember),
            child: const Text('Do not show again'),
          ),
          FilledButton(
            onPressed: () =>
                Navigator.pop(context, AiConsentChoice.continueOnce),
            child: const Text('Continue'),
          ),
        ],
      ),
    ) ??
    AiConsentChoice.cancel;
