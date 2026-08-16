import 'package:flutter/material.dart';

class TranscriptionEditor extends StatelessWidget {
  const TranscriptionEditor({required this.controller, this.onChanged, super.key});

  final TextEditingController controller;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) => TextField(
    controller: controller,
    onChanged: onChanged,
    minLines: 10,
    maxLines: 24,
    cursorColor: const Color(0xFFFFD980),
    style: const TextStyle(
      color: Color(0xFFFFE8B4),
      fontSize: 16,
      height: 1.45,
    ),
    decoration: InputDecoration(
      labelText: 'Review transcription',
      alignLabelWithHint: true,
      labelStyle: const TextStyle(
        color: Color(0xFFFFD980),
        fontFamily: 'serif',
        fontSize: 19,
        fontWeight: FontWeight.w600,
      ),
      filled: true,
      fillColor: const Color(0xB90B0806),
      contentPadding: const EdgeInsets.all(18),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color(0xBFE7A62C), width: 1.1),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color(0xFFFFD980), width: 1.6),
      ),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
    ),
  );
}
