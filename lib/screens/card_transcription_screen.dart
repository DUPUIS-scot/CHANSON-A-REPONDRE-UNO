import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/deck_provider.dart';
import '../services/external_ai_handoff_service.dart';
import '../widgets/home_navigation_button.dart';
import '../widgets/transcription_jester_scene.dart';

const _gold = Color(0xFFE7A62C);
const _brightGold = Color(0xFFFFD980);
const _ink = Color(0xFF090604);
const _transcriptionStageBackgroundAsset =
    'assets/images/play_stage_background_user.jpg';

class CardTranscriptionScreen extends StatefulWidget {
  const CardTranscriptionScreen({required this.cardId, super.key});
  final String cardId;

  @override
  State<CardTranscriptionScreen> createState() => _CardTranscriptionScreenState();
}

class _CardTranscriptionScreenState extends State<CardTranscriptionScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) TranscriptionJesterScene.setPuppetMode(true);
    });
  }

  @override
  void dispose() {
    TranscriptionJesterScene.setPuppetMode(false);
    super.dispose();
  }

  String _jesterTexturePath(String cardId, String imagePath) {
    final match = RegExp(r'^final-84-(\d{2})$').firstMatch(cardId);
    if (match == null) return imagePath;
    final number = int.tryParse(match.group(1) ?? '');
    if (number == null || number < 1 || number > 84) return imagePath;
    return 'share-previews/UNO-${number.toString().padLeft(3, '0')}.jpg';
  }

  ButtonStyle _primaryStyle() => FilledButton.styleFrom(
        backgroundColor: const Color(0xA6E7A62C),
        foregroundColor: _ink,
        disabledBackgroundColor: const Color(0x66352A1B),
        disabledForegroundColor: const Color(0x888F816A),
        minimumSize: const Size.fromHeight(78),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        side: const BorderSide(color: _brightGold, width: 1.4),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      );

  ButtonStyle _secondaryStyle() => OutlinedButton.styleFrom(
        foregroundColor: _gold,
        disabledForegroundColor: const Color(0x887F735F),
        backgroundColor: const Color(0x990A0806),
        minimumSize: const Size.fromHeight(78),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        side: const BorderSide(color: _gold, width: 1.4),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      );

  @override
  Widget build(BuildContext context) {
    final decks = context.watch<DeckProvider>();
    final card = decks.cardById(widget.cardId);
    final deck = decks.deckForCard(widget.cardId);
    if (card == null) {
      return const Scaffold(body: Center(child: Text('This card no longer exists.')));
    }

    final jesterTexturePath = _jesterTexturePath(card.id, card.imagePath);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      TranscriptionJesterScene.setSelectedCard(cardId: card.id, imagePath: jesterTexturePath);
      TranscriptionJesterScene.setPuppetMode(true);
    });

    final canHandoff = deck != null;

    Future<void> openAi(CardAiHandoffMode mode) async {
      if (deck == null) return;
      final service = const ExternalAiHandoffService();
      final prompt = ExternalAiHandoffService.buildPrompt(mode: mode, card: card, deck: deck);
      try {
        await service.copyPrompt(prompt);
        await service.openProviderWithoutCopy(provider: ExternalAiProvider.chatgpt);
      } on Object {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Card context copied. Open ChatGPT and paste it into the conversation.')),
        );
      }
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
        actions: const [Padding(padding: EdgeInsets.only(right: 12), child: HomeNavigationButton())],
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          Positioned.fill(
            child: Image.asset(
              _transcriptionStageBackgroundAsset,
              fit: BoxFit.cover,
              alignment: Alignment.center,
              filterQuality: FilterQuality.high,
              errorBuilder: (context, error, stackTrace) => const ColoredBox(color: Color(0xFF050302)),
            ),
          ),
          const Positioned.fill(child: TranscriptionJesterScene()),
          const Positioned.fill(
            child: IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Color(0x00000000), Color(0x00000000), Color(0x12000000), Color(0x5A000000)],
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
                    padding: EdgeInsets.fromLTRB(compact ? 18 : 36, 0, compact ? 18 : 36, compact ? 22 : 30),
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 920),
                      child: compact
                          ? Column(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                _TranscribeButton(style: _primaryStyle(), enabled: canHandoff, onPressed: () => openAi(CardAiHandoffMode.transcribe)),
                                const SizedBox(height: 12),
                                _DiscussButton(style: _secondaryStyle(), enabled: canHandoff, onPressed: () => openAi(CardAiHandoffMode.diy)),
                              ],
                            )
                          : Row(
                              children: [
                                Expanded(child: _TranscribeButton(style: _primaryStyle(), enabled: canHandoff, onPressed: () => openAi(CardAiHandoffMode.transcribe))),
                                const SizedBox(width: 18),
                                Expanded(child: _DiscussButton(style: _secondaryStyle(), enabled: canHandoff, onPressed: () => openAi(CardAiHandoffMode.diy))),
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
  const _TranscribeButton({required this.style, required this.enabled, required this.onPressed});
  final ButtonStyle style;
  final bool enabled;
  final VoidCallback onPressed;
  @override
  Widget build(BuildContext context) => FilledButton.icon(
        onPressed: enabled ? onPressed : null,
        style: style,
        icon: const Icon(Icons.mic_rounded, size: 28),
        label: const Text('TRANSCRIBE CARD', textAlign: TextAlign.center, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, letterSpacing: .6)),
      );
}

class _DiscussButton extends StatelessWidget {
  const _DiscussButton({required this.style, required this.enabled, required this.onPressed});
  final ButtonStyle style;
  final bool enabled;
  final VoidCallback onPressed;
  @override
  Widget build(BuildContext context) => OutlinedButton.icon(
        onPressed: enabled ? onPressed : null,
        style: style,
        icon: const Icon(Icons.forum_rounded, size: 28),
        label: const Text('DISCUSS WITH AI', textAlign: TextAlign.center, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, letterSpacing: .6)),
      );
}
