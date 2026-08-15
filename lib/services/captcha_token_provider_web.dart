import 'dart:js_interop';

@JS('requestTurnstileToken')
external JSPromise<JSString> _requestTurnstileToken(JSString siteKey);

Future<String?> requestCaptchaToken(String siteKey) async {
  final normalized = siteKey.trim();
  if (normalized.isEmpty) return null;
  final token = (await _requestTurnstileToken(normalized.toJS).toDart).toDart.trim();
  return token.isEmpty ? null : token;
}
