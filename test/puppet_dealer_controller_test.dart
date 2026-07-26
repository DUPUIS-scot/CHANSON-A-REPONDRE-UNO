import 'package:flutter_test/flutter_test.dart';
import 'package:uno_chanson_2/widgets/puppet_dealer_controller.dart';

void main() {
  test('dealer controller delegates card transfers and quality changes', () async {
    final controller = PuppetDealerController();
    final events = <String>[];

    controller.attach(
      deal: (path) async => events.add('deal:$path'),
      receive: (path) async => events.add('receive:$path'),
      setQuality: (quality) => events.add('quality:${quality.name}'),
    );

    await controller.dealToPlayer('assets/cards/deal.png');
    await controller.receiveFromPlayer('assets/cards/play.png');
    controller.setQuality(PuppetQuality.high);

    expect(events, [
      'deal:assets/cards/deal.png',
      'receive:assets/cards/play.png',
      'quality:high',
    ]);
  });

  test('detached controller remains safe to call', () async {
    final controller = PuppetDealerController();
    controller.attach(
      deal: (_) async {},
      receive: (_) async {},
      setQuality: (_) {},
    );
    controller.detach();

    await controller.dealToPlayer('unused');
    await controller.receiveFromPlayer('unused');
    controller.setQuality(PuppetQuality.low);
  });
}
