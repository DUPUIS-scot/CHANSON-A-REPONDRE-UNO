// Compatibility bridge between the Flutter Castle host and the Three.js iframe.
// The Castle renderer currently consumes imagePath while the Flutter host sends
// rectoUrl. Re-post one normalized setCards message so card textures load.
(() => {
  window.addEventListener('message', event => {
    let message;
    try {
      message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    } catch (_) {
      return;
    }
    if (!message || message.type !== 'setCards' || !Array.isArray(message.cards)) return;
    const needsNormalization = message.cards.some(card =>
      card && !card.imagePath && (card.rectoUrl || card.thumbnailUrl)
    );
    if (!needsNormalization) return;
    const normalized = {
      ...message,
      cards: message.cards.map(card => ({
        ...card,
        imagePath: card?.imagePath || card?.rectoUrl || card?.thumbnailUrl || '',
      })),
    };
    window.postMessage(JSON.stringify(normalized), location.origin);
  }, true);
})();
