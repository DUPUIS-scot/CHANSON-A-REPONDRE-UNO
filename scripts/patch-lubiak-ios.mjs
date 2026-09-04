import fs from 'node:fs';

const jsPath = 'web/lubiak/lubiak.js';
let js = fs.readFileSync(jsPath, 'utf8');
let changed = false;

function replaceOnce(source, from, to, label) {
  if (source.includes(to)) return source;
  if (!source.includes(from)) throw new Error(`Missing ${label} anchor`);
  changed = true;
  return source.replace(from, to);
}

// LUBIAK_IOS_RUNTIME_PROFILE_V3
// This patch intentionally targets the current modular runtime only. Historical
// panorama/light/terrain mutations were retired because their anchors no longer
// match the authoritative LUBIAK scene and could reintroduce superseded behavior.

const domAnchor = "const bandcamp = document.querySelector('#bandcamp');";
const domGuard = `${domAnchor}\n\n// LUBIAK_BOOT_CONTRACT_GUARD_V1\nif (!host || !status) {\n  const missing = [!host ? '#stage' : null, !status ? '#status' : null].filter(Boolean).join(', ');\n  const message = \`LUBIAK boot contract missing: \${missing}\`;\n  console.error(message);\n  if (!status) {\n    const fallbackStatus = document.createElement('div');\n    fallbackStatus.textContent = message;\n    fallbackStatus.style.cssText = 'position:fixed;inset:auto 16px 16px 16px;z-index:10000;padding:12px;background:#180b08;color:#ffd7a1;font:700 12px system-ui;text-align:center';\n    document.body.appendChild(fallbackStatus);\n  }\n  throw new Error(message);\n}`;
js = replaceOnce(js, domAnchor, domGuard, 'DOM contract guard');

js = replaceOnce(
  js,
  "  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });",
  "  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !isIOS, powerPreference: isIOS ? 'default' : 'high-performance' });",
  'renderer profile',
);

js = replaceOnce(
  js,
  "  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));",
  "  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isIOS ? 1.18 : 1.6));",
  'renderer DPR',
);

js = replaceOnce(
  js,
  "  status.textContent = '3D UNAVAILABLE';",
  "  if (status) status.textContent = '3D UNAVAILABLE';",
  'bootstrap error status guard',
);

if (!changed) {
  console.log('LUBIAK iOS/runtime hardening already installed.');
  process.exit(0);
}

fs.writeFileSync(jsPath, js);
console.log('Applied authoritative LUBIAK iOS/runtime hardening profile.');
