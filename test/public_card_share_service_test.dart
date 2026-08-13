import 'package:flutter_test/flutter_test.dart';
import 'package:uno_chanson_2/services/public_card_share_service.dart';

void main() {
  test('public card URL keeps the deployment base and uses only card id', () {
    final url = PublicCardShareService.urlFor(
      'final-84-42',
      applicationUri: Uri.parse(
        'https://dupuis-scot.github.io/CHANSON-A-REPONDRE-UNO/'
        '?v=965c218#/cards',
      ),
    );

    expect(
      url.toString(),
      'https://dupuis-scot.github.io/CHANSON-A-REPONDRE-UNO/'
      '#/cards/final-84-42',
    );
  });

  test('card id is safely encoded in the hash route', () {
    final url = PublicCardShareService.urlFor(
      'card with spaces',
      applicationUri: Uri.parse('https://example.test/app/#/home'),
    );

    expect(
      url.toString(),
      'https://example.test/app/#/cards/card%20with%20spaces',
    );
  });
}
