// Drive the ACTUAL career UI with a deterministic browser clock. The private
// save is mounted by abre-saida-carreira.cjs; all remote writes stay blocked.
const fs=require('node:fs');
const {loadDependency}=require('../presidencia-runtime.cjs');
const out=process.env.UI_RECORD_OUT||'test-results/saida-bola/ui-real-antes';
(async()=>{
 fs.mkdirSync(out+'/frames',{recursive:true});
 const b=await loadDependency('playwright').chromium.connectOverCDP('http://127.0.0.1:9236'),p=b.contexts()[0].pages()[0];
 const cdp=await p.context().newCDPSession(p);
 const prior=await p.evaluate(()=>qaMap.inspect().match.matchId);
 await p.evaluate(()=>{
  document.querySelector('button[aria-label="Ampliar mapa"]')?.click();
  const select=document.querySelector('select[aria-label="Câmera da partida"]');if(select){select.value='tele';select.dispatchEvent(new Event('change',{bubbles:true}))}
  [...document.querySelectorAll('button')].find(b=>b.innerText==='REVER JOGO SALVO EM 3D').click();
 });
 let ready=false;
 for(let i=0;i<2000&&!ready;i++){
  await p.clock.runFor(1);
  ready=await p.evaluate(prior=>{const m=qaMap?.inspect().match;return m?.matchId!==prior&&m?.detail?.style==='jogador-novo'},prior);
 }
 if(!ready)throw Error('The real career map did not load its player models');
 await p.evaluate(()=>{const s=document.querySelector('select[aria-label="Câmera da partida"]');s.value='tele';s.dispatchEvent(new Event('change',{bubbles:true}))});
 const rows=[];
 for(let i=0;i<60;i++){
  await p.clock.fastForward(50);
  const row=await p.evaluate(()=>{const q=qaMap.inspect(),m=q.match,actors=[];qaScene.traverse(o=>{if(!o.name.startsWith('jogador:'))return;const bone=o.getObjectByName('mixamorigHead');actors.push({key:o.name.slice(8),position:o.position.toArray(),head:bone?[bone.matrixWorld.elements[12],bone.matrixWorld.elements[13],bone.matrixWorld.elements[14]]:null})});return{time:m.time,phase:m.phase,events:m.official?.events,official:m.official,actors,camera:q.matchCamera,details:m.detail?.football?.fouls,text:document.body.innerText.slice(0,1400)}});
  rows.push(row);const image=await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:84,captureBeyondViewport:false,optimizeForSpeed:true});fs.writeFileSync(out+'/frames/'+String(i).padStart(5,'0')+'.jpg',Buffer.from(image.data,'base64'));fs.writeFileSync(out+'/trace.json',JSON.stringify(rows));
  if(i%30===0)console.log(JSON.stringify({frame:i,time:row.time,actors:row.actors.length}));
 }
 fs.writeFileSync(out+'/trace.json',JSON.stringify(rows));
 console.log(JSON.stringify({complete:true,range:[rows[0].time,rows.at(-1).time],frames:rows.length}));process.exit(0);
})().catch(e=>{console.error(e.stack);process.exit(1)});
