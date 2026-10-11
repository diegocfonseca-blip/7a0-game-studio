// Prévia do modelo real de obras/circulação. Não é screenshot do aplicativo.
const fs=require('node:fs'),path=require('node:path');
const sharp=require('./presidencia-runtime.cjs').loadDependency('sharp');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results');
const stages=JSON.parse(fs.readFileSync(path.join(out,'estadio-mapa-model.json'),'utf8'));
const treeClips=['polygon(22% 78%, 24% 77%, 25% 81%, 24% 84%, 22% 83%)','polygon(34% 80%, 36% 79%, 38% 82%, 37% 86%, 34% 85%)','polygon(61% 77%, 63% 76%, 65% 78%, 65% 83%, 62% 84%)'];
const sites=[['grama',35,46,30],['geral',26,44,40],['cadeiras',28,44,90],['visitante',69,44,120],['camarote',44,51,150]];
const office={cadeiras:'estadio-v223/cadeiras-aerea.webp',visitante:'estadio-v225/visitante-aerea.webp',camarote:'estadio-v226/camarote-aerea.webp'};
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cache=new Map();
async function asset(src){if(!cache.has(src))cache.set(src,'data:image/png;base64,'+(await sharp(path.join(root,'public',src)).png().toBuffer()).toString('base64'));return cache.get(src)}
(async()=>{
 // Load the pure TS movement functions using the same fixture harness.
 const runtimeFile=path.join(out,'mapa-runtime.js');
 const modelSource=fs.readFileSync(path.join(root,'src/escalacao/presidencia-estadio-mapa-model.ts'),'utf8');
 const {stripTypeScriptTypes}=require('node:module');
 let runtime=stripTypeScriptTypes(modelSource).replace(/^import .*$/gm,'').replace(/export /g,'');
 runtime+='\n';fs.writeFileSync(runtimeFile,runtime);
 const getFrame=new Function(runtime+'return quadroAtor');const frame=getFrame();
 function plan(stage,seconds){
  const all=[{src:'estadio-mapa/terreno.webp',clip:null,depth:0}];
  const grass=stage.grass;
  if(grass>0)all.push({src:'estadio-v104/grama.webp',clip:`polygon(33.1% 26%, ${33.1+32.1*grass}% 26%, ${30.5+37.1*grass}% 43.5%, 30.5% 43.5%)`,depth:1});
  all.push(...stage.layers);
  if((stage.stadium.inv.visitante??0)>=120&&(stage.stadium.inv.cadeiras??0)>=90)all.push({src:'estadio-v242/canto-direito-overlay.png',depth:2001});
  if(office[stage.stage])all.push({src:office[stage.stage],clip:'polygon(27% 42%, 72% 42%, 72% 58%, 27% 58%)',depth:2250});
  for(const [key,left,top,cost] of sites){const paid=stage.stadium.inv[key]??0;if(paid>0&&paid<cost)all.push({src:'estadio-mapa/obra.webp',bounds:{left,top,width:4,height:4*640/427*61/140},depth:2500});}
  for(const actor of stage.actors){const p=frame(actor,seconds);all.push({src:actor.src,actor,p,depth:p.depth});}
  for(const clip of treeClips)all.push({src:'estadio-mapa/terreno.webp',clip,depth:6000});
  return all.sort((a,b)=>(a.depth??0)-(b.depth??0));
 }
 async function sceneSVG(stage,seconds=0){
  let defs='',body='',serial=0;
  for(const layer of plan(stage,seconds)){
   if(layer.actor){const {actor,p}=layer,w=actor.width*p.scale,h=actor.height*p.scale,src=p.back&&actor.srcBack?actor.srcBack:layer.src;let actorImage=await asset(src);if(actor.frames){const meta=await sharp(path.join(root,'public',src)).metadata();actorImage='data:image/png;base64,'+(await sharp(path.join(root,'public',src)).extract({left:p.frame*meta.width/actor.frames,top:0,width:meta.width/actor.frames,height:meta.height}).png().toBuffer()).toString('base64')}body+=`<g transform="translate(${p.x},${p.y}) ${actor.kind==='car'?`rotate(${p.angle})`:''}"><image href="${actorImage}" x="${-w/2}" y="${-h}" width="${w}" height="${h}"${actor.kind!=='car'&&p.flip?' transform="scale(-1,1)"':''}/></g>`;continue}
   const b=layer.bounds??layer.sourceBounds;
   let raster=`<image href="${await asset(layer.src)}" x="${b?b.left*6.4:0}" y="${b?b.top*4.27:0}" width="${b?b.width*6.4:640}" height="${b?b.height*4.27:427}" preserveAspectRatio="${layer.bounds?'xMidYMid meet':'none'}"/>`;
   if(layer.clip&&!layer.bounds){const id='c'+serial++,pts=[...layer.clip.matchAll(/([\d.]+)%\s+([\d.]+)%/g)].map(m=>`${m[1]*6.4},${m[2]*4.27}`).join(' ');defs+=`<clipPath id="${id}"><polygon points="${pts}"/></clipPath>`;raster=`<g clip-path="url(#${id})">${raster}</g>`;if(layer.progress<1){const xs=[...layer.clip.matchAll(/([\d.]+)%\s+[\d.]+%/g)].map(m=>+m[1]),left=Math.min(...xs),width=(Math.max(...xs)-left)*layer.progress,id='c'+serial++;defs+=`<clipPath id="${id}"><rect x="${left*6.4}" y="0" width="${width*6.4}" height="427"/></clipPath>`;raster=`<g clip-path="url(#${id})">${raster}</g>`;}}
   body+=raster;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="427"><defs>${defs}</defs>${body}</svg>`;
 }
 fs.mkdirSync(path.join(out,'estadio-etapas'),{recursive:true});
 const thumbs=[];
 for(let i=0;i<stages.length;i++){
  const svg=await sceneSVG(stages[i]),file=path.join(out,'estadio-etapas',String(i).padStart(2,'0')+'.png');await sharp(Buffer.from(svg)).png().toFile(file);
  const panel=`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="472"><rect width="640" height="472" fill="#f4ecd6"/><text x="10" y="26" fill="#0c0c0c" font-size="17" font-family="sans-serif">${escape(String(i).padStart(2,'0')+' — '+stages[i].name.replace(/^[0-9]+ — /,''))}</text><image href="data:image/png;base64,${fs.readFileSync(file).toString('base64')}" y="42" width="640" height="427"/></svg>`;
  thumbs.push({input:await sharp(Buffer.from(panel)).resize(400,295).png().toBuffer(),left:(i%3)*400,top:Math.floor(i/3)*295});
 }
 await sharp({create:{width:1200,height:Math.ceil(stages.length/3)*295,channels:4,background:'#f4ecd6'}}).composite(thumbs).png().toFile(path.join(out,'estadio-todas-etapas.png'));
 // Six close-up review scenes, all from the same world and model.
 const chosen=[0,2,4,9,23,stages.length-1];
 await sharp({create:{width:1280,height:3*472,channels:4,background:'#f4ecd6'}}).composite(await Promise.all(chosen.map(async(index,i)=>{const svg=await sceneSVG(stages[index]);const panel=`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="472"><rect width="640" height="472" fill="#f4ecd6"/><text x="12" y="28" font-family="sans-serif" font-size="19">${escape(stages[index].name)}</text><image href="data:image/png;base64,${(await sharp(Buffer.from(svg)).png().toBuffer()).toString('base64')}" y="42" width="640" height="427"/></svg>`;return {input:await sharp(Buffer.from(panel)).png().toBuffer(),left:i%2*640,top:Math.floor(i/2)*472}}))).png().toFile(path.join(out,'estadio-revisao.png'));
 const embedded={};for(const stage of stages)for(const layer of plan(stage,0))for(const src of [layer.src,layer.actor?.srcBack].filter(Boolean))embedded[src]='data:image/'+(src.endsWith('.png')?'png':'webp')+';base64,'+fs.readFileSync(path.join(root,'public',src)).toString('base64');
 const style=fs.readFileSync(path.join(root,'src/escalacao/presidencia-estadio-mapa.css'),'utf8')+fs.readFileSync(path.join(root,'src/escalacao/presidencia-estadio-camadas.css'),'utf8');
 const html=`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mapa evolutivo — prévia local</title><style>${style}*{box-sizing:border-box}body{margin:0;background:#f4ecd6;color:#0c0c0c;font:16px Arial,sans-serif}main{max-width:1100px;margin:auto;padding:16px}h1{font-size:24px}select,button{font:inherit;border:2px solid #0c0c0c;border-radius:8px;background:#f4ecd6;padding:9px}select{max-width:100%;margin:8px 0}.pe-map-viewport{border-radius:10px}.pe-map-world{position:relative}#scene{width:100%;height:100%;position:relative}.item{position:absolute;pointer-events:none}.item img{display:block;width:100%;height:100%;object-fit:fill}.actor img{object-fit:contain}.legend{font-size:13px}.warn{border-left:4px solid #c2452f;padding:8px}#name{font-weight:bold}</style><main><h1>Estádio: cada clique e melhoria</h1><p class="warn">Prévia local do modelo. Não publicada. Navegação e movimento demonstrados aqui; ainda não é o aplicativo validado no navegador.</p><select id="stage" aria-label="Etapa">${stages.map((s,i)=>`<option value="${i}">${escape(s.name)}</option>`).join('')}</select><div class="pe-map-tools"><button id="prev">← Etapa anterior</button><button id="next">Próxima etapa →</button><button id="in" aria-label="Aproximar mapa">+</button><output id="level">100%</output><button id="out" aria-label="Afastar mapa">−</button><button id="fit">VER TUDO</button><button id="pause">PAUSAR</button></div><div id="viewport" class="pe-map-viewport" tabindex="0"><div id="world" class="pe-map-world"><div id="scene"></div></div></div><p id="name"></p><p class="legend">Arraste para explorar; use dois dedos para aproximar. Carros na rua são tráfego ambiente. Obras e destinos seguem as compras desta prévia. As duas vistas usam as mesmas obras; a janela mantém seu enquadramento.</p></main><script>${runtime}\nconst stages=${JSON.stringify(stages)},assets=${JSON.stringify(embedded)},treeClips=${JSON.stringify(treeClips)},sites=${JSON.stringify(sites)},office=${JSON.stringify(office)};
const scene=document.querySelector('#scene'),world=document.querySelector('#world'),vp=document.querySelector('#viewport'),selector=document.querySelector('#stage');let index=0,seconds=0,last=0,paused=false,actors=[],view={zoom:1,x:0,y:0};
function image(src,style,extra){const el=document.createElement('div');el.className='item '+(extra||'');Object.assign(el.style,style);const img=document.createElement('img');img.src=assets[src];img.alt='';el.append(img);scene.append(el);return el}
function raster(src,clip,depth,b){return image(src,{inset:b?'auto':'0',left:b?b.left+'%':undefined,top:b?b.top+'%':undefined,width:b?b.width+'%':undefined,height:b?b.height+'%':undefined,clipPath:clip||'none',zIndex:depth||0})}
function show(){index=+selector.value;const s=stages[index];scene.replaceChildren();actors=[];raster('estadio-mapa/terreno.webp',null,0);const g=s.grass;if(g>0)raster('estadio-v104/grama.webp','polygon(33.1% 26%, '+(33.1+32.1*g)+'% 26%, '+(30.5+37.1*g)+'% 43.5%, 30.5% 43.5%)',1);
if((s.stadium.inv.visitante||0)>=120&&(s.stadium.inv.cadeiras||0)>=90)raster('estadio-v242/canto-direito-overlay.png',null,2001);
for(const l of s.layers){if(l.bounds){raster(l.src,null,l.depth,l.bounds);continue}const el=document.createElement('div');el.className='item';Object.assign(el.style,{inset:'0',clipPath:l.clip,zIndex:l.depth||0});const reveal=document.createElement('div');Object.assign(reveal.style,{position:'absolute',inset:'0'});if(l.progress<1){const xs=[...l.clip.matchAll(/([\\d.]+)%\\s+[\\d.]+%/g)].map(m=>+m[1]),left=Math.min(...xs),right=100-(left+(Math.max(...xs)-left)*l.progress);reveal.style.clipPath='inset(0 '+right+'% 0 '+left+'%)'}const img=document.createElement('img');img.src=assets[l.src];img.alt='';if(l.sourceBounds){const b=l.sourceBounds;Object.assign(img.style,{position:'absolute',left:b.left+'%',top:b.top+'%',width:b.width+'%',height:b.height+'%'})}reveal.append(img);el.append(reveal);scene.append(el)}
if(office[s.stage])raster(office[s.stage],'polygon(27% 42%, 72% 42%, 72% 58%, 27% 58%)',2250);for(const [key,left,top,cost] of sites){const paid=s.stadium.inv[key]||0;if(paid>0&&paid<cost)raster('estadio-mapa/obra.webp',null,2500,{left,top,width:4,height:4*640/427*61/140})}for(const a of s.actors){const el=image(a.src,{width:a.width/640*100+'%',height:a.height/427*100+'%',transformOrigin:'center bottom',overflow:a.frames?'hidden':'visible'},'actor');if(a.frames)el.firstChild.style.width=a.frames*100+'%';actors.push([a,el])}for(const clip of treeClips)raster('estadio-mapa/terreno.webp',clip,6000);document.querySelector('#name').textContent=s.name;document.querySelector('#prev').disabled=index===0;document.querySelector('#next').disabled=index===stages.length-1;paint()}
function paint(){for(const [a,el] of actors){const p=quadroAtor(a,seconds);const img=el.firstChild;img.src=assets[p.back&&a.srcBack?a.srcBack:a.src];img.style.transform=a.frames?'translateX('+(-p.frame/a.frames*100)+'%)':'';Object.assign(el.style,{left:p.x/640*100+'%',top:p.y/427*100+'%',zIndex:p.depth,transform:'translate(-50%,-100%) scale('+p.scale+')'+(a.kind==='car'?' rotate('+p.angle+'deg)':' scaleX('+(p.flip?-1:1)+')')})}}
const reduce=matchMedia('(prefers-reduced-motion: reduce)');function tick(now){if(!paused&&!reduce.matches&&!document.hidden&&last)seconds+=Math.min(.08,(now-last)/1000);last=now;paint();requestAnimationFrame(tick)}
function apply(v){view=limitarVistaMapa(v,vp.clientWidth,vp.clientHeight);world.style.transform='translate('+view.x+'px,'+view.y+'px) scale('+view.zoom+')';document.querySelector('#level').textContent=Math.round(view.zoom*100)+'%'}function zoom(f){apply(aproximarMapa(view,view.zoom*f,{x:0,y:0},vp.clientWidth,vp.clientHeight))}
selector.onchange=show;document.querySelector('#prev').onclick=()=>{selector.value=--index;show()};document.querySelector('#next').onclick=()=>{selector.value=++index;show()};document.querySelector('#in').onclick=()=>zoom(1.35);document.querySelector('#out').onclick=()=>zoom(1/1.35);document.querySelector('#fit').onclick=()=>apply({zoom:1,x:0,y:0});document.querySelector('#pause').onclick=e=>{paused=!paused;e.target.textContent=paused?'RETOMAR':'PAUSAR'};
const touches=new Map();let gesture=null;function rebase(){const p=[...touches.values()];if(!p.length){gesture=null;return}const a=p[0],b=p[1]||a;gesture={view:{...view},cx:(a.x+b.x)/2,cy:(a.y+b.y)/2,distance:p.length>1?Math.hypot(a.x-b.x,a.y-b.y):0}}
vp.onpointerdown=e=>{if(touches.size>=2)return;vp.setPointerCapture(e.pointerId);touches.set(e.pointerId,{x:e.clientX,y:e.clientY});rebase()};vp.onpointermove=e=>{if(!touches.has(e.pointerId)||!gesture)return;touches.set(e.pointerId,{x:e.clientX,y:e.clientY});const p=[...touches.values()],a=p[0],b=p[1]||a,g=gesture,r=vp.getBoundingClientRect(),cx=(a.x+b.x)/2,cy=(a.y+b.y)/2;const v=p.length>1&&g.distance>0?aproximarMapa(g.view,g.view.zoom*Math.hypot(a.x-b.x,a.y-b.y)/g.distance,{x:g.cx-r.left-r.width/2,y:g.cy-r.top-r.height/2},r.width,r.height):g.view;apply({...v,x:v.x+cx-g.cx,y:v.y+cy-g.cy})};vp.onpointerup=vp.onpointercancel=vp.onlostpointercapture=e=>{touches.delete(e.pointerId);rebase()};new ResizeObserver(()=>apply(view)).observe(vp);show();requestAnimationFrame(tick);
</script></html>`;
 fs.writeFileSync(path.join(out,'estadio-mapa-interativo.html'),html);
 console.log('PASS preview: '+stages.length+' etapas; mapa interativo e imagens em test-results. Modelo estático, sem publicar.');
})().catch(e=>{console.error(e);process.exitCode=1});
