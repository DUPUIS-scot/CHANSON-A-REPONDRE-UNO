class OpenAiConnectionStatus {
  const OpenAiConnectionStatus({
    required this.connected,
    this.maskedKey,
    this.updatedAt,
  });

  final bool connected;
  final String? maskedKey;
  final DateTime? updatedAt;

  factory OpenAiConnectionStatus.fromJson(Map<String, dynamic> json) =>
      OpenAiConnectionStatus(
        connected: json['connected'] == true,
        maskedKey: json['maskedKey'] as String?,
        updatedAt: DateTime.tryParse(json['updatedAt'] as String? ?? ''),
      );

  static const disconnected = OpenAiConnectionStatus(connected: false);
}
