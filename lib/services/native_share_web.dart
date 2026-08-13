import 'dart:js_interop';

@JS('navigator')
external JSObject get _navigator;

@JS('navigator.share')
external JSFunction? get _navigatorShare;

@JS()
@anonymous
extension type _ShareData._(JSObject _) implements JSObject {
  external factory _ShareData({JSString title, JSString url});
}

Future<bool> sharePublicCard({
  required String title,
  required String url,
}) async {
  final share = _navigatorShare;
  if (share == null) return false;

  try {
    final promise = share.callAsFunction(
      _navigator,
      _ShareData(title: title.toJS, url: url.toJS),
    );
    await (promise as JSPromise<JSAny?>).toDart;
  } on Object {
    // The native sheet may reject when the user cancels. It was still
    // available, so do not unexpectedly overwrite the clipboard.
  }
  return true;
}
