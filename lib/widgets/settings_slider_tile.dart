import 'package:flutter/material.dart';

class SettingsSliderTile extends StatelessWidget {
  const SettingsSliderTile({
    required this.title,
    required this.value,
    required this.min,
    required this.max,
    required this.onChanged,
    this.divisions,
    this.label,
    super.key,
  });
  final String title;
  final double value;
  final double min;
  final double max;
  final int? divisions;
  final String? label;
  final ValueChanged<double>? onChanged;
  @override
  Widget build(BuildContext context) => ListTile(
    title: Text(title),
    subtitle: Slider(
      value: value,
      min: min,
      max: max,
      divisions: divisions,
      label: label,
      onChanged: onChanged,
    ),
    trailing: Text(label ?? value.toStringAsFixed(1)),
  );
}
