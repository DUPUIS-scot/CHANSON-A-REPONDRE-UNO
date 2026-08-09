import 'package:flutter/material.dart';

import '../core/app_constants.dart';
import '../models/card_image_model.dart';
import 'stored_image.dart';

class CardSelectionDialog extends StatefulWidget {
  const CardSelectionDialog({
    required this.cards,
    required this.initiallySelectedIds,
    super.key,
  });
  final List<CardImageModel> cards;
  final Set<String> initiallySelectedIds;

  @override
  State<CardSelectionDialog> createState() => _CardSelectionDialogState();
}

class _CardSelectionDialogState extends State<CardSelectionDialog> {
  late final selected = {...widget.initiallySelectedIds};
  String query = '';

  @override
  Widget build(BuildContext context) {
    final cards = widget.cards
        .where((card) => card.title.toLowerCase().contains(query.toLowerCase()))
        .toList();
    return AlertDialog(
      title: const Text('Link cards'),
      content: SizedBox(
        width: 720,
        height: 560,
        child: Column(
          children: [
            TextField(
              onChanged: (value) => setState(() => query = value),
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search),
                labelText: 'Search cards',
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: GridView.builder(
                gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                  maxCrossAxisExtent: 150,
                  childAspectRatio: cardAspectRatio,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                ),
                itemCount: cards.length,
                itemBuilder: (context, index) {
                  final card = cards[index];
                  final checked = selected.contains(card.id);
                  return Semantics(
                    button: true,
                    selected: checked,
                    label: '${card.category} card',
                    child: Card(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(
                          color: checked
                              ? Theme.of(context).colorScheme.primary
                              : Colors.transparent,
                          width: checked ? 4 : 0,
                        ),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: InkWell(
                        onTap: () => setState(
                          () => checked
                              ? selected.remove(card.id)
                              : selected.add(card.id),
                        ),
                        child: StoredImage(
                          source: card.path,
                          fit: BoxFit.contain,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () => Navigator.pop(context, selected.toList()),
          child: Text('Link ${selected.length} cards'),
        ),
      ],
    );
  }
}
