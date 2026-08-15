import 'captcha_token_provider_stub.dart'
    if (dart.library.html) 'captcha_token_provider_web.dart' as implementation;

Future<String?> requestCaptchaToken(String siteKey) =>
    implementation.requestCaptchaToken(siteKey);
