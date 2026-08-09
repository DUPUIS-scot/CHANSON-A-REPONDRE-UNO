import 'package:flutter/material.dart';
import '../core/app_constants.dart';
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
      child: Column(
        children: [
          Expanded(
            child: Center(
              child: AspectRatio(
                aspectRatio: cardAspectRatio,
                child: StoredImage(
                  source: card.path,
                  fit: BoxFit.contain,
                  errorBuilder: (_, _, _) => const Center(
                    child: Icon(Icons.broken_image_outlined, size: 42),
                  ),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 4, 4, 4),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    card.category.toUpperCase(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppTheme.brightGold,
                      fontSize: 11,
                    ),
                  ),
                ),
                IconButton(
                  tooltip: card.isFavourite
                      ? 'Remove favourite'
                      : 'Add favourite',
                  onPressed: onFavourite,
                  icon: Icon(
                    card.isFavourite ? Icons.favorite : Icons.favorite_border,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}
