import 'package:flutter/material.dart';

class DjWhoAvatar extends StatelessWidget {
  const DjWhoAvatar({this.size = 36, super.key});

  static const assetPath = 'assets/images/dj_who.png';

  final double size;

  @override
  Widget build(BuildContext context) => Semantics(
    image: true,
    label: 'DJ WHO',
    child: ClipOval(
      child: SizedBox.square(
        dimension: size,
        child: Image.asset(
          assetPath,
          fit: BoxFit.cover,
          alignment: Alignment.center,
          errorBuilder: (_, _, _) => const ColoredBox(
            color: Color(0xFF17120D),
            child: Icon(Icons.person_rounded),
          ),
        ),
      ),
    ),
  );
}
