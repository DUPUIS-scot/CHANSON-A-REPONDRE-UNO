import * as THREE from 'three';

if (!window.__castleLaboratoryMedallionButtonInstalled) {
  window.__castleLaboratoryMedallionButtonInstalled = true;

  const host = document.createElement('button');
  host.id = 'laboratory-medallion-button';
  host.type = 'button';
  host.setAttribute('aria-label', 'Entrer dans le laboratoire');
  host.title = 'Entrer dans le laboratoire';
  host.innerHTML = '<span class="lab-medallion-canvas" aria-hidden="true"></span><span class="lab-medallion-label">LABORATOIRE</span>';
  document.body.appendChild(host);

  const style = document.createElement('style');
  style.textContent = `
    #laboratory-medallion-button {position:fixed;left:50%;bottom:max(18px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483000;width:126px;height:154px;padding:0;border:0;background:transparent;color:#d8dde2;cursor:pointer;display:none;place-items:center;pointer-events:auto;-webkit-tap-highlight-color:transparent;filter:drop-shadow(0 9px 14px rgba(0,0,0,.72))}
    body[data-scene-mode="interior"] #laboratory-medallion-button {display:grid}
    body[data-scene-mode="laboratory"] #laboratory-medallion-button,body[data-scene-mode="exterior"] #laboratory-medallion-button {display:none}
    #laboratory-medallion-button .lab-medallion-canvas {width:116px;height:128px;display:block;position:relative}
    #laboratory-medallion-button canvas {display:block;width:116px!important;height:128px!important;pointer-events:none}
    #laboratory-medallion-button .lab-medallion-label {position:absolute;left:50%;bottom:0;transform:translateX(-50%);font:700 10px/1 system-ui,sans-serif;letter-spacing:.18em;color:rgba(231,236,240,.86);text-shadow:0 2px 5px #000,0 0 8px #000;white-space:nowrap;opacity:.82;transition:opacity .18s ease,letter-spacing .18s ease}
    #laboratory-medallion-button:hover .lab-medallion-label,#laboratory-medallion-button:focus-visible .lab-medallion-label {opacity:1;letter-spacing:.22em}
    #laboratory-medallion-button:hover,#laboratory-medallion-button:focus-visible {outline:none;filter:drop-shadow(0 10px 18px rgba(0,0,0,.82)) drop-shadow(0 0 8px rgba(196,211,222,.22))}
    #laboratory-medallion-button:active {transform:translateX(-50%) scale(.96)}
    @media(max-width:700px){#laboratory-medallion-button{width:104px;height:132px;bottom:max(12px,env(safe-area-inset-bottom))}#laboratory-medallion-button .lab-medallion-canvas,#laboratory-medallion-button canvas{width:96px!important;height:106px!important}#laboratory-medallion-button .lab-medallion-label{font-size:8px}}
  `;
  document.head.appendChild(style);

  const mount = host.querySelector('.lab-medallion-canvas');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 116 / 128, 0.1, 20);
  camera.position.set(0, 0.02, 5.6);

  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(116, 128, false);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);
  } catch (_) { host.classList.add('lab-medallion-renderer-failed'); }

  scene.add(new THREE.HemisphereLight(0xdce8f0, 0x10161b, 1.55));
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(3.5, 4.5, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9db9cf, 1.45); rim.position.set(-4, 1.5, -3.5); scene.add(rim);

  function buildMedallion() {
    const shape = new THREE.Shape();
    shape.moveTo(-0.79,-0.86); shape.bezierCurveTo(-1.02,-0.55,-1.05,-0.08,-0.94,0.34); shape.bezierCurveTo(-0.80,0.83,-0.48,1.09,-0.30,1.27); shape.bezierCurveTo(-0.18,1.39,-0.16,1.58,-0.15,1.82); shape.bezierCurveTo(-0.14,2.04,0.14,2.04,0.15,1.82); shape.bezierCurveTo(0.16,1.58,0.18,1.39,0.30,1.27); shape.bezierCurveTo(0.48,1.09,0.80,0.83,0.94,0.34); shape.bezierCurveTo(1.05,-0.08,1.02,-0.55,0.79,-0.86); shape.bezierCurveTo(0.57,-1.15,0.30,-1.28,0,-1.30); shape.bezierCurveTo(-0.30,-1.28,-0.57,-1.15,-0.79,-0.86); shape.closePath();
    const hole = new THREE.Path(); hole.absellipse(0,1.69,0.12,0.12,0,Math.PI*2,false,0); shape.holes.push(hole);
    const geometry = new THREE.ExtrudeGeometry(shape,{depth:0.105,bevelEnabled:true,bevelThickness:0.025,bevelSize:0.022,bevelSegments:2,curveSegments:20,steps:1}); geometry.center();
    const mesh = new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0x555b5f,metalness:0.91,roughness:0.34}));
    mesh.scale.setScalar(0.86);
    const faceGeometry = new THREE.ShapeGeometry(shape,24); faceGeometry.center();
    const face = new THREE.Mesh(faceGeometry,new THREE.MeshStandardMaterial({color:0x666c70,metalness:0.78,roughness:0.50,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
    face.position.z=0.065; mesh.add(face);
    const group=new THREE.Group(); group.add(mesh); group.position.y=-0.10; return group;
  }

  const medallion=buildMedallion(); scene.add(medallion);
  document.body.dataset.laboratoryMedallionOrientation='upright-y-spin-v49';
  const clock=new THREE.Clock(); let frame=0;
  function render(){frame=requestAnimationFrame(render);if(!renderer||document.hidden||document.body.dataset.sceneMode!=='interior')return;const t=clock.getElapsedTime();medallion.rotation.set(0,t*0.82,0);renderer.render(scene,camera)}
  render();

  function sync(){const interior=document.body.dataset.sceneMode==='interior';host.disabled=!interior||document.body.dataset.laboratoryReady==='loading';host.setAttribute('aria-busy',document.body.dataset.laboratoryReady==='loading'?'true':'false')}
  function primeVideo(){if(document.body.dataset.sceneMode!=='interior')return;document.body.dataset.bureauVideoGestureSource='laboratory-medallion-v61';window.__castleBureauVideoPrime?.()}
  host.addEventListener('pointerdown',primeVideo,{passive:true});
  host.addEventListener('touchstart',primeVideo,{passive:true});
  host.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();if(document.body.dataset.sceneMode!=='interior')return;primeVideo();const bureauButton=document.getElementById('bureau-of-ai');if(bureauButton&&!bureauButton.disabled){bureauButton.click();return}window.dispatchEvent(new CustomEvent('castle-open-laboratory'))});
  const observer=new MutationObserver(sync); observer.observe(document.body,{attributes:true,attributeFilter:['data-scene-mode','data-laboratory-ready']}); sync();
  window.addEventListener('pagehide',()=>{if(frame)cancelAnimationFrame(frame);renderer?.dispose?.();observer.disconnect()},{once:true});
}
