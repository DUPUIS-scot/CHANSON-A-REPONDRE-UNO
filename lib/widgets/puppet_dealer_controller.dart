enum PuppetQuality { low, medium, high }

class PuppetDealerController {
  Future<void> Function(String imagePath)? _deal;
  Future<void> Function(String imagePath)? _receive;
  void Function(PuppetQuality quality)? _setQuality;

  Future<void> dealToPlayer(String imagePath) =>
      _deal?.call(imagePath) ?? Future<void>.value();

  Future<void> receiveFromPlayer(String imagePath) =>
      _receive?.call(imagePath) ?? Future<void>.value();

  void setQuality(PuppetQuality quality) => _setQuality?.call(quality);

  void attach({
    required Future<void> Function(String imagePath) deal,
    required Future<void> Function(String imagePath) receive,
    required void Function(PuppetQuality quality) setQuality,
  }) {
    _deal = deal;
    _receive = receive;
    _setQuality = setQuality;
  }

  void detach() {
    _deal = null;
    _receive = null;
    _setQuality = null;
  }
}
