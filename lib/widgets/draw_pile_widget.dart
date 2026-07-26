import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class DrawPileWidget extends StatelessWidget {
  const DrawPileWidget({required this.count, required this.onDraw, super.key});
  final int count;
  final VoidCallback? onDraw;
  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    label: 'Draw pile, $count cards',
    child: InkWell(
      onTap: onDraw,
      borderRadius: BorderRadius.circular(8),
      child: SizedBox(
        width: 88,
        height: 132,
        child: Stack(
          children: [
            for (var offset = 6; offset >= 0; offset -= 3)
              Positioned(
                left: offset.toDouble(),
                top: offset.toDouble(),
                right: (6 - offset).toDouble(),
                bottom: (6 - offset).toDouble(),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.gold),
                    color: const Color(0xFF24140E),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Image.asset(
                    'assets/images/card_back.png',
                    fit: BoxFit.contain,
                    errorBuilder: (_, _, _) =>
                        const Icon(Icons.style, color: AppTheme.gold),
                  ),
                ),
              ),
            Positioned(
              bottom: 8,
              left: 0,
              right: 0,
              child: Text(
                '$count',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
