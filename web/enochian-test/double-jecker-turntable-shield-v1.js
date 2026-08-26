(()=>{
  'use strict';
  const STORE='doubleJeckerTurntableShieldRect';
  function install(host){
    try{
      const live=host&&host.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
      const panel=document.getElementById('doubleDeckerSpecial');
      const launcher=d&&d.getElementById('doubleDeckerSpecialLaunch');
      const api=w&&w.__enochDoubleDeckerSpecial;
      const master=d&&d.getElementById('audio');
      if(!d||!w||!panel||!launcher||!api||!master)return false;
      if(document.documentElement.dataset.doubleJeckerTurntableShield==='v1')return true;
      document.documentElement.dataset.doubleJeckerTurntableShield='v1';

      panel.setAttribute('aria-label','DOUBLE JECKER SPECIAL');
      panel.querySelectorAll('strong,.dds-foot span').forEach(el=>{el.textContent=el.textContent.replace(/DOUBLE DECKER SPECIAL/g,'DOUBLE JECKER SPECIAL')});
      launcher.textContent='DOUBLE JECKER SPECIAL';
      launcher.setAttribute('aria-label','Open DOUBLE JECKER SPECIAL');

      let style=document.getElementById('double-jecker-turntable-shield-style');
      if(!style){
        style=document.createElement('style');style.id='double-jecker-turntable-shield-style';style.textContent=`
          #doubleJeckerShield{position:fixed;left:18px;top:18px;width:150px;height:150px;z-index:2147483200;border-radius:50%;display:grid;place-items:center;touch-action:none;user-select:none;cursor:grab;filter:drop-shadow(0 14px 22px #000b)}
          #doubleJeckerShield.dragging{cursor:grabbing}
          #doubleJeckerShield .djs-rim{position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 45% 35%,#3c3527 0 5%,#18130b 22%,#050504 58%,#241b0d 74%,#090806 76% 100%);border:2px solid #8c7447;box-shadow:inset 0 0 0 5px #080704,inset 0 0 0 7px #44351d,0 0 0 1px #020202,0 0 24px #000d}
          #doubleJeckerShield .djs-platter{position:absolute;inset:13px;border-radius:50%;background:repeating-radial-gradient(circle,#111 0 2px,#080808 2px 4px);border:1px solid #3c3424;display:grid;place-items:center;transition:box-shadow .2s,border-color .2s}
          #doubleJeckerShield.engine-on .djs-platter{border-color:#63f5cf;box-shadow:0 0 20px #19c98f55,inset 0 0 18px #19c98f22}
          #doubleJeckerShield.playing .djs-platter{animation:djs-spin 3.2s linear infinite}
          @keyframes djs-spin{to{transform:rotate(360deg)}}
          #doubleJeckerShield .djs-center{position:absolute;width:66px;height:66px;border-radius:50%;border:1px solid #8c7447;background:radial-gradient(circle,#231b0d,#080705 72%);display:grid;place-items:center;color:#f0c97e;font:1000 19px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.04em;cursor:pointer;z-index:4;box-shadow:0 0 0 4px #050504,0 0 10px #000}
          #doubleJeckerShield.engine-on .djs-center{background:radial-gradient(circle,#173b31,#07110e 72%);border-color:#63f5cf;color:#63f5cf}
          #doubleJeckerShield .djs-title{position:absolute;left:15px;right:15px;top:22px;text-align:center;color:#d5aa63;font:900 6px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.14em;z-index:3;pointer-events:none;text-shadow:0 1px 2px #000}
          #doubleJeckerShield .djs-link{position:absolute;inset:7px;border-radius:50%;border:2px solid transparent;z-index:2;pointer-events:none}
          #doubleJeckerShield.jecker-linked .djs-link{border-color:#19c98f88;box-shadow:0 0 9px #19c98f55,inset 0 0 8px #19c98f22}
          #doubleJeckerShield .djs-stem{position:absolute;width:10px;height:10px;border-radius:50%;background:#17201e;border:1px solid #315b56;z-index:5;box-shadow:0 0 0 transparent;pointer-events:none}
          #doubleJeckerShield .djs-stem.live{background:#19c98f;border-color:#63f5cf;box-shadow:0 0 8px #19c98f99}
          #doubleJeckerShield .s-vocals{top:14px;left:70px}.s-drums{right:14px;top:70px}.s-bass{bottom:14px;left:70px}.s-other{left:14px;top:70px}
          #doubleJeckerShield .djs-state{position:absolute;bottom:27px;left:30px;right:30px;text-align:center;color:#789f99;font:800 6px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;pointer-events:none;z-index:3}
          #doubleJeckerShield.engine-on .djs-state{color:#63f5cf}
          #doubleJeckerShield.panel-open{opacity:.82}#doubleJeckerShield.takeover-active{opacity:0!important;pointer-events:none!important;transform:scale(.82)!important}
          @media(max-width:720px){#doubleJeckerShield{width:112px;height:112px;left:8px;top:8px}.djs-title{display:none!important}#doubleJeckerShield .djs-platter{inset:10px}#doubleJeckerShield .djs-center{width:48px;height:48px;font-size:14px}#doubleJeckerShield .djs-state{bottom:18px;font-size:5px}.s-vocals{top:9px!important;left:51px!important}.s-drums{right:9px!important;top:51px!important}.s-bass{bottom:9px!important;left:51px!important}.s-other{left:9px!important;top:51px!important}}
        `;document.head.appendChild(style);
      }

      let shield=document.getElementById('doubleJeckerShield');
      if(!shield){
        shield=document.createElement('section');shield.id='doubleJeckerShield';shield.setAttribute('role','group');shield.setAttribute('aria-label','DOUBLE JECKER SPECIAL floating turntable');
        shield.innerHTML='<div class="djs-rim"></div><div class="djs-link"></div><div class="djs-platter"></div><div class="djs-title">DOUBLE JECKER SPECIAL</div><i class="djs-stem s-vocals" data-jecker-stem="vocals"></i><i class="djs-stem s-drums" data-jecker-stem="drums"></i><i class="djs-stem s-bass" data-jecker-stem="bass"></i><i class="djs-stem s-other" data-jecker-stem="other"></i><button type="button" class="djs-center" aria-label="Open DOUBLE JECKER SPECIAL">2J</button><div class="djs-state">READY</div>';
        document.body.appendChild(shield);
      }

      try{const saved=JSON.parse(localStorage.getItem(STORE)||'null');if(saved&&Number.isFinite(saved.left)&&Number.isFinite(saved.top)){shield.style.left=saved.left+'px';shield.style.top=saved.top+'px'}}catch(_){}
      const clampPos=()=>{const r=shield.getBoundingClientRect(),left=Math.max(0,Math.min(innerWidth-r.width,parseFloat(shield.style.left)||r.left)),top=Math.max(0,Math.min(innerHeight-r.height,parseFloat(shield.style.top)||r.top));shield.style.left=left+'px';shield.style.top=top+'px';return{left,top}};
      let drag=null,moved=false;
      shield.addEventListener('pointerdown',e=>{if(e.target.closest('.djs-center'))return;const r=shield.getBoundingClientRect();drag={id:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top};moved=false;shield.classList.add('dragging');try{shield.setPointerCapture(e.pointerId)}catch(_){}});
      shield.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;e.preventDefault();moved=true;shield.style.left=(e.clientX-drag.dx)+'px';shield.style.top=(e.clientY-drag.dy)+'px';clampPos()});
      const endDrag=e=>{if(!drag||drag.id!==e.pointerId)return;drag=null;shield.classList.remove('dragging');const pos=clampPos();try{localStorage.setItem(STORE,JSON.stringify(pos))}catch(_){};try{shield.releasePointerCapture(e.pointerId)}catch(_){}};
      shield.addEventListener('pointerup',endDrag);shield.addEventListener('pointercancel',endDrag);

      const center=shield.querySelector('.djs-center');
      center.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();launcher.click()});

      const mask=()=>{const j=w.__enochStemJecker||w.__enochStemDecker;if(j&&typeof j.liveMask==='function')return j.liveMask();const on=(stem)=>api.state?.slots?.A?.[stem]?.on!==false||api.state?.slots?.B?.[stem]?.on!==false;return{vocals:on('vocals'),drums:on('drums'),bass:on('bass'),other:on('other')}};
      const paint=()=>{
        const engineOn=!!api.state?.enabled,playing=engineOn&&['A','B'].some(deckName=>['vocals','drums','bass','other'].some(stem=>{const media=api.state?.slots?.[deckName]?.[stem]?.media;return media&&!media.paused&&!media.ended})),linked=!!(w.__enochStemJecker||w.__enochStemDecker)?.linked,open=panel.classList.contains('open');
        shield.classList.toggle('engine-on',engineOn);shield.classList.toggle('playing',playing);shield.classList.toggle('jecker-linked',linked);shield.classList.toggle('panel-open',open);shield.classList.toggle('takeover-active',engineOn&&panel.classList.contains('jecker-takeover'));
        const m=mask();Object.entries(m).forEach(([stem,on])=>shield.querySelector(`[data-jecker-stem="${stem}"]`)?.classList.toggle('live',!!on));
        const state=shield.querySelector('.djs-state');if(state)state.textContent=engineOn?(playing?'ENGINE · PLAY':'ENGINE · PAUSE'):(linked?'STEM JECKER':'READY');
        center.setAttribute('aria-expanded',String(open));center.title=open?'DOUBLE JECKER SPECIAL OPEN':'Open DOUBLE JECKER SPECIAL';
      };
      master.addEventListener('play',paint);master.addEventListener('pause',paint);master.addEventListener('ended',paint);
      const observer=new MutationObserver(paint);observer.observe(panel,{attributes:true,attributeFilter:['class']});
      const timer=setInterval(paint,250);paint();
      w.addEventListener('pagehide',()=>{clearInterval(timer);observer.disconnect()},{once:true});
      window.addEventListener('resize',clampPos);
      w.__enochDoubleJeckerShield={version:'v1',element:shield,paint,open:()=>{if(!panel.classList.contains('open'))launcher.click()},close:()=>{if(panel.classList.contains('open'))launcher.click()}};
      return true;
    }catch(_){return false}
  }
  window.installEnochianDoubleJeckerTurntableShieldV1=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);return install(host)};
})();
