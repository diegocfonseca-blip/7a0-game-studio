// 🧍 27/10 — monta o JOGADOR NOVO do 3D a partir do boneco do Meshy (esqueleto Mixamo) e dos movimentos de futebol do Mixamo.
// Os arquivos crus (FBX do Meshy e da Adobe) NÃO entram no repositório; este script lê de uma pasta local e grava só o resultado:
//   public/futebol3d/jogador.glb        boneco leve + esqueleto + movimentos já convertidos pro esqueleto dele
//   public/futebol3d/jogador-roupa.png  máscara: R camisa · G calção · B meião (cor do clube) · alfa 0 cabelo · 128 pele (tom da lenda)
//   (o GLB leva também o alvo de forma "careca": o cabelo encolhe até o crânio pra quem não é lenda)
//   public/futebol3d/jogador-meta.json  dados dos movimentos (velocidade da corrida, instante do toque na bola)
// Uso (com o vite de pé na porta 5190 e DEPLOY_BASE=/):  node scripts/futebol3d/monta-jogador.mjs <pasta-com-rig.fbx-e-anim/>
// A pasta precisa estar servida pelo vite (ex.: tmp-meshy/ na raiz do projeto, fora do git).
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path'
const {chromium}=createRequire(import.meta.url)('playwright')
const PASTA=process.argv[2]||'tmp-meshy',OUT=new URL('../../public/futebol3d/',import.meta.url);fs.mkdirSync(OUT,{recursive:true})
// nome no jogo → arquivo do Mixamo
const CLIPS={idle:'Offensive Soccer Idle',idle_bola:'Playing With Ball Idle',trote:'Soccer Jog Forward',re:'Soccer Jog Backward',lado_e:'Soccer Strafe Left',lado_d:'Soccer Strafe Right',
 diag_fe:'Soccer Jog Diagonal Forward Left',diag_fd:'Soccer Jog Diagonal Forward Right',diag_te:'Soccer Jog Diagonal Backward Left',diag_td:'Soccer Jog Diagonal Backward Right',
 conduz:'Forward Jog Dribbling Soccer Ball',passe:'Soccer Pass From Idle Pose',chute:'Male Soccer Penalty Kick',chute_corrida:'Jogging And Kicking A Soccerball Forward',cavadinha:'Soccer Chip Shot While Jogging',
 cabeca:'Soccer Header In Place',cabeca2:'Idle Soccer Header',peito:'Soccer Idle Chest Receive',dominio:'Receiving A Soccerball And Playing With It',giro:'Soccer 360 Spin',bicicleta:'Soccer Scissor Kick To Goal',
 lateral:'Soccer Sideline Throw In',carrinho:'Soccer Slide Tackle',cai:'Tripping Over A Soccer Tackle',levanta:'Standing Up From A Soccer Fall',
 gk_idle:'Goalkeeper Idle Without Ball',gk_idle_bola:'Goalkeeper Idle Holding Ball',gk_voo_e:'Goalkeeper Left Diving Save',gk_voo_d:'Goalkeeper Right Diving Save',gk_pega_baixo:'Goalkeeper Catching Ball Low Height',
 gk_pega:'Goalkeeper Catching Ball Medium Height',gk_pega_alto:'Goalkeeper Jump Catching Ball High Height',gk_passo_e:'Goalkeeper Left Sidestep',gk_passo_d:'Goalkeeper Right Sidestep',gk_chutao:'Goalkeeper Drop Kicking Ball',
 gk_lanca:'Goalie Overhand Throw',gk_rola:'Goalkeeper Rolling Pass',gk_recolhe:'Goalkeeper Scooping The Ball From A Roll'}
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--ignore-gpu-blocklist']})
const page=await (await browser.newContext({viewport:{width:800,height:600}})).newPage();const logs=[];page.on('pageerror',e=>logs.push(e.message));page.on('console',m=>{if(m.type()==='error')logs.push(m.text())})
await page.goto('http://localhost:5190/qa-presidencia-mapa.html',{waitUntil:'load'});await page.waitForFunction(()=>window.qaThree,{},{timeout:240000})
await page.exposeFunction('__grava',(nome,dataUrl)=>fs.writeFileSync(new URL(nome,OUT),Buffer.from(dataUrl.split(',')[1],'base64')))
await page.exposeFunction('__gravaTexto',(nome,txt)=>fs.writeFileSync(new URL(nome,OUT),txt))
const r=await page.evaluate(async({PASTA,CLIPS})=>{
 const T=window.qaThree,{FBXLoader}=await import('/node_modules/three/examples/jsm/loaders/FBXLoader.js'),{GLTFExporter}=await import('/node_modules/three/examples/jsm/exporters/GLTFExporter.js')
 const L=new FBXLoader(),g=await L.loadAsync('/'+PASTA+'/rig.fbx');g.updateMatrixWorld(true)
 let mesh;g.traverse(o=>{if(o.isSkinnedMesh)mesh=o});const geo=mesh.geometry,pos=geo.attributes.position,uv=geo.attributes.uv,si=geo.attributes.skinIndex,sw=geo.attributes.skinWeight,bones=mesh.skeleton.bones
 // ── textura: 1024 px ──
 const espera=async()=>{for(let i=0;i<200;i++){const im=mesh.material.map?.image;if(im&&(im.width>0||im.naturalWidth>0)&&(im.complete??true))return im;await new Promise(r=>setTimeout(r,100))}throw Error('textura do boneco não carregou')}
 const S=1024,img=await espera(),cv=document.createElement('canvas');cv.width=cv.height=S;const cx=cv.getContext('2d');cx.drawImage(img,0,0,S,S);const base=cx.getImageData(0,0,S,S)
 // ── classe de cada vértice pelo osso que mais pesa ──
 const classeOsso=n=>/Head|Neck|headfront/i.test(n)?0:/ForeArm|Hand/i.test(n)?1:/Arm|Shoulder|Spine|Hips/i.test(n)?2:/UpLeg/i.test(n)?3:/Leg/i.test(n)?4:/Foot|Toe/i.test(n)?5:1
 const v=new T.Vector3(),hy=bones.find(b=>/Hips$/.test(b.name)).getWorldPosition(new T.Vector3()).y
 const bb=new T.Box3().setFromBufferAttribute(pos);mesh.updateMatrixWorld(true)
 const ys=[],cls=[];for(let i=0;i<pos.count;i++){let best=0,bw=-1;for(let k=0;k<4;k++){const w=sw.getComponent(i,k);if(w>bw){bw=w;best=si.getComponent(i,k)}}cls.push(classeOsso(bones[best].name));v.fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld);ys.push(v.y)}
 // cintura: um pouco acima do quadril (onde a camisa termina e o calção começa)
 const altura=Math.max(...ys)-Math.min(...ys),cintura=hy-altura*.012 /* (a barra da camisa cobre o cós do calção: acima do quadril ainda é camisa) */
 // ── pinta cada triângulo no espaço da textura com a parte do corpo dele ──
 const fy=mesh.material.map.flipY!==false
 const part=document.createElement('canvas');part.width=part.height=S;const px=part.getContext('2d');px.fillStyle='#000';px.fillRect(0,0,S,S)
 const idx=geo.index?Array.from(geo.index.array):[...Array(pos.count).keys()]
 const cor=['#fff','#fff','#f00','#0f0','#00f','#fff','#ff0'] // camisa/calção/meião em canal próprio; o resto branco: a borda suavizada nunca vira outra parte
 for(let t=0;t<idx.length;t+=3){const a=idx[t],b=idx[t+1],c=idx[t+2],cs=[cls[a],cls[b],cls[c]],cl=cs.sort((x,y)=>cs.filter(z=>z===y).length-cs.filter(z=>z===x).length)[0];const y=(ys[a]+ys[b]+ys[c])/3
  let parte=cl===0?6:cl===1?1:cl===2?(y>cintura?2:3):cl===3?(y>cintura?2:3):cl===4?4:cl===5?5:1 // 6 cabeça · 1 antebraço/mão · 2 camisa · 3 calção · 4 meião · 5 chuteira
  px.fillStyle=cor[parte];px.strokeStyle=cor[parte];px.lineWidth=2;px.beginPath();for(const k of [a,b,c])px.lineTo(uv.getX(k)*S,(fy?1-uv.getY(k):uv.getY(k))*S);px.closePath();px.fill();px.stroke()}
 const pd=px.getImageData(0,0,S,S).data,bd=base.data
 const mask=cx.createImageData(S,S),md=mask.data
 const pele=(r,g,b)=>r>120&&r>g&&g>b&&r-b>35&&r-b<150&&g>70&&g/r>.6&&b/r>.4 // tom de pele (o brilho da listra vermelha tem g/r baixo: não é pele)
 const cont=[0,0,0,0,0,0]
  // roupa vira branco com as DOBRAS e o brilho da arte original (cada listra medida pela própria cor: vermelha pelo R, preta pelo
  // brilho) — a cor do time entra no jogo e o pano continua com volume, sem virar plástico liso
 const amostra=[],roupa=[]
 for(let i=0;i<S*S;i++){let R=pd[i*4],G=pd[i*4+1],B=pd[i*4+2],mxp=Math.max(R,G,B),p=R>200&&G>200&&B<60?6:mxp>70&&R===mxp&&R>2*G&&R>2*B?2:mxp>70&&G===mxp&&G>2*R&&G>2*B?3:mxp>70&&B===mxp&&B>2*R&&B>2*G?4:0 /* (a borda suavizada do triângulo também conta: senão vira risco claro na costura) */,r=bd[i*4],g2=bd[i*4+1],b=bd[i*4+2];md[i*4+3]=255
  // alfa da máscara: 255 resto · 128 pele (tom da lenda) · 0 cabelo (some no careca, ganha a cor da lenda)
  if(p===6&&(!pele(r,g2,b)||r<192)){md[i*4+3]=0;cont[1]++;continue}
  if(pele(r,g2,b)){md[i*4+3]=128;cont[0]++;continue} // (braço que sai da manga também: é pele, não camisa)
  if((p===2||p===3||p===4)&&!pele(r,g2,b)){const c=r>g2*1.5&&r>90,v=c?r:Math.max(r,g2,b),k=p*2+(c?1:0);(amostra[k]??=[]).push(v);roupa.push([i,k,v]);md[i*4+(p-2)]=255;cont[p]++}else cont[p]++}
 amostra.length=0;for(const [,k,v] of roupa)(amostra[k]??=[]).push(v)
 // cada grupo (parte × listra vermelha/escura) vira branco pela MEDIANA dele: a dobra e o brilho ficam, a listra some
 const med=amostra.map(a=>{if(!a)return 1;const b=Float32Array.from(a).sort();return Math.max(1,b[b.length>>1])})
 for(const [i,k,v] of roupa){const s2=Math.round(226*Math.min(1.13,Math.max(.62,v/med[k])));bd[i*4]=bd[i*4+1]=bd[i*4+2]=s2}
 // costura: espalha a roupa 4 px pra fora das ilhas (texel vazio), senão o filtro da textura puxa uma linha clara na emenda
 for(let passo=0;passo<8;passo++){const md0=md.slice(),bd0=bd.slice();for(let y=1;y<S-1;y++)for(let x=1;x<S-1;x++){const i=y*S+x;const tem=j=>md0[j*4]|md0[j*4+1]|md0[j*4+2]||md0[j*4+3]<255;if(Math.max(pd[i*4],pd[i*4+1],pd[i*4+2])>200||tem(i))continue
  for(const j of [i-1,i+1,i-S,i+S]){if(tem(j)){for(let k=0;k<4;k++){md[i*4+k]=md0[j*4+k];if(k<3)bd[i*4+k]=bd0[j*4+k]}break}}}}
 cx.putImageData(base,0,0);const baseUrl=cv.toDataURL('image/jpeg',.88)
 const mc=document.createElement('canvas');mc.width=mc.height=S;mc.getContext('2d').putImageData(mask,0,0);await window.__grava('jogador-roupa.png',mc.toDataURL('image/png'))
 const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;tex.flipY=mesh.material.map.flipY;tex.userData.mimeType='image/jpeg';mesh.material=new T.MeshStandardMaterial({map:tex,roughness:.5,metalness:0,name:'jogador'})
 // ── movimentos: rotação de mundo com as poses de referência casadas (T do Mixamo → A do boneco) ──
 const tb=new Map();g.traverse(o=>{if(o.isBone)tb.set(o.name,o)});const hips=tb.get('mixamorigHips'),h0=hips.position.clone()
 const depth=o=>{let d=0;while(o.parent){o=o.parent;d++}return d}
 const clips=[],meta={}
 for(const [nome,arq] of Object.entries(CLIPS)){
  let src;try{src=await L.loadAsync('/'+PASTA+'/anim/'+encodeURIComponent(arq)+'.fbx')}catch(e){meta[nome]={erro:'sem arquivo'};continue}
  const clip=src.animations[0];src.updateMatrixWorld(true);const sb=new Map();src.traverse(o=>{if(o.isBone)sb.set(o.name,o)})
  const names=[...tb.keys()].filter(n=>sb.has(n)&&!/Hand.+\d|Bone_|headfront|_End/.test(n)).sort((x,y)=>depth(tb.get(x))-depth(tb.get(y)))
  const child=(m,n)=>m.get(n).children.find(c=>c.isBone&&m.has(c.name))
  for(const n of names){const s1=sb.get(n),t1=tb.get(n),sc=child(sb,n),tc=child(tb,n);if(!sc||!tc||/Hips|Spine|Neck|Head/.test(n))continue
   src.updateMatrixWorld(true);const sd=sc.getWorldPosition(new T.Vector3()).sub(s1.getWorldPosition(new T.Vector3())).normalize(),td=tc.getWorldPosition(new T.Vector3()).sub(t1.getWorldPosition(new T.Vector3())).normalize()
   const q=new T.Quaternion().setFromUnitVectors(sd,td),nw=q.multiply(s1.getWorldQuaternion(new T.Quaternion()));s1.quaternion.copy(s1.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(nw));s1.updateMatrixWorld(true)}
  src.updateMatrixWorld(true);g.updateMatrixWorld(true)
  const ref=new Map(names.map(n=>[n,{s:sb.get(n).getWorldQuaternion(new T.Quaternion()),t:tb.get(n).getWorldQuaternion(new T.Quaternion())}]))
  const sm=new T.AnimationMixer(src),sa=sm.clipAction(clip);sa.play()
  const fps=24,dur=/^(idle|idle_bola)$/.test(nome)?Math.min(4,clip.duration):clip.duration,frames=Math.max(1,Math.ceil(dur*fps)),times=[],vals=new Map(names.map(n=>[n,[]])),hp=[],sh=sb.get('mixamorigHips');let sy0=null,sx0=0,sz0=0,sxl=0,szl=0
  const saved=names.map(n=>[tb.get(n),tb.get(n).quaternion.clone()]);const foot={l:[],r:[]}
  for(let i=0;i<=frames;i++){const t=Math.min(dur,i/fps);times.push(+t.toFixed(4));sa.time=t;sm.update(0);src.updateMatrixWorld(true)
   for(const n of names){const rr=ref.get(n),want=sb.get(n).getWorldQuaternion(new T.Quaternion()).multiply(rr.s.clone().invert()).multiply(rr.t),bone=tb.get(n);bone.quaternion.copy(bone.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(want).normalize());bone.updateMatrixWorld(true);vals.get(n).push(...bone.quaternion.toArray().map(x=>+x.toFixed(4)))}
   const p=sh.getWorldPosition(new T.Vector3());if(sy0===null){sy0=p.y;sx0=p.x;sz0=p.z}sxl=p.x;szl=p.z
   hp.push(h0.x,+(h0.y+(p.y-sy0)*(h0.y/sy0)).toFixed(4),h0.z)
   for(const [k,nm] of [['l','mixamorigLeftFoot'],['r','mixamorigRightFoot']])foot[k].push(tb.get(nm).getWorldPosition(new T.Vector3()))}
  for(const [b,qq] of saved)b.quaternion.copy(qq);g.updateMatrixWorld(true)
  // velocidade do deslocamento original (escala da fonte → metros pelo quadril) e instante do toque: pé mais rápido
  const escala=h0.y/sy0/ (g.scale.y||1),dist=Math.hypot(sxl-sx0,szl-sz0)*escala
  let toque=null,maxv=0,pe=null;for(const k of ['l','r'])for(let i=1;i<foot[k].length;i++){const sp=foot[k][i].distanceTo(foot[k][i-1])*fps;if(sp>maxv){maxv=sp;toque=times[i];pe=k}}
  const tracks=names.map(n=>new T.QuaternionKeyframeTrack(n+'.quaternion',times,vals.get(n)));tracks.push(new T.VectorKeyframeTrack('mixamorigHips.position',times,hp))
  clips.push(new T.AnimationClip(nome,dur,tracks).optimize());meta[nome]={arquivo:arq,duracao:+dur.toFixed(3),deslocamento:+dist.toFixed(3),toque,pe}
 }
 // ── careca (quem não é lenda): alvo de forma que encolhe o cabelo até o crânio ──
 {const pel=new Uint8Array(pos.count),cab=new Uint8Array(pos.count),w=new T.Vector3(),inv=mesh.matrixWorld.clone().invert(),P=[]
  for(let i=0;i<pos.count;i++){const x=Math.min(S-1,Math.floor(uv.getX(i)*S)),y=Math.min(S-1,Math.floor((fy?1-uv.getY(i):uv.getY(i))*S));const al=md[(y*S+x)*4+3];cab[i]=al<64?1:0;pel[i]=cls[i]===0&&al>100&&al<160?1:0;P.push(w.fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld).clone())}
  // crânio = elipsoide medido pela pele do rosto (largura das orelhas, testa, frente); todo vértice da cabeça que não é pele e
  // fica fora dele é puxado pra superfície (+3%). Pele nunca se mexe — o rosto continua igual.
  const pz=P.filter((p,i)=>pel[i]&&p.y>140),q=(k,f)=>{const v=pz.map(p=>p[k]).sort((x,y)=>x-y);return v[Math.floor(f*(v.length-1))]}
  const rx=(q('x',.95)-q('x',.05))/2,c=new T.Vector3((q('x',.95)+q('x',.05))/2,q('y',.95)-rx*1.15,q('z',.95)-rx*1.2),R3=new T.Vector3(rx,rx*1.28,rx*1.18)
  // o FBX vem com vértice repetido por triângulo: decide por PONTO (todas as cópias juntas), senão uma cópia anda e a outra
  // fica e o triângulo vira espinho. Ponto em dúvida segue a maioria dos vizinhos (2 passadas).
  const gid=new Int32Array(pos.count),chave=new Map(),G=[];for(let i=0;i<pos.count;i++){const p=P[i],k=Math.round(p.x*200)+','+Math.round(p.y*200)+','+Math.round(p.z*200);let g=chave.get(k);if(g===undefined){g=G.length;chave.set(k,g);G.push({v:[],p,c0:false,sim:0,pele:0})}gid[i]=g;const o=G[g];o.v.push(i);if(cls[i]===0)o.c0=true;if(pel[i])o.pele++;else if(cls[i]===0||(cab[i]&&p.y>c.y-R3.y*1.6))o.sim++}
  const viz=G.map(()=>new Set());for(let t=0;t<idx.length;t+=3){const a=gid[idx[t]],b=gid[idx[t+1]],e=gid[idx[t+2]];viz[a].add(b).add(e);viz[b].add(a).add(e);viz[e].add(a).add(b)}
  const fora=o=>o.p.clone().sub(c).divide(R3).length()>1.03
  let mexe=G.map(o=>o.sim>o.pele) // cabelo de dentro também vai pra superfície: camadas em alturas diferentes deixavam a cabeça amassada
  for(let it=0;it<2;it++){const m2=mexe.slice();G.forEach((o,g)=>{if(mexe[g]||!(o.c0||o.sim)||!fora(o))return;let s=0;for(const h of viz[g])s+=mexe[h];if(viz[g].size&&s/viz[g].size>=.6)m2[g]=true});mexe=m2}
  const d=new Float32Array(pos.count*3),dn=new Float32Array(pos.count*3),nor=geo.attributes.normal,nm=new T.Matrix3().getNormalMatrix(inv),nv=new T.Vector3();let n=0
  const pescoco=c.y-R3.y*.55,rp=rx*.68,eixo=new T.Vector3(c.x,0,c.z-R3.z*.12)
  G.forEach((o,g)=>{if(!mexe[g])return;const p=o.p;let alvo,nn
   if(p.y>=pescoco){const e=p.clone().sub(c).divide(R3),k=e.length();alvo=c.clone().add(e.multiplyScalar(1.03/k).multiply(R3));nn=alvo.clone().sub(c).divide(R3).divide(R3).normalize()}
   else{const h=new T.Vector3(p.x-eixo.x,0,p.z-eixo.z),l=h.length();if(l<=rp)return;alvo=new T.Vector3(eixo.x,p.y,eixo.z).add(h.multiplyScalar(rp/l));nn=new T.Vector3(alvo.x-eixo.x,0,alvo.z-eixo.z).normalize()}
   // (cabelo comprido caído na nuca vira uma camada fina em volta do pescoço, sem puxar a gola pro crânio)
   const al=alvo.clone().applyMatrix4(inv);nv.copy(nn).applyMatrix3(nm).normalize();n++
   for(const i of o.v){const ol=w.fromBufferAttribute(pos,i);d[i*3]=al.x-ol.x;d[i*3+1]=al.y-ol.y;d[i*3+2]=al.z-ol.z;dn[i*3]=nv.x-nor.getX(i);dn[i*3+1]=nv.y-nor.getY(i);dn[i*3+2]=nv.z-nor.getZ(i)}})
  const r=rx
  geo.morphAttributes.position=[new T.BufferAttribute(d,3)];geo.morphAttributes.normal=[new T.BufferAttribute(dn,3)];geo.morphTargetsRelative=true;mesh.updateMorphTargets();mesh.morphTargetDictionary={careca:0};mesh.morphTargetInfluences=[0]
  cont.push({cabeloVert:n,raio:+r.toFixed(2),c:c.toArray().map(x=>+x.toFixed(1))})}
 // ── exporta o boneco + movimentos ── (vértices repetidos do FBX juntados: 31 mil → ~5 mil)
 const {mergeVertices}=await import('/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js');const antes=mesh.geometry.attributes.position.count;mesh.geometry=mergeVertices(mesh.geometry,1e-5);const depois=mesh.geometry.attributes.position.count
 const glb=await new GLTFExporter().parseAsync(g,{binary:true,animations:clips,onlyVisible:true})
 const blob=new Blob([glb]),url=await new Promise(res=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.readAsDataURL(blob)})
 await window.__grava('jogador.glb',url)
 const metaTxt=JSON.stringify({fonte:'Meshy (boneco do Diego, esqueleto Mixamo) + movimentos Mixamo (Adobe) baixados pela conta do Diego',triangulos:idx.length/3,altura,cintura,partes:cont,clips:meta},null,1)
 await window.__gravaTexto('jogador-meta.json',metaTxt)
 return {flipY:fy,verts:[antes,depois],tri:idx.length/3,clips:clips.length,partes:cont,cintura,hy,altura,glbMB:(glb.byteLength/1e6).toFixed(2)}
},{PASTA,CLIPS})
console.log(JSON.stringify(r),'erros',JSON.stringify(logs.slice(0,5)));await browser.close()
