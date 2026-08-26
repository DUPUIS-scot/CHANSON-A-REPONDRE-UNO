(()=>{
  'use strict';
  function install(host){
    try{
      const live=host?.contentDocument, deck=live?.getElementById('deck');
      const d=deck?.contentDocument, w=d?.defaultView;
      if(!d||!w||d.documentElement.dataset.twoMixVirtualMice==='v1')return !!d;
      d.documentElement.dataset.twoMixVirtualMice='v1';

      const style=d.createElement('style');
      style.id='two-mix-virtual-mice-style';
      style.textContent=`
        #twoMixToggle{position:fixed;z-index:2147483000;right:10px;bottom:10px;min-height:28px;padding:0 9px;border:1px solid #d39d3e;border-radius:14px;background:#100b04;color:#f5cf85;font:900 8px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;cursor:pointer;box-shadow:0 4px 15px #0009}
        #twoMixToggle.active{border-color:#63f5cf;background:#06271f;color:#baffed;box-shadow:0 0 16px #19c98f88}
        #twoMixHelp{position:fixed;z-index:2147482999;right:10px;bottom:45px;max-width:205px;padding:8px;border:1px solid #315b56;border-radius:6px;background:#020706eF;color:#b8d8d0;font:800 8px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;box-shadow:0 8px 24px #000a;pointer-events:none}
        #twoMixHelp.live{max-width:236px;border-color:#63f5cf;background:#04130feF;box-shadow:0 0 18px #19c98f55}
        #twoMixHelp b{display:block;color:#f0c97e;margin-bottom:3px;letter-spacing:.08em}
        .two-mix-cursor{position:fixed;z-index:2147482998;width:28px;height:28px;display:none;align-items:center;justify-content:center;transform:translate(-4px,-4px);border-radius:50% 50% 50% 4px;pointer-events:none;font:1000 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;transition:box-shadow .08s}
        .two-mix-cursor.active{display:flex}.two-mix-cursor.a{border:2px solid #f0b34d;background:#3b2208d9;color:#ffe2a4;box-shadow:0 0 12px #f0b34daa}.two-mix-cursor.b{border:2px solid #63f5cf;background:#06352bd9;color:#c9fff0;box-shadow:0 0 12px #63f5cfaa}
        #twoMixTether{position:fixed;z-index:2147482997;height:1px;transform-origin:0 50%;display:none;background:linear-gradient(90deg,#f0b34d,#63f5cf);pointer-events:none;opacity:.8}
        #twoMixState{position:fixed;z-index:2147482999;left:10px;bottom:11px;display:none;padding:6px 8px;border:1px solid #315b56;border-radius:4px;background:#020706df;color:#a9eee7;font:800 7px/1 ui-monospace,SFMono-Regular,Menlo,monospace;pointer-events:none}
        #twoMixState.active{display:block}
        @media(max-width:720px){#twoMixToggle{right:7px;bottom:7px;font-size:7px;min-height:25px}#twoMixHelp{right:7px;bottom:37px;max-width:175px;font-size:7px}.two-mix-cursor{width:24px;height:24px}#twoMixState{left:7px;bottom:7px;font-size:6px}}
      `;
      d.head.appendChild(style);
      const make=(tag,id,cls,text)=>{const el=d.createElement(tag);el.id=id;if(cls)el.className=cls;if(text)el.textContent=text;d.body.appendChild(el);return el};
      const button=make('button','twoMixToggle','','2MIX OFF');
      button.type='button';button.setAttribute('aria-pressed','false');button.title='Enable CHANSON A REPONDRE UNO virtual mice';
      const help=make('aside','twoMixHelp','','');
      help.innerHTML='<b>CHANSON A REPONDRE UNO</b>Click to reveal A + B virtual mice. Move: together · Shift: spread · Alt: rotate · Drag: control both · Esc: release.';
      const tether=make('div','twoMixTether');
      const state=make('div','twoMixState');
      const a=make('div','twoMixA','two-mix-cursor a','A');
      const b=make('div','twoMixB','two-mix-cursor b','B');
      const pair={enabled:false,dragging:false,last:null,a:{x:.35,y:.58,target:null,start:0,value:0},b:{x:.65,y:.58,target:null,start:0,value:0}};

      const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
      const point=p=>({x:p.x*w.innerWidth,y:p.y*w.innerHeight});
      const resolve=p=>{const q=point(p);const outer=document.elementFromPoint(q.x,q.y)?.closest?.('#outerAnalyserCanvas,#outerAnalyserPanel button');if(outer)return outer;const el=d.elementFromPoint(q.x,q.y);return el?.closest?.('input[type="range"],button,[role="button"],canvas,.wheel,.pad')||null};
      const outerEvent=(type,p,base)=>{const el=p.target;if(!el||el.ownerDocument===d)return;const q=point(p);el.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,clientX:q.x,clientY:q.y,pointerId:base,buttons:type==='pointerup'?0:1,pointerType:'mouse'}))};
      const dispatchInput=(el,value)=>{if(!el||el.tagName!=='INPUT')return;el.value=String(value);el.dispatchEvent(new w.Event('input',{bubbles:true}));el.dispatchEvent(new w.Event('change',{bubbles:true}))};
      const acquire=p=>{const el=resolve(p);p.target=el;p.start=Date.now();p.value=el?.tagName==='INPUT'?Number(el.value)||0:0;return el};
      const adjust=p=>{const el=p.target;if(!el||el.tagName!=='INPUT'||el.type!=='range')return;const max=Number(el.max)||100,min=Number(el.min)||0,step=Number(el.step)||1;const delta=(pair.moveX||0)-(pair.moveY||0);const next=clamp(p.value+delta*(max-min)/180,min,max);dispatchInput(el,Math.round(next/step)*step)};
      const activateButton=p=>{const el=p.target;if(!el||el.tagName!=='BUTTON'||Date.now()-p.start<140)return;el.click()};
      const targetName=el=>el?.getAttribute?.('aria-label')||el?.dataset?.stemRange||el?.id?.toUpperCase()||el?.textContent?.trim()?.slice(0,18)||'READY';
      const updateGuide=(A,B)=>{
        if(!pair.enabled){
          help.classList.remove('live');help.style.left='';help.style.top='';help.style.right='';help.style.bottom='';
          help.innerHTML='<b>CHANSON A REPONDRE UNO</b>Click to reveal A + B virtual mice. Move: together · Shift: spread · Alt: rotate · Drag: control both · Esc: release.';
          return;
        }
        const x=clamp((A.x+B.x)/2+18,8,Math.max(8,w.innerWidth-248));
        const y=clamp((A.y+B.y)/2+18,8,Math.max(8,w.innerHeight-94));
        help.classList.add('live');help.style.left=x+'px';help.style.top=y+'px';help.style.right='auto';help.style.bottom='auto';
        help.innerHTML='<b>A: '+targetName(resolve(pair.a))+' · B: '+targetName(resolve(pair.b))+'</b>HOLD CLICK + DRAG = CONTROL BOTH · RELEASE = STOP · SHIFT = SPREAD · ALT = ROTATE · ESC = RELEASE';
      };
      const render=()=>{
        const A=point(pair.a),B=point(pair.b);a.style.left=A.x+'px';a.style.top=A.y+'px';b.style.left=B.x+'px';b.style.top=B.y+'px';
        const dx=B.x-A.x,dy=B.y-A.y,len=Math.hypot(dx,dy);tether.style.left=A.x+'px';tether.style.top=A.y+'px';tether.style.width=len+'px';tether.style.transform='rotate('+Math.atan2(dy,dx)+'rad)';
        state.textContent='A: '+targetName(resolve(pair.a))+'  ·  B: '+targetName(resolve(pair.b));updateGuide(A,B);
      };
      const setEnabled=on=>{pair.enabled=!!on;pair.dragging=false;pair.last=null;button.classList.toggle('active',on);button.textContent=on?'CHANSON A REPONDRE UNO · LIVE':'CHANSON A REPONDRE UNO';button.setAttribute('aria-pressed',String(on));button.title=on?'CHANSON A REPONDRE UNO virtual mice active':'Enable CHANSON A REPONDRE UNO virtual mice';help.style.display='block';[a,b].forEach(el=>el.classList.toggle('active',on));tether.style.display=on?'block':'none';state.classList.toggle('active',on);render()};
      button.addEventListener('click',e=>{e.stopPropagation();setEnabled(!pair.enabled)});
      d.addEventListener('pointerdown',e=>{if(!pair.enabled||e.target===button)return;pair.dragging=true;pair.last={x:e.clientX,y:e.clientY};pair.moveX=0;pair.moveY=0;acquire(pair.a);acquire(pair.b);outerEvent('pointerdown',pair.a,71);outerEvent('pointerdown',pair.b,72);e.preventDefault();e.stopImmediatePropagation()},{capture:true});
      d.addEventListener('pointermove',e=>{if(!pair.enabled||!pair.last)return;const dx=e.clientX-pair.last.x,dy=e.clientY-pair.last.y;pair.last={x:e.clientX,y:e.clientY};pair.moveX+=dx;pair.moveY+=dy;
        if(e.shiftKey){pair.a.x=clamp(pair.a.x-dx/w.innerWidth,0.03,.97);pair.b.x=clamp(pair.b.x+dx/w.innerWidth,0.03,.97);pair.a.y=clamp(pair.a.y-dy/w.innerHeight,0.03,.97);pair.b.y=clamp(pair.b.y+dy/w.innerHeight,0.03,.97)}
        else if(e.altKey){const cx=(pair.a.x+pair.b.x)/2,cy=(pair.a.y+pair.b.y)/2,angle=dx*.012,rx=pair.a.x-cx,ry=pair.a.y-cy,co=Math.cos(angle),si=Math.sin(angle);pair.a.x=clamp(cx+rx*co-ry*si,.03,.97);pair.a.y=clamp(cy+rx*si+ry*co,.03,.97);pair.b.x=clamp(2*cx-pair.a.x,.03,.97);pair.b.y=clamp(2*cy-pair.a.y,.03,.97)}
        else {pair.a.x=clamp(pair.a.x+dx/w.innerWidth,.03,.97);pair.b.x=clamp(pair.b.x+dx/w.innerWidth,.03,.97);pair.a.y=clamp(pair.a.y+dy/w.innerHeight,.03,.97);pair.b.y=clamp(pair.b.y+dy/w.innerHeight,.03,.97)}
        if(pair.dragging){adjust(pair.a);adjust(pair.b);outerEvent('pointermove',pair.a,71);outerEvent('pointermove',pair.b,72)}render();e.preventDefault();e.stopImmediatePropagation()},{capture:true});
      d.addEventListener('pointerup',e=>{if(!pair.enabled||!pair.dragging)return;activateButton(pair.a);activateButton(pair.b);outerEvent('pointerup',pair.a,71);outerEvent('pointerup',pair.b,72);pair.dragging=false;pair.last=null;pair.a.target=null;pair.b.target=null;render();e.preventDefault();e.stopImmediatePropagation()},{capture:true});
      d.addEventListener('wheel',e=>{if(!pair.enabled)return;[pair.a,pair.b].forEach((p,i)=>{const el=resolve(p);if(el?.ownerDocument!==d)el?.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,clientX:point(p).x,clientY:point(p).y,deltaY:e.deltaY}));else if(el?.type==='range'){const step=Number(el.step)||1;dispatchInput(el,clamp((Number(el.value)||0)+(e.deltaY<0?step:-step),Number(el.min)||0,Number(el.max)||100))}});e.preventDefault()},{capture:true,passive:false});
      d.addEventListener('keydown',e=>{if(e.key==='Escape'&&pair.enabled){pair.dragging=false;pair.last=null;pair.a.target=null;pair.b.target=null;render();e.preventDefault()}},{capture:true});
      w.__enochTwoMixVirtualMice={version:'v1',enable:()=>setEnabled(true),disable:()=>setEnabled(false),state:pair};
      setEnabled(false);return true;
    }catch(_){return false}
  }
  window.installEnochianTwoMixVirtualMice=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);return install(host)};
})();