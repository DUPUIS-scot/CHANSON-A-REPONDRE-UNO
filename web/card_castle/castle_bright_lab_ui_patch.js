import * as THREE from 'three';

if (!window.__castleBrightLabUiPatchInstalled) {
  window.__castleBrightLabUiPatchInstalled = true;
  let attempts=0,labFillRig=null,lastMode='';
  function ensureLabFillRig(){const runtime=window.__castleSearchRuntime;if(!runtime?.scene||labFillRig)return labFillRig;const rig=new THREE.Group();rig.name='laboratory-extra-readable-light-v6';rig.visible=false;rig.add(new THREE.AmbientLight(0x8aa8bc,.98));rig.add(new THREE.HemisphereLight(0xd2e4ee,0x38291f,1.08));const front=new THREE.DirectionalLight(0xe0f2fb,1.9);front.position.set(2,11,12);rig.add(front);const warm=new THREE.PointLight(0xffc184,18,20,2);warm.position.set(0,5.5,2);rig.add(warm);const side=new THREE.PointLight(0xb8e0f2,16,24,2);side.position.set(-8,6,-2);rig.add(side);runtime.scene.add(rig);labFillRig=rig;return rig;}
  function ensureBackButton(){let b=document.getElementById('laboratory-back-interior');if(b)return b;b=document.createElement('button');b.id='laboratory-back-interior';b.type='button';b.className='castle-control';b.setAttribute('aria-label','Retour au château intérieur');b.innerHTML='<span class="control-medallion">←</span><span class="control-copy"><span class="control-title">CHÂTEAU INTÉRIEUR</span><span class="control-subtitle">Retour</span></span>';Object.assign(b.style,{position:'fixed',left:'18px',top:'18px',zIndex:'10020',display:'none'});b.addEventListener('click',e=>{e.preventDefault();document.getElementById('bureau-of-ai')?.click();});document.body.appendChild(b);return b;}
  function setReferenceLabView(runtime){
    // Elevated three-quarter overview matching the supplied reference: bureau
    // foreground, fountain left-centre, stained-glass wall fully readable.
    runtime.orbit.target.set(0,5.4,-1.0);
    runtime.orbit.yaw=-0.34;
    runtime.orbit.pitch=0.43;
    runtime.orbit.distance=31;
    runtime.updateOrbit?.();
    document.body.dataset.laboratoryStartingView='reference-overview-v51';
  }
  function sync(){const runtime=window.__castleSearchRuntime;if(!runtime?.scene||!runtime?.renderer){if(attempts++<180)setTimeout(sync,100);return;}const mode=document.body.dataset.sceneMode||'exterior',lab=mode==='laboratory';const rig=ensureLabFillRig();if(rig)rig.visible=lab;
    const gatekeeper=runtime.scene.getObjectByName('castle-jester-gatekeeper');
    // Jester is restored in the castle interior, but never appears in lab.
    if(gatekeeper) gatekeeper.visible=(mode==='exterior'||mode==='interior');
    if(mode==='interior'&&lastMode==='laboratory'){
      gatekeeper?.userData && (gatekeeper.userData.restoredFromLaboratory=true);
    }
    const bureau=document.getElementById('bureau-of-ai');if(bureau){bureau.hidden=true;bureau.style.display='none';bureau.setAttribute('aria-hidden','true');}
    const med=document.getElementById('laboratory-medallion-button');if(med)med.style.display=mode==='interior'?'':'none';const label=document.querySelector('#laboratory-medallion-button .lab-medallion-label');if(label){label.textContent='';label.style.display='none';}
    ensureBackButton().style.display=lab?'flex':'none';
    if(lab){runtime.renderer.toneMapping=THREE.ACESFilmicToneMapping;runtime.renderer.toneMappingExposure=2.05;runtime.scene.fog=new THREE.FogExp2(0x182630,.0015);const canvas=runtime.renderer.domElement;if(canvas)canvas.style.filter='contrast(.94) saturate(.92) brightness(1.18)';document.body.dataset.laboratoryLighting='extra-bright-readable-v6';if(lastMode!=='laboratory')setTimeout(()=>setReferenceLabView(runtime),80);}
    lastMode=mode;
  }
  const observer=new MutationObserver(()=>requestAnimationFrame(sync));observer.observe(document.body,{attributes:true,attributeFilter:['data-scene-mode','data-laboratory-ready']});window.addEventListener('castleRuntimeReady',sync);setInterval(()=>{const m=document.body.dataset.sceneMode;if(m==='laboratory'||m==='interior')sync();},500);sync();
}
