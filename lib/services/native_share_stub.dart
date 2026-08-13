import 'native_share_result.dart';

Future<NativeShareResult> sharePublicCard({
  required String title,
  required String text,
  required String url,
  String? imagePath,
}) async => NativeShareResult.unavailable;
