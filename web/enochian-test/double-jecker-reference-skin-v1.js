(()=>{
  'use strict';
  function install(host){
    try{
      const live=host&&host.contentDocument;
      const deck=live&&live.getElementById('deck');
      const d=deck&&deck.contentDocument;
      const panel=document.getElementById('doubleDeckerSpecial');
      if(!d||!panel)return false;
      if(panel.dataset.jeckerReferenceSkin==='v1')return true;
      panel.dataset.jeckerReferenceSkin='v1';

      let style=document.getElementById('double-jecker-reference-skin-v1');
      if(!style){
        style=document.createElement('style');
        style.id='double-jecker-reference-skin-v1';
        style.textContent=`
          #doubleDeckerSpecial.jecker-radial{
            --j-bg:#080604;--j-black:#120c08;--j-metal:#25150d;--j-copper:#713313;--j-red:#aa2d12;--j-orange:#df5912;--j-hot:#ff7518;--j-brass:#c8841b;--j-gold:#e9a93e;--j-cream:#eccb8c;--j-muted:#a88e62;--j-border:#6f3715;
            background:
              radial-gradient(circle at 50% 50%,transparent 0 15.5%,rgba(255,119,24,.08) 15.6% 16.2%,transparent 16.3% 31.5%,rgba(212,115,26,.11) 31.6% 32.2%,transparent 32.3% 68%,rgba(188,74,15,.15) 68.1% 69.1%,transparent 69.2%),
              repeating-radial-gradient(circle at 50% 50%,rgba(255,208,121,.035) 0 1px,rgba(0,0,0,.02) 1px 3px,transparent 3px 6px),
              radial-gradient(circle at 50% 42%,#3b1a0c 0 17%,#130c07 17.3% 37%,#2b160b 37.3% 39%,#100a06 39.2% 67%,#32180b 67.3% 69%,#070503 69.4% 100%)!important;
            border:2px solid #b45b18!important;
            box-shadow:inset 0 0 0 2px #ef8427,inset 0 0 0 7px #160b06,inset 0 0 0 9px #7d3b12,inset 0 0 38px #000,0 0 8px rgba(255,109,18,.42),0 20px 58px #000e!important;
            isolation:isolate;
          }
          #doubleDeckerSpecial.jecker-radial::before{
            inset:3.4%!important;border:2px solid #7c3b13!important;
            background:
              repeating-conic-gradient(from 0deg,rgba(255,166,56,.08) 0deg .8deg,transparent .8deg 4.5deg),
              radial-gradient(circle,transparent 0 72%,rgba(0,0,0,.6) 89%,transparent 100%)!important;
            box-shadow:inset 0 0 0 3px #110906,inset 0 0 26px #000d,0 0 10px rgba(238,99,17,.18)!important;
          }
          #doubleDeckerSpecial.jecker-radial::after{
            content:'2JECKER · CIRCULAR STEM TURNTABLE'!important;top:2.6%!important;
            color:#f0c16f!important;font-family:Georgia,'Times New Roman',serif!important;font-weight:900!important;
            font-size:clamp(8px,1.3vmin,12px)!important;letter-spacing:.14em!important;
            text-shadow:0 1px 0 #3a1607,0 0 5px #ff7a18,0 0 12px rgba(255,84,6,.42)!important;
          }
          #doubleDeckerSpecial.jecker-radial .dds-engine-control{top:7.4%!important;width:29%!important}
          #doubleDeckerSpecial.jecker-radial .dds-engine-control button{
            border:2px solid #d56b1c!important;border-radius:9px!important;
            background:linear-gradient(180deg,#7a2d0d 0%,#431706 45%,#1b0c06 100%)!important;
            color:#ffd17a!important;font-family:Georgia,'Times New Roman',serif!important;font-weight:900!important;
            text-shadow:0 1px 0 #4a1706,0 0 6px #ff7016!important;
            box-shadow:inset 0 1px 0 #ffbd5a,inset 0 -4px 7px #160703,0 0 5px #ff6b13,0 0 16px rgba(255,80,8,.38)!important;
          }
          #doubleDeckerSpecial.jecker-radial .dds-engine-control button.active{
            border-color:#ff8b20!important;background:linear-gradient(#a83b0d,#511807)!important;color:#ffe0a0!important;
            box-shadow:inset 0 1px 0 #ffd07d,0 0 7px #ff7c18,0 0 20px rgba(255,80,8,.58)!important;
          }
          #doubleDeckerSpecial.jecker-radial .dds-slot{
            border:2px solid #6d3212!important;
            background:
              radial-gradient(circle at 42% 28%,rgba(255,183,76,.16),transparent 35%),
              repeating-linear-gradient(87deg,rgba(255,255,255,.018) 0 1px,transparent 1px 5px),
              radial-gradient(circle,#321508 0%,#160a05 61%,#090503 100%)!important;
            box-shadow:inset 0 0 0 3px #100806,inset 0 0 15px #000b,0 3px 11px #000d!important;
          }
          #doubleDeckerSpecial.jecker-radial .dds-slot[data-slot='vocals']{border-color:#9d2c14!important;background:radial-gradient(circle at 42% 28%,rgba(255,88,28,.2),transparent 35%),radial-gradient(circle,#5a170d,#260b07 62%,#0b0503)!important}
          #doubleDeckerSpecial.jecker-radial .dds-slot[data-slot='drums']{border-color:#b44d12!important;background:radial-gradient(circle at 42% 28%,rgba(255,126,34,.2),transparent 35%),radial-gradient(circle,#642307,#2a1005 62%,#0b0503)!important}
          #doubleDeckerSpecial.jecker-radial .dds-slot[data-slot='bass']{border-color:#a87515!important;background:radial-gradient(circle at 42% 28%,rgba(255,196,63,.16),transparent 35%),radial-gradient(circle,#4f3908,#211806 62%,#0b0603)!important}
          #doubleDeckerSpecial.jecker-radial .dds-slot[data-slot='other']{border-color:#8d4b12!important;background:radial-gradient(circle at 42% 28%,rgba(255,151,39,.16),transparent 35%),radial-gradient(circle,#492108,#201006 62%,#0b0503)!important}
          #doubleDeckerSpecial.jecker-radial .dds-slot.stem-off{opacity:.5!important;filter:saturate(.58) brightness(.72)}
          #doubleDeckerSpecial.jecker-radial .dds-slot select{
            border-color:#7c3d15!important;background:#0b0704!important;color:#e7bd77!important;
            font-family:'Arial Narrow','Roboto Condensed',Arial,sans-serif!important;font-weight:800!important;letter-spacing:.035em!important;
            box-shadow:inset 0 1px 4px #000!important;
          }
          #doubleDeckerSpecial.jecker-radial .dds-slot input[type=range],#doubleDeckerSpecial.jecker-radial .dds-performance input{accent-color:#e46a15!important}
          #doubleDeckerSpecial.jecker-radial .dds-slot output,#doubleDeckerSpecial.jecker-radial .dds-slot label,#doubleDeckerSpecial.jecker-radial .dds-slot span{
            color:#e4bd78!important;font-family:'Arial Narrow','Roboto Condensed',Arial,sans-serif!important;font-weight:700!important;letter-spacing:.04em!important;
            text-shadow:0 1px 2px #000!important;
          }
          #doubleDeckerSpecial.jecker-radial .dds-slot .stem-toggle,#doubleDeckerSpecial.jecker-radial .dds-slot [data-dds-stem-toggle]{
            background:linear-gradient(#2b1308,#0b0603)!important;color:#b8935d!important;border:1px solid #754016!important;
            font-family:Georgia,'Times New Roman',serif!important;font-weight:900!important;
            box-shadow:inset 0 1px 0 rgba(255,195,101,.12),inset 0 -3px 5px #000!important;
          }
          #doubleDeckerSpecial.jecker-radial .dds-slot .stem-toggle.active,#doubleDeckerSpecial.jecker-radial .dds-slot [data-dds-stem-toggle].active{
            background:radial-gradient(circle at 45% 35%,#bd4b12,#561b08 62%,#190b05)!important;color:#ffd27d!important;border-color:#ef7a1a!important;
            text-shadow:0 0 5px #ff7117!important;box-shadow:inset 0 1px 0 #ffbc57,0 0 7px #ff6717,0 0 14px rgba(255,82,8,.35)!important;
          }
          #doubleDeckerSpecial.jecker-radial .dds-center{
            border:2px solid #a95a1c!important;
            background:
              repeating-radial-gradient(circle at 50% 50%,#1b140e 0 1px,#080604 1px 3px,#21170f 3px 4px,#090604 4px 7px)!important;
            box-shadow:inset 0 0 0 4px #0a0604,inset 0 0 0 6px #5d3518,inset 0 0 28px #000,0 0 0 2px #1b0e07,0 0 15px #000!important;
          }
          #doubleDeckerSpecial.jecker-radial .dds-center button,#doubleDeckerSpecial.jecker-radial .dds-center select,
          #doubleDeckerSpecial.jecker-radial .dds-deck-shuffle,#doubleDeckerSpecial.jecker-radial .dds-foot button{
            border:1px solid #8c4516!important;background:linear-gradient(#321507,#120805)!important;color:#e7bd77!important;
            font-family:'Arial Narrow','Roboto Condensed',Arial,sans-serif!important;font-weight:900!important;letter-spacing:.04em!important;
            box-shadow:inset 0 1px 0 rgba(255,196,96,.12),inset 0 -3px 5px #000!important;
          }
          #doubleDeckerSpecial.jecker-radial .dds-v2-actions button.active,#doubleDeckerSpecial.jecker-radial .dds-perf-buttons button.active{
            background:linear-gradient(#a33e0d,#4c1706)!important;color:#ffd17a!important;border-color:#f27a19!important;box-shadow:0 0 8px rgba(255,103,18,.5)!important;
          }
          #doubleDeckerSpecial.jecker-radial .dds-performance{
            border:1px solid #633516!important;background:rgba(9,5,3,.86)!important;box-shadow:inset 0 0 10px #000!important;
          }
          #doubleDeckerSpecial.jecker-radial .dds-performance label,#doubleDeckerSpecial.jecker-radial .dds-performance output,
          #doubleDeckerSpecial.jecker-radial .dds-quantize label,#doubleDeckerSpecial.jecker-radial .dds-master-hold{
            color:#e4bd78!important;font-family:'Arial Narrow','Roboto Condensed',Arial,sans-serif!important;font-weight:900!important;
          }
          #doubleDeckerSpecial.jecker-radial .dds-performance output{color:#ff8a24!important;text-shadow:0 0 5px rgba(255,95,15,.55)!important}
          #doubleDeckerSpecial.jecker-radial .dds-deck>.dds-deck-shuffle{
            border:2px solid #7d3c13!important;background:radial-gradient(circle at 45% 30%,#522008,#1c0b05 66%,#080402)!important;
            color:#f1c77e!important;text-shadow:0 1px 2px #000!important;box-shadow:inset 0 0 0 3px #0d0604,0 2px 9px #000!important;
          }
          #doubleDeckerSpecial.jecker-radial .dds-foot{bottom:7.4%!important}
          #doubleDeckerSpecial.jecker-radial .dds-foot button{
            border:2px solid #d16218!important;border-radius:8px!important;background:linear-gradient(#702409,#2a0d05)!important;color:#ffd17a!important;
            font-family:Georgia,'Times New Roman',serif!important;font-weight:900!important;text-shadow:0 0 5px #ff7017!important;
            box-shadow:inset 0 1px 0 #ffb44f,0 0 5px #ff6a13,0 0 14px rgba(255,83,7,.32)!important;
          }
          #doubleDeckerSpecial.jecker-radial button:focus-visible,#doubleDeckerSpecial.jecker-radial select:focus-visible,#doubleDeckerSpecial.jecker-radial input:focus-visible{outline:2px solid #ff9b30!important;outline-offset:2px!important}
          @media(max-width:720px),(max-height:560px){#doubleDeckerSpecial.jecker-radial::after{font-size:7px!important;letter-spacing:.08em!important}.dds-engine-control button{font-size:6px!important}}
        `;
        document.head.appendChild(style);
      }
      return true;
    }catch(_){return false}
  }
  window.installEnochianDoubleJeckerReferenceSkinV1=host=>{let n=0,t=setInterval(()=>{if(install(host)||++n>240)clearInterval(t)},50);return install(host)};
})();
