import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('laboratory GLB exposes the two canonical video screen nodes', () {
    final bytes = File('assets/models/laboratory_interior.glb').readAsBytesSync();
    expect(bytes.length, greaterThan(20));

    final data = ByteData.sublistView(bytes);
    expect(data.getUint32(0, Endian.little), 0x46546c67); // glTF
    expect(data.getUint32(4, Endian.little), 2);

    final jsonLength = data.getUint32(12, Endian.little);
    final jsonType = data.getUint32(16, Endian.little);
    expect(jsonType, 0x4e4f534a); // JSON
    expect(20 + jsonLength, lessThanOrEqualTo(bytes.length));

    final jsonText = utf8
        .decode(bytes.sublist(20, 20 + jsonLength))
        .replaceAll('\u0000', '')
        .trim();
    final document = jsonDecode(jsonText) as Map<String, dynamic>;
    final nodes = (document['nodes'] as List<dynamic>? ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .toList();
    final names = nodes
        .map((node) => node['name'])
        .whereType<String>()
        .toSet();

    expect(names, contains('VideoScreen_Left'));
    expect(names, contains('VideoScreen_Right'));
  });
}
