let selectedCard = null;
let preview = null;
let activeTouch = null;

function assetUrl(path) {
  if (!path) return null;
  const raw = String(path).trim();
  try {
    const parsed = new URL(raw, document.baseURI);
    if (/^https?:/i.test(raw) || /^data:/i.test(raw)) return parsed.href;
  } catch (_) {}
  const normalized = raw.replace(/^\/+/, '');
  if (normalized.startsWith('assets/assets/') || normalized.startsWith('share-previews/')) {
    return new URL(normalized, document.baseURI).href;
  }
  if (normalized.startsWith('assets/')) {
    return new URL(`assets/${normalized}`, document.baseURI).href;
  }
  return new URL(`assets/${normalized}`, document.baseURI).href;
}

function puppetCanvas() {
  return document.querySelector('[data-transcription-puppet="true"]');
}

function ensurePreview() {
  if (preview) return preview;
  const img = document.createElement('img');
  img.id = 'transcription-jester-mode-card-preview';
  img.dataset.transcriptionJesterCanvas = 'true';
  img.dataset.transcriptionPuppet = 'true';
  img.setAttribute('aria-hidden', 'true');
  Object.assign(img.style, {
    position: 'fixed',
    display: 'none',
    objectFit: 'cover',
    pointerEvents: 'none',
    zIndex: '3',
    borderRadius: '4px',
    boxShadow: '0 8px 20px rgba(0,0,0,.58)',
    transform: 'perspective(500px) rotateY(-8deg) rotateZ(2deg)',
    transformOrigin: 'center center',
  });
  document.body.appendChild(img);
  preview = img;
  return img;
}

function layoutPreview() {
  const canvas = puppetCanvas();
  const img = ensurePreview();
  if (!canvas || canvas.style.visibility === 'hidden' || !selectedCard) {
    img.style.display = 'none';
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const mobile = rect.width < 560;
  const width = Math.max(54, Math.min(mobile ? rect.width * 0.17 : rect.width * 0.14, 116));
  const height = width * 1.5;
  Object.assign(img.style, {
    display: 'block',
    width: `${width}px`,
    height: `${height}px`,
    left: `${rect.left + rect.width * (mobile ? 0.62 : 0.64) - width / 2}px`,
    top: `${rect.top + rect.height * (mobile ? 0.38 : 0.40) - height / 2}px`,
  });
}

function setCard(cardId, imagePath) {
  selectedCard = { cardId, imagePath };
  const img = ensurePreview();
  img.dataset.selectedCardId = cardId || '';
  img.src = assetUrl(imagePath) || '';
  img.onload = () => {
    img.dataset.cardTexture = 'ready';
    layoutPreview();
  };
  img.onerror = () => {
    img.dataset.cardTexture = 'failed';
    img.style.display = 'none';
  };
  layoutPreview();
}

// iOS Safari/Flutter can retain the gesture on the Flutter glass pane. Bridge
// single-finger touch gestures into the PointerEvent path used by Jester Mode.
function dispatchPointer(type, touch, pointerId) {
  if (!touch || typeof PointerEvent === 'undefined') return;
  window.dispatchEvent(new PointerEvent(type, {
    pointerId,
    pointerType: 'touch',
    isPrimary: true,
    clientX: touch.clientX,
    clientY: touch.clientY,
    button: 0,
    buttons: type === 'pointerup' || type === 'pointercancel' ? 0 : 1,
    bubbles: true,
    cancelable: true,
  }));
}

function inJesterStage(touch) {
  const canvas = puppetCanvas();
  if (!canvas || canvas.style.visibility === 'hidden') return false;
  const r = canvas.getBoundingClientRect();
  return touch.clientX >= r.left && touch.clientX <= r.right &&
    touch.clientY >= Math.max(r.top, 108) && touch.clientY <= r.bottom;
}

document.addEventListener('touchstart', (event) => {
  if (event.touches.length !== 1) return;
  const touch = event.touches[0];
  if (!inJesterStage(touch)) return;
  activeTouch = { identifier: touch.identifier, pointerId: 1001 };
  dispatchPointer('pointerdown', touch, activeTouch.pointerId);
}, { capture: true, passive: true });

document.addEventListener('touchmove', (event) => {
  if (!activeTouch) return;
  const touch = [...event.touches].find((item) => item.identifier === activeTouch.identifier);
  if (!touch) return;
  if (event.cancelable) event.preventDefault();
  dispatchPointer('pointermove', touch, activeTouch.pointerId);
}, { capture: true, passive: false });

document.addEventListener('touchend', (event) => {
  if (!activeTouch) return;
  const touch = [...event.changedTouches].find((item) => item.identifier === activeTouch.identifier);
  dispatchPointer('pointerup', touch, activeTouch.pointerId);
  activeTouch = null;
}, { capture: true, passive: true });

document.addEventListener('touchcancel', (event) => {
  if (!activeTouch) return;
  const touch = [...event.changedTouches].find((item) => item.identifier === activeTouch.identifier);
  dispatchPointer('pointercancel', touch, activeTouch.pointerId);
  activeTouch = null;
}, { capture: true, passive: true });

window.addEventListener('resize', layoutPreview);
window.addEventListener('orientationchange', () => setTimeout(layoutPreview, 120));

window.transcriptionJesterModePatchSetCard = setCard;
window.transcriptionJesterModePatchLayout = layoutPreview;
