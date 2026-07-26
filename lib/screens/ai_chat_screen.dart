import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../providers/card_ai_provider.dart';
import '../providers/auth_controller.dart';
import '../core/app_router.dart';
import '../providers/deck_provider.dart';
import '../widgets/ai_consent_dialog.dart';
import '../widgets/card_chat_message_bubble.dart';
import '../widgets/discussion_mode_selector.dart';
import '../widgets/stored_image.dart';
import '../widgets/home_navigation_button.dart';
import '../services/protected_ai_guard.dart';

class AiChatScreen extends StatefulWidget {
  const AiChatScreen({this.cardId, super.key});
  final String? cardId;
  @override
  State<AiChatScreen> createState() => _AiChatScreenState();
}

class _AiChatScreenState extends State<AiChatScreen> {
  final input = TextEditingController();
  String? selectedCardId;
  bool transcriptionExpanded = true;
  static const prompts = [
    'What is the main idea of this card?',
    'Explain the symbols in this image.',
    'Discuss the tone of the text.',
    'Summarize this card.',
    'Translate this card.',
    'Ask me a reflective question about it.',
    'What historical context is relevant?',
    'Which parts are uncertain or difficult to read?',
  ];
  @override
  void initState() {
    super.initState();
    selectedCardId = widget.cardId;
  }

  @override
  void dispose() {
    input.dispose();
    super.dispose();
  }

  Future<bool> _consent() async {
    final ai = context.read<CardAiProvider>();
    if (await ai.hasConsent()) return true;
    if (!mounted) return false;
    final choice = await showAiConsentDialog(context);
    if (choice == AiConsentChoice.remember) await ai.rememberConsent();
    return choice != AiConsentChoice.cancel;
  }

  Future<void> _send([String? suggested]) async {
    final text = (suggested ?? input.text).trim();
    if (text.isEmpty || selectedCardId == null) {
      return;
    }
    if (!await requireRealAuthentication(context, featureName: 'AI Chat') ||
        !mounted ||
        !await _consent() ||
        !mounted) {
      return;
    }
    input.clear();
    await context.read<CardAiProvider>().send(selectedCardId!, text);
  }

  @override
  Widget build(BuildContext context) {
    final decks = context.watch<DeckProvider>();
    final ai = context.watch<CardAiProvider>();
    final auth = context.watch<AuthController>();
    selectedCardId ??= decks.cards
        .where((card) => card.transcriptionReviewed)
        .firstOrNull
        ?.id;
    final card = selectedCardId == null
        ? null
        : decks.cardById(selectedCardId!);
    final deck = card == null ? null : decks.deckForCard(card.id);
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Card Chat'),
        actions: [
          IconButton(
            tooltip: 'Clear chat',
            onPressed: card == null || card.chatHistory.isEmpty
                ? null
                : () async {
                    final yes =
                        await showDialog<bool>(
                          context: context,
                          builder: (context) => AlertDialog(
                            title: const Text('Clear this card conversation?'),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(context, false),
                                child: const Text('Cancel'),
                              ),
                              FilledButton(
                                onPressed: () => Navigator.pop(context, true),
                                child: const Text('Clear'),
                              ),
                            ],
                          ),
                        ) ??
                        false;
                    if (yes) ai.clearChat(card.id);
                  },
            icon: const Icon(Icons.delete_sweep),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: HomeNavigationButton(
              beforeNavigate: ai.cancelCurrentRequest,
            ),
          ),
        ],
      ),
      body: !auth.canUseProtectedAi
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.lock_outline, size: 48),
                    const SizedBox(height: 12),
                    Text(
                      'Real authentication required',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'This screen is available in development mode, but AI requests require a genuine Supabase account and session.',
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    FilledButton.icon(
                      onPressed: () => requireRealAuthentication(
                        context,
                        featureName: 'AI Chat',
                      ),
                      icon: const Icon(Icons.person_outline),
                      label: const Text('Open Profile'),
                    ),
                  ],
                ),
              ),
            )
          : !ai.isConfigured
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'No AI backend configured.',
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    FilledButton.icon(
                      onPressed: () => context.go(AppRoutes.settings),
                      icon: const Icon(Icons.settings_outlined),
                      label: const Text('Open Settings'),
                    ),
                  ],
                ),
              ),
            )
          : card == null
          ? Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: DropdownButtonFormField<String>(
                  decoration: const InputDecoration(
                    labelText: 'Choose a transcribed card',
                  ),
                  items: decks.cards
                      .where((card) => card.transcriptionReviewed)
                      .map(
                        (card) => DropdownMenuItem(
                          value: card.id,
                          child: Text(card.displayTitle),
                        ),
                      )
                      .toList(),
                  onChanged: (value) => setState(() => selectedCardId = value),
                ),
              ),
            )
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 72,
                        height: 96,
                        child: StoredImage(source: card.path),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              card.displayTitle,
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                            Text(deck?.name ?? 'Unknown deck'),
                            const SizedBox(height: 8),
                            DiscussionModeSelector(
                              value: ai.discussionMode,
                              onChanged: ai.setMode,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                ExpansionTile(
                  title: const Text('Saved transcription'),
                  initiallyExpanded: transcriptionExpanded,
                  onExpansionChanged: (value) => transcriptionExpanded = value,
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(12),
                      child: SelectableText(
                        card.cleanedTranscription ??
                            card.transcription ??
                            'No saved transcription.',
                      ),
                    ),
                  ],
                ),
                SizedBox(
                  height: 42,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    itemCount: prompts.length,
                    separatorBuilder: (_, _) => const SizedBox(width: 8),
                    itemBuilder: (_, index) => ActionChip(
                      label: Text(prompts[index]),
                      onPressed: ai.isLoading
                          ? null
                          : () => _send(prompts[index]),
                    ),
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: card.chatHistory.length,
                    itemBuilder: (_, index) =>
                        CardChatMessageBubble(message: card.chatHistory[index]),
                  ),
                ),
                if (ai.error != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Text(
                      ai.error!,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                      ),
                    ),
                  ),
                if (ai.isLoading) const LinearProgressIndicator(),
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: input,
                          onSubmitted: (_) => _send(),
                          decoration: const InputDecoration(
                            labelText: 'Ask about this card',
                          ),
                        ),
                      ),
                      IconButton.filled(
                        onPressed: ai.isLoading ? null : _send,
                        icon: const Icon(Icons.send),
                      ),
                      IconButton(
                        tooltip: 'Retry last message',
                        onPressed: ai.lastPrompt == null || ai.isLoading
                            ? null
                            : () => _send(ai.lastPrompt),
                        icon: const Icon(Icons.refresh),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
