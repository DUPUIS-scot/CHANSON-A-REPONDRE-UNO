import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/card_image_model.dart';
import '../models/deck_model.dart';
import '../providers/card_ai_provider.dart';
import '../providers/deck_provider.dart';
import '../services/card_ai_service.dart';
import '../services/external_ai_handoff_service.dart';
import 'home_navigation_button.dart';
import 'transcription_jester_scene.dart';

const _gold = Color(0xFFE7A62C);
const _brightGold = Color(0xFFFFD980);
const _cream = Color(0xFFFFE8B4);
const _ink = Color(0xFF090604);

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
      pageBuilder: (_, _, _) => _ExternalAiJesterScreen(
        card: card,
        deck: deck,
        initialMode: mode,
        service: service,
      ),
      transitionsBuilder: (_, animation, _, child) =>
          FadeTransition(opacity: animation, child: child),
    ),
  );
}

Future<void> _showProviderChooser({
  required BuildContext context,
  required CardImageModel card,
  required Deck deck,
  required CardAiHandoffMode mode,
  required ExternalAiHandoffService service,
}) async {
  var handoffCard = card;
  final existing = ExternalAiHandoffService.transcriptionFor(card);
  final shouldTranscribe =
      mode == CardAiHandoffMode.transcribe || existing.isEmpty;

  final cardAi = context.read<CardAiProvider?>();
  if (shouldTranscribe && cardAi != null) {
    final updated = await cardAi.transcribe(card.id, TranscriptionMode.exact);
    if (!context.mounted) return;
    final transcription = updated == null
        ? ''
        : ExternalAiHandoffService.transcriptionFor(updated);
    if (updated == null || transcription.isEmpty) {
      final detail = cardAi.error?.trim();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            detail == null || detail.isEmpty
                ? 'Sorry, transcription is not available for the moment. Cheers!'
                : detail,
          ),
        ),
      );
      return;
    }
    handoffCard = updated;
  }

  final prompt = ExternalAiHandoffService.buildPrompt(
    mode: mode,
    card: handoffCard,
    deck: deck,
  );
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    backgroundColor: const Color(0xF20A0806),
    builder: (_) => _ProviderSheet(
      card: handoffCard,
      mode: mode,
      prompt: prompt,
      service: service,
    ),
  );
}

class _ExternalAiJesterScreen extends StatefulWidget {
  const _ExternalAiJesterScreen({
    required this.card,
    required this.deck,
    required this.initialMode,
    required this.service,
  });

  final CardImageModel card;
  final Deck deck;
  final CardAiHandoffMode initialMode;
  final ExternalAiHandoffService service;

  @override
  State<_ExternalAiJesterScreen> createState() => _ExternalAiJesterScreenState();
}

class _ExternalAiJesterScreenState extends State<_ExternalAiJesterScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _syncSelectedCardToJester(widget.card);
    });
  }

  @override
  void didUpdateWidget(covariant _ExternalAiJesterScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.card.id != widget.card.id ||
        oldWidget.card.imagePath != widget.card.imagePath) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _syncSelectedCardToJester(widget.card);
      });
    }
  }

  void _syncSelectedCardToJester(CardImageModel card) {
    if (!mounted) return;
    final cardId = card.id;
    final imagePath = card.imagePath;
    final route = Uri(
      path: '/cards/$cardId/transcription',
      queryParameters: {'selectedCardImage': imagePath},
    ).toString();
    try {
      // The web jester resolves its selected card from the current URL. Keep
      // Browse routing unchanged while giving the 3D scene a stable card id.
      // This replacement is local to the full-screen handoff view and is
      // restored automatically when Navigator pops back to Browse.
      // ignore: avoid_dynamic_calls
      final history = Uri.base;
      // Use Router's URL indirectly by preserving the same app origin/hash.
      // On non-web platforms this block has no effect because the jester scene
      // is a stub.
      if (history.scheme == 'http' || history.scheme == 'https') {
        // no-op here; the scene gets the selected card through its JS bridge
        // below once mounted.
      }
    } on Object {
      // Best-effort web enhancement only.
    }
    TranscriptionJesterScene.setSelectedCard(
      cardId: cardId,
      imagePath: imagePath,
    );
  }

  @override
  Widget build(BuildContext context) {
    final refreshed =
        context.watch<DeckProvider>().cardById(widget.card.id) ?? widget.card;

    Future<void> handoff(CardAiHandoffMode mode) => _showProviderChooser(
          context: context,
          card: refreshed,
          deck: widget.deck,
          mode: mode,
          service: widget.service,
        );

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        fit: StackFit.expand,
        children: [
          const Positioned.fill(child: TranscriptionJesterScene()),
          const Positioned.fill(
            child: IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Color(0x00000000),
                      Color(0x08000000),
                      Color(0x32050201),
                      Color(0xD8050201),
                    ],
                    stops: [0, .58, .82, 1],
                  ),
                ),
              ),
            ),
          ),
          SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
                  child: Row(
                    children: [
                      Material(
                        color: const Color(0xB0090604),
                        shape: const CircleBorder(
                          side: BorderSide(color: _gold, width: 1.4),
                        ),
                        child: IconButton(
                          tooltip: 'Back',
                          onPressed: () => Navigator.of(context).pop(),
                          color: _brightGold,
                          icon: const Icon(Icons.arrow_back_rounded),
                        ),
                      ),
                      const Spacer(),
                      const HomeNavigationButton(),
                    ],
                  ),
                ),
                const Spacer(),
                SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 920),
                      child: LayoutBuilder(
                        builder: (context, constraints) {
                          final compact = constraints.maxWidth < 760;
                          if (compact) {
                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                _TranscribeButton(
                                  emphasized: widget.initialMode ==
                                      CardAiHandoffMode.transcribe,
                                  onPressed: () =>
                                      handoff(CardAiHandoffMode.transcribe),
                                ),
                                const SizedBox(height: 12),
                                _DiyButton(
                                  emphasized: widget.initialMode ==
                                      CardAiHandoffMode.diy,
                                  onPressed: () =>
                                      handoff(CardAiHandoffMode.diy),
                                ),
                              ],
                            );
                          }
                          return Row(
                            children: [
                              Expanded(
                                child: _TranscribeButton(
                                  emphasized: widget.initialMode ==
                                      CardAiHandoffMode.transcribe,
                                  onPressed: () =>
                                      handoff(CardAiHandoffMode.transcribe),
                                ),
                              ),
                              const SizedBox(width: 18),
                              Expanded(
                                child: _DiyButton(
                                  emphasized: widget.initialMode ==
                                      CardAiHandoffMode.diy,
                                  onPressed: () =>
                                      handoff(CardAiHandoffMode.diy),
                                ),
                              ),
                            ],
                          );
                        },
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TranscribeButton extends StatelessWidget {
  const _TranscribeButton({required this.emphasized, required this.onPressed});

  final bool emphasized;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) => FilledButton(
        style: FilledButton.styleFrom(
          backgroundColor: _gold,
          foregroundColor: _ink,
          minimumSize: const Size.fromHeight(82),
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          side: BorderSide(
            color: emphasized ? _brightGold : _gold,
            width: emphasized ? 2.2 : 1.2,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
        ),
        onPressed: onPressed,
        child: const _ActionLabel(
          icon: Icons.document_scanner_rounded,
          title: 'TRANSCRIBE CARD',
          subtitle: 'Extract the card text, then choose your AI',
        ),
      );
}

class _DiyButton extends StatelessWidget {
  const _DiyButton({required this.emphasized, required this.onPressed});

  final bool emphasized;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) => OutlinedButton(
        style: OutlinedButton.styleFrom(
          foregroundColor: _gold,
          backgroundColor: const Color(0xE70A0806),
          minimumSize: const Size.fromHeight(82),
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          side: BorderSide(
            color: emphasized ? _brightGold : _gold,
            width: emphasized ? 2.2 : 1.3,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
        ),
        onPressed: onPressed,
        child: const _ActionLabel(
          icon: Icons.auto_awesome_rounded,
          title: 'DIY WITH AI',
          subtitle: 'Use the transcription with the AI of your choice',
        ),
      );
}

class _ActionLabel extends StatelessWidget {
  const _ActionLabel({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) => Row(
        children: [
          Icon(icon, size: 34),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.w900,
                    letterSpacing: .25,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w500,
                    height: 1.2,
                  ),
                ),
              ],
            ),
          ),
        ],
      );
}

class _ProviderSheet extends StatelessWidget {
  const _ProviderSheet({
    required this.card,
    required this.mode,
    required this.prompt,
    required this.service,
  });

  final CardImageModel card;
  final CardAiHandoffMode mode;
  final String prompt;
  final ExternalAiHandoffService service;

  String get _purpose => mode == CardAiHandoffMode.transcribe
      ? 'Transcribe this card with your AI'
      : 'DIY with your AI';

  IconData _iconFor(ExternalAiProvider provider) => switch (provider) {
        ExternalAiProvider.chatgpt => Icons.auto_awesome_rounded,
        ExternalAiProvider.gemini => Icons.diamond_outlined,
        ExternalAiProvider.claude => Icons.psychology_alt_outlined,
        ExternalAiProvider.copilot => Icons.assistant_outlined,
      };

  Future<void> _open(BuildContext context, ExternalAiProvider provider) async {
    try {
      await service.openProvider(provider: provider, prompt: prompt);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Transcription prompt copied. Paste it in ${provider.label} if it is not inserted automatically.',
          ),
        ),
      );
    } on Object {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Transcription prompt copied, but ${provider.label} could not be opened automatically.',
          ),
        ),
      );
    }
  }

  Future<void> _copy(BuildContext context) async {
    await service.copyPrompt(prompt);
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('AI prompt with transcription copied')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          8,
          20,
          20 + MediaQuery.viewInsetsOf(context).bottom,
        ),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 720),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                _purpose,
                textAlign: TextAlign.center,
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: _cream,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '${card.displayTitle} · The saved transcription, card metadata, and source link will be handed to the AI you choose.',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(color: _cream),
              ),
              const SizedBox(height: 18),
              LayoutBuilder(
                builder: (context, constraints) {
                  final itemWidth = constraints.maxWidth < 520
                      ? constraints.maxWidth
                      : (constraints.maxWidth - 12) / 2;
                  return Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: ExternalAiProvider.values
                        .map(
                          (provider) => SizedBox(
                            width: itemWidth,
                            child: FilledButton.tonalIcon(
                              onPressed: () => _open(context, provider),
                              icon: Icon(_iconFor(provider)),
                              label: Padding(
                                padding:
                                    const EdgeInsets.symmetric(vertical: 14),
                                child: Text(provider.label),
                              ),
                            ),
                          ),
                        )
                        .toList(growable: false),
                  );
                },
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () => _copy(context),
                icon: const Icon(Icons.content_copy_rounded),
                label: const Padding(
                  padding: EdgeInsets.symmetric(vertical: 14),
                  child: Text('COPY PROMPT'),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Nothing is sent to an external AI until you choose a provider. The prepared prompt is copied locally first.',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodySmall?.copyWith(color: _cream),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
