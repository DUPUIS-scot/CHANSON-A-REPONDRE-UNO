// Interior test mode intentionally applies no DOM atmosphere, colour grade,
// fog, glow or Three.js light rig. The GLB is rendered with plain unlit
// materials by card_castle.html so geometry and textures can be inspected first.
if (!window.__castleInteriorAtmosphereInstalled) {
  window.__castleInteriorAtmosphereInstalled = true;
  document.getElementById('castle-interior-atmosphere')?.remove();
  document.getElementById('castle-interior-atmosphere-style')?.remove();
  const canvas = document.querySelector('#scene canvas');
  if (canvas) canvas.style.filter = '';
  window.__castleInteriorLightingRig = { group: null, sync() {} };
  document.body.dataset.interiorAtmosphereLayer = 'disabled-plain-glb-preview';
  document.body.dataset.interiorLighting = 'disabled';
  document.body.dataset.interiorFog = 'disabled';
}
