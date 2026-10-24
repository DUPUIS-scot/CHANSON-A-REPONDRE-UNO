import 'package:flutter/material.dart';

class EvelBungeeView extends StatelessWidget {
  const EvelBungeeView({super.key});

  @override
  Widget build(BuildContext context) => const ColoredBox(
    color: Color(0xFF090604),
    child: Center(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Text(
          'EVEL BUNGEE is available in the web application.',
          textAlign: TextAlign.center,
        ),
      ),
    ),
  );
}
