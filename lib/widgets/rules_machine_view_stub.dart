import 'package:flutter/material.dart';

class RulesMachineView extends StatelessWidget {
  const RulesMachineView({
    super.key,
    this.interactive = true,
    this.onSwipeUp,
    this.onSwipeDown,
  });

  final bool interactive;
  final VoidCallback? onSwipeUp;
  final VoidCallback? onSwipeDown;

  @override
  Widget build(BuildContext context) => const ColoredBox(
        color: Color(0xFF080706),
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Text(
              'The interactive Rules machine is available in the web application.',
              textAlign: TextAlign.center,
            ),
          ),
        ),
      );
}
