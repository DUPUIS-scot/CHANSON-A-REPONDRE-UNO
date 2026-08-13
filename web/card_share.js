window.shareChansonCard = async function (title, text, url, imagePath) {
  if (typeof navigator.share !== 'function') return 'unavailable';

  const resultForError = (error) =>
    error && error.name === 'AbortError' ? 'cancelled' : 'failed';

  if (imagePath && typeof navigator.canShare === 'function') {
    try {
      const imageUrl = imagePath.startsWith('assets/')
        ? new URL(`assets/${imagePath}`, document.baseURI).href
        : new URL(imagePath, document.baseURI).href;
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Card image HTTP ${response.status}`);
      const blob = await response.blob();
      const extension = blob.type === 'image/jpeg' ? 'jpg' : 'png';
      const file = new File([blob], `chanson-card.${extension}`, {
        type: blob.type || 'image/png',
      });
      const payload = { files: [file], title, text, url };
      if (navigator.canShare(payload)) {
        try {
          await navigator.share(payload);
          return 'shared';
        } catch (error) {
          return resultForError(error);
        }
      }
    } catch (_) {
      // Image loading/conversion is progressive enhancement. Continue with URL.
    }
  }

  try {
    await navigator.share({ title, text, url });
    return 'shared';
  } catch (error) {
    return resultForError(error);
  }
};
