(()=>{
'use strict';
const deckDocument=frame=>{try{return frame?.contentDocument?.getElementById('deck')?.contentDocument||null}catch(_){return null}};
const clamp=(value,minimum,maximum)=>Math.max(minimum,Math.min(maximum,value));
function install(frame){
  const d=deckDocument(frame),w=d?.defaultView;
  if(!d||!w)return false;
  const panel=d.querySelector('.enoch-linein');
  if(!panel)return false;
  if(panel.dataset.floatResize==='v1')return true;
  panel.dataset.floatResize='v1';

  const storageKey='enoch-private-line-in-panel-v1';
  const header=panel.querySelector('header');
  if(!header)return false;
  const css=d.createElement('style');
  css.textContent=`
    .enoch-linein[data-float-resize="v1"]{
      box-sizing:border-box!important;
      min-width:320px!important;
      min-height:118px!important;
      max-width:calc(100vw - 28px)!important;
      max-height:calc(100dvh - 28px)!important;
      resize:both!important;
      overflow:auto!important;
      touch-action:none!important;
    }
    .enoch-linein[data-float-resize="v1"]>header{
      cursor:move!important;
      touch-action:none!important;
      user-select:none!important;
    }
    .enoch-linein[data-float-resize="v1"]>header button{cursor:pointer!important}
    .enoch-linein[data-float-resize="v1"]::after{
      content:"↘";
      position:fixed;
      right:4px;
      bottom:1px;
      color:#d8a85e;
      font:900 13px/1 ui-monospace,monospace;
      pointer-events:none;
    }
  `;
  d.head.appendChild(css);

  const save=()=>{try{w.sessionStorage?.setItem(storageKey,JSON.stringify({left:panel.style.left,top:panel.style.top,width:panel.style.width,height:panel.style.height}))}catch(_){}};
  const place=(left,top)=>{
    const rect=panel.getBoundingClientRect();
    const maxLeft=Math.max(14,w.innerWidth-rect.width-14);
    const maxTop=Math.max(14,w.innerHeight-rect.height-14);
    panel.style.left=clamp(left,14,maxLeft)+'px';
    panel.style.top=clamp(top,14,maxTop)+'px';
    panel.style.transform='none';
  };
  try{
    const restored=JSON.parse(w.sessionStorage?.getItem(storageKey)||'null');
    if(restored){
      if(restored.width)panel.style.width=restored.width;
      if(restored.height)panel.style.height=restored.height;
      panel.style.transform='none';
      const rect=panel.getBoundingClientRect();
      place(Number.parseFloat(restored.left)||Math.max(14,(w.innerWidth-rect.width)/2),Number.parseFloat(restored.top)||Math.max(14,(w.innerHeight-rect.height)/2));
    }
  }catch(_){}

  let drag=null;
  header.addEventListener('pointerdown',event=>{
    if(event.button!==0||event.target.closest('button,input,select,textarea,label'))return;
    const rect=panel.getBoundingClientRect();
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:rect.left,top:rect.top};
    panel.style.transform='none';
    header.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });
  header.addEventListener('pointermove',event=>{
    if(!drag||drag.id!==event.pointerId)return;
    place(drag.left+event.clientX-drag.x,drag.top+event.clientY-drag.y);
  });
  const finish=event=>{
    if(!drag||drag.id!==event.pointerId)return;
    try{header.releasePointerCapture?.(event.pointerId)}catch(_){}
    drag=null;
    save();
  };
  header.addEventListener('pointerup',finish);
  header.addEventListener('pointercancel',finish);
  new w.ResizeObserver(()=>{save()}).observe(panel);
  w.addEventListener('resize',()=>{const rect=panel.getBoundingClientRect();place(rect.left,rect.top);save()});
  return true;
}
let timer=0;
window.installEnochianPrivateLineInFloatV1=frame=>{
  if(install(frame)){if(timer)clearInterval(timer);timer=0;return true}
  if(!timer){let tries=0;timer=setInterval(()=>{if(install(frame)||++tries>240){clearInterval(timer);timer=0}},50)}
  return false;
};
})();