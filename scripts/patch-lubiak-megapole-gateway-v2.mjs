import fs from 'node:fs';

const path='web/lubiak/lubiak.js';
let src=fs.readFileSync(path,'utf8');
if(src.includes('LUBIAK_MEGAPOLE_GATEWAY_V2')) process.exit(0);

const pattern=/\/\/ In aerial mode the dragon remains a triple-click Megapole gateway\.[\s\S]*?(?=\nfunction openMegapoleInsideLubiak\(\))/m;
if(!pattern.test(src)) throw new Error('existing dragon Megapole gateway block not found');

const block=`// LUBIAK_MEGAPOLE_GATEWAY_V2
// The dragon is an active Megapole passage in FOLLOW, RIDE and AERIAL.
// Three deliberate taps/clicks on the dragon within 1.1s open Megapole inside LUBIAK.
const megapoleDragonClicks=[];
renderer.domElement.addEventListener('pointerup',(event)=>{
  if(!dragonRoot || worldMode!=='exterior') return;
  if(document.querySelector('#megapole-portal')?.classList.contains('is-open')) return;
  if(typeof lookTravel==='number' && lookTravel>8) return;
  const rect=renderer.domElement.getBoundingClientRect();
  if(rect.width<=0 || rect.height<=0) return;
  const pointer=new THREE.Vector2(
    ((event.clientX-rect.left)/rect.width)*2-1,
    -(((event.clientY-rect.top)/rect.height)*2-1),
  );
  const ray=new THREE.Raycaster();
  ray.setFromCamera(pointer,camera);
  if(!ray.intersectObject(dragonRoot,true).length) return;

  const now=performance.now();
  megapoleDragonClicks.push(now);
  while(megapoleDragonClicks.length && now-megapoleDragonClicks[0]>1100) megapoleDragonClicks.shift();

  if(megapoleDragonClicks.length>=3){
    megapoleDragonClicks.length=0;
    showStatus('ENTERING SILMARI’LLION — MEGAPOLE',900);
    openMegapoleInsideLubiak();
    return;
  }

  const left=3-megapoleDragonClicks.length;
  showStatus('DRAGON GATE · '+left+' MORE '+(left===1?'TAP':'TAPS')+' TO MEGAPOLE',650);
},true);
`;

src=src.replace(pattern,block);
fs.writeFileSync(path,src);
console.log('Activated LUBIAK dragon passage to Megapole in every navigation mode.');
