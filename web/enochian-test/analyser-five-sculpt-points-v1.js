(()=>{
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const deckDoc=frame=>{try{return frame?.contentDocument?.getElementById('deck')?.contentDocument||null}catch(_){return null}};
function install(frame){
  try{
    const d=deckDoc(frame),w=d?.defaultView,wave=d?.querySelector('.wave');
    if(!d||!w||!wave)return false;
    if(d.documentElement.dataset.analyserFiveSculptPoints==='v1')return true;
    const gesture=w.__enochAnalyserGesture;if(!gesture?.deform)return false;
    const def=gesture.deform;
    const defaults=[
      {bin:2.0,row:5.0,radius:.20,strength:1},
      {bin:4.8,row:8.0,radius:.20,strength:1},
      {bin:7.5,row:10.5,radius:.22,strength:1},
      {bin:10.2,row:8.0,radius:.20,strength:1},
      {bin:13.0,row:5.0,radius:.20,strength:1}
    ];
    if(!Array.isArray(def.anchors)||def.anchors.length!==5){
      def.anchors=defaults.map((p,i)=>Object.assign({id:i,pullY:0,pullZ:0,twist:0,vY:0,vZ:0},p));
    }else{
      def.anchors=def.anchors.slice(0,5).map((a,i)=>Object.assign({id:i,pullY:0,pullZ:0,twist:0,vY:0,vZ:0},defaults[i],a));
    }
    const css=d.createElement('style');
    css.textContent=`
      .analyser-sculpt-point{position:absolute;z-index:66;width:9px;height:9px;margin:-5px 0 0 -5px;border:1px solid #ffc45a;border-radius:50%;background:#071116;box-shadow:0 0 7px #ffb23f99,0 0 0 1px #08161c;pointer-events:none;opacity:0;transition:opacity .14s,transform .14s,box-shadow .14s}
      .signal-mod-toggle.active~.analyser-sculpt-point,.wave.analyser-signal-sculpting .analyser-sculpt-point{opacity:.92}
      .analyser-sculpt-point.is-active{transform:scale(1.45);box-shadow:0 0 11px #ffd36acc,0 0 0 2px #ffb23f44}
    `;
    d.head.appendChild(css);
    wave.querySelectorAll('.analyser-sculpt-point').forEach(n=>n.remove());
    const nodes=def.anchors.map((a,i)=>{
      const n=d.createElement('span');n.className='analyser-sculpt-point';n.dataset.sculptPoint=String(i+1);n.setAttribute('aria-hidden','true');
      n.style.left=`${clamp(a.bin/15*100,0,100)}%`;n.style.top=`${clamp(a.row/15*100,0,100)}%`;wave.appendChild(n);return n;
    });
    let active=2,lastGrabBin=def.grabBin,lastGrabRow=def.grabRow,raf=0;
    const nearest=(bin,row)=>{let best=0,dist=Infinity;def.anchors.forEach((a,i)=>{const q=(a.bin-bin)**2+(a.row-row)**2;if(q<dist){dist=q;best=i}});return best};
    const tick=()=>{
      if(Number.isFinite(def.grabBin)&&(def.grabBin!==lastGrabBin||def.grabRow!==lastGrabRow)){
        active=nearest(def.grabBin,Number.isFinite(def.grabRow)?def.grabRow:0);lastGrabBin=def.grabBin;lastGrabRow=def.grabRow;
      }
      const a=def.anchors[active];
      if(a){
        a.pullY=def.pullY||0;a.pullZ=def.pullZ||0;a.twist=def.twist||0;a.vY=def.vY||0;a.vZ=def.vZ||0;
      }
      nodes.forEach((n,i)=>n.classList.toggle('is-active',i===active&&w.__enochSignalModulation===true));
      d.documentElement.dataset.analyserSculptPointCount=String(def.anchors.length);
      raf=w.requestAnimationFrame(tick);
    };
    d.documentElement.dataset.analyserFiveSculptPoints='v1';
    w.__enochFiveSculptPoints={version:'v1',anchors:def.anchors,get active(){return active}};
    raf=w.requestAnimationFrame(tick);
    w.addEventListener('pagehide',()=>{if(raf)w.cancelAnimationFrame(raf)},{once:true});
    return true;
  }catch(_){return false}
}
let timer=0;
window.installEnochianFiveSculptPointsV1=frame=>{if(install(frame)){if(timer){clearInterval(timer);timer=0}return true}if(!timer){let n=0;timer=setInterval(()=>{if(install(frame)||++n>240){clearInterval(timer);timer=0}},50)}return false};
})();
