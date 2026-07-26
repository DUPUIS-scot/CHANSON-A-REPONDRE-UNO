import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocalStorageService {
  Future<SharedPreferences> get _preferences => SharedPreferences.getInstance();

  Future<String?> read(String key) async => (await _preferences).getString(key);
  Future<void> write(String key, Object value) async =>
      (await _preferences).setString(key, jsonEncode(value));
  Future<void> remove(String key) async => (await _preferences).remove(key);
  Future<void> clear() async => (await _preferences).clear();

  Future<Directory> appDirectory() async {
    final documents = await getApplicationDocumentsDirectory();
    final directory = Directory('${documents.path}/chanson_repondre');
    if (!await directory.exists()) await directory.create(recursive: true);
    return directory;
  }

}
