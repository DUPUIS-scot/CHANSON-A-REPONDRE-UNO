# CHANSON À RÉPONDRE UNO

Flutter web application for the permanent CHANSON À RÉPONDRE UNO card
library and game.

## Version 2.0

Version 2.0 certifies the current public app feature set:

- the permanent 67-card bundled deck remains available at startup;
- five deck categories are available across Browse, Deck Selection, Search,
  and Play: Classique, Sauvage, Poésie, Cyberpunk, and Art contemporain;
- face-down cards in Play use the matching supplied category verso;
- Browse shows five cards at a time while preserving shuffle, search, filters,
  and navigation;
- Search displays card thumbnails, and long-press/long-click opens the card
  fullscreen.

See [RELEASE_NOTES.md](RELEASE_NOTES.md) for release details.

## Local web build

```powershell
flutter pub get
flutter analyze
flutter test
flutter build web --release --base-href "/CHANSON-A-REPONDRE-UNO/"
```
