import fs from 'node:fs';

const path = 'web/lubiak/lubiak.js';
let src = fs.readFileSync(path, 'utf8');

if (src.includes('LUBIAK_THREE_MODE_SELECTOR_V1')) {
  console.log('LUBIAK three-mode selector already present.');
  process.exit(0);
}

const oldToggle = `const aerialToggle = document.createElement('button');
aerialToggle.id = 'lubiak-aerial-toggle';
aerialToggle.type = 'button';
aerialToggle.textContent = 'AERIAL';
aerialToggle.setAttribute('aria-label', 'Toggle aerial observation camera');
aerialToggle.style.cssText = 'position:fixed;right:max(26px,env(safe-area-inset-right));bottom:158px;z-index:70;border:1px solid #f6c28b88;border-radius:999px;padding:10px 14px;background:#160b08dd;color:#ffe2bd;font:700 10px/1 system-ui;letter-spacing:.14em;box-shadow:0 6px 20px #0009;cursor:pointer';
aerialToggle.addEventListener('click', () => setCameraMode(cameraMode === 'follow' ? 'aerial' : 'follow'));
document.body.appendChild(aerialToggle);`;

const newToggle = `// LUBIAK_THREE_MODE_SELECTOR_V1
// Explicit control choices: grounded/follow camera, detached aerial camera, or broom ride.
const modeDock = document.createElement('div');
modeDock.id = 'lubiak-mode-dock';
modeDock.style.cssText = 'position:fixed;right:max(18px,env(safe-area-inset-right));bottom:158px;z-index:70;display:flex;gap:6px;align-items:center;padding:5px;border:1px solid #f6c28b55;border-radius:999px;background:#100806dd;box-shadow:0 6px 20px #0009;backdrop-filter:blur(8px)';

function makeModeButton(label, aria) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.setAttribute('aria-label', aria);
  button.style.cssText = 'border:1px solid #f6c28b66;border-radius:999px;padding:9px 12px;background:#160b08cc;color:#ffe2bd;font:700 9px/1 system-ui;letter-spacing:.12em;cursor:pointer;opacity:.72';
  modeDock.appendChild(button);
  return button;
}

const followToggle = makeModeButton('FOLLOW', 'Follow the djinn in third person');
const aerialToggle = makeModeButton('AERIAL', 'Use detached aerial observation camera');
const rideToggle = makeModeButton('RIDE', 'Mount DA NOBLE Y2K and fly');

document.body.appendChild(modeDock);

function refreshLubiakModeButtons() {
  const riding = playerMode === 'mounting' || playerMode === 'flight';
  const active = cameraMode === 'aerial' ? aerialToggle : riding ? rideToggle : followToggle;
  for (const button of [followToggle, aerialToggle, rideToggle]) {
    const isActive = button === active;
    button.style.opacity = isActive ? '1' : '.62';
    button.style.background = isActive ? '#6d3018ee' : '#160b08cc';
    button.style.borderColor = isActive ? '#ffd7a1cc' : '#f6c28b66';
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  }
}

followToggle.addEventListener('click', () => {
  if (cameraMode === 'aerial') setCameraMode('follow');
  else {
    cameraMode = 'follow';
    showStatus(playerMode === 'flight' ? 'FOLLOWING RIDER' : 'FOLLOWING DJINN', 700);
    refreshLubiakModeButtons();
  }
});

aerialToggle.addEventListener('click', () => {
  setCameraMode(cameraMode === 'aerial' ? 'follow' : 'aerial');
  refreshLubiakModeButtons();
});

rideToggle.addEventListener('click', () => {
  if (!playerReady || !playerRoot || !broomRoot) {
    showStatus('DA NOBLE Y2K NOT READY', 900);
    return;
  }
  if (cameraMode === 'aerial') setCameraMode('follow');
  if (playerMode === 'walk') beginMountTransition();
  else if (playerMode === 'mounting') showStatus('DA NOBLE Y2K · MOUNTING', 700);
  else if (playerMode === 'flight') showStatus('RIDE MODE · DA NOBLE Y2K', 700);
  refreshLubiakModeButtons();
});

refreshLubiakModeButtons();`;

if (!src.includes(oldToggle)) throw new Error('Aerial toggle block not found');
src = src.replace(oldToggle, newToggle);

const oldCameraTail = `  if (aerialToggle) aerialToggle.textContent = cameraMode === 'aerial' ? 'RETURN' : 'AERIAL';
}`;
const newCameraTail = `  if (typeof refreshLubiakModeButtons === 'function') refreshLubiakModeButtons();
}`;
if (!src.includes(oldCameraTail)) throw new Error('Camera mode tail not found');
src = src.replace(oldCameraTail, newCameraTail);

const oldKey = `  if (key === 'v' && !event.repeat) {
    setCameraMode(cameraMode === 'follow' ? 'aerial' : 'follow');
    event.preventDefault();
    return;
  }
  keys.add(key);`;
const newKey = `  if (key === 'v' && !event.repeat) {
    setCameraMode(cameraMode === 'follow' ? 'aerial' : 'follow');
    event.preventDefault();
    return;
  }
  if (key === 'r' && !event.repeat) {
    if (cameraMode === 'aerial') setCameraMode('follow');
    if (playerReady && broomRoot && playerMode === 'walk') beginMountTransition();
    if (typeof refreshLubiakModeButtons === 'function') refreshLubiakModeButtons();
    event.preventDefault();
    return;
  }
  keys.add(key);`;
if (!src.includes(oldKey)) throw new Error('Keyboard mode block not found');
src = src.replace(oldKey, newKey);

const oldFlightEntry = `      playerMode = 'flight';
      applyRidePose(1);
      showStatus('FLIGHT MODE · RIDING DA NOBLE Y2K', 900);`;
const newFlightEntry = `      playerMode = 'flight';
      applyRidePose(1);
      if (typeof refreshLubiakModeButtons === 'function') refreshLubiakModeButtons();
      showStatus('RIDE MODE · DA NOBLE Y2K', 900);`;
if (!src.includes(oldFlightEntry)) throw new Error('Flight entry block not found');
src = src.replace(oldFlightEntry, newFlightEntry);

fs.writeFileSync(path, src);
console.log('Added FOLLOW / AERIAL / RIDE selector to LUBIAK.');
