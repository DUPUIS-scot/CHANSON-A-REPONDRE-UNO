import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('transcription jester declares Draco geometry compression', () {
    final gltf = _readGlbJson('assets/models/transcription_jester.glb');
    final required = List<String>.from(
      gltf['extensionsRequired'] as List<dynamic>? ?? const <dynamic>[],
    );
    final used = List<String>.from(
      gltf['extensionsUsed'] as List<dynamic>? ?? const <dynamic>[],
    );

    expect(required, contains('KHR_draco_mesh_compression'));
    expect(used, contains('KHR_draco_mesh_compression'));
    expect(required, contains('EXT_texture_webp'));

    final nodes = gltf['nodes'] as List<dynamic>;
    final rootName = (nodes.first as Map<String, dynamic>)['name'] as String? ?? '';
    expect(rootName, startsWith('tripo_node_'));
    expect(rootName.toLowerCase(), isNot(contains('marionette')));
  });

  test('Draco support is installed before the jester renderers load', () {
    final bootstrap = File(
      'web/transcription_draco_bootstrap.js',
    ).readAsStringSync();
    final html = File('web/index.html').readAsStringSync();

    expect(bootstrap, contains('KHR_draco_mesh_compression'));
    expect(bootstrap, contains('DRACOLoader'));
    expect(bootstrap, contains('setDRACOLoader'));
    expect(bootstrap, contains('setDecoderPath(DRACO_DECODER_PATH)'));
    expect(
      bootstrap,
      contains('three@0.160.0/examples/jsm/libs/draco/'),
    );
    expect(bootstrap, contains("'transcription_jester.glb'"));
    expect(bootstrap, contains("'transcription_jester_rigged.glb'"));
    expect(bootstrap, contains("'play_jester_rigged.glb'"));
    expect(bootstrap, contains('DRACO_MODELS.some'));

    final bootstrapIndex = html.indexOf('transcription_draco_bootstrap.js');
    final playRendererIndex = html.indexOf('puppet_dealer.js');
    final transcriptionRendererIndex = html.indexOf('transcription_jester.js');
    expect(bootstrapIndex, greaterThanOrEqualTo(0));
    expect(playRendererIndex, greaterThan(bootstrapIndex));
    expect(transcriptionRendererIndex, greaterThan(bootstrapIndex));
    expect(html, contains('jester-draco-20260816-play-1'));
    expect(html, contains('transcription-jester-rigged-2'));
  });
}

Map<String, dynamic> _readGlbJson(String path) {
  final bytes = File(path).readAsBytesSync();
  if (bytes.length < 20) {
    throw StateError('$path is too small to be a GLB file.');
  }

  final data = ByteData.sublistView(bytes);
  if (data.getUint32(0, Endian.little) != 0x46546C67) {
    throw StateError('$path does not have the glTF GLB magic header.');
  }
  if (data.getUint32(4, Endian.little) != 2) {
    throw StateError('$path is not a glTF 2.0 GLB.');
  }

  final jsonLength = data.getUint32(12, Endian.little);
  final jsonType = data.getUint32(16, Endian.little);
  if (jsonType != 0x4E4F534A || 20 + jsonLength > bytes.length) {
    throw StateError('$path does not contain a valid first JSON chunk.');
  }

  final jsonText = utf8.decode(bytes.sublist(20, 20 + jsonLength)).trim();
  return jsonDecode(jsonText) as Map<String, dynamic>;
}
