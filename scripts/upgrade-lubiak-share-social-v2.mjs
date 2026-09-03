import fs from 'node:fs';
const p='web/lubiak/lubiak.js';
let s=fs.readFileSync(p,'utf8');
if(s.includes('LUBIAK_SHARE_SOCIAL_COMPOSITION_V2')) process.exit(0);
const backdrop=`function loadCaptureBackdrop(){
  if(worldMode!=='exterior') return Promise.resolve(null);
  return new Promise((resolve)=>{
    const image=new Image();
    image.onload=()=>resolve(image);
    image.onerror=()=>resolve(null);
    image.src='assets/ChatGPT%20Image%20Aug%2030%2C%202026%2C%2001_48_08%20AM.png';
  });
}`;
if(!s.includes(backdrop)) throw new Error('share backdrop anchor missing');
const enhanced=`function loadCaptureBackdrop(){
  if(worldMode!=='exterior') return Promise.resolve(null);
  return new Promise((resolve)=>{
    const image=new Image();
    image.onload=()=>resolve(image);
    image.onerror=()=>resolve(null);
    image.src='assets/ChatGPT%20Image%20Aug%2030%2C%202026%2C%2001_48_08%20AM.png';
  });
}
// LUBIAK_SHARE_SOCIAL_COMPOSITION_V2
// Clean social card branding is composited after the 3D render; runtime controls are never captured.
function loadCaptureLogo(){
  return new Promise((resolve)=>{
    const image=new Image();
    image.onload=()=>resolve(image);
    image.onerror=()=>resolve(null);
    image.src='/assets/assets/images/app_logo.png';
  });
}
function drawCaptureBranding(ctx,logo,w,h){
  const pad=Math.max(16,Math.round(w*0.018));
  const logoSize=Math.max(54,Math.min(112,Math.round(w*0.085)));
  const topH=logoSize+pad*2;
  ctx.fillStyle='rgba(8,5,4,.62)';
  ctx.fillRect(pad,pad,Math.min(w-pad*2,Math.round(w*0.56)),topH);
  if(logo){
    const ratio=logo.naturalWidth/Math.max(1,logo.naturalHeight);
    let dw=logoSize*ratio,dh=logoSize;
    if(dw>logoSize*1.45){dw=logoSize*1.45;dh=dw/ratio;}
    ctx.drawImage(logo,pad*1.55,pad+(topH-dh)/2,dw,dh);
  }
  const tx=pad*1.55+(logo?logoSize*1.62:0);
  ctx.textBaseline='alphabetic';
  ctx.fillStyle='#f0d7ad';
  ctx.font='700 '+Math.max(22,Math.round(w/36))+'px ui-monospace, monospace';
  ctx.fillText('LUBIAK',tx,pad+Math.round(topH*0.48));
  ctx.font='600 '+Math.max(11,Math.round(w/92))+'px ui-monospace, monospace';
  ctx.fillStyle='rgba(240,215,173,.88)';
  ctx.fillText('CHANSON À RÉPONDRE UNO',tx,pad+Math.round(topH*0.72));
  const footerH=Math.max(48,Math.round(h*0.064));
  ctx.fillStyle='rgba(8,5,4,.76)';
  ctx.fillRect(0,h-footerH,w,footerH);
  ctx.textBaseline='middle';
  ctx.fillStyle='#f0d7ad';
  ctx.font='600 '+Math.max(11,Math.round(w/96))+'px ui-monospace, monospace';
  ctx.fillText('www.chanson-a-repondre-uno.scot/lubiak/',pad,h-footerH/2);
}`;
s=s.replace(backdrop,enhanced);
const old=`  renderer.render(scene,camera);
  ctx.drawImage(source,0,0,w,h);
  ctx.fillStyle='rgba(8,5,4,.72)';ctx.fillRect(0,h-34,w,34);
  ctx.fillStyle='#f0d7ad';ctx.font=Math.max(12,Math.round(w/92))+'px ui-monospace, monospace';ctx.textBaseline='middle';
  ctx.fillText('CHANSON À RÉPONDRE UNO · LUBIAK',14,h-17);
  return await new Promise((resolve,reject)=>out.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG capture failed')),'image/png',0.95));`;
if(!s.includes(old)) throw new Error('share capture footer anchor missing');
const neo=`  renderer.render(scene,camera);
  ctx.drawImage(source,0,0,w,h);
  const logo=await loadCaptureLogo();
  drawCaptureBranding(ctx,logo,w,h);
  return await new Promise((resolve,reject)=>out.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG capture failed')),'image/png',0.95));`;
s=s.replace(old,neo);
fs.writeFileSync(p,s);
console.log('Upgraded LUBIAK social share capture composition.');
