// Compatibility bridge between the Flutter Castle host and the Three.js iframe.
// The Castle renderer consumes imagePath while the Flutter host sends rectoUrl.
// Normalize same-origin absolute Flutter asset URLs back to repository-relative
// asset paths before re-posting setCards, because the renderer's assetUrl()
// already resolves relative paths from card_castle/.
(() => {
  function toCastleAssetPath(source) {
    const value = String(source || '').trim();
    if (!value) return '';

    try {
      const url = new URL(value, location.href);
      if (url.origin === location.origin) {
        return `${url.pathname}${url.search}${url.hash}`.replace(/^\/+/, '');
      }
    } catch (_) {
      // Fall through to the original relative-path handling below.
    }

    return value.replace(/^\/+/, '');
  }

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
        imagePath: card?.imagePath || toCastleAssetPath(card?.rectoUrl || card?.thumbnailUrl),
      })),
    };
    document.body.dataset.bridgeTextureNormalization = 'relative-path';
    window.postMessage(JSON.stringify(normalized), location.origin);
  }, true);
})();
