import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

/// Displays a native stored file or a web-safe PNG data URL.
class StoredImage extends StatelessWidget {
  const StoredImage({
    required this.source,
    this.fit = BoxFit.cover,
    this.errorBuilder,
    super.key,
  });

  final String source;
  final BoxFit fit;
  final ImageErrorWidgetBuilder? errorBuilder;

  @override
  Widget build(BuildContext context) {
    if (source.startsWith('data:image/png;base64,')) {
      try {
        final encoded = source.substring(source.indexOf(',') + 1);
        return Image.memory(
          base64Decode(encoded),
          fit: fit,
          errorBuilder: errorBuilder,
        );
      } on FormatException {
        return _error(context, const FormatException('Invalid PNG data.'));
      }
    }
    if (source.startsWith('assets/')) {
      return Image.asset(source, fit: fit, errorBuilder: errorBuilder);
    }
    if (kIsWeb) {
      return _error(context, const FileSystemException('Missing web image.'));
    }
    return Image.file(File(source), fit: fit, errorBuilder: errorBuilder);
  }

  Widget _error(BuildContext context, Object error) {
    return errorBuilder?.call(context, error, StackTrace.current) ??
        const Center(child: Icon(Icons.broken_image_outlined));
  }
}
