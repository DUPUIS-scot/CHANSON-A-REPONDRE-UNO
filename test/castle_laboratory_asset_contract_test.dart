import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('laboratory GLB exposes two canonical video screen mesh nodes', () {
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

    Map<String, dynamic> node(String name) => nodes.firstWhere(
          (candidate) => candidate['name'] == name,
          orElse: () => <String, dynamic>{},
        );

    final left = node('VideoScreen_Left');
    final right = node('VideoScreen_Right');

    expect(left, isNotEmpty);
    expect(right, isNotEmpty);
    expect(left['mesh'], isA<int>());
    expect(right['mesh'], isA<int>());
    expect(left['mesh'], lessThan((document['meshes'] as List<dynamic>).length));
    expect(right['mesh'], lessThan((document['meshes'] as List<dynamic>).length));
  });
}
