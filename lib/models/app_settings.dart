class AppSettings {
  const AppSettings({
    this.accentColor = 0xFFC18A27,
    this.animationsEnabled = true,
    this.reducedMotion = false,
    this.backgroundAutoplay = true,
    this.backgroundLoop = true,
    this.rotationEnabled = true,
    this.rotationSpeed = 14,
    this.perspective = .0011,
    this.curtainIntroEnabled = true,
    this.curtainDuration = 1200,
    this.wheelSensitivity = 1,
    this.dragSensitivity = 1,
    this.renameImportedCards = true,
    this.keepOriginalFilename = true,
    this.manualDeckAssignment = true,
    this.previewOnLongPress = true,
    this.fullscreenZoom = true,
    this.maximumZoom = 5,
    this.heroAnimation = true,
    this.streaming = true,
    this.maximumMessages = 100,
    this.requestTimeout = 60,
    this.retryAttempts = 2,
    this.uploadLimitMb = 20,
    this.debugLogging = false,
    this.languageDetection = true,
    this.autoSaveTranscription = false,
    this.editableTranscription = true,
    this.showOcrWarnings = true,
    this.markUnreadableText = true,
    this.markdown = true,
    this.typingAnimation = true,
    this.messageFontSize = 15,
    this.highContrast = false,
    this.keyboardNavigation = true,
    this.screenReaderLabels = true,
    this.focusIndicators = true,
    this.developerMode = false,
  });

  final int accentColor;
  final bool animationsEnabled;
  final bool reducedMotion;
  final bool backgroundAutoplay;
  final bool backgroundLoop;
  final bool rotationEnabled;
  final double rotationSpeed;
  final double perspective;
  final bool curtainIntroEnabled;
  final double curtainDuration;
  final double wheelSensitivity;
  final double dragSensitivity;
  final bool renameImportedCards;
  final bool keepOriginalFilename;
  final bool manualDeckAssignment;
  final bool previewOnLongPress;
  final bool fullscreenZoom;
  final double maximumZoom;
  final bool heroAnimation;
  final bool streaming;
  final int maximumMessages;
  final double requestTimeout;
  final int retryAttempts;
  final double uploadLimitMb;
  final bool debugLogging;
  final bool languageDetection;
  final bool autoSaveTranscription;
  final bool editableTranscription;
  final bool showOcrWarnings;
  final bool markUnreadableText;
  final bool markdown;
  final bool typingAnimation;
  final double messageFontSize;
  final bool highContrast;
  final bool keyboardNavigation;
  final bool screenReaderLabels;
  final bool focusIndicators;
  final bool developerMode;

  factory AppSettings.fromJson(Map<String, dynamic> json) => AppSettings(
    accentColor: (json['accentColor'] as num?)?.toInt() ?? 0xFFC18A27,
    animationsEnabled: json['animationsEnabled'] as bool? ?? true,
    reducedMotion: json['reducedMotion'] as bool? ?? false,
    backgroundAutoplay: json['backgroundAutoplay'] as bool? ?? true,
    backgroundLoop: json['backgroundLoop'] as bool? ?? true,
    rotationEnabled: json['rotationEnabled'] as bool? ?? true,
    rotationSpeed: (json['rotationSpeed'] as num?)?.toDouble() ?? 14,
    perspective: (json['perspective'] as num?)?.toDouble() ?? .0011,
    curtainIntroEnabled: json['curtainIntroEnabled'] as bool? ?? true,
    curtainDuration: (json['curtainDuration'] as num?)?.toDouble() ?? 1200,
    wheelSensitivity: (json['wheelSensitivity'] as num?)?.toDouble() ?? 1,
    dragSensitivity: (json['dragSensitivity'] as num?)?.toDouble() ?? 1,
    renameImportedCards: json['renameImportedCards'] as bool? ?? true,
    keepOriginalFilename: json['keepOriginalFilename'] as bool? ?? true,
    manualDeckAssignment: json['manualDeckAssignment'] as bool? ?? true,
    previewOnLongPress: json['previewOnLongPress'] as bool? ?? true,
    fullscreenZoom: json['fullscreenZoom'] as bool? ?? true,
    maximumZoom: (json['maximumZoom'] as num?)?.toDouble() ?? 5,
    heroAnimation: json['heroAnimation'] as bool? ?? true,
    streaming: json['streaming'] as bool? ?? true,
    maximumMessages: (json['maximumMessages'] as num?)?.toInt() ?? 100,
    requestTimeout: (json['requestTimeout'] as num?)?.toDouble() ?? 60,
    retryAttempts: (json['retryAttempts'] as num?)?.toInt() ?? 2,
    uploadLimitMb: (json['uploadLimitMb'] as num?)?.toDouble() ?? 20,
    debugLogging: json['debugLogging'] as bool? ?? false,
    languageDetection: json['languageDetection'] as bool? ?? true,
    autoSaveTranscription: json['autoSaveTranscription'] as bool? ?? false,
    editableTranscription: json['editableTranscription'] as bool? ?? true,
    showOcrWarnings: json['showOcrWarnings'] as bool? ?? true,
    markUnreadableText: json['markUnreadableText'] as bool? ?? true,
    markdown: json['markdown'] as bool? ?? true,
    typingAnimation: json['typingAnimation'] as bool? ?? true,
    messageFontSize: (json['messageFontSize'] as num?)?.toDouble() ?? 15,
    highContrast: json['highContrast'] as bool? ?? false,
    keyboardNavigation: json['keyboardNavigation'] as bool? ?? true,
    screenReaderLabels: json['screenReaderLabels'] as bool? ?? true,
    focusIndicators: json['focusIndicators'] as bool? ?? true,
    developerMode: json['developerMode'] as bool? ?? false,
  );

  Map<String, Object> toJson() => {
    'accentColor': accentColor,
    'animationsEnabled': animationsEnabled,
    'reducedMotion': reducedMotion,
    'backgroundAutoplay': backgroundAutoplay,
    'backgroundLoop': backgroundLoop,
    'rotationEnabled': rotationEnabled,
    'rotationSpeed': rotationSpeed,
    'perspective': perspective,
    'curtainIntroEnabled': curtainIntroEnabled,
    'curtainDuration': curtainDuration,
    'wheelSensitivity': wheelSensitivity,
    'dragSensitivity': dragSensitivity,
    'renameImportedCards': renameImportedCards,
    'keepOriginalFilename': keepOriginalFilename,
    'manualDeckAssignment': manualDeckAssignment,
    'previewOnLongPress': previewOnLongPress,
    'fullscreenZoom': fullscreenZoom,
    'maximumZoom': maximumZoom,
    'heroAnimation': heroAnimation,
    'streaming': streaming,
    'maximumMessages': maximumMessages,
    'requestTimeout': requestTimeout,
    'retryAttempts': retryAttempts,
    'uploadLimitMb': uploadLimitMb,
    'debugLogging': debugLogging,
    'languageDetection': languageDetection,
    'autoSaveTranscription': autoSaveTranscription,
    'editableTranscription': editableTranscription,
    'showOcrWarnings': showOcrWarnings,
    'markUnreadableText': markUnreadableText,
    'markdown': markdown,
    'typingAnimation': typingAnimation,
    'messageFontSize': messageFontSize,
    'highContrast': highContrast,
    'keyboardNavigation': keyboardNavigation,
    'screenReaderLabels': screenReaderLabels,
    'focusIndicators': focusIndicators,
    'developerMode': developerMode,
  };

  AppSettings copyWith({
    int? accentColor,
    bool? animationsEnabled,
    bool? reducedMotion,
    bool? backgroundAutoplay,
    bool? backgroundLoop,
    bool? rotationEnabled,
    double? rotationSpeed,
    double? perspective,
    bool? curtainIntroEnabled,
    double? curtainDuration,
    double? wheelSensitivity,
    double? dragSensitivity,
    bool? renameImportedCards,
    bool? keepOriginalFilename,
    bool? manualDeckAssignment,
    bool? previewOnLongPress,
    bool? fullscreenZoom,
    double? maximumZoom,
    bool? heroAnimation,
    bool? streaming,
    int? maximumMessages,
    double? requestTimeout,
    int? retryAttempts,
    double? uploadLimitMb,
    bool? debugLogging,
    bool? languageDetection,
    bool? autoSaveTranscription,
    bool? editableTranscription,
    bool? showOcrWarnings,
    bool? markUnreadableText,
    bool? markdown,
    bool? typingAnimation,
    double? messageFontSize,
    bool? highContrast,
    bool? keyboardNavigation,
    bool? screenReaderLabels,
    bool? focusIndicators,
    bool? developerMode,
  }) => AppSettings(
    accentColor: accentColor ?? this.accentColor,
    animationsEnabled: animationsEnabled ?? this.animationsEnabled,
    reducedMotion: reducedMotion ?? this.reducedMotion,
    backgroundAutoplay: backgroundAutoplay ?? this.backgroundAutoplay,
    backgroundLoop: backgroundLoop ?? this.backgroundLoop,
    rotationEnabled: rotationEnabled ?? this.rotationEnabled,
    rotationSpeed: rotationSpeed ?? this.rotationSpeed,
    perspective: perspective ?? this.perspective,
    curtainIntroEnabled: curtainIntroEnabled ?? this.curtainIntroEnabled,
    curtainDuration: curtainDuration ?? this.curtainDuration,
    wheelSensitivity: wheelSensitivity ?? this.wheelSensitivity,
    dragSensitivity: dragSensitivity ?? this.dragSensitivity,
    renameImportedCards: renameImportedCards ?? this.renameImportedCards,
    keepOriginalFilename: keepOriginalFilename ?? this.keepOriginalFilename,
    manualDeckAssignment: manualDeckAssignment ?? this.manualDeckAssignment,
    previewOnLongPress: previewOnLongPress ?? this.previewOnLongPress,
    fullscreenZoom: fullscreenZoom ?? this.fullscreenZoom,
    maximumZoom: maximumZoom ?? this.maximumZoom,
    heroAnimation: heroAnimation ?? this.heroAnimation,
    streaming: streaming ?? this.streaming,
    maximumMessages: maximumMessages ?? this.maximumMessages,
    requestTimeout: requestTimeout ?? this.requestTimeout,
    retryAttempts: retryAttempts ?? this.retryAttempts,
    uploadLimitMb: uploadLimitMb ?? this.uploadLimitMb,
    debugLogging: debugLogging ?? this.debugLogging,
    languageDetection: languageDetection ?? this.languageDetection,
    autoSaveTranscription: autoSaveTranscription ?? this.autoSaveTranscription,
    editableTranscription: editableTranscription ?? this.editableTranscription,
    showOcrWarnings: showOcrWarnings ?? this.showOcrWarnings,
    markUnreadableText: markUnreadableText ?? this.markUnreadableText,
    markdown: markdown ?? this.markdown,
    typingAnimation: typingAnimation ?? this.typingAnimation,
    messageFontSize: messageFontSize ?? this.messageFontSize,
    highContrast: highContrast ?? this.highContrast,
    keyboardNavigation: keyboardNavigation ?? this.keyboardNavigation,
    screenReaderLabels: screenReaderLabels ?? this.screenReaderLabels,
    focusIndicators: focusIndicators ?? this.focusIndicators,
    developerMode: developerMode ?? this.developerMode,
  );
}
