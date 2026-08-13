import 'dart:js_interop';

import 'native_share_result.dart';

@JS('shareChansonCard')
external JSFunction? get _shareChansonCard;

Future<NativeShareResult> sharePublicCard({
  required String title,
  required String text,
  required String url,
  String? imagePath,
}) async {
  final share = _shareChansonCard;
  if (share == null) return NativeShareResult.unavailable;

  try {
    final promise = share.callAsFunction(
      null,
      title.toJS,
      text.toJS,
      url.toJS,
      imagePath?.toJS,
    );
    final value = await (promise as JSPromise<JSString>).toDart;
    return switch (value.toDart) {
      'shared' => NativeShareResult.shared,
      'cancelled' => NativeShareResult.cancelled,
      'unavailable' => NativeShareResult.unavailable,
      _ => NativeShareResult.failed,
    };
  } on Object {
    return NativeShareResult.failed;
  }
}
