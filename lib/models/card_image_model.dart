import 'card_chat_message.dart';
import 'card_transcription_result.dart';

class CardImageModel {
  const CardImageModel({
    required this.id,
    required this.deckId,
    required this.title,
    required this.path,
    required this.category,
    required this.colour,
    required this.importedAt,
    this.author = '',
    this.theme = '',
    this.emotion = '',
    this.tags = const [],
    this.year,
    this.isFavourite = false,
    this.transcription,
    this.cleanedTranscription,
    this.transcriptionLanguage = '',
    this.transcribedAt,
    this.transcriptionReviewed = false,
    this.transcriptionModel,
    this.transcriptionRequestId,
    this.transcriptionStatus = TranscriptionReviewStatus.unreviewed,
    this.chatHistory = const [],
    this.imageWidth,
    this.imageHeight,
  });

  final String id;
  final String deckId;
  final String title;
  final String path;
  final String category;
  final String colour;
  final DateTime importedAt;
  final String author;
  final String theme;
  final String emotion;
  final List<String> tags;
  final int? year;
  final bool isFavourite;
  final String? transcription;
  final String? cleanedTranscription;
  final String transcriptionLanguage;
  final DateTime? transcribedAt;
  final bool transcriptionReviewed;
  final String? transcriptionModel;
  final String? transcriptionRequestId;
  final TranscriptionReviewStatus transcriptionStatus;
  final List<CardChatMessage> chatHistory;
  final int? imageWidth;
  final int? imageHeight;

  String get imagePath => path;
  String get displayTitle {
    final generated = RegExp(
      r'^(?:Card\s+|card_)0*([1-9][0-9]*)$',
      caseSensitive: false,
    ).firstMatch(title);
    return generated == null ? title : 'Carte UNO ${generated.group(1)}';
  }

  double get aspectRatio {
    final width = imageWidth;
    final height = imageHeight;
    return width != null && height != null && width > 0 && height > 0
        ? width / height
        : 2 / 3;
  }

  factory CardImageModel.fromJson(Map<String, dynamic> json) => CardImageModel(
    id: json['id'] as String? ?? '',
    deckId: json['deckId'] as String? ?? '',
    title: json['title'] as String? ?? '',
    path: json['path'] as String? ?? '',
    category: json['category'] as String? ?? 'Parole',
    colour: json['colour'] as String? ?? 'red',
    importedAt:
        DateTime.tryParse(json['importedAt'] as String? ?? '') ??
        DateTime.fromMillisecondsSinceEpoch(0),
    author: json['author'] as String? ?? '',
    theme: json['theme'] as String? ?? '',
    emotion: json['emotion'] as String? ?? '',
    tags: (json['tags'] as List<dynamic>? ?? const [])
        .whereType<String>()
        .toList(),
    year: (json['year'] as num?)?.toInt(),
    isFavourite: json['isFavourite'] as bool? ?? false,
    transcription: json['transcription'] as String?,
    cleanedTranscription: json['cleanedTranscription'] as String?,
    transcriptionLanguage: json['transcriptionLanguage'] as String? ?? '',
    transcribedAt: DateTime.tryParse(json['transcribedAt'] as String? ?? ''),
    transcriptionReviewed: json['transcriptionReviewed'] as bool? ?? false,
    transcriptionModel: json['transcriptionModel'] as String?,
    transcriptionRequestId: json['transcriptionRequestId'] as String?,
    transcriptionStatus: TranscriptionReviewStatus.values.firstWhere(
      (value) => value.name == json['transcriptionStatus'],
      orElse: () => json['transcriptionReviewed'] as bool? ?? false
          ? TranscriptionReviewStatus.reviewed
          : TranscriptionReviewStatus.unreviewed,
    ),
    chatHistory: (json['chatHistory'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(CardChatMessage.fromJson)
        .toList(),
    imageWidth: (json['imageWidth'] as num?)?.toInt(),
    imageHeight: (json['imageHeight'] as num?)?.toInt(),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'deckId': deckId,
    'title': title,
    'path': path,
    'category': category,
    'colour': colour,
    'importedAt': importedAt.toIso8601String(),
    'author': author,
    'theme': theme,
    'emotion': emotion,
    'tags': tags,
    'year': year,
    'isFavourite': isFavourite,
    'transcription': transcription,
    'cleanedTranscription': cleanedTranscription,
    'transcriptionLanguage': transcriptionLanguage,
    'transcribedAt': transcribedAt?.toIso8601String(),
    'transcriptionReviewed': transcriptionReviewed,
    'transcriptionModel': transcriptionModel,
    'transcriptionRequestId': transcriptionRequestId,
    'transcriptionStatus': transcriptionStatus.name,
    'chatHistory': chatHistory.map((message) => message.toJson()).toList(),
    'imageWidth': imageWidth,
    'imageHeight': imageHeight,
  };

  CardImageModel copyWith({
    String? id,
    String? deckId,
    String? title,
    String? path,
    String? category,
    String? colour,
    bool? isFavourite,
    String? transcription,
    String? cleanedTranscription,
    String? transcriptionLanguage,
    DateTime? transcribedAt,
    bool? transcriptionReviewed,
    String? transcriptionModel,
    String? transcriptionRequestId,
    TranscriptionReviewStatus? transcriptionStatus,
    List<CardChatMessage>? chatHistory,
    bool clearAiData = false,
    int? imageWidth,
    int? imageHeight,
  }) => CardImageModel(
    id: id ?? this.id,
    deckId: deckId ?? this.deckId,
    title: title ?? this.title,
    path: path ?? this.path,
    category: category ?? this.category,
    colour: colour ?? this.colour,
    importedAt: importedAt,
    author: author,
    theme: theme,
    emotion: emotion,
    tags: tags,
    year: year,
    isFavourite: isFavourite ?? this.isFavourite,
    transcription: clearAiData ? null : transcription ?? this.transcription,
    cleanedTranscription: clearAiData
        ? null
        : cleanedTranscription ?? this.cleanedTranscription,
    transcriptionLanguage: clearAiData
        ? ''
        : transcriptionLanguage ?? this.transcriptionLanguage,
    transcribedAt: clearAiData ? null : transcribedAt ?? this.transcribedAt,
    transcriptionReviewed: clearAiData
        ? false
        : transcriptionReviewed ?? this.transcriptionReviewed,
    transcriptionModel: clearAiData
        ? null
        : transcriptionModel ?? this.transcriptionModel,
    transcriptionRequestId: clearAiData
        ? null
        : transcriptionRequestId ?? this.transcriptionRequestId,
    transcriptionStatus: clearAiData
        ? TranscriptionReviewStatus.unreviewed
        : transcriptionStatus ?? this.transcriptionStatus,
    chatHistory: clearAiData ? const [] : chatHistory ?? this.chatHistory,
    imageWidth: imageWidth ?? this.imageWidth,
    imageHeight: imageHeight ?? this.imageHeight,
  );
}
