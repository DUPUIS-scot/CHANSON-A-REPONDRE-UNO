sealed class StartupVideoSource {
  const StartupVideoSource();
}

class AssetStartupVideoSource extends StartupVideoSource {
  const AssetStartupVideoSource(this.assetPath);
  final String assetPath;
}
