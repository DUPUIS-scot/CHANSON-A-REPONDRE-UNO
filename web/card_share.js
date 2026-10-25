/**
 * Flutter web bridge for UNO card sharing. The shared browser authority
 * normalizes URLs; this bridge only adds an explicitly requested card image.
 */
window.shareChansonCard = async function (title, text, url, imagePath) {
  const resultForError = (error) =>
    error && error.name === 'AbortError' ? 'cancelled' : 'failed';
  const authority = window.ChansonSocialShare;
  const share = authority?.share || (typeof navigator.share === 'function'
    ? navigator.share.bind(navigator) : null);
  if (!share) return 'unavailable';

  const cleanUrl = authority?.minimalUrl
    ? authority.minimalUrl(url)
    : url;
  const isCardLink = authority?.isCardShareUrl?.(cleanUrl) ||
    /\/share\/(UNO|BRIO|HP)-\d+\/?$/i.test(new URL(cleanUrl, location.href).pathname);

  // For card links, the page's OG tags supply the original card preview.
  // Sending an image file instead can make receivers lose the clickable URL.
  if (imagePath && !isCardLink && typeof navigator.canShare === 'function') {
    try {
      const normalizedImagePath = imagePath.startsWith('assets/')
        ? imagePath : imagePath.replace(/^\/+/, '');
      const response = await fetch(new URL(normalizedImagePath, document.baseURI));
      if (!response.ok) throw new Error(`Card image HTTP ${response.status}`);
      const blob = await response.blob();
      const extension = blob.type === 'image/jpeg' ? 'jpg'
        : blob.type === 'image/webp' ? 'webp' : 'png';
      const file = new File([blob], `chanson-card.${extension}`, {
        type: blob.type || 'image/png',
      });
      const payload = { files: [file], title, text, url: cleanUrl };
      if (navigator.canShare(payload)) {
        try {
          await share(payload);
          return 'shared';
        } catch (error) {
          return resultForError(error);
        }
      }
    } catch (_) {
      // A missing image must never block the ordinary link share.
    }
  }

  try {
    await share({ title, text, url: cleanUrl });
    return 'shared';
  } catch (error) {
    return resultForError(error);
  }
};
