(()=>{
  'use strict';
  function install(host){
    try{
      const live=host&&host.contentDocument,deck=live&&live.getElementById('deck'),d=deck&&deck.contentDocument,w=d&&d.defaultView;
      if(!d||!w||d.documentElement.dataset.padFxAuthority==='v2')return !!d;
      const script=d.createElement('script');script.id='padFxAuthorityV2Inline';script.textContent=`(()=>{
        'use strict';
        if(window.__enochPadFxAuthorityV2)return;
        const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
        let fx=null,mode=null,x=.5,y=.5,gateTimer=0;
        const impulse=(ac,seconds=2.2,decay=2.8)=>{const rate=ac.sampleRate,len=Math.max(1,Math.floor(rate*seconds)),buf=ac.createBuffer(2,len,rate);for(let c=0;c<2;c++){const data=buf.getChannelData(c);for(let i=0;i<len;i++){const t=i/len;data[i]=(Math.random()*2-1)*Math.pow(1-t,decay)}}return buf};
        async function setup(){
          if(typeof ensureAudio==='function')await ensureAudio();
          if(!ctx||!drive||!master)throw new Error('PAD FX GRAPH UNAVAILABLE');
          if(fx)return fx;
          const input=ctx.createGain();input.gain.value=1;drive.connect(input);
          const mkOut=()=>{const g=ctx.createGain();g.gain.value=0;g.connect(master);return g};
          const echoDelay=ctx.createDelay(1.5),echoFb=ctx.createGain(),echoOut=mkOut();echoDelay.delayTime.value=.28;echoFb.gain.value=.42;input.connect(echoDelay);echoDelay.connect(echoFb).connect(echoDelay);echoDelay.connect(echoOut);
          const convolver=ctx.createConvolver(),reverbTone=ctx.createBiquadFilter(),reverbOut=mkOut();convolver.buffer=impulse(ctx,2.6,3.2);reverbTone.type='lowpass';reverbTone.frequency.value=9000;input.connect(convolver).connect(reverbTone).connect(reverbOut);
          const phasers=[0,1,2,3].map(()=>{const n=ctx.createBiquadFilter();n.type='allpass';n.Q.value=7;return n});for(let i=0;i<phasers.length-1;i++)phasers[i].connect(phasers[i+1]);const phaserOut=mkOut();input.connect(phasers[0]);phasers[phasers.length-1].connect(phaserOut);const phaserLfo=ctx.createOscillator(),phaserDepth=ctx.createGain();phaserLfo.type='sine';phaserLfo.frequency.value=.55;phaserDepth.gain.value=850;phaserLfo.connect(phaserDepth);phasers.forEach((n,i)=>{n.frequency.value=420+i*310;phaserDepth.connect(n.frequency)});phaserLfo.start();
          const flangerDelay=ctx.createDelay(.05),flangerFb=ctx.createGain(),flangerOut=mkOut(),flangerLfo=ctx.createOscillator(),flangerDepth=ctx.createGain();flangerDelay.delayTime.value=.006;flangerFb.gain.value=.28;input.connect(flangerDelay);flangerDelay.connect(flangerFb).connect(flangerDelay);flangerDelay.connect(flangerOut);flangerLfo.type='sine';flangerLfo.frequency.value=.22;flangerDepth.gain.value=.004;flangerLfo.connect(flangerDepth).connect(flangerDelay.delayTime);flangerLfo.start();
          const crusher=ctx.createWaveShaper(),crusherTone=ctx.createBiquadFilter(),crusherOut=mkOut();crusherTone.type='lowpass';crusherTone.frequency.value=5200;input.connect(crusher).connect(crusherTone).connect(crusherOut);
          const gateGain=ctx.createGain(),gateOut=mkOut();gateGain.gain.value=1;input.connect(gateGain).connect(gateOut);
          fx={input,echoDelay,echoFb,echoOut,convolver,reverbTone,reverbOut,phasers,phaserLfo,phaserDepth,phaserOut,flangerDelay,flangerFb,flangerLfo,flangerDepth,flangerOut,crusher,crusherTone,crusherOut,gateGain,gateOut};return fx;
        }
        const curveFor=(amount)=>{const len=2048,a=new Float32Array(len),k=4+amount*60;for(let i=0;i<len;i++){const z=i*2/(len-1)-1;a[i]=Math.tanh(z*k)/Math.tanh(k)}return a};
        const stopGate=()=>{if(gateTimer){clearInterval(gateTimer);gateTimer=0}if(fx?.gateGain&&ctx)fx.gateGain.gain.setTargetAtTime(1,ctx.currentTime,.01)};
        const silence=()=>{if(!fx||!ctx)return;['echoOut','reverbOut','phaserOut','flangerOut','crusherOut','gateOut'].forEach(k=>fx[k].gain.setTargetAtTime(0,ctx.currentTime,.012));stopGate()};
        async function apply(nextMode,nx=x,ny=y){
          x=clamp(nx,0,1);y=clamp(ny,0,1);mode=nextMode;await setup();silence();
          try{if(wet)wet.gain.setTargetAtTime(0,ctx.currentTime,.01);if(delay)delay.delayTime.setTargetAtTime(0,ctx.currentTime,.01);if(fb)fb.gain.setTargetAtTime(.18,ctx.currentTime,.01);if(filter){filter.type='lowpass';filter.frequency.setTargetAtTime(20000,ctx.currentTime,.01);if(filter.Q)filter.Q.setTargetAtTime(1,ctx.currentTime,.01)}if(drive)drive.curve=null}catch(_){}
          const mix=clamp(typeof fxMix==='number'?fxMix:.5,0,1),wetAmt=.18+mix*.72;
          if(mode==='echo'){fx.echoDelay.delayTime.setTargetAtTime(.08+x*.62,ctx.currentTime,.012);fx.echoFb.gain.setTargetAtTime(.18+y*.68,ctx.currentTime,.012);fx.echoOut.gain.setTargetAtTime(wetAmt*(.3+y*.7),ctx.currentTime,.012)}
          else if(mode==='reverb'){fx.reverbTone.frequency.setTargetAtTime(1800+x*15000,ctx.currentTime,.012);fx.reverbOut.gain.setTargetAtTime(wetAmt*(.4+y*.75),ctx.currentTime,.018)}
          else if(mode==='phaser'){fx.phaserLfo.frequency.setTargetAtTime(.12+x*2.8,ctx.currentTime,.02);fx.phaserDepth.gain.setTargetAtTime(180+y*2200,ctx.currentTime,.02);fx.phasers.forEach((n,i)=>{n.Q.setTargetAtTime(2+y*18,ctx.currentTime,.02);n.frequency.setTargetAtTime(220+i*260+x*1200,ctx.currentTime,.02)});fx.phaserOut.gain.setTargetAtTime(wetAmt*(.28+y*.58),ctx.currentTime,.015)}
          else if(mode==='flanger'){fx.flangerLfo.frequency.setTargetAtTime(.06+x*1.9,ctx.currentTime,.02);fx.flangerDepth.gain.setTargetAtTime(.0015+y*.008,ctx.currentTime,.02);fx.flangerFb.gain.setTargetAtTime(.08+y*.7,ctx.currentTime,.02);fx.flangerOut.gain.setTargetAtTime(wetAmt*(.22+y*.58),ctx.currentTime,.015)}
          else if(mode==='bitcrusher'){fx.crusher.curve=curveFor(.18+x*.82);fx.crusherTone.frequency.setTargetAtTime(900+Math.pow(1-y,1.6)*12000,ctx.currentTime,.015);fx.crusherOut.gain.setTargetAtTime(wetAmt*(.25+y*.55),ctx.currentTime,.015)}
          else if(mode==='gate'){fx.gateOut.gain.setTargetAtTime(wetAmt,ctx.currentTime,.01);const hz=2+x*14,duty=.15+y*.68;gateTimer=setInterval(()=>{if(!ctx||mode!=='gate')return;const phase=(performance.now()/1000*hz)%1;fx.gateGain.gain.setTargetAtTime(phase<duty?1:.025,ctx.currentTime,.004)},16)}
          try{log('PAD FX V2 · '+String(mode||'OFF').toUpperCase())}catch(_){}
        }
        function bind(){
          const pad=document.getElementById('xyPad'),box=pad?.closest('.pad-panel'),modeBox=box?.querySelector('.pad-mode'),readout=document.getElementById('padReadout'),dot=document.getElementById('padDot');if(!pad||!modeBox)return false;
          modeBox.querySelectorAll('[data-pad-fx]').forEach(btn=>{btn.onclick=async e=>{e?.preventDefault?.();modeBox.querySelectorAll('[data-pad-fx]').forEach(b=>b.classList.toggle('active',b===btn));await apply(btn.dataset.padFx,x,y)}});
          const setFromEvent=async e=>{const r=pad.getBoundingClientRect();x=clamp((e.clientX-r.left)/Math.max(1,r.width),0,1);y=clamp(1-(e.clientY-r.top)/Math.max(1,r.height),0,1);if(dot){dot.style.left=(x*100)+'%';dot.style.top=((1-y)*100)+'%'}if(readout)readout.textContent='X '+Math.round(x*100)+' · Y '+Math.round(y*100);if(mode)await apply(mode,x,y)};
          pad.onpointerdown=async e=>{try{pad.setPointerCapture(e.pointerId)}catch(_){};await setFromEvent(e)};pad.onpointermove=async e=>{if(!pad.hasPointerCapture?.(e.pointerId))return;await setFromEvent(e)};
          document.documentElement.dataset.padFxAuthority='v2';return true;
        }
        window.__enochPadFxAuthorityV2={version:'v2',setup,apply,get mode(){return mode},bind};
        let tries=0,t=setInterval(()=>{if(bind()||++tries>180)clearInterval(t)},50);bind();
      })();`;
      d.body.appendChild(script);
      return true;
    }catch(_){return false}
  }
  window.installEnochianPadFxAuthorityV2=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);return install(host)};
})();
