let selectedCard = null;
let preview = null;
const activeTouches = new Map();

function assetUrl(path) {
  if (!path) return null;
  const raw = String(path).trim();
  if (/^data:/i.test(raw)) return raw;
  try {
    const parsed = new URL(raw, document.baseURI);
    if (/^https?:/i.test(raw)) return parsed.href;
  } catch (_) {}
  const normalized = raw.replace(/^\/+/, '');
  if (normalized.startsWith('assets/assets/')) return new URL(normalized, document.baseURI).href;
  if (normalized.startsWith('share-previews/')) return new URL(`assets/${normalized}`, document.baseURI).href;
  if (normalized.startsWith('assets/')) return new URL(`assets/${normalized}`, document.baseURI).href;
  return new URL(`assets/${normalized}`, document.baseURI).href;
}

function isHpCard(cardId) {
  return /^hp-\d+$/i.test(String(cardId || '').trim());
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
  img.dataset.cardPreview = 'jester-mode';
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
  if (!canvas || canvas.style.visibility === 'hidden' || !selectedCard || isHpCard(selectedCard.cardId)) {
    img.style.display = 'none';
    img.dataset.previewSuppressed = selectedCard && isHpCard(selectedCard.cardId) ? 'hp' : '';
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const mobile = rect.width < 560;
  const width = Math.max(54, Math.min(mobile ? rect.width * 0.17 : rect.width * 0.14, 116));
  const height = width * 1.5;
  Object.assign(img.style, {
    display: 'block',
    visibility: 'visible',
    width: `${width}px`,
    height: `${height}px`,
    left: `${rect.left + rect.width * (mobile ? 0.72 : 0.70) - width / 2}px`,
    top: `${rect.top + rect.height * 0.42 - height / 2}px`,
  });
  img.dataset.previewSuppressed = '';
}

function setCard(cardId, imagePath) {
  selectedCard = { cardId: String(cardId || ''), imagePath: String(imagePath || '') };
  try {
    window.transcriptionPuppetSetCard?.(selectedCard.cardId, selectedCard.imagePath);
  } catch (_) {}

  const img = ensurePreview();
  img.dataset.selectedCardId = selectedCard.cardId;
  if (isHpCard(selectedCard.cardId)) {
    img.removeAttribute('src');
    img.dataset.cardTexture = 'suppressed-hp';
    img.style.display = 'none';
    layoutPreview();
    return;
  }

  img.src = assetUrl(selectedCard.imagePath) || '';
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

function dispatchPointer(type, touch, pointerId) {
  if (!touch || typeof PointerEvent === 'undefined') return;
  window.dispatchEvent(new PointerEvent(type, {
    pointerId,
    pointerType: 'touch',
    isPrimary: activeTouches.size <= 1,
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
  const rect = canvas.getBoundingClientRect();
  return touch.clientX >= rect.left && touch.clientX <= rect.right &&
    touch.clientY >= Math.max(rect.top, 108) && touch.clientY <= rect.bottom;
}

function pointerIdFor(touch) {
  const value = Number(touch.identifier);
  return 2000 + (Number.isFinite(value) ? Math.abs(value % 100000) : activeTouches.size + 1);
}

document.addEventListener('touchstart', (event) => {
  for (const touch of event.changedTouches) {
    if (activeTouches.size >= 2 || !inJesterStage(touch)) continue;
    const pointerId = pointerIdFor(touch);
    activeTouches.set(touch.identifier, pointerId);
    dispatchPointer('pointerdown', touch, pointerId);
  }
}, { capture: true, passive: true });

document.addEventListener('touchmove', (event) => {
  let handled = false;
  for (const touch of event.touches) {
    const pointerId = activeTouches.get(touch.identifier);
    if (pointerId == null) continue;
    handled = true;
    dispatchPointer('pointermove', touch, pointerId);
  }
  if (handled && event.cancelable) event.preventDefault();
}, { capture: true, passive: false });

function finishTouches(event, type) {
  for (const touch of event.changedTouches) {
    const pointerId = activeTouches.get(touch.identifier);
    if (pointerId == null) continue;
    dispatchPointer(type, touch, pointerId);
    activeTouches.delete(touch.identifier);
  }
}

document.addEventListener('touchend', (event) => {
  finishTouches(event, 'pointerup');
}, { capture: true, passive: true });

document.addEventListener('touchcancel', (event) => {
  finishTouches(event, 'pointercancel');
}, { capture: true, passive: true });

window.addEventListener('resize', layoutPreview);
window.addEventListener('orientationchange', () => setTimeout(layoutPreview, 120));

window.transcriptionJesterModePatchSetCard = setCard;
window.transcriptionJesterModePatchLayout = layoutPreview;
