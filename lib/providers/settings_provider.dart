import 'dart:convert';
import 'package:flutter/material.dart';
import '../core/app_constants.dart';
import '../services/local_storage_service.dart';
import '../models/app_settings.dart';

class SettingsProvider extends ChangeNotifier {
  SettingsProvider(this._storage);
  final LocalStorageService _storage;
  static const _key = 'settings';
  ThemeMode themeMode = ThemeMode.dark;
  String language = 'English';
  double textScale = 1;
  double volume = .7;
  bool soundEnabled = true;
  bool keepRevealedCardsFaceUp = true;
  bool hidePlayerHandAfterTurn = false;
  int get maxPlayerHandSize => AppConstants.maxPlayerHandSize;
  AppSettings advanced = const AppSettings();
  Future<void> load() async {
    try {
      final map =
          jsonDecode(await _storage.read(_key) ?? '{}') as Map<String, dynamic>;
      themeMode = map['themeMode'] == 'light'
          ? ThemeMode.light
          : ThemeMode.dark;
      language = map['language'] as String? ?? 'English';
      textScale = (map['textScale'] as num?)?.toDouble() ?? 1;
      volume = (map['volume'] as num?)?.toDouble() ?? .7;
      soundEnabled = map['soundEnabled'] as bool? ?? true;
      keepRevealedCardsFaceUp = map['keepRevealedCardsFaceUp'] as bool? ?? true;
      hidePlayerHandAfterTurn =
          map['hidePlayerHandAfterTurn'] as bool? ?? false;
      advanced = map['advanced'] is Map<String, dynamic>
          ? AppSettings.fromJson(map['advanced'] as Map<String, dynamic>)
          : const AppSettings();
    } on Object {
      /* defaults */
    }
    notifyListeners();
  }

  Future<void> update({
    ThemeMode? theme,
    String? locale,
    double? scale,
    double? audioVolume,
    bool? sound,
    bool? keepRevealed,
    bool? hideAfterTurn,
  }) async {
    themeMode = theme ?? themeMode;
    language = locale ?? language;
    textScale = scale ?? textScale;
    volume = audioVolume ?? volume;
    soundEnabled = sound ?? soundEnabled;
    keepRevealedCardsFaceUp = keepRevealed ?? keepRevealedCardsFaceUp;
    hidePlayerHandAfterTurn = hideAfterTurn ?? hidePlayerHandAfterTurn;
    await _persist();
  }

  Future<void> reset() async {
    themeMode = ThemeMode.dark;
    language = 'English';
    textScale = 1;
    volume = .7;
    soundEnabled = true;
    keepRevealedCardsFaceUp = true;
    hidePlayerHandAfterTurn = false;
    advanced = const AppSettings();
    await _persist();
  }

  Future<void> updateAdvanced(AppSettings value) async {
    advanced = value;
    await _persist();
  }

  Future<void> _persist() async {
    await _storage.write(_key, {
      'themeMode': themeMode.name,
      'language': language,
      'textScale': textScale,
      'volume': volume,
      'soundEnabled': soundEnabled,
      'keepRevealedCardsFaceUp': keepRevealedCardsFaceUp,
      'hidePlayerHandAfterTurn': hidePlayerHandAfterTurn,
      'advanced': advanced.toJson(),
    });
    notifyListeners();
  }
}
