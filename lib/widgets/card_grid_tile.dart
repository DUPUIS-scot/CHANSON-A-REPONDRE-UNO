import 'package:flutter/material.dart';
import '../models/card_image_model.dart';
import '../theme/app_theme.dart';
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
              fit: BoxFit.contain,
              errorBuilder: (_, _, _) => const Center(
                child: Icon(Icons.broken_image_outlined, size: 42),
              ),
            ),
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
                      card.category.toUpperCase(),
                      style: const TextStyle(
                        color: AppTheme.brightGold,
                        fontSize: 11,
                      ),
                    ),
                    Text(
                      card.title,
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
