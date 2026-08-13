import 'package:flutter_test/flutter_test.dart';
import 'package:uno_chanson_2/services/native_share_result.dart';
import 'package:uno_chanson_2/services/public_card_share_service.dart';

void main() {
  final deployed = Uri.parse(
    'https://dupuis-scot.github.io/CHANSON-A-REPONDRE-UNO/'
    '?v=965c218#/cards?focus=old-card',
  );

  test('deep link keeps deployment base, permanent id, and no query state', () {
    final url = PublicCardShareService.deepLinkFor(
      'final-84-42',
      applicationUri: deployed,
    );
    expect(
      url.toString(),
      'https://dupuis-scot.github.io/CHANSON-A-REPONDRE-UNO/'
      '#/cards/final-84-42',
    );
  });

  test('preview URL safely encodes the permanent card id', () {
    final url = PublicCardShareService.shareUrlFor(
      'card with spaces',
      applicationUri: Uri.parse('https://example.test/app/#/home'),
    );
    expect(
      url.toString(),
      'https://example.test/app/share/card%20with%20spaces/',
    );
  });

  test('successful native share leaves clipboard untouched', () async {
    var copied = false;
    final result = await _share(
      NativeShareResult.shared,
      copy: (_) async => copied = true,
    );
    expect(result, CardShareResult.shared);
    expect(copied, isFalse);
  });

  test('unavailable native share copies exact preview URL', () async {
    String? copied;
    final result = await _share(
      NativeShareResult.unavailable,
      copy: (value) async => copied = value,
    );
    expect(result, CardShareResult.copied);
    expect(
      copied,
      'https://dupuis-scot.github.io/CHANSON-A-REPONDRE-UNO/'
      'share/final-84-42/',
    );
  });

  test('user cancellation leaves clipboard untouched', () async {
    var copied = false;
    final result = await _share(
      NativeShareResult.cancelled,
      copy: (_) async => copied = true,
    );
    expect(result, CardShareResult.cancelled);
    expect(copied, isFalse);
  });

  test('genuine native failure falls back to clipboard', () async {
    var copied = false;
    final result = await _share(
      NativeShareResult.failed,
      copy: (_) async => copied = true,
    );
    expect(result, CardShareResult.copied);
    expect(copied, isTrue);
  });

  test('total failure is reported only when clipboard also fails', () async {
    final result = await _share(
      NativeShareResult.failed,
      copy: (_) => throw StateError('clipboard blocked'),
    );
    expect(result, CardShareResult.failed);
  });

  test('image sharing unavailable still shares the URL', () async {
    String? receivedImage;
    String? receivedUrl;
    final result = await PublicCardShareService.share(
      cardId: 'final-84-42',
      imagePath: 'assets/cards/exact-card.png',
      applicationUri: deployed,
      nativeShare:
          ({required title, required text, required url, imagePath}) async {
            receivedImage = imagePath;
            receivedUrl = url;
            return NativeShareResult.shared;
          },
      copyLink: (_) async {},
    );
    expect(result, CardShareResult.shared);
    expect(receivedImage, 'assets/cards/exact-card.png');
    expect(receivedUrl, endsWith('/share/final-84-42/'));
  });

  test('image loading failure can degrade to successful URL share', () async {
    final result = await PublicCardShareService.share(
      cardId: 'final-84-42',
      imagePath: 'assets/cards/missing.png',
      applicationUri: deployed,
      nativeShare:
          ({required title, required text, required url, imagePath}) async =>
              NativeShareResult.shared,
      copyLink: (_) async {},
    );
    expect(result, CardShareResult.shared);
  });
}

Future<CardShareResult> _share(
  NativeShareResult nativeResult, {
  required CardLinkCopier copy,
}) => PublicCardShareService.share(
  cardId: 'final-84-42',
  imagePath: 'assets/cards/final-84-42.png',
  applicationUri: Uri.parse(
    'https://dupuis-scot.github.io/CHANSON-A-REPONDRE-UNO/'
    '?v=old#/cards?focus=another',
  ),
  nativeShare:
      ({required title, required text, required url, imagePath}) async =>
          nativeResult,
  copyLink: copy,
);
