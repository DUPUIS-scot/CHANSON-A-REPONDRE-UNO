(()=>{
 const CSS=`@supports (-webkit-touch-callout:none){@media (orientation:landscape) and (max-height:520px) and (pointer:coarse){
 html.enoch-ios-landscape,html.enoch-ios-landscape body{width:100%!important;height:100%!important;min-height:0!important;overflow:hidden!important;background:#000!important}
 html.enoch-ios-landscape body{position:static!important;-webkit-overflow-scrolling:auto!important}
 .enoch-ios-landscape .app{box-sizing:border-box!important;width:100%!important;max-width:none!important;height:100dvh!important;min-height:0!important;margin:0!important;padding:3px max(5px,env(safe-area-inset-right)) max(3px,env(safe-area-inset-bottom)) max(5px,env(safe-area-inset-left))!important;gap:3px!important;overflow:hidden!important;grid-template-rows:32px minmax(0,1fr) 32px!important}
 .enoch-ios-landscape .top{height:32px!important;min-height:32px!important;padding:2px 5px!important;overflow:hidden!important}
 .enoch-ios-landscape .avatar,.enoch-ios-landscape .home-link{width:26px!important;height:26px!important;min-width:26px!important;min-height:26px!important}
 .enoch-ios-landscape .title{font-size:8px!important;letter-spacing:.22em!important;white-space:nowrap!important}
 .enoch-ios-landscape #stemMasterToggle{display:inline-flex!important}
 .enoch-ios-landscape .terminal-actions{display:flex!important;gap:3px!important;align-items:center!important;flex-wrap:nowrap!important}
 .enoch-ios-landscape .terminal-action,.enoch-ios-landscape .badge{min-height:25px!important;padding:2px 5px!important;font-size:5.5px!important;white-space:nowrap!important}
 .enoch-ios-landscape .ios-fullscreen{display:inline-flex!important;visibility:visible!important;opacity:1!important;align-items:center!important;justify-content:center!important;width:28px!important;min-width:28px!important;height:25px!important;padding:0!important;font-size:14px!important;color:#ff8b16!important;border:1px solid #6f5938!important;background:#080b0a!important;z-index:20!important}

 .enoch-ios-landscape .grid{display:grid!important;height:100%!important;min-height:0!important;overflow:hidden!important;grid-template-columns:minmax(175px,22%) minmax(0,1fr) minmax(190px,22%)!important;gap:3px!important;align-items:stretch!important}
 .enoch-ios-landscape .side{box-sizing:border-box!important;height:100%!important;min-height:0!important;padding:4px!important;gap:2px!important;overflow:hidden!important;align-content:start!important}
 .enoch-ios-landscape .side h2,.enoch-ios-landscape .stem-title{font-size:6px!important;margin:1px!important;line-height:1.05!important}
 .enoch-ios-landscape .side .box,.enoch-ios-landscape .side .fxbox,.enoch-ios-landscape .stem-isolator{padding:3px!important;gap:2px!important}
 .enoch-ios-landscape .track{font-size:7px!important;line-height:1.05!important}
 .enoch-ios-landscape .time{font-size:5.5px!important;line-height:1!important}
 .enoch-ios-landscape .range{height:14px!important;margin:0!important}
 .enoch-ios-landscape .transport{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:2px!important;margin:0!important}
 .enoch-ios-landscape .transport .btn{box-sizing:border-box!important;min-width:0!important;min-height:25px!important;padding:2px!important;font-size:7px!important;line-height:1!important}
 .enoch-ios-landscape .loop-controls{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:2px!important;margin:1px 0 0!important;width:100%!important}
 .enoch-ios-landscape .loop-controls .btn{box-sizing:border-box!important;min-width:0!important;min-height:23px!important;padding:2px 1px!important;font-size:5px!important;line-height:1.05!important;white-space:normal!important;overflow:hidden!important}
 .enoch-ios-landscape select{min-height:22px!important;padding:2px 4px!important;font-size:6px!important}
 .enoch-ios-landscape .stem-row{grid-template-columns:48px minmax(0,1fr) 25px!important;gap:2px!important;min-height:19px!important}
 .enoch-ios-landscape .stem-toggle{padding:2px!important;font-size:5px!important;min-height:18px!important}
 .enoch-ios-landscape .stem-note{display:none!important}
 .enoch-ios-landscape .side label,.enoch-ios-landscape .side .label{font-size:5.5px!important;line-height:1!important}

 .enoch-ios-landscape .stage{box-sizing:border-box!important;height:100%!important;min-height:0!important;padding:4px!important;gap:3px!important;overflow:hidden!important;grid-template-rows:64px minmax(150px,1fr) 38px minmax(150px,36%)!important}
 .enoch-ios-landscape .wave{min-height:0!important;overflow:hidden!important}
 .enoch-ios-landscape .wave h2{margin:2px!important;font-size:6px!important;line-height:1!important}
 .enoch-ios-landscape .wave canvas{top:16px!important;height:27px!important;bottom:auto!important}
 .enoch-ios-landscape .signals{bottom:2px!important;gap:2px!important}
 .enoch-ios-landscape .sig{font-size:4.8px!important;padding:1px 2px!important;line-height:1!important}
 .enoch-ios-landscape .deckarea{position:relative!important;height:100%!important;min-height:0!important;padding:0 0 20px!important;gap:4px!important;grid-template-columns:68px minmax(125px,1fr) 68px!important;align-items:center!important;overflow:hidden!important}
 .enoch-ios-landscape .wheelbox{align-self:center!important;padding:1px!important;gap:2px!important;min-width:0!important}
 .enoch-ios-landscape .wheel{width:58px!important;height:58px!important;min-width:58px!important;min-height:58px!important}
 .enoch-ios-landscape .wheel-label{font-size:5px!important;line-height:1!important}
 .enoch-ios-landscape .wheel-value{font-size:6px!important;line-height:1!important}
 .enoch-ios-landscape .wheel-hint{font-size:4px!important;white-space:nowrap!important;line-height:1!important}
 .enoch-ios-landscape .platter-wrap{position:relative!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;transform:none!important;width:min(29vh,138px)!important;max-width:138px!important;height:min(29vh,138px)!important;max-height:138px!important;align-self:center!important;justify-self:center!important;margin:0!important;z-index:2!important}
 .enoch-ios-landscape .platter{width:100%!important;height:100%!important}
 .enoch-ios-landscape .platter-art{width:72%!important;height:72%!important}
 .enoch-ios-landscape .seek{position:absolute!important;left:18%!important;right:18%!important;bottom:1px!important;z-index:4!important;gap:3px!important}
 .enoch-ios-landscape .seek .btn{min-width:34px!important;min-height:20px!important;padding:2px 3px!important;font-size:4.8px!important}
 .enoch-ios-landscape .seek .range{height:14px!important}

 .enoch-ios-landscape .target-mod{display:grid!important;grid-template-columns:minmax(0,1fr) 64px!important;padding:2px 3px!important;min-height:0!important;overflow:hidden!important;gap:3px!important}
 .enoch-ios-landscape .target-mod textarea{box-sizing:border-box!important;width:100%!important;height:24px!important;min-height:24px!important;padding:3px 5px!important;font-size:6px!important;resize:none!important}
 .enoch-ios-landscape .target-mod .mod-glyphs,.enoch-ios-landscape .target-mod .mod-state{display:none!important}
 .enoch-ios-landscape .target-mod>.wheelbox{display:none!important}

 .enoch-ios-landscape .pad-panel.instant-layout{box-sizing:border-box!important;height:100%!important;min-height:0!important;padding:3px!important;gap:3px!important;grid-template-columns:minmax(0,1.45fr) 38px minmax(82px,1fr) 62px!important;grid-template-rows:37px minmax(0,1fr)!important;overflow:hidden!important}
 .enoch-ios-landscape .pad-panel.instant-layout>.pad-top{grid-column:1!important;grid-row:1!important;min-width:0!important;overflow:hidden!important}
 .enoch-ios-landscape .pad-mode{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:2px!important}
 .enoch-ios-landscape .pad-mode .btn{box-sizing:border-box!important;min-width:0!important;min-height:17px!important;padding:1px!important;font-size:4.2px!important;line-height:1!important;white-space:normal!important}
 .enoch-ios-landscape .pad-panel.instant-layout>.xy-pad{grid-column:1!important;grid-row:2!important;height:100%!important;min-height:0!important;overflow:hidden!important}
 .enoch-ios-landscape .pad-readout-overlay{top:4px!important;right:4px!important;padding:2px 4px!important;font-size:5px!important}
 .enoch-ios-landscape .mixer-level{grid-column:2!important;grid-row:1/3!important;min-width:0!important;padding:2px 1px!important;gap:2px!important;overflow:hidden!important}
 .enoch-ios-landscape .mixer-level-title{font-size:5px!important}
 .enoch-ios-landscape .mixer-level-range{width:24px!important;height:100%!important;min-height:58px!important}
 .enoch-ios-landscape .mixer-level-value{min-width:30px!important;min-height:18px!important;padding:2px!important;font-size:7px!important}
 .enoch-ios-landscape .instant-fx{grid-column:3!important;grid-row:1/3!important;min-width:0!important;padding:1px!important;gap:2px!important;overflow:hidden!important}
 .enoch-ios-landscape .instant-fx-title{font-size:5px!important;padding:0!important}
 .enoch-ios-landscape .instant-fx-grid{gap:2px!important}
 .enoch-ios-landscape .instant-fx-btn{box-sizing:border-box!important;width:100%!important;min-width:0!important;min-height:34px!important;padding:2px!important;font-size:6px!important}
 .enoch-ios-landscape .instant-fx-btn span{font-size:7px!important}
 .enoch-ios-landscape .instant-fx-btn small{font-size:4.5px!important;margin-top:1px!important}
 .enoch-ios-landscape .mod-depth-box{grid-column:4!important;grid-row:1/3!important;min-width:0!important;padding:2px!important;overflow:hidden!important}
 .enoch-ios-landscape .mod-depth-box .wheel{width:50px!important;height:50px!important;min-width:50px!important;min-height:50px!important}

 .enoch-ios-landscape .grid>aside:last-child{height:100%!important;min-height:0!important;display:grid!important;grid-template-rows:auto repeat(5,minmax(38px,1fr)) 34px minmax(74px,1.5fr)!important;align-content:stretch!important;overflow:hidden!important}
 .enoch-ios-landscape .grid>aside:last-child .fxbox{min-height:0!important;overflow:hidden!important}
 .enoch-ios-landscape #killfx{min-height:28px!important;padding:3px!important;font-size:6px!important}
 .enoch-ios-landscape .console{height:100%!important;min-height:0!important;overflow:hidden!important;padding:3px!important}
 .enoch-ios-landscape .console-lines{overflow:auto!important;max-height:none!important;height:100%!important;font-size:4.5px!important;line-height:1.2!important}

 .enoch-ios-landscape .target-footer{display:grid!important;grid-template-columns:20% minmax(0,1fr) 24%!important;height:32px!important;min-height:32px!important;overflow:hidden!important;align-items:center!important;padding:1px 3px!important}
 .enoch-ios-landscape .footer-home{font-size:5.5px!important}
 .enoch-ios-landscape .footer-shortcuts{font-size:4px!important;white-space:nowrap!important;overflow:hidden!important}
 .enoch-ios-landscape .footer-volume{min-width:0!important;overflow:hidden!important}
 }}`;
 function label(d){const a=d.getElementById('loopIn'),b=d.getElementById('loopOut'),c=d.getElementById('loopToggle'),r=d.getElementById('loopReset');if(a)a.textContent='IN';if(b)b.textContent='OUT';if(c)c.textContent=(c.classList.contains('active')||c.getAttribute('aria-pressed')==='true')?'STOP':'LOOP';if(r)r.textContent='RESET'}
 function install(d){if(!d||!d.body||d.documentElement.dataset.iosDisposition==='v6')return false;const play=d.getElementById('play'),li=d.getElementById('loopIn'),lo=d.getElementById('loopOut'),lt=d.getElementById('loopToggle'),lr=d.getElementById('loopReset'),pad=d.getElementById('xyPad');if(!play||!li||!lo||!lt||!lr||!pad)return false;d.documentElement.dataset.iosDisposition='v6';d.documentElement.classList.add('enoch-ios-landscape');const st=d.createElement('style');st.textContent=CSS;d.head.appendChild(st);
 const tr=play.parentElement;tr.style.gridTemplateColumns='repeat(4,minmax(0,1fr))';let row=d.querySelector('.loop-controls');if(!row){row=d.createElement('div');row.className='loop-controls';tr.insertAdjacentElement('afterend',row)}[li,lo,lt,lr].forEach(b=>row.appendChild(b));[li,lo,lt,lr].forEach(b=>b.addEventListener('click',()=>setTimeout(()=>label(d),0)));label(d);
 const mod=d.getElementById('phrase')?.closest('.mod'),lower=pad.closest('.pad-panel'),depth=mod?.querySelector(':scope > .wheelbox');if(mod)mod.classList.add('target-mod');if(depth&&lower&&!depth.classList.contains('mod-depth-box')){depth.classList.add('mod-depth-box');lower.appendChild(depth)}
 let actions=d.querySelector('.terminal-actions');if(!actions){const badge=[...d.querySelectorAll('.badge')].find(x=>/ENGINE READY|ENGINE IDLE/i.test(x.textContent||''));if(badge){actions=d.createElement('div');actions.className='terminal-actions';badge.parentNode.insertBefore(actions,badge);actions.appendChild(badge)}}if(actions&&!d.getElementById('iosFullscreen')){const f=d.createElement('button');f.id='iosFullscreen';f.className='btn terminal-action ios-fullscreen';f.type='button';f.textContent='⛶';f.title='Full screen';f.setAttribute('aria-label','Full screen');f.addEventListener('click',()=>{try{const live=d.defaultView.parent;if(live&&typeof live.__enochToggleFullscreen==='function')return live.__enochToggleFullscreen();const test=live&&live.parent;if(test&&typeof test.__enochTestFullscreen==='function')return test.__enochTestFullscreen()}catch(_){}});actions.appendChild(f)}
 const foot=d.querySelector('.foot');if(foot&&!foot.classList.contains('target-footer'))foot.classList.add('target-footer');try{d.defaultView.dispatchEvent(new Event('resize'))}catch(_){}return true}window.installEnochianTargetViewport=frame=>{let n=0,t=setInterval(()=>{try{const w=frame.contentDocument,deck=w&&w.getElementById('deck'),d=deck&&deck.contentDocument;if(install(d))clearInterval(t)}catch(_){}if(++n>200)clearInterval(t)},50)};
})();