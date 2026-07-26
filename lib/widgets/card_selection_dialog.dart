import 'package:flutter/material.dart';

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
        .where((card) => card.displayTitle.toLowerCase().contains(query.toLowerCase()))
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
                labelText: 'Search cards by title',
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: GridView.builder(
                gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                  maxCrossAxisExtent: 150,
                  childAspectRatio: 0.62,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                ),
                itemCount: cards.length,
                itemBuilder: (context, index) {
                  final card = cards[index];
                  final checked = selected.contains(card.id);
                  return Card(
                    clipBehavior: Clip.antiAlias,
                    child: InkWell(
                      onTap: () => setState(
                        () => checked
                            ? selected.remove(card.id)
                            : selected.add(card.id),
                      ),
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          StoredImage(source: card.path, fit: BoxFit.contain),
                          Align(
                            alignment: Alignment.bottomCenter,
                            child: ColoredBox(
                              color: const Color(0xDD000000),
                              child: Padding(
                                padding: const EdgeInsets.all(8),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        card.displayTitle,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    Checkbox(
                                      value: checked,
                                      onChanged: (_) => setState(
                                        () => checked
                                            ? selected.remove(card.id)
                                            : selected.add(card.id),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
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
