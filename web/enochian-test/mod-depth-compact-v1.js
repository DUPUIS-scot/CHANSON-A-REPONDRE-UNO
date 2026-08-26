(()=>{
  function install(frame){
    try{
      const live=frame?.contentDocument,deck=live?.getElementById('deck'),d=deck?.contentDocument;
      if(!d)return false;
      if(d.documentElement.dataset.modDepthCompact==='v5')return true;
      const mod=d.querySelector('.mod'),wheelbox=mod?.querySelector('.wheelbox'),wheel=d.getElementById('modWheel');
      if(!mod||!wheelbox||!wheel)return false;
      d.documentElement.dataset.modDepthCompact='v5';
      d.documentElement.dataset.enochVisualShell='20260827-no-main-turntable';

      const sides=[...d.querySelectorAll('.grid>.side')];
      sides[0]?.classList.add('enoch-playback-panel');
      sides[1]?.classList.add('enoch-transform-panel');
      d.querySelector('.stage')?.classList.add('enoch-signal-stage');
      d.querySelector('.wave')?.classList.add('enoch-signal-surface');
      d.querySelector('.deckarea')?.classList.add('enoch-deck-controls');
      d.querySelector('.pad-panel')?.classList.add('enoch-fx-console');
      d.querySelector('.stem-isolator')?.classList.add('enoch-stems-console');
      mod.classList.add('enoch-mod-console');

      const title=d.querySelector('.top .title');
      if(title){title.textContent='ENOCHIAN TERMINAL';title.dataset.subtitle='CHANSON À RÉPONDRE UNO'}
      const leftTitle=sides[0]?.querySelector('.fx-title');
      if(leftTitle&&/DECK ENGINE/i.test(leftTitle.textContent||''))leftTitle.textContent='PLAYBACK';

      const style=d.createElement('style');
      style.dataset.enochVisualShell='20260827-no-main-turntable';
      style.textContent=`
        :root{
          --bg:#02090e!important;
          --line:#72532e!important;
          --line2:#9b7138!important;
          --cyan:#35d7ff!important;
          --green:#35d7ff!important;
          --gold:#d7a651!important;
          --text:#c8e4e8!important;
          --dim:#738f96!important;
          --enoch-bg:#031017;
          --enoch-panel:#06151c;
          --enoch-signal:#35d7ff;
          --enoch-signal-soft:rgba(53,215,255,.28);
          --enoch-ritual:#b98539;
          --enoch-ritual-bright:#d7a651;
          --enoch-ink:#a8c3c8;
        }
        html,body{background:#01060a!important;color:var(--text)!important}
        body{background:
          radial-gradient(circle at 50% 8%,rgba(24,66,77,.25),transparent 38%),
          linear-gradient(135deg,rgba(255,255,255,.012),transparent 45%),
          #031017!important}
        .app{gap:6px!important;padding:6px!important}
        .frame,.box,.fxbox,.mod,.console,.pad-panel,.stem-isolator,
        [class*="double-decker"],[class*="doubleDecker"]{
          position:relative!important;
          border-radius:2px!important;
          border-color:rgba(185,133,57,.58)!important;
          background:
            radial-gradient(circle at 30% 20%,rgba(25,53,61,.13),transparent 38%),
            linear-gradient(180deg,rgba(5,18,25,.97),rgba(2,10,15,.98))!important;
          box-shadow:inset 0 0 0 1px rgba(218,161,68,.07),inset 0 0 24px rgba(0,0,0,.55)!important;
        }
        .frame:before,.box:before,.fxbox:before,.mod:before,.console:before,.pad-panel:before,.stem-isolator:before{
          content:"";position:absolute;inset:4px;border:1px solid rgba(185,133,57,.12);pointer-events:none;z-index:0
        }
        .frame>* ,.box>* ,.fxbox>* ,.mod>* ,.console>* ,.pad-panel>* ,.stem-isolator>*{position:relative;z-index:1}
        .top{border-color:rgba(215,166,81,.72)!important;background:linear-gradient(180deg,#071820,#030c11)!important}
        .top .title{font-family:"Arial Narrow","Roboto Condensed",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace!important;color:#d7a651!important;font-size:12px!important;font-weight:700!important;letter-spacing:.32em!important;text-shadow:0 0 14px rgba(215,166,81,.18)!important;line-height:1.05!important}
        .top .title:after{content:attr(data-subtitle);display:block;margin-top:4px;color:#769ca6;font-size:6px;letter-spacing:.28em;font-weight:600}
        .badge{border-radius:2px!important;border-color:rgba(53,215,255,.45)!important;background:#031116!important;color:#35d7ff!important;box-shadow:inset 0 0 12px rgba(53,215,255,.08)!important}
        .avatar{border-color:#b98539!important;box-shadow:0 0 0 1px #02090e,0 0 14px rgba(185,133,57,.18)!important}
        .home-link{border-radius:2px!important;background:#061217!important;border-color:#8a6535!important;color:#d7a651!important}
        .fx-title,.label,.wheel-label,.stem-title,.instant-fx-title,.mixer-level-title{
          font-family:"Arial Narrow","Roboto Condensed",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace!important;
          text-transform:uppercase!important;letter-spacing:.18em!important;color:#b8a173!important
        }
        .track{color:#d8eef1!important;letter-spacing:.04em!important}
        .time,.sig b{color:#35d7ff!important}
        .btn,select.btn{
          border-radius:2px!important;border-color:#46656a!important;background:linear-gradient(180deg,#07171c,#031014)!important;color:#a8cbd1!important;
          box-shadow:inset 0 0 0 1px rgba(255,255,255,.018)!important
        }
        .btn:hover,.btn:focus-visible{border-color:#d7a651!important;color:#f0c97e!important;background:#0a1719!important}
        .btn.active,.stem-toggle.active,.terminal-action.active{
          background:#05222b!important;color:#74e8ff!important;border-color:#35d7ff!important;
          box-shadow:0 0 14px rgba(53,215,255,.16),inset 0 0 12px rgba(53,215,255,.08)!important
        }
        .range{accent-color:#35d7ff!important}
        .range::-webkit-slider-runnable-track{border-color:#38565d!important;background:linear-gradient(90deg,#35d7ff 0 var(--pct),#0a161a var(--pct) 100%)!important}
        .range::-webkit-slider-thumb{border-color:#d7a651!important;background:radial-gradient(circle at 35% 30%,#fff3c8 0 8%,#d7a651 14%,#735020 55%,#17100a 100%)!important}
        .wave,.enoch-signal-surface{
          border-radius:2px!important;border-color:rgba(53,215,255,.38)!important;
          background:
            linear-gradient(rgba(53,215,255,.035) 1px,transparent 1px),
            linear-gradient(90deg,rgba(53,215,255,.035) 1px,transparent 1px),
            radial-gradient(circle at 50% 52%,rgba(11,60,72,.34),transparent 62%),#020b10!important;
          background-size:18px 18px,18px 18px,auto,auto!important;
          box-shadow:inset 0 0 32px rgba(0,0,0,.72),0 0 18px rgba(53,215,255,.05)!important
        }
        .wave h2{color:#d7a651!important;letter-spacing:.34em!important}
        .sig{border-radius:1px!important;border-color:#244b53!important;background:#031116e8!important}
        .sig img,.mod-glyphs img{filter:invert(77%) sepia(88%) saturate(1712%) hue-rotate(156deg) brightness(104%) contrast(105%)!important}
        .deckarea:before{background:linear-gradient(90deg,transparent,#9a7138 12%,#315f69 50%,#9a7138 88%,transparent)!important;opacity:.5}
        .enoch-deck-controls>.platter-wrap{display:none!important}
        .enoch-deck-controls{grid-template-columns:minmax(96px,1fr) minmax(96px,1fr)!important;grid-template-areas:"eq fx"!important;max-width:360px!important;width:100%!important;margin:0 auto!important;align-items:center!important;justify-content:center!important}
        .enoch-deck-controls>.wheelbox.eq{grid-area:eq!important}
        .enoch-deck-controls>.wheelbox.fx{grid-area:fx!important}
        .enoch-deck-controls>.seek{display:none!important}
        .wheelbox{border-radius:2px!important;background:#031015!important}
        .wheel{
          border-color:#b98539!important;
          background:
            radial-gradient(circle at 50% 50%,#061920 0 34%,#020b10 35% 58%,transparent 59%),
            conic-gradient(from -135deg,#35d7ff 0 24deg,#15454f 24deg 270deg,#b98539 270deg 360deg)!important;
          box-shadow:inset 0 0 22px #000,0 0 0 3px #02090d,0 0 0 4px rgba(185,133,57,.5),0 0 20px rgba(53,215,255,.10)!important
        }
        .wheel:before{background:#d7a651!important;box-shadow:0 0 10px rgba(215,166,81,.75)!important}
        .wheel-value{color:#35d7ff!important;text-shadow:0 0 8px rgba(53,215,255,.28)!important}
        .mod-state div{border-color:#3d5150!important;background:#031014!important}
        .mod-state b{color:#35d7ff!important}
        .mod textarea{border-radius:2px!important;border-color:#4f6b6f!important;background:#020a0e!important;color:#bcdce1!important;box-shadow:inset 0 0 14px #000!important}
        .xy-pad{border-radius:2px!important;border-color:#8a6535!important;background:
          linear-gradient(90deg,transparent 49.5%,rgba(53,215,255,.30) 50%,transparent 50.5%),
          linear-gradient(0deg,transparent 49.5%,rgba(53,215,255,.30) 50%,transparent 50.5%),
          radial-gradient(circle at 50% 50%,#0b2530,#020b10 68%,#01070a)!important}
        .pad-dot{background:radial-gradient(circle,#dffaff 0 14%,#35d7ff 34%,#155266 70%,#041218 100%)!important;border-color:#d7a651!important;box-shadow:0 0 0 2px #02090d,0 0 18px rgba(53,215,255,.58)!important}
        .instant-fx-btn{border-radius:2px!important;border-color:#4a656a!important;background:linear-gradient(180deg,#07161b,#020b0f)!important}
        .instant-fx-btn.active{background:#06242c!important;border-color:#35d7ff!important;box-shadow:0 0 16px rgba(53,215,255,.18),inset 0 0 0 1px rgba(53,215,255,.22)!important}
        .stem-isolator{border-color:#795b34!important}
        .stem-range{accent-color:#35d7ff!important}
        .stem-value,.pad-readout,.mixer-level-value{color:#35d7ff!important}
        .console-lines{color:#799da5!important}
        .signal-flow-line{color:#35d7ff!important;text-shadow:0 0 8px rgba(53,215,255,.18)!important}
        .foot{color:#725f42!important;letter-spacing:.22em!important}

        .mod{grid-template-columns:minmax(0,1fr) 96px!important;align-items:start!important;transform:translateY(-12px)!important;transform-origin:center top!important;position:relative!important;z-index:1!important}
        .mod>.wheelbox{align-self:start!important;justify-self:center!important;width:96px!important;margin:0!important;padding:0 2px 2px!important;gap:1px!important}
        .mod>.wheelbox .wheel{width:74px!important;height:74px!important}
        .mod>.wheelbox .wheel:before{top:7px!important;height:19px!important;transform-origin:2px 30px!important}
        .mod>.wheelbox .wheel-label{font-size:8px!important;line-height:1!important;margin:0!important}
        .mod>.wheelbox .wheel-value{font-size:9px!important;line-height:1!important;min-height:9px!important;margin:-1px 0 0!important}
        .mod>.wheelbox .wheel-hint{font-size:5.5px!important;line-height:1!important;margin:0!important;padding:0!important}
        .mod + .pad-panel{position:relative!important;z-index:2!important;margin-top:0!important;transform:none!important;pointer-events:auto!important}
        .pad-panel,.pad-panel *{pointer-events:auto}

        @media(min-width:1001px){
          .grid{grid-template-columns:minmax(205px,20%) minmax(520px,52%) minmax(225px,28%)!important;gap:6px!important}
          .side{border-radius:2px!important;padding:7px!important;gap:5px!important}
          .stage{padding:7px!important;gap:5px!important;grid-template-rows:minmax(120px,18vh) minmax(0,1fr) auto auto auto!important}
          .enoch-playback-panel>.fx-title:first-child{color:#d7a651!important;font-size:9px!important;border-bottom:1px solid rgba(185,133,57,.32);padding:2px 2px 7px}
          .enoch-signal-stage:before{border-color:rgba(53,215,255,.10)!important}
          .enoch-signal-surface{min-height:120px!important}
          .enoch-deck-controls{min-height:92px!important}
          .enoch-mod-console{border-color:rgba(185,133,57,.68)!important}
          .enoch-mod-console>.wheelbox{width:118px!important}
          .enoch-mod-console>.wheelbox .wheel{width:92px!important;height:92px!important}
          .enoch-mod-console>.wheelbox .wheel:before{top:8px!important;height:24px!important;transform-origin:2px 38px!important}
          .enoch-mod-console{grid-template-columns:minmax(0,1fr) 118px!important}
        }

        html.enoch-ios-landscape .ios-second-center{display:grid!important;grid-template-rows:auto minmax(0,1fr)!important;align-content:start!important;overflow:visible!important}
        html.enoch-ios-landscape .ios-second-center>.mod{transform:translateY(-12px)!important;transform-origin:center top!important;position:relative!important;z-index:1!important;margin-bottom:-12px!important}
        html.enoch-ios-landscape .ios-second-center>.pad-panel{position:relative!important;z-index:2!important;transform:none!important;margin-top:0!important;pointer-events:auto!important}
        @media(max-width:1000px){
          .app{gap:4px!important;padding:4px!important}
          .enoch-deck-controls>.platter-wrap{display:none!important}
          .enoch-deck-controls{grid-template-columns:1fr 1fr!important;grid-template-areas:"eq fx"!important;max-width:320px!important}
          .mod{grid-template-columns:1fr!important;transform:translateY(-12px)!important}
          .mod>.wheelbox{width:76px!important;margin:0 auto!important}
          .mod>.wheelbox .wheel{width:58px!important;height:58px!important}
          .mod>.wheelbox .wheel:before{top:5px!important;height:15px!important;transform-origin:2px 24px!important}
          .mod + .pad-panel{clear:both!important;position:relative!important;z-index:2!important}
          .top .title{font-size:9px!important;letter-spacing:.22em!important}
          .top .title:after{font-size:5px!important;margin-top:2px!important}
        }
      `;
      d.head.appendChild(style);
      return true;
    }catch(_){return false}
  }
  let timer=0,lastFrame=null;
  window.installEnochianModDepthCompactV1=frame=>{
    lastFrame=frame;
    if(install(frame)){if(timer){clearInterval(timer);timer=0}return true}
    if(!timer){let n=0;timer=setInterval(()=>{if(install(lastFrame)||++n>240){clearInterval(timer);timer=0}},50)}
    return false;
  };
})();