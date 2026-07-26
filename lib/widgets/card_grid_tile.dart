import 'package:flutter/material.dart';
import '../models/card_image_model.dart';
import 'category_badge.dart';
import 'stored_image.dart';

class CardGridTile extends StatelessWidget {
  const CardGridTile({
    required this.card,
    required this.onTap,
    required this.onFavourite,
    super.key,
  });
  final CardImageModel card;
  final VoidCallback onTap;
  final VoidCallback onFavourite;
  @override
  Widget build(BuildContext context) => Card(
    clipBehavior: Clip.antiAlias,
    child: InkWell(
      onTap: onTap,
      child: Stack(
        children: [
          Positioned.fill(
            child: StoredImage(
              source: card.path,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => const Center(
                child: Icon(Icons.broken_image_outlined, size: 42),
              ),
            ),
          ),
          Positioned(
            left: 8,
            top: 8,
            child: CategoryBadge(category: card.category),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: ColoredBox(
              color: const Color(0xD9000000),
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      card.displayTitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            right: 4,
            top: 4,
            child: IconButton.filledTonal(
              tooltip: card.isFavourite ? 'Remove favourite' : 'Add favourite',
              onPressed: onFavourite,
              icon: Icon(
                card.isFavourite ? Icons.favorite : Icons.favorite_border,
              ),
            ),
          ),
        ],
      ),
    ),
  );
}
