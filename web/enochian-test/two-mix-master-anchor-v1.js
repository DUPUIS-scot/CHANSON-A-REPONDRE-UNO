(()=>{'use strict';
function install(frame){
  try{
    const live=frame?.contentDocument,deck=live?.getElementById('deck'),d=deck?.contentDocument,w=d?.defaultView;
    if(!d||!w)return false;
    if(d.documentElement.dataset.twoMixMasterLayout==='v7')return true;

    const toggle=d.getElementById('twoMixToggle');
    if(!toggle)return false;

    const findMaster=()=>{
      const explicit=d.querySelector('[data-master-deck],.master-deck');
      if(explicit)return explicit;
      const nodes=[...d.querySelectorAll('section,.box,.panel,.module,div')].filter(el=>{
        const r=el.getBoundingClientRect(),t=(el.textContent||'').toUpperCase();
        return r.width>220&&r.height>70&&((t.includes('AUDIO AUTHORITY')&&t.includes('MASTER DECK'))||/^\s*MASTER DECK\b/.test(t));
      });
      nodes.sort((a,b)=>a.getBoundingClientRect().width*a.getBoundingClientRect().height-b.getBoundingClientRect().width*b.getBoundingClientRect().height);
      return nodes[0]||null;
    };

    const master=findMaster();
    if(!master)return false;
    master.dataset.masterDeck='1';
    if(w.getComputedStyle(master).position==='static')master.style.position='relative';

    d.getElementById('two-mix-master-anchor-style')?.remove();
    const style=d.createElement('style');
    style.id='two-mix-master-anchor-style';
    style.textContent=`
[data-master-deck="1"]{position:relative!important;overflow:visible!important}
#twoMixToggle.two-mix-master-anchor{position:absolute!important;right:10px!important;top:10px!important;left:auto!important;bottom:auto!important;transform:none!important;z-index:900!important;margin:0!important;display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}
#twoMixHelpToggle{position:absolute!important;right:5px!important;top:4px!important;z-index:930!important;width:17px!important;height:17px!important;min-width:17px!important;padding:0!important;border:1px solid #f0c97e!important;border-radius:50%!important;background:#061014!important;color:#f0c97e!important;font:900 10px/15px ui-monospace,SFMono-Regular,Menlo,monospace!important;text-align:center!important;cursor:pointer!important;pointer-events:auto!important;box-shadow:0 0 7px #f0c97e33!important}
#twoMixHelp.two-mix-live-help{position:absolute!important;z-index:2147483000!important;display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;width:220px!important;max-width:min(240px,72vw)!important;padding:7px 8px!important;border:1px solid #f0c97e!important;border-radius:3px!important;background:#050b0df7!important;color:#baf7ef!important;font:700 7px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace!important;letter-spacing:.035em!important;white-space:normal!important;box-shadow:0 5px 18px #000d,0 0 8px #f0c97e22!important}.two-mix-help-open#twoMixHelp{display:block!important;visibility:visible!important;opacity:1!important}.two-mix-guide-title{display:block!important;margin-bottom:4px!important;color:#f0c97e!important;font-size:8px!important;letter-spacing:.12em!important}.two-mix-guide-row{display:grid!important;grid-template-columns:66px minmax(0,1fr)!important;gap:5px!important;padding:1px 0!important}.two-mix-guide-key{color:#fff0bf!important}.two-mix-guide-touch{display:block!important;margin-top:4px!important;padding-top:4px!important;border-top:1px solid #315b56!important;color:#8fd9cf!important;font-size:6px!important}
#twoMixCursorHelp{position:fixed!important;z-index:2147483001!important;left:0;top:0;display:none;max-width:190px;padding:6px 8px;border:1px solid #63f5cf;border-radius:5px 5px 5px 1px;background:#03110ff2;color:#c9fff0;font:800 7px/1.32 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.055em;white-space:nowrap;pointer-events:none;box-shadow:0 4px 16px #000c,0 0 12px #19c98f55;transform:translate(14px,14px);opacity:0;transition:opacity .18s ease}
#twoMixCursorHelp.visible{display:block;opacity:1}
#twoMixCursorHelp b{color:#f0c97e;letter-spacing:.14em}
#twoMixCursorHelp .mix-cursor-hint{color:#9de8dc}
@media(max-width:720px){#twoMixCursorHelp{max-width:158px;padding:5px 6px;font-size:6px;transform:translate(11px,11px)}}`;
    d.head.appendChild(style);

    toggle.classList.add('two-mix-master-anchor');
    toggle.title='2MIX';
    toggle.setAttribute('aria-label','Open 2MIX');
    if(toggle.parentElement!==master)master.appendChild(toggle);

    let helpButton=d.getElementById('twoMixHelpToggle');
    if(!helpButton){
      helpButton=d.createElement('button');
      helpButton.id='twoMixHelpToggle';
      helpButton.type='button';
      helpButton.textContent='?';
      helpButton.title='2MIX controls';
      helpButton.setAttribute('aria-label','Show 2MIX manipulation guide');
      master.appendChild(helpButton);
    }

    let help=d.getElementById('twoMixHelp');
    if(!help){help=d.createElement('div');help.id='twoMixHelp'}
    help.className='two-mix-live-help';
    help.setAttribute('role','tooltip');
    help.innerHTML='<strong class="two-mix-guide-title">2MIX · LIVE CONTROL</strong><span class="two-mix-guide-row"><b class="two-mix-guide-key">DRAG</b><span>MOVE A+B</span></span><span class="two-mix-guide-row"><b class="two-mix-guide-key">SHIFT+DRAG</b><span>SEPARATE A/B</span></span><span class="two-mix-guide-row"><b class="two-mix-guide-key">ALT+DRAG</b><span>ROTATE</span></span><span class="two-mix-guide-row"><b class="two-mix-guide-key">LOCK A/B</b><span>CONSTRAIN SIDE</span></span><span class="two-mix-guide-row"><b class="two-mix-guide-key">WHEEL</b><span>ADJUST MIX</span></span><small class="two-mix-guide-touch">? · SHOW / HIDE GUIDE · UNO OPENS 2MIX</small>';
    if(help.parentElement!==master)master.appendChild(help);

    helpButton.setAttribute('aria-describedby','twoMixHelp');
    helpButton.setAttribute('aria-expanded','false');

    const place=()=>{
      const br=helpButton.getBoundingClientRect(),mr=master.getBoundingClientRect(),hw=Math.min(240,Math.max(190,master.clientWidth*.48));
      help.style.width=hw+'px';
      let left=br.right-mr.left-hw;
      left=Math.max(4,Math.min(left,Math.max(4,mr.width-hw-4)));
      let top=br.top-mr.top-help.offsetHeight-7;
      if(top<4)top=br.bottom-mr.top+7;
      help.style.left=left+'px';help.style.top=Math.max(4,top)+'px';help.style.right='auto';help.style.bottom='auto';
    };
    const isOpen=()=>help.classList.contains('two-mix-help-open');
    const show=()=>{help.classList.add('two-mix-help-open');helpButton.setAttribute('aria-expanded','true');w.requestAnimationFrame(place)};
    const hide=()=>{help.classList.remove('two-mix-help-open');helpButton.setAttribute('aria-expanded','false')};
    const toggleGuide=e=>{e?.preventDefault();e?.stopPropagation();isOpen()?hide():show()};
    if(helpButton.dataset.liveHelpBound!=='v7'){
      helpButton.dataset.liveHelpBound='v7';
      helpButton.addEventListener('click',toggleGuide);
      helpButton.addEventListener('keydown',e=>{if(e.key==='Escape'){hide();helpButton.focus()}});
    }
    w.addEventListener('resize',()=>{if(isOpen())place()});

    let cursorHelp=d.getElementById('twoMixCursorHelp');
    if(!cursorHelp){
      cursorHelp=d.createElement('div');
      cursorHelp.id='twoMixCursorHelp';
      cursorHelp.setAttribute('role','status');
      cursorHelp.setAttribute('aria-live','polite');
      cursorHelp.innerHTML='<b>2MIX</b> <span class="mix-cursor-hint">DRAG A+B · SHIFT SPLIT · ALT ROTATE · CTRL PERFORM · WHEEL MIX</span>';
      d.body.appendChild(cursorHelp);
    }

    let cursorTimer=0,lastX=Math.round(w.innerWidth*.68),lastY=Math.round(w.innerHeight*.62);
    const positionCursorHelp=(x,y)=>{
      lastX=x;lastY=y;
      const pad=12,box=cursorHelp.getBoundingClientRect();
      let px=x,py=y;
      if(px+box.width+28>w.innerWidth)px=Math.max(pad,x-box.width-22);
      if(py+box.height+28>w.innerHeight)py=Math.max(pad,y-box.height-22);
      cursorHelp.style.left=Math.max(pad,px)+'px';
      cursorHelp.style.top=Math.max(pad,py)+'px';
    };
    const cursorHelpActive=()=>toggle.classList.contains('active')||toggle.getAttribute('aria-pressed')==='true';
    const hideCursorHelp=()=>{w.clearTimeout(cursorTimer);cursorHelp.classList.remove('visible')};
    const showCursorHelp=()=>{
      w.clearTimeout(cursorTimer);
      positionCursorHelp(lastX,lastY);
      cursorHelp.classList.add('visible');
      cursorTimer=w.setTimeout(()=>cursorHelp.classList.remove('visible'),5200);
    };

    if(d.documentElement.dataset.twoMixCursorHelpBound!=='v1'){
      d.documentElement.dataset.twoMixCursorHelpBound='v1';
      d.addEventListener('pointermove',e=>{
        positionCursorHelp(e.clientX,e.clientY);
        if(cursorHelpActive()&&cursorHelp.classList.contains('visible'))positionCursorHelp(e.clientX,e.clientY);
      },{passive:true});
      toggle.addEventListener('click',()=>{
        w.requestAnimationFrame(()=>{cursorHelpActive()?showCursorHelp():hideCursorHelp()});
      });
      d.addEventListener('keydown',e=>{if(e.key==='Escape')hideCursorHelp()},{capture:true});
    }

    d.documentElement.dataset.twoMixMasterAnchor='v1';
    d.documentElement.dataset.twoMixMasterLayout='v7';
    w.__enochTwoMixMasterAnchor={version:'v7',toggle,helpButton,help,cursorHelp,master,show,hide,toggleGuide,place,showCursorHelp,hideCursorHelp};
    return true;
  }catch(_){return false}
}
window.installEnochianTwoMixMasterAnchorV1=frame=>{let n=0,t=setInterval(()=>{if(install(frame)||++n>240)clearInterval(t)},50);return install(frame)};
})();