import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/app_router.dart';
import '../providers/deck_provider.dart';
import '../providers/card_ai_provider.dart';
import '../widgets/stored_image.dart';
import '../widgets/home_navigation_button.dart';

class CardFullscreenScreen extends StatefulWidget {
  const CardFullscreenScreen({required this.cardId, super.key});
  final String cardId;
  @override
  State<CardFullscreenScreen> createState() => _CardFullscreenScreenState();
}

class _CardFullscreenScreenState extends State<CardFullscreenScreen> {
  late final PageController controller;
  int currentIndex = 0;

  @override
  void initState() {
    super.initState();
    final cards = context.read<DeckProvider>().cards;
    currentIndex = cards.indexWhere((card) => card.id == widget.cardId);
    if (currentIndex < 0) currentIndex = 0;
    controller = PageController(initialPage: currentIndex);
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cards = context.watch<DeckProvider>().cards;
    final ai = context.watch<CardAiProvider>();
    if (cards.isEmpty) {
      return const Scaffold(body: Center(child: Text('Card not found.')));
    }
    if (currentIndex >= cards.length) currentIndex = cards.length - 1;
    final card = cards[currentIndex];
    final status = card.transcriptionReviewed
        ? 'Reviewed'
        : card.transcription != null || card.cleanedTranscription != null
        ? 'Transcribed'
        : 'Not transcribed';
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: Text(card.displayTitle),
        backgroundColor: Colors.black,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Chip(label: Text(status)),
          ),
          const Padding(
            padding: EdgeInsets.only(right: 8),
            child: HomeNavigationButton(),
          ),
        ],
      ),
      body: PageView.builder(
        controller: controller,
        itemCount: cards.length,
        onPageChanged: (index) => setState(() => currentIndex = index),
        itemBuilder: (_, index) => InteractiveViewer(
          minScale: .75,
          maxScale: 5,
          child: Center(
            child: StoredImage(
              source: cards[index].path,
              fit: BoxFit.contain,
              errorBuilder: (_, _, _) =>
                  const Icon(Icons.broken_image, size: 80),
            ),
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: ColoredBox(
          color: Colors.black,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Wrap(
              alignment: WrapAlignment.center,
              spacing: 8,
              runSpacing: 8,
              children: [
                FilledButton.icon(
                  onPressed: ai.isConfigured
                      ? () => context.go(AppRoutes.transcription(card.id))
                      : null,
                  icon: const Icon(Icons.document_scanner),
                  label: Text(
                    card.transcription == null
                        ? 'Transcribe Card'
                        : 'View Transcription',
                  ),
                ),
                FilledButton.tonalIcon(
                  onPressed:
                      ai.isConfigured &&
                          (card.transcription != null ||
                              card.cleanedTranscription != null)
                      ? () => context.go(AppRoutes.cardChat(card.id))
                      : null,
                  icon: const Icon(Icons.forum),
                  label: const Text('Discuss This Card'),
                ),
                if (card.transcription != null ||
                    card.cleanedTranscription != null) ...[
                  OutlinedButton.icon(
                    onPressed: () async {
                      final yes =
                          await showDialog<bool>(
                            context: context,
                            builder: (dialogContext) => AlertDialog(
                              title: const Text('Retranscribe card?'),
                              content: const Text(
                                'The saved transcription is preserved unless the new request succeeds.',
                              ),
                              actions: [
                                TextButton(
                                  onPressed: () =>
                                      Navigator.pop(dialogContext, false),
                                  child: const Text('Cancel'),
                                ),
                                FilledButton(
                                  onPressed: () =>
                                      Navigator.pop(dialogContext, true),
                                  child: const Text('Retranscribe'),
                                ),
                              ],
                            ),
                          ) ??
                          false;
                      if (yes && context.mounted) {
                        context.go(AppRoutes.transcription(card.id));
                      }
                    },
                    icon: const Icon(Icons.refresh_rounded),
                    label: const Text('Retranscribe'),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => Clipboard.setData(
                      ClipboardData(
                        text:
                            card.cleanedTranscription ??
                            card.transcription ??
                            '',
                      ),
                    ),
                    icon: const Icon(Icons.copy_rounded),
                    label: const Text('Copy Transcription'),
                  ),
                  OutlinedButton.icon(
                    onPressed: () async {
                      final yes =
                          await showDialog<bool>(
                            context: context,
                            builder: (dialogContext) => AlertDialog(
                              title: const Text('Delete AI data?'),
                              content: const Text(
                                'This removes the transcription and chat history, but keeps the PNG card.',
                              ),
                              actions: [
                                TextButton(
                                  onPressed: () =>
                                      Navigator.pop(dialogContext, false),
                                  child: const Text('Cancel'),
                                ),
                                FilledButton(
                                  onPressed: () =>
                                      Navigator.pop(dialogContext, true),
                                  child: const Text('Delete'),
                                ),
                              ],
                            ),
                          ) ??
                          false;
                      if (yes && context.mounted) {
                        await context.read<CardAiProvider>().deleteAiData(
                          card.id,
                        );
                      }
                    },
                    icon: const Icon(Icons.delete_outline),
                    label: const Text('Delete AI Data'),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
