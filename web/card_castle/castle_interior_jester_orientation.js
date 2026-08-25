(() => {
  if (window.__castleInteriorJesterOrientationInstalled) return;
  window.__castleInteriorJesterOrientationInstalled = true;

  const THREE = window.THREE;
  if (!THREE?.AnimationMixer?.prototype) {
    document.body.dataset.interiorJesterOrientation = 'three-unavailable';
    return;
  }

  const prototype = THREE.AnimationMixer.prototype;
  if (prototype.__castleJesterOrientationPatched) return;
  prototype.__castleJesterOrientationPatched = true;

  const originalClipAction = prototype.clipAction;
  const correctedClips = new WeakMap();
  const AXIS_CORRECTION = Math.PI;
  const MIN_ROOT_MOTION = 0.25;

  function horizontalTravel(track) {
    const values = track?.values;
    if (!values || values.length < 6) return 0;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i + 2 < values.length; i += 3) {
      const x = values[i], z = values[i + 2];
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    }
    return Math.hypot(maxX - minX, maxZ - minZ);
  }

  function correctedInteriorClip(clip) {
    if (!clip?.tracks?.length) return clip;
    const cached = correctedClips.get(clip);
    if (cached) return cached;

    const movingBindings = new Set();
    for (const track of clip.tracks) {
      if (!track?.name?.endsWith('.position')) continue;
      if (horizontalTravel(track) < MIN_ROOT_MOTION) continue;
      movingBindings.add(track.name.slice(0, -'.position'.length));
    }

    if (!movingBindings.size) {
      correctedClips.set(clip, clip);
      document.body.dataset.interiorJesterOrientation = 'no-root-motion-track';
      return clip;
    }

    const clone = clip.clone();
    const correction = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), AXIS_CORRECTION);
    let correctedTracks = 0;

    for (const track of clone.tracks) {
      if (!track?.name?.endsWith('.quaternion')) continue;
      const binding = track.name.slice(0, -'.quaternion'.length);
      if (!movingBindings.has(binding)) continue;
      const values = track.values;
      for (let i = 0; i + 3 < values.length; i += 4) {
        const q = new THREE.Quaternion(values[i], values[i + 1], values[i + 2], values[i + 3]);
        q.multiply(correction).normalize();
        values[i] = q.x; values[i + 1] = q.y; values[i + 2] = q.z; values[i + 3] = q.w;
      }
      correctedTracks++;
    }

    if (!correctedTracks) {
      correctedClips.set(clip, clip);
      document.body.dataset.interiorJesterOrientation = 'root-motion-quaternion-not-found';
      return clip;
    }

    correctedClips.set(clip, clone);
    document.body.dataset.interiorJesterOrientation = 'root-motion-yaw-180-v71';
    document.body.dataset.interiorJesterOrientationTracks = String(correctedTracks);
    return clone;
  }

  prototype.clipAction = function(clip, optionalRoot, blendMode) {
    const runtime = window.__castleSearchRuntime;
    const mixerRoot = this.getRoot?.();
    const isInteriorMixer = runtime?.interiorRoot && mixerRoot === runtime.interiorRoot;
    const selectedClip = isInteriorMixer ? correctedInteriorClip(clip) : clip;
    return originalClipAction.call(this, selectedClip, optionalRoot, blendMode);
  };

  document.body.dataset.interiorJesterOrientation = 'installed-awaiting-interior-clip-v71';
})();
