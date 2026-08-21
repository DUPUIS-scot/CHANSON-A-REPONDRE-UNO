import * as THREE from 'three';

if (!window.__castleBrightLabUiPatchInstalled) {
  window.__castleBrightLabUiPatchInstalled = true;
  let attempts=0,labFillRig=null,lastMode='';
  function ensureLabFillRig(){const r=window.__castleSearchRuntime;if(!r?.scene||labFillRig)return labFillRig;const g=new THREE.Group();g.name='laboratory-extra-readable-light-v8';g.visible=false;g.add(new THREE.AmbientLight(0x8aa8bc,.98));g.add(new THREE.HemisphereLight(0xd2e4ee,0x38291f,1.08));const a=new THREE.DirectionalLight(0xe0f2fb,1.9);a.position.set(2,11,12);g.add(a);const b=new THREE.PointLight(0xffc184,18,20,2);b.position.set(0,5.5,2);g.add(b);const c=new THREE.PointLight(0xb8e0f2,16,24,2);c.position.set(-8,6,-2);g.add(c);r.scene.add(g);return labFillRig=g;}
  function backButton(){let b=document.getElementById('laboratory-back-interior');if(b)return b;b=document.createElement('button');b.id='laboratory-back-interior';b.type='button';b.className='castle-control';b.innerHTML='<span class="control-medallion">←</span><span class="control-copy"><span class="control-title">CHÂTEAU INTÉRIEUR</span><span class="control-subtitle">Retour</span></span>';Object.assign(b.style,{position:'fixed',left:'18px',top:'18px',zIndex:'10020',display:'none'});b.onclick=e=>{e.preventDefault();document.getElementById('bureau-of-ai')?.click();};document.body.appendChild(b);return b;}
  function labRoot(r){return r.scene.getObjectByName('BureauOfAI')||r.bureauRoot||null;}
  function rotateLab(r){const root=labRoot(r);if(!root)return;root.rotation.y=Math.PI;root.updateMatrixWorld(true);document.body.dataset.laboratoryOrientation='rotated-y-180-v52';}
  function labView(r){r.orbit.target.set(0,5.2,0);r.orbit.yaw=0.12;r.orbit.pitch=.34;r.orbit.distance=34;r.updateOrbit?.();document.body.dataset.laboratoryStartingView='rotated-reference-overview-v52';}
  function restoreJester(r,mode){
    const j=r.scene.getObjectByName('castle-jester-gatekeeper');
    if(!j)return;
    const show=mode==='exterior'||mode==='interior';
    j.visible=show;
    j.traverse(o=>{if(o.userData?.castleGatekeeper===true)o.visible=show;});
    if(show) document.body.dataset.castleJesterRestored=`${mode}-v53`;
  }
  function sync(){const r=window.__castleSearchRuntime;if(!r?.scene||!r?.renderer){if(attempts++<180)setTimeout(sync,100);return;}const mode=document.body.dataset.sceneMode||'exterior',lab=mode==='laboratory';const rig=ensureLabFillRig();if(rig)rig.visible=lab;
    restoreJester(r,mode);
    const bureau=document.getElementById('bureau-of-ai');if(bureau){bureau.hidden=true;bureau.style.display='none';bureau.setAttribute('aria-hidden','true');}
    const med=document.getElementById('laboratory-medallion-button');if(med)med.style.display=mode==='interior'?'':'none';const label=document.querySelector('#laboratory-medallion-button .lab-medallion-label');if(label){label.textContent='';label.style.display='none';}backButton().style.display=lab?'flex':'none';
    if(lab){rotateLab(r);r.renderer.toneMapping=THREE.ACESFilmicToneMapping;r.renderer.toneMappingExposure=2.05;r.scene.fog=new THREE.FogExp2(0x182630,.0015);const canvas=r.renderer.domElement;if(canvas)canvas.style.filter='contrast(.94) saturate(.92) brightness(1.18)';if(lastMode!=='laboratory')setTimeout(()=>labView(r),120);}
    lastMode=mode;
  }
  const ob=new MutationObserver(()=>requestAnimationFrame(sync));ob.observe(document.body,{attributes:true,attributeFilter:['data-scene-mode','data-laboratory-ready']});window.addEventListener('castleRuntimeReady',sync);setInterval(sync,500);sync();
}
