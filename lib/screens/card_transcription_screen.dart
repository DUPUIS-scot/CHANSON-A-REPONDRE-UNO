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

class CardTranscriptionScreen extends StatelessWidget {
  const CardTranscriptionScreen({required this.cardId, super.key});
  final String cardId;

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
    final card = decks.cardById(cardId);
    final deck = decks.deckForCard(cardId);
    if (card == null) {
      return const Scaffold(body: Center(child: Text('This card no longer exists.')));
    }

    final jesterTexturePath = _jesterTexturePath(card.id, card.imagePath);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!context.mounted) return;
      TranscriptionJesterScene.setSelectedCard(cardId: card.id, imagePath: jesterTexturePath);
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
        if (!context.mounted) return;
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
          const SafeArea(
            child: Align(
              alignment: Alignment.topLeft,
              child: Padding(padding: EdgeInsets.fromLTRB(12, 12, 96, 0), child: _JesterModeControl()),
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

class _JesterModeControl extends StatefulWidget {
  const _JesterModeControl();
  @override
  State<_JesterModeControl> createState() => _JesterModeControlState();
}

class _JesterModeControlState extends State<_JesterModeControl> {
  bool _enabled = false;
  void _toggle() {
    final next = !_enabled;
    setState(() => _enabled = next);
    TranscriptionJesterScene.setPuppetMode(next);
  }
  @override
  void dispose() {
    if (_enabled) TranscriptionJesterScene.setPuppetMode(false);
    super.dispose();
  }
  @override
  Widget build(BuildContext context) => DecoratedBox(
        decoration: BoxDecoration(color: const Color(0xB30A0806), border: Border.all(color: _gold.withValues(alpha: .72)), borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(mainAxisSize: MainAxisSize.min, children: [
              OutlinedButton.icon(
                onPressed: _toggle,
                style: OutlinedButton.styleFrom(foregroundColor: _enabled ? _ink : _brightGold, backgroundColor: _enabled ? _brightGold : const Color(0xCC090604), side: const BorderSide(color: _brightGold, width: 1.2), minimumSize: const Size(0, 44), padding: const EdgeInsets.symmetric(horizontal: 14)),
                icon: Icon(_enabled ? Icons.pan_tool_alt : Icons.accessibility_new_rounded, size: 20),
                label: Text(_enabled ? 'EXIT JESTER' : 'JESTER MODE', style: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: .5)),
              ),
              if (_enabled) ...[const SizedBox(width: 8), IconButton.outlined(onPressed: TranscriptionJesterScene.resetPuppetPose, tooltip: 'Reset jester pose', color: _brightGold, icon: const Icon(Icons.restart_alt_rounded))],
            ]),
            if (_enabled) ...[const SizedBox(height: 6), const Padding(padding: EdgeInsets.symmetric(horizontal: 4), child: Text('Drag head, arms or torso', style: TextStyle(color: _brightGold, fontSize: 12, fontWeight: FontWeight.w600)))],
          ]),
        ),
      );
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
