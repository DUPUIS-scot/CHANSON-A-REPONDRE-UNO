(()=>{
  const CSS=`@supports (-webkit-touch-callout:none){@media (orientation:landscape) and (max-height:520px) and (pointer:coarse){
    html.enoch-ios-landscape,html.enoch-ios-landscape body{width:100%!important;height:auto!important;min-height:200dvh!important;overflow-x:hidden!important;overflow-y:auto!important;background:#000!important;scroll-behavior:smooth!important;-webkit-overflow-scrolling:touch!important}
    html.enoch-ios-landscape body{position:static!important}
    html.enoch-ios-landscape .app{box-sizing:border-box!important;width:100%!important;max-width:none!important;height:200dvh!important;min-height:200dvh!important;margin:0!important;padding:3px max(5px,env(safe-area-inset-right)) max(3px,env(safe-area-inset-bottom)) max(5px,env(safe-area-inset-left))!important;gap:3px!important;overflow:visible!important;grid-template-rows:32px minmax(0,calc(200dvh - 70px)) 32px!important}
    html.enoch-ios-landscape .grid{display:grid!important;height:100%!important;min-height:0!important;overflow:visible!important;grid-template-columns:minmax(175px,22%) minmax(0,1fr) minmax(190px,22%)!important;gap:3px!important;align-items:stretch!important}
    html.enoch-ios-landscape .side{box-sizing:border-box!important;height:100%!important;min-height:0!important;overflow:hidden!important;align-content:start!important}

    /* SCREEN 1: enlarged analyser plus dominant centred turntable. */
    html.enoch-ios-landscape .stage{box-sizing:border-box!important;min-height:0!important;height:100%!important;overflow:hidden!important;grid-template-rows:96px calc(100dvh - 132px) minmax(300px,1fr)!important;gap:3px!important}
    html.enoch-ios-landscape .wave{position:relative!important;min-height:0!important;height:96px!important;overflow:hidden!important;padding:0!important}
    html.enoch-ios-landscape .wave h2{position:relative!important;z-index:4!important;margin:4px 2px 0!important;font-size:6.3px!important;line-height:1!important;letter-spacing:.2em!important;white-space:nowrap!important}
    html.enoch-ios-landscape .wave canvas{position:absolute!important;left:5px!important;right:5px!important;top:21px!important;width:calc(100% - 10px)!important;height:40px!important;bottom:auto!important;z-index:1!important;opacity:.78!important}
    html.enoch-ios-landscape .wave .signals{position:absolute!important;left:4px!important;right:4px!important;bottom:4px!important;height:62px!important;display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:2px!important;z-index:3!important;pointer-events:none!important}
    html.enoch-ios-landscape .wave .sig{box-sizing:border-box!important;display:grid!important;grid-template-rows:auto auto 1fr!important;align-items:center!important;justify-items:center!important;min-width:0!important;height:62px!important;padding:2px 1px!important;overflow:hidden!important;background:#020807c8!important;border:1px solid #1a3c35!important}
    html.enoch-ios-landscape .wave .sig span{font-size:5.2px!important;line-height:1!important}
    html.enoch-ios-landscape .wave .sig b{font-size:6.8px!important;line-height:1!important;white-space:nowrap!important}
    html.enoch-ios-landscape .wave .sig img{width:30px!important;height:30px!important;max-width:30px!important;max-height:30px!important;object-fit:contain!important}

    html.enoch-ios-landscape .deckarea{position:relative!important;display:block!important;min-height:0!important;height:100%!important;overflow:hidden!important;padding:0 8px 28px!important}
    html.enoch-ios-landscape .deckarea>.platter-wrap{position:absolute!important;left:50%!important;top:46%!important;right:auto!important;bottom:auto!important;transform:translate(-50%,-50%)!important;width:min(42vh,176px)!important;height:min(42vh,176px)!important;max-width:176px!important;max-height:176px!important;margin:0!important;z-index:6!important}
    html.enoch-ios-landscape .deckarea>.platter-wrap .platter{width:100%!important;height:100%!important}
    html.enoch-ios-landscape .deckarea>.wheelbox{position:absolute!important;bottom:30px!important;width:52px!important;max-width:52px!important;overflow:visible!important;padding:1px!important;gap:1px!important;z-index:7!important;background:#020706e8!important}
    html.enoch-ios-landscape .deckarea>.wheelbox.eq{left:8px!important;right:auto!important;transform:none!important}
    html.enoch-ios-landscape .deckarea>.wheelbox.fx{right:8px!important;left:auto!important;transform:none!important}
    html.enoch-ios-landscape .deckarea>.wheelbox .wheel{width:48px!important;height:48px!important;min-width:48px!important;min-height:48px!important}
    html.enoch-ios-landscape .deckarea>.wheelbox .wheel-label{font-size:4.3px!important;line-height:1!important;white-space:nowrap!important}
    html.enoch-ios-landscape .deckarea>.wheelbox .wheel-value{font-size:4.8px!important;line-height:1!important}
    html.enoch-ios-landscape .deckarea>.wheelbox .wheel-hint{display:none!important}
    html.enoch-ios-landscape .deckarea>.seek{position:absolute!important;left:18%!important;right:18%!important;bottom:2px!important;z-index:9!important;gap:3px!important}

    /* SCREEN 2 centre: only FX PAD | MIX LEVEL | INSTANT FX. */
    html.enoch-ios-landscape .pad-panel.instant-layout{box-sizing:border-box!important;display:grid!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;overflow:hidden!important;grid-template-columns:minmax(0,1fr) 44px minmax(0,1fr)!important;grid-template-rows:36px minmax(0,1fr)!important;gap:4px!important;padding:4px!important}
    html.enoch-ios-landscape .pad-panel.instant-layout>*{box-sizing:border-box!important;min-width:0!important;max-width:100%!important}
    html.enoch-ios-landscape .pad-panel.instant-layout>.pad-top{grid-column:1!important;grid-row:1!important;overflow:hidden!important}
    html.enoch-ios-landscape .pad-mode{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:2px!important}
    html.enoch-ios-landscape .pad-mode .btn{min-width:0!important;min-height:16px!important;padding:1px!important;font-size:4px!important;line-height:1!important;overflow:hidden!important}
    html.enoch-ios-landscape .pad-panel.instant-layout>.xy-pad{grid-column:1!important;grid-row:2!important;width:100%!important;min-width:0!important;min-height:170px!important;height:100%!important}
    html.enoch-ios-landscape .mixer-level{grid-column:2!important;grid-row:1/3!important;width:100%!important;min-width:0!important;min-height:0!important;padding:2px 1px!important;gap:2px!important;overflow:hidden!important}
    html.enoch-ios-landscape .mixer-level-title{font-size:4.6px!important}
    html.enoch-ios-landscape .mixer-level-range{min-height:104px!important;width:23px!important;height:100%!important}
    html.enoch-ios-landscape .mixer-level-value{min-width:30px!important;min-height:18px!important;padding:1px!important;font-size:6.3px!important}
    html.enoch-ios-landscape .instant-fx{grid-column:3!important;grid-row:1/3!important;width:100%!important;min-width:0!important;min-height:0!important;overflow:hidden!important;padding:1px!important;gap:3px!important}
    html.enoch-ios-landscape .instant-fx-title{font-size:5.4px!important;line-height:1!important;white-space:nowrap!important;overflow:hidden!important}
    html.enoch-ios-landscape .instant-fx-grid{display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-template-rows:repeat(3,minmax(50px,1fr))!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;gap:3px!important}
    html.enoch-ios-landscape .instant-fx-btn{box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;min-height:50px!important;height:100%!important;padding:3px!important;overflow:hidden!important}
    html.enoch-ios-landscape .instant-fx-btn span{font-size:7.3px!important}
    html.enoch-ios-landscape .instant-fx-btn small{font-size:4.3px!important;margin-top:1px!important}
    html.enoch-ios-landscape .pad-panel.instant-layout>.mod-depth-box{display:none!important}

    /* MOD controls move under CHANNEL EQ in the left column. */
    html.enoch-ios-landscape .ios-mod-cluster{box-sizing:border-box!important;display:grid!important;grid-template-columns:minmax(0,1fr) 62px!important;grid-template-rows:auto!important;gap:3px!important;width:100%!important;min-height:138px!important;overflow:hidden!important;border:1px solid #17332e!important;border-radius:6px!important;background:#020706!important;padding:3px!important}
    html.enoch-ios-landscape .ios-mod-cluster .target-mod{box-sizing:border-box!important;display:grid!important;grid-template-rows:auto minmax(66px,1fr)!important;height:132px!important;min-height:132px!important;padding:3px!important;gap:3px!important;overflow:hidden!important;border:0!important;background:transparent!important}
    html.enoch-ios-landscape .ios-mod-cluster .target-mod .mod-main{display:grid!important;grid-template-rows:auto 1fr!important;grid-template-columns:1fr!important;gap:3px!important;min-width:0!important;min-height:0!important;height:100%!important}
    html.enoch-ios-landscape .ios-mod-cluster .target-mod .mod-head{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important;gap:3px!important;min-width:0!important;overflow:hidden!important}
    html.enoch-ios-landscape .ios-mod-cluster .target-mod .mod-head .label{display:block!important;font-size:5.6px!important;line-height:1.08!important;letter-spacing:.12em!important;white-space:normal!important}
    html.enoch-ios-landscape .ios-mod-cluster .target-mod .mod-head>*:not(.label){display:block!important}
    html.enoch-ios-landscape .ios-mod-cluster .target-mod textarea{display:block!important;visibility:visible!important;opacity:1!important;box-sizing:border-box!important;width:100%!important;height:78px!important;min-height:78px!important;max-height:78px!important;margin:0!important;padding:4px 5px!important;font-size:6px!important;line-height:1.2!important;resize:none!important;overflow:auto!important;background:#010403!important;color:#d7fff8!important;border:1px solid #315b56!important}
    html.enoch-ios-landscape .ios-mod-cluster .mod-depth-box{display:grid!important;width:62px!important;min-width:62px!important;min-height:132px!important;align-content:center!important;justify-items:center!important;padding:2px!important;gap:2px!important;overflow:hidden!important;background:#020706!important}
    html.enoch-ios-landscape .ios-mod-cluster .mod-depth-box .wheel{width:48px!important;height:48px!important;min-width:48px!important;min-height:48px!important}
    html.enoch-ios-landscape .ios-mod-cluster .mod-depth-box .wheel-label{font-size:4.4px!important}
    html.enoch-ios-landscape .ios-mod-cluster .mod-depth-box .wheel-value,html.enoch-ios-landscape .ios-mod-cluster .mod-depth-box .wheel-hint{font-size:4.2px!important;line-height:1.05!important}

    html.enoch-ios-landscape .grid>aside:last-child{min-height:0!important;height:100%!important;overflow:hidden!important;grid-template-rows:auto repeat(5,58px) 36px minmax(205px,1fr)!important;gap:3px!important;align-content:start!important}
    html.enoch-ios-landscape .grid>aside:last-child .fxbox{min-height:0!important;overflow:hidden!important;padding:4px!important;gap:2px!important}
    html.enoch-ios-landscape .grid>aside:last-child .range{height:14px!important}
    html.enoch-ios-landscape #killfx{min-height:32px!important;height:32px!important;padding:3px!important;font-size:6px!important}
    html.enoch-ios-landscape .console{min-height:205px!important;height:auto!important;overflow:hidden!important;padding:4px!important;gap:2px!important}
    html.enoch-ios-landscape .console-lines{height:100%!important;max-height:none!important;overflow:auto!important;font-size:4.7px!important;line-height:1.18!important;white-space:pre-wrap!important;word-break:break-word!important}
    html.enoch-ios-landscape .console-lines div{white-space:pre-wrap!important;overflow:visible!important;text-overflow:clip!important}
    html.enoch-ios-landscape .target-footer{height:32px!important;min-height:32px!important}

    html.enoch-ios-landscape .terminal-actions{position:relative!important;z-index:50!important}
    html.enoch-ios-landscape .ios-fullscreen{display:inline-flex!important;visibility:visible!important;opacity:1!important;align-items:center!important;justify-content:center!important;width:30px!important;min-width:30px!important;height:25px!important;padding:0!important;font-size:13px!important;line-height:1!important}
  }}`;

  function moveModLeft(d){
    const left=d.querySelector('.grid>aside:first-child');
    const mod=d.getElementById('phrase')?.closest('.mod');
    const lower=d.getElementById('xyPad')?.closest('.pad-panel');
    const depth=(lower&&lower.querySelector('.mod-depth-box'))||mod?.querySelector(':scope > .wheelbox');
    if(!left||!mod)return;
    let cluster=d.getElementById('iosModCluster');
    if(!cluster){cluster=d.createElement('div');cluster.id='iosModCluster';cluster.className='ios-mod-cluster';left.appendChild(cluster)}
    if(mod.parentElement!==cluster)cluster.appendChild(mod);
    mod.classList.add('target-mod');
    if(depth){depth.classList.add('mod-depth-box');if(depth.parentElement!==cluster)cluster.appendChild(depth)}
  }

  function installSignalConsole(d){
    if(d.documentElement.dataset.signalConsoleV12==='1')return;
    const log=d.getElementById('log'), audio=d.getElementById('audio');
    if(!log)return;
    d.documentElement.dataset.signalConsoleV12='1';
    let last='',lastAt=0;
    const stamp=()=>new Date().toLocaleTimeString([], {hour12:false});
    const push=text=>{const row=d.createElement('div');row.className='signal-flow-line';row.textContent='['+stamp()+'] '+text;log.prepend(row);while(log.children.length>18)log.lastChild.remove()};
    setInterval(()=>{
      const bits=[0,1,2,3].map(i=>d.getElementById('b'+i)?.textContent||'00000000');
      const state=bits.join('|');
      if(state==='00000000|00000000|00000000|00000000' && (!audio||audio.paused))return;
      const now=Date.now();if(state===last&&now-lastAt<900)return;last=state;lastAt=now;
      push('ENOCHIAN SIGNAL · BASS '+bits[0]+' · MID '+bits[1]+' · HIGH '+bits[2]+' · BEAT '+bits[3]);
      const flow=bits.join('').match(/.{1,8}/g)?.join(' ')||state;push('ENOCHIAN FLOW · '+flow);
    },420);
  }

  function install(frame){try{
    const live=frame.contentDocument;const deck=live&&live.getElementById('deck');const d=deck&&deck.contentDocument;
    if(!d||!d.head||!d.documentElement.classList.contains('enoch-ios-landscape'))return false;
    ['iphoneLandscapeLayoutV2','iphoneLandscapeLayoutV3','iphoneLandscapeLayoutV4','iphoneLandscapeLayoutV5','iphoneLandscapeLayoutV6','iphoneLandscapeLayoutV7','iphoneLandscapeLayoutV8','iphoneLandscapeLayoutV9','iphoneLandscapeLayoutV10','iphoneLandscapeLayoutV11'].forEach(id=>d.getElementById(id)?.remove());
    const s=d.createElement('style');s.id='iphoneLandscapeLayoutV12';s.textContent=CSS;d.head.appendChild(s);
    moveModLeft(d);installSignalConsole(d);d.documentElement.style.scrollSnapType='y proximity';
    try{d.defaultView.dispatchEvent(new Event('resize'))}catch(_){}return true
  }catch(_){return false}}
  window.installEnochianIphoneLandscapeV2=frame=>{let n=0;const t=setInterval(()=>{if(install(frame)||++n>200)clearInterval(t)},50)};
})();