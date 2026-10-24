import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class CurtainControlButton extends StatefulWidget {
  const CurtainControlButton({
    required this.isOpen,
    required this.onPressed,
    super.key,
  });
  final bool isOpen;
  final VoidCallback onPressed;
  @override
  State<CurtainControlButton> createState() => _CurtainControlButtonState();
}

class _CurtainControlButtonState extends State<CurtainControlButton> {
  bool focused = false;
  @override
  Widget build(BuildContext context) => Focus(
    onFocusChange: (value) => setState(() => focused = value),
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: const Color(0xDD090806),
        border: Border.all(
          color: focused ? AppTheme.brightGold : AppTheme.gold,
          width: focused ? 2 : 1,
        ),
        boxShadow: const [
          BoxShadow(color: Color(0x55FFC928), blurRadius: 10),
        ],
      ),
      child: IconButton(
        tooltip: widget.isOpen ? 'Close curtains' : 'Open curtains',
        onPressed: widget.onPressed,
        icon: const Icon(
          Icons.theater_comedy_rounded,
          color: AppTheme.brightGold,
        ),
      ),
    ),
  );
}
