(()=>{
  'use strict';
  const VERSION='v1';
  const FX=[
    ['radio','RADIO'],
    ['freeze','FREEZE'],
    ['stutter','STUTTER'],
    ['reverse','REVERSE'],
    ['ring','RING MOD'],
    ['shift','FREQ SHIFT'],
    ['shimmer','SHIMMER']
  ];
  const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,Number(value)||0));

  function install(host){
    try{
      const live=host?.contentDocument,deck=live?.getElementById('deck'),d=deck?.contentDocument,w=d?.defaultView;
      const api=w?.__enochDoubleDeckerSpecial,panel=document.getElementById('doubleDeckerSpecial');
      if(!d||!w||!api||!panel)return false;
      if(panel.dataset.dj360Table===VERSION)return true;
      panel.dataset.dj360Table=VERSION;

      let style=document.getElementById('dj360-signal-table-style');
      if(style)style.remove();
      style=document.createElement('style');
      style.id='dj360-signal-table-style';
      style.textContent=\`
        .dj360-table{display:grid;gap:6px;border:1px solid #805b31;border-radius:7px;padding:7px;background:linear-gradient(145deg,#160b08,#030607 56%,#10100c);box-shadow:inset 0 0 0 1px #2e2013,0 0 18px #e22b1828;color:#e8d0a0;font:800 7px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
        .dj360-head{display:flex;align-items:center;justify-content:space-between;gap:6px;color:#f7d991;letter-spacing:.11em}.dj360-head b{color:#ff654e}.dj360-head output{color:#7ff3e0;font-size:6px;text-align:right}
        .dj360-stage{position:relative;display:grid;place-items:center;min-height:132px;overflow:hidden;border:1px solid #3e3320;border-radius:5px;background:radial-gradient(ellipse at center,#301008 0,#0c0908 48%,#020303 76%)}
        .dj360-underlay{position:absolute;inset:auto 5px 5px;z-index:0;color:#77c8cc55;text-align:center;letter-spacing:.12em;font-size:6px}
        .dj360-disc{--turn:0deg;position:relative;z-index:1;width:118px;height:118px;border:0;border-radius:50%;cursor:grab;touch-action:none;transform:rotate(var(--turn));background:repeating-radial-gradient(circle at 50% 50%,#414141 0 1px,#161616 2px 4px,#4e4e4e 5px 6px,#151515 7px 10px),conic-gradient(from 20deg,#8b8b8b,#242424,#747474,#151515,#999,#272727,#8b8b8b);box-shadow:inset 0 0 0 4px #080808,inset 0 0 0 6px #a29378,inset 0 0 0 8px #1d1711,0 0 0 1px #d5a552,0 0 24px #e72c1d8c;transition:box-shadow .16s}
        .dj360-disc:before{content:'';position:absolute;left:50%;top:-16px;width:25px;height:29px;transform:translateX(-50%);border:5px solid #737373;border-bottom:0;border-radius:16px 16px 0 0;background:#252525;box-shadow:inset 0 0 0 1px #bbb}
        .dj360-disc:after{content:'◉';position:absolute;inset:30px;border:1px solid #f1dba8;border-radius:50%;display:grid;place-items:center;color:#f1dba8;background:radial-gradient(circle,#38120c 0 18%,#140b09 19% 51%,#4a1611 52% 55%,#080909 56%);font-size:30px;text-shadow:0 0 8px #ff301c}.dj360-disc:active{cursor:grabbing;box-shadow:inset 0 0 0 4px #080808,inset 0 0 0 6px #fff0ba,0 0 0 1px #fff0ba,0 0 38px #ff3822}
        .dj360-route{display:grid;grid-template-columns:1fr auto 1fr;gap:5px;align-items:center;color:#d1c19d;font-size:6px}.dj360-route b{color:#ff754d;text-align:center}.dj360-route span:last-child{text-align:right;color:#78e4db}
        .dj360-fx{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px}.dj360-fx button{min-height:24px;border:1px solid #4d4030;border-radius:3px;background:#070b0b;color:#cdbd98;font:900 6px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;cursor:pointer}.dj360-fx button.active{border-color:#ff5e44;background:#35110d;color:#fff0bd;box-shadow:0 0 12px #ff311e88}
        .dj360-help{color:#83a8a5;font-size:6px;text-align:center;letter-spacing:.04em}
        @media(max-width:720px){.dj360-stage{min-height:112px}.dj360-disc{width:98px;height:98px}.dj360-disc:after{inset:25px;font-size:24px}.dj360-fx{grid-template-columns:repeat(3,minmax(0,1fr))}}
      \`;
      document.head.appendChild(style);

      const center=panel.querySelector('.dds-center')||panel;
      let root=panel.querySelector('[data-dj360-table]');
      if(!root){
        root=document.createElement('section');
        root.className='dj360-table';
        root.dataset.dj360Table='';
        root.setAttribute('aria-label','Double Jester 360 Signal Table');
        root.innerHTML='<div class="dj360-head"><b>2JESTER · 360 SIGNAL TABLE</b><output data-dj360-state>ARMED · MAIN UNDERLAY</output></div><div class="dj360-stage"><button type="button" class="dj360-disc" data-dj360-disc role="slider" aria-label="Double Jester 360 signal blend" aria-valuemin="0" aria-valuemax="360" aria-valuenow="0"></button><div class="dj360-underlay">MAIN PROGRAM · CONTINUES UNDERNEATH</div></div><div class="dj360-route"><span>JESTER A</span><b data-dj360-route>0° · A</b><span>JESTER B</span></div><div class="dj360-fx">'+FX.map(([id,label])=>'<button type="button" data-dj360-fx="'+id+'" aria-pressed="false">'+label+'</button>').join('')+'</div><div class="dj360-help">DRAG TAG TO BLEND A ↔ B · EFFECTS PROCESS JESTER ONLY</div>';
        center.insertBefore(root,center.querySelector('[data-jester-signal-route]')||center.firstChild);
      }
      const disc=root.querySelector('[data-dj360-disc]'),route=root.querySelector('[data-dj360-route]'),status=root.querySelector('[data-dj360-state]');
      const state=api.state.dj360||(api.state.dj360={angle:0,fx:{},stutterTimer:null,reverseTimer:null});

      const slots=()=>['A','B'].flatMap(deckName=>['vocals','drums','bass','other'].map(stem=>api.state?.slots?.[deckName]?.[stem]).filter(Boolean));
      const setOutputGain=(gain,value,time=.025)=>{try{const now=api.state.ctx?.currentTime||0;gain.cancelScheduledValues?.(now);gain.setTargetAtTime?.(value,now,time)|| (gain.value=value)}catch(_){try{gain.value=value}catch(__){}}};

      function ensureGraph(){
        const ctx=api.state?.ctx,source=api.state?.masterGain;
        if(!ctx||!source)return null;
        if(state.graph)return state.graph;
        const dry=ctx.createGain(),input=ctx.createGain(),radioHP=ctx.createBiquadFilter(),radioLP=ctx.createBiquadFilter(),radioDrive=ctx.createWaveShaper(),radioWet=ctx.createGain();
        const ring=ctx.createGain(),ringWet=ctx.createGain(),ringOsc=ctx.createOscillator(),ringDepth=ctx.createGain();
        const freezeDelay=ctx.createDelay(2),freezeFb=ctx.createGain(),freezeWet=ctx.createGain();
        const stutter=ctx.createGain(),stutterWet=ctx.createGain();
        const reverseA=ctx.createDelay(1),reverseB=ctx.createDelay(1),reverseWet=ctx.createGain();
        const shift=ctx.createBiquadFilter(),shiftWet=ctx.createGain(),shiftOsc=ctx.createOscillator(),shiftDepth=ctx.createGain();
        const shimmerDelay=ctx.createDelay(1),shimmerFb=ctx.createGain(),shimmerHP=ctx.createBiquadFilter(),shimmerWet=ctx.createGain();
        [dry,input,radioWet,ringWet,freezeWet,stutterWet,reverseWet,shiftWet,shimmerWet].forEach(node=>node.gain.value=0);
        dry.gain.value=1;radioHP.type='highpass';radioHP.frequency.value=550;radioLP.type='lowpass';radioLP.frequency.value=2800;
        const curve=new Float32Array(256);for(let i=0;i<256;i++){const x=i*2/255-1;curve[i]=Math.tanh(4*x)}radioDrive.curve=curve;
        ringOsc.frequency.value=43;ringDepth.gain.value=.72;ringOsc.connect(ringDepth).connect(ring.gain);ringOsc.start();
        freezeDelay.delayTime.value=.18;freezeFb.gain.value=.87;
        reverseA.delayTime.value=.31;reverseB.delayTime.value=.47;
        shift.type='bandpass';shift.Q.value=9;shift.frequency.value=1100;shiftOsc.frequency.value=.18;shiftDepth.gain.value=780;shiftOsc.connect(shiftDepth).connect(shift.frequency);shiftOsc.start();
        shimmerDelay.delayTime.value=.27;shimmerFb.gain.value=.62;shimmerHP.type='highpass';shimmerHP.frequency.value=1800;
        try{source.disconnect()}catch(_){}
        source.connect(dry).connect(ctx.destination);source.connect(input);
        input.connect(radioHP).connect(radioLP).connect(radioDrive).connect(radioWet).connect(ctx.destination);
        input.connect(ring).connect(ringWet).connect(ctx.destination);
        input.connect(freezeDelay);freezeDelay.connect(freezeFb).connect(freezeDelay);freezeDelay.connect(freezeWet).connect(ctx.destination);
        input.connect(stutter).connect(stutterWet).connect(ctx.destination);
        input.connect(reverseA).connect(reverseWet).connect(ctx.destination);input.connect(reverseB).connect(reverseWet);
        input.connect(shift).connect(shiftWet).connect(ctx.destination);
        input.connect(shimmerDelay);shimmerDelay.connect(shimmerFb).connect(shimmerDelay);shimmerDelay.connect(shimmerHP).connect(shimmerWet).connect(ctx.destination);
        state.graph={ctx,dry,radioWet,ringWet,freezeWet,stutter,stutterWet,reverseWet,shiftWet,shimmerWet};
        return state.graph;
      }
      function setFx(name,on){
        state.fx[name]=!!on;
        const graph=ensureGraph();
        if(graph){
          const mapping={radio:'radioWet',freeze:'freezeWet',stutter:'stutterWet',reverse:'reverseWet',ring:'ringWet',shift:'shiftWet',shimmer:'shimmerWet'};
          const gain=graph[mapping[name]]?.gain;if(gain)setOutputGain(gain,on?.68:0);
          if(name==='stutter'){setOutputGain(graph.stutter.gain,on?0:1);if(state.stutterTimer)clearInterval(state.stutterTimer);state.stutterTimer=null;if(on){let flip=false;state.stutterTimer=w.setInterval(()=>{flip=!flip;setOutputGain(graph.stutter.gain,flip?1:0,.008)},92)}}
        }
        root.querySelector('[data-dj360-fx="'+name+'"]')?.classList.toggle('active',!!on);
        root.querySelector('[data-dj360-fx="'+name+'"]')?.setAttribute('aria-pressed',String(!!on));
      }
      function setAngle(value){
        const angle=((Number(value)||0)%360+360)%360;state.angle=angle;
        disc.style.setProperty('--turn',angle+'deg');disc.setAttribute('aria-valuenow',String(Math.round(angle)));
        const mix=angle/360;api.setCrossfader?.(mix);
        const label=mix<.47?'A '+Math.round((1-mix*2)*100)+'%':mix>.53?'B '+Math.round((mix*2-1)*100)+'%':'A + B';
        route.textContent=Math.round(angle)+'° · '+label;
      }
      let drag=null;
      const pointAngle=event=>{const box=disc.getBoundingClientRect(),x=event.clientX-(box.left+box.width/2),y=event.clientY-(box.top+box.height/2);return (Math.atan2(y,x)*180/Math.PI+450)%360};
      disc.addEventListener('pointerdown',event=>{drag={start:pointAngle(event),angle:state.angle};disc.setPointerCapture?.(event.pointerId);event.preventDefault()});
      disc.addEventListener('pointermove',event=>{if(!drag)return;setAngle(drag.angle+pointAngle(event)-drag.start)});
      disc.addEventListener('pointerup',()=>{drag=null});
      disc.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowUp'){setAngle(state.angle+15);event.preventDefault()}if(event.key==='ArrowLeft'||event.key==='ArrowDown'){setAngle(state.angle-15);event.preventDefault()}});
      root.querySelectorAll('[data-dj360-fx]').forEach(button=>button.addEventListener('click',()=>{const name=button.dataset.dj360Fx;setFx(name,!state.fx[name])}));
      const sync=()=>{const on=!!api.state?.enabled;status.textContent=on?'LIVE · JESTER OVER MAIN':'ARMED · MAIN UNDERLAY';root.classList.toggle('is-live',on)};
      const oldEnable=api.enable,oldDisable=api.disable;
      if(!api.__dj360Wrapped){api.__dj360Wrapped=true;if(oldEnable)api.enable=async(...args)=>{const result=await oldEnable.apply(api,args);ensureGraph();sync();return result};if(oldDisable)api.disable=async(...args)=>{const result=await oldDisable.apply(api,args);sync();return result};}
      api.set360Angle=setAngle;api.set360Fx=setFx;api.ensure360Fx=ensureGraph;
      setAngle(state.angle);sync();
      return true;
    }catch(_){return false}
  }
  window.installEnochianDoubleJester360FxV1=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},60);return install(host)};
})();