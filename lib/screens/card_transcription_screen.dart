import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/deck_provider.dart';
import '../services/external_ai_handoff_service.dart';
import '../widgets/home_navigation_button.dart';
import '../widgets/transcription_ai_provider_sheet.dart';
import '../widgets/transcription_jester_scene.dart';

const _gold = Color(0xFFE7A62C);
const _brightGold = Color(0xFFFFD980);
const _ink = Color(0xFF090604);

class CardTranscriptionScreen extends StatelessWidget {
  const CardTranscriptionScreen({required this.cardId, super.key});
  final String cardId;

  ButtonStyle _primaryStyle() => FilledButton.styleFrom(
        backgroundColor: _gold,
        foregroundColor: _ink,
        disabledBackgroundColor: const Color(0x66352A1B),
        disabledForegroundColor: const Color(0x888F816A),
        minimumSize: const Size.fromHeight(78),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        side: const BorderSide(color: _brightGold, width: 1.4),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
      );

  ButtonStyle _secondaryStyle() => OutlinedButton.styleFrom(
        foregroundColor: _gold,
        disabledForegroundColor: const Color(0x887F735F),
        backgroundColor: const Color(0xE20A0806),
        minimumSize: const Size.fromHeight(78),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        side: const BorderSide(color: _gold, width: 1.4),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
      );

  @override
  Widget build(BuildContext context) {
    final decks = context.watch<DeckProvider>();
    final card = decks.cardById(cardId);
    final deck = decks.deckForCard(cardId);
    if (card == null) {
      return const Scaffold(
        body: Center(child: Text('This card no longer exists.')),
      );
    }

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!context.mounted) return;
      TranscriptionJesterScene.setSelectedCard(
        cardId: card.id,
        imagePath: card.imagePath,
      );
    });

    final canHandoff = deck != null;

    void openAi(CardAiHandoffMode mode) {
      if (deck == null) return;
      showTranscriptionAiProviderSheet(
        context: context,
        card: card,
        deck: deck,
        mode: mode,
      );
    }

    return Scaffold(
      backgroundColor: Colors.transparent,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        toolbarHeight: 82,
        elevation: 0,
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        foregroundColor: _brightGold,
        title: const SizedBox.shrink(),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 12),
            child: HomeNavigationButton(),
          ),
        ],
      ),
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
                      Color(0x00000000),
                      Color(0x16000000),
                      Color(0x82000000),
                    ],
                    stops: [0, .68, .86, 1],
                  ),
                ),
              ),
            ),
          ),
          SafeArea(
            child: LayoutBuilder(
              builder: (context, box) {
                final compact = box.maxWidth < 760;
                return Align(
                  alignment: Alignment.bottomCenter,
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(
                      compact ? 18 : 36,
                      0,
                      compact ? 18 : 36,
                      compact ? 22 : 30,
                    ),
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 920),
                      child: compact
                          ? Column(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                _TranscribeButton(
                                  style: _primaryStyle(),
                                  enabled: canHandoff,
                                  onPressed: () =>
                                      openAi(CardAiHandoffMode.transcribe),
                                ),
                                const SizedBox(height: 12),
                                _DiscussButton(
                                  style: _secondaryStyle(),
                                  enabled: canHandoff,
                                  onPressed: () =>
                                      openAi(CardAiHandoffMode.diy),
                                ),
                              ],
                            )
                          : Row(
                              children: [
                                Expanded(
                                  child: _TranscribeButton(
                                    style: _primaryStyle(),
                                    enabled: canHandoff,
                                    onPressed: () =>
                                        openAi(CardAiHandoffMode.transcribe),
                                  ),
                                ),
                                const SizedBox(width: 18),
                                Expanded(
                                  child: _DiscussButton(
                                    style: _secondaryStyle(),
                                    enabled: canHandoff,
                                    onPressed: () =>
                                        openAi(CardAiHandoffMode.diy),
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _TranscribeButton extends StatelessWidget {
  const _TranscribeButton({
    required this.style,
    required this.enabled,
    required this.onPressed,
  });
  final ButtonStyle style;
  final bool enabled;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) => FilledButton(
        style: style,
        onPressed: enabled ? onPressed : null,
        child: const _ActionLabel(
          icon: Icons.document_scanner_rounded,
          title: 'TRANSCRIBE CARD',
          subtitle: 'Choose an external AI to read the card image',
        ),
      );
}

class _DiscussButton extends StatelessWidget {
  const _DiscussButton({
    required this.style,
    required this.enabled,
    required this.onPressed,
  });
  final ButtonStyle style;
  final bool enabled;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) => OutlinedButton(
        style: style,
        onPressed: enabled ? onPressed : null,
        child: const _ActionLabel(
          icon: Icons.forum_rounded,
          title: 'DISCUSS WITH AI',
          subtitle: 'ChatGPT · Gemini · Claude · Copilot · Copy Prompt',
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
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    letterSpacing: .3,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 14,
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
