import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../core/app_router.dart';
import '../models/card_image_model.dart';
import '../providers/deck_provider.dart';
import '../services/public_card_share_service.dart';
import '../theme/app_theme.dart';
import '../widgets/home_navigation_button.dart';
import '../widgets/stored_image.dart';

class BrowseSelectedCardScreen extends StatelessWidget {
  const BrowseSelectedCardScreen({required this.card, this.shareCard, super.key});
  final CardImageModel card;
  final Future<CardShareResult> Function(CardImageModel card)? shareCard;

  Future<void> _share(BuildContext context) async {
    final deck = context.read<DeckProvider>().deckForCard(card.id);
    if (shareCard == null && deck == null) return;
    final result = shareCard != null ? await shareCard!(card) : await PublicCardShareService.share(card: card, deck: deck!);
    if (!context.mounted) return;
    if (result == CardShareResult.copied) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Link copied')));
    if (result == CardShareResult.failed) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Unable to share this card')));
  }

  @override
  Widget build(BuildContext context) {
    final decks = context.watch<DeckProvider>();
    final deck = decks.deckForCard(card.id);
    final matches = deck?.cards.where((candidate) => candidate.id == card.id);
    final liveCard = matches != null && matches.isNotEmpty ? matches.first : card;
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Stack(children: [
          Positioned.fill(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(10, 58, 10, 12),
              child: Center(
                child: Hero(
                  tag: 'browse-hand-card-${liveCard.id}',
                  child: StoredImage(source: liveCard.imagePath, fit: BoxFit.contain),
                ),
              ),
            ),
          ),
          const Positioned(top: 4, right: 8, child: HomeNavigationButton()),
          Positioned(left: 12, right: 12, bottom: 16, child: Center(child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 620), child: Column(mainAxisSize: MainAxisSize.min, children: [
            _GlassRow(children: [Expanded(child: _Action(icon: Icons.fullscreen, label: 'Open Full Screen', onPressed: () => context.push(AppRoutes.cardAlias(liveCard.id)))), const SizedBox(width: 8), Expanded(child: _Action(icon: Icons.share_outlined, label: 'Share', onPressed: () => _share(context)))]),
            const SizedBox(height: 8),
            _GlassRow(children: [Expanded(child: _Action(icon: Icons.document_scanner, label: 'TRANSCRIBE CARD', onPressed: () => context.go(AppRoutes.transcription(liveCard.id)))), const SizedBox(width: 8), Expanded(child: _Action(icon: Icons.auto_awesome, label: 'DISCUSS WITH AI', onPressed: () => context.go(AppRoutes.transcription(liveCard.id))))]),
            const SizedBox(height: 8),
            IconButton(tooltip: liveCard.isFavourite ? 'Remove favourite' : 'Add favourite', onPressed: () => decks.toggleFavourite(liveCard.id), style: IconButton.styleFrom(backgroundColor: const Color(0x99000000), foregroundColor: AppTheme.brightGold, side: const BorderSide(color: AppTheme.gold)), icon: Icon(liveCard.isFavourite ? Icons.favorite : Icons.favorite_border)),
          ])))),
        ]),
      ),
    );
  }
}

class _GlassRow extends StatelessWidget {
  const _GlassRow({required this.children});
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => DecoratedBox(decoration: BoxDecoration(color: const Color(0xA8000000), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xAAFFC928))), child: Padding(padding: const EdgeInsets.all(6), child: Row(children: children)));
}

class _Action extends StatelessWidget {
  const _Action({required this.icon, required this.label, required this.onPressed});
  final IconData icon;
  final String label;
  final VoidCallback onPressed;
  @override
  Widget build(BuildContext context) => TextButton.icon(onPressed: onPressed, style: TextButton.styleFrom(foregroundColor: AppTheme.brightGold, backgroundColor: const Color(0x66000000), padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 13)), icon: Icon(icon, size: 20), label: FittedBox(fit: BoxFit.scaleDown, child: Text(label, maxLines: 1, style: const TextStyle(fontWeight: FontWeight.w700))));
}
