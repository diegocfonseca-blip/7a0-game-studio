// 🧍 27/10 — monta o JOGADOR do 3D: boneco do Tripo (uniforme branco liso) com esqueleto Mixamo + os movimentos de futebol do Mixamo.
// Os arquivos crus (Tripo/Mixamo/Adobe) NÃO entram no repositório; este script lê de uma pasta local e grava só o resultado:
//   public/futebol3d/jogador.glb          boneco + esqueleto + movimentos, com a textura ORIGINAL (nunca repintada)
//   public/futebol3d/jogador-uniforme.png MAPA DE REGIÕES (R região·20 +10 nas costas · G altura · B posição lateral): diz,
//                                          texel a texel, o que é pele/cabelo/camisa/mangas/gola/calção/meião/chuteira — é por ele
//                                          que o jogo veste cada time (jogador-novo.mjs + uniformes.mjs)
//   public/futebol3d/jogador-meta.json    dados dos movimentos (velocidade, instante do toque) + medidas do uniforme
// Uso (com o vite de pé na porta 5190 e DEPLOY_BASE=/):  node scripts/futebol3d/monta-jogador.mjs tmp-tripo
// A pasta (fora do git) tem rig.fbx (do Mixamo), base.jpg (a arte original do Tripo) e anim/ (os FBX dos movimentos).
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
const MED=JSON.parse(process.env.MEDIDAS||'{}'),SO_MAPA=process.env.SO_MAPA==='1' // (ajuste fino do corte e teste rápido só do mapa)
const r=await page.evaluate(async({PASTA,CLIPS,MED,SO_MAPA})=>{
 const T=window.qaThree,{FBXLoader}=await import('/node_modules/three/examples/jsm/loaders/FBXLoader.js'),{GLTFExporter}=await import('/node_modules/three/examples/jsm/exporters/GLTFExporter.js')
 const L=new FBXLoader(),g=await L.loadAsync('/'+PASTA+'/rig.fbx');g.updateMatrixWorld(true)
 let mesh;g.traverse(o=>{if(o.isSkinnedMesh)mesh=o});const geo=mesh.geometry,pos=geo.attributes.position,uv=geo.attributes.uv,si=geo.attributes.skinIndex,sw=geo.attributes.skinWeight,bones=mesh.skeleton.bones
 // ── textura ORIGINAL do boneco (nunca é repintada: a cor do time entra no jogo, por cima, só onde o mapa de regiões manda) ──
 const espera=async()=>{for(let i=0;i<200;i++){const im=mesh.material.map?.image;if(im&&(im.width>0||im.naturalWidth>0)&&(im.complete??true))return im;await new Promise(r=>setTimeout(r,100))}throw Error('textura do boneco não carregou')}
 // (o boneco do Tripo volta do Mixamo com a textura embaralhada — usa a arte original `base.jpg` da pasta, se tiver)
 const deFora=await fetch('/'+PASTA+'/base.jpg').then(r=>r.ok&&/image/.test(r.headers.get('content-type')??'')?r.blob():null).catch(()=>null)
 const S=1024,img=deFora?await createImageBitmap(deFora):await espera(),cv=document.createElement('canvas');cv.width=cv.height=S;const cx=cv.getContext('2d');cx.drawImage(img,0,0,S,S);const bd=cx.getImageData(0,0,S,S).data
 const fy=mesh.material.map?.flipY!==false
 // ── ossos na pose de descanso (posição de cada parte do corpo) ──
 mesh.updateMatrixWorld(true);const ow=n=>{const b=bones.find(b=>b.name.replace(/[:]/g,'')==='mixamorig'+n);return b?b.getWorldPosition(new T.Vector3()):null}
 const O={hips:ow('Hips'),spine:ow('Spine1'),neck:ow('Neck'),head:ow('Head'),ombroE:ow('LeftArm'),ombroD:ow('RightArm'),cotoE:ow('LeftForeArm'),cotoD:ow('RightForeArm'),coxaE:ow('LeftUpLeg'),coxaD:ow('RightUpLeg'),joelhoE:ow('LeftLeg'),joelhoD:ow('RightLeg'),peE:ow('LeftFoot'),peD:ow('RightFoot')}
 const P=[],cls=[],v=new T.Vector3();for(let i=0;i<pos.count;i++){P.push(v.fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld).clone());let best=0,bw=-1;for(let k=0;k<4;k++){const w=sw.getComponent(i,k);if(w>bw){bw=w;best=si.getComponent(i,k)}}cls.push(bones[best].name.replace(/[:]/g,''))}
 const ys=P.map(p=>p.y),y0=Math.min(...ys),altura=Math.max(...ys)-y0,ax=(O.spine.x+O.hips.x)/2,az=(O.spine.z+O.hips.z)/2
 // zona do corpo pelo osso que mais pesa no vértice: cabeça · braço · tronco · coxa · canela · pé
 const zonaDe=n=>/Head|Neck/.test(n)?'cabeca':/Hand|ForeArm/.test(n)?'antebraco':/Arm|Shoulder/.test(n)?'braco':/Spine|Hips/.test(n)?'tronco':/UpLeg/.test(n)?'coxa':/Leg/.test(n)?'canela':/Foot|Toe/.test(n)?'pe':'tronco'
 const idx=geo.index?Array.from(geo.index.array):[...Array(pos.count).keys()]
 // ── 1) rasteriza cada triângulo NO ESPAÇO DA TEXTURA: cada texel sabe a que triângulo pertence e onde fica no corpo (3D) ──
 const triDe=new Int32Array(S*S).fill(-1),px3=new Float32Array(S*S*3),U=i=>uv.getX(i)*S,V=i=>(fy?1-uv.getY(i):uv.getY(i))*S
 const zonaTri=[];for(let t=0;t<idx.length;t+=3){const zs=[cls[idx[t]],cls[idx[t+1]],cls[idx[t+2]]].map(zonaDe);zonaTri.push(zs.sort((a,b)=>zs.filter(z=>z===b).length-zs.filter(z=>z===a).length)[0])}
 for(let t=0,ti=0;t<idx.length;t+=3,ti++){const a=idx[t],b=idx[t+1],c=idx[t+2],x0=U(a),y0_=V(a),x1=U(b),y1=V(b),x2=U(c),y2=V(c),den=(y1-y2)*(x0-x2)+(x2-x1)*(y0_-y2);if(Math.abs(den)<1e-9)continue
  const mnx=Math.max(0,Math.floor(Math.min(x0,x1,x2)-1)),mxx=Math.min(S-1,Math.ceil(Math.max(x0,x1,x2)+1)),mny=Math.max(0,Math.floor(Math.min(y0_,y1,y2)-1)),mxy=Math.min(S-1,Math.ceil(Math.max(y0_,y1,y2)+1)),e=.6/Math.sqrt(Math.abs(den))
  for(let y=mny;y<=mxy;y++)for(let x=mnx;x<=mxx;x++){const qx=x+.5,qy=y+.5,l0=((y1-y2)*(qx-x2)+(x2-x1)*(qy-y2))/den,l1=((y2-y0_)*(qx-x2)+(x0-x2)*(qy-y2))/den,l2=1-l0-l1;if(l0<-e||l1<-e||l2<-e)continue
   const i=y*S+x;if(triDe[i]>=0&&Math.min(l0,l1,l2)<0)continue;triDe[i]=ti;const pa=P[a],pb=P[b],pc=P[c];px3[i*3]=pa.x*l0+pb.x*l1+pc.x*l2;px3[i*3+1]=pa.y*l0+pb.y*l1+pc.y*l2;px3[i*3+2]=pa.z*l0+pb.z*l1+pc.z*l2}}
 // ── 2) cor de cada texel: pano (branco/cinza, sem cor) · pele (alaranjado) · escuro (chuteira/cabelo) ──
 const tipoCor=i=>{const r=bd[i*4],g=bd[i*4+1],b=bd[i*4+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b),sat=mx?(mx-mn)/mx:0;return mx<55?'escuro':sat<.27&&mx>70?'pano':'pele'}
 // ── diagnóstico: ilhas do atlas (triângulos ligados pelo UV) e quantas misturam pele e pano ──
 const pai=new Int32Array(idx.length/3).map((_,i)=>i),acha=i=>{while(pai[i]!==i){pai[i]=pai[pai[i]];i=pai[i]}return i},q=new Map()
 for(let t=0,ti=0;t<idx.length;t+=3,ti++)for(let k=0;k<3;k++){const key=Math.round(uv.getX(idx[t+k])*8192)+','+Math.round(uv.getY(idx[t+k])*8192),o=q.get(key);if(o===undefined)q.set(key,ti);else pai[acha(ti)]=acha(o)}
 const ilha=new Map();for(let i=0;i<S*S;i++){if(triDe[i]<0)continue;const k=acha(triDe[i]);let o=ilha.get(k);if(!o){o={pano:0,pele:0,escuro:0};ilha.set(k,o)}o[tipoCor(i)]++}
 const mistas=[...ilha.values()].filter(o=>Math.min(o.pano,o.pele)>40).length
 // medidas do corte (frações da altura do boneco) — conferidas na foto de regiões (tmp-tripo/regioes + verreg)
 const {KCINT=0,KGOLA_Y=.05,KGOLA_YC=.018,KGOLA_R=.065,KMANGA_T=.05,KMANGA_R=.056}=MED
 // ── 3) REGIÃO de cada texel = zona do corpo (osso + posição 3D) × tipo de cor. Tudo que não é roupa fica com a arte original ──
 // 0 vazio · 1 pele · 2 cabelo · 3 camisa · 4 mangas · 5 gola · 6 calção · 7 meião · 8 chuteira
 const H=altura,cint=O.hips.y+H*KCINT,golaY=O.neck.y-H*KGOLA_Y
 // manga = pano perto do EIXO DO BRAÇO (ombro→cotovelo), já pra fora do ombro: corte limpo na costura, não desce pela lateral
 const segDist=(p,a,b)=>{const ab=b.clone().sub(a),t=T.MathUtils.clamp(p.clone().sub(a).dot(ab)/ab.lengthSq(),-1,2),q=a.clone().addScaledVector(ab,t);return{d:p.distanceTo(q),t}}
 const manga=p=>{const ehE=Math.sign(O.ombroE.x-ax)===Math.sign(p.x-ax);const [a,b]=ehE?[O.ombroE,O.cotoE]:[O.ombroD,O.cotoD];const r=segDist(p,a,b);return r.t>KMANGA_T&&r.d<H*KMANGA_R}
 // gola = pano colado no pescoço (anel em volta dele), não o peito
 // (nas costas a gola é mais alta e fina que na frente, onde as pontas descem no peito)
 const gola=p=>Math.hypot(p.x-O.neck.x,p.z-O.neck.z)<H*KGOLA_R&&p.y>(p.z<O.neck.z?O.neck.y-H*KGOLA_YC:golaY)
 const reg=new Uint8Array(S*S);let nRoupa=0
 for(let i=0;i<S*S;i++){const t=triDe[i];if(t<0)continue;const z=zonaTri[t],c=tipoCor(i),x=px3[i*3]-ax,y=px3[i*3+1],k=c==='pano'
  let r=1
  if(z==='cabeca')r=k&&y<O.head.y?5:(c==='pele'?1:2)                      // cabeça nunca recebe cor do time (só a gola que sobe no pescoço: pano claro abaixo do crânio)
  else if(z==='antebraco')r=1                                              // antebraço e mão: sempre pele
  else if(z==='braco'||z==='tronco'){const p=new T.Vector3(px3[i*3],y,px3[i*3+2]);if(!k)r=1;else if(gola(p))r=5;else if(manga(p))r=4;else r=y<cint?6:3}
  else if(z==='coxa')r=k?(y<cint&&y>O.joelhoE.y?6:7):1
  else if(z==='canela')r=k?7:(c==='escuro'?8:1)
  else if(z==='pe')r=c==='escuro'||c==='pele'?8:7
  reg[i]=r;if(r>=3)nRoupa++}
 // limpeza: ponto isolado (cor de sombra/brilho) segue a maioria dos vizinhos do MESMO triângulo-ilha — tira as pintas
 for(let it=0;it<2;it++){const r0=reg.slice();for(let y=2;y<S-2;y++)for(let x=2;x<S-2;x++){const i=y*S+x;if(!r0[i])continue;const n=new Uint16Array(9);let tot=0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const j=i+dy*S+dx;if(r0[j]&&acha(triDe[j])===acha(triDe[i])){n[r0[j]]++;tot++}}let m=r0[i];for(let k2=1;k2<9;k2++)if(n[k2]>n[m])m=k2;if(m!==r0[i]&&n[m]>tot*.6&&!(r0[i]===1&&zonaTri[triDe[i]]==='cabeca'))reg[i]=m}}
 // ── 4) mapa de regiões (RGBA): R = região·20 (+10 nas costas) · G = altura no corpo · B = posição lateral (esquerda→direita)
 //    — listras e faixas seguem o CORPO, como numa camisa de verdade, não os pedaços do atlas · A = 255. Espalhado 6 px pra fora das ilhas (o filtro da textura não puxa vazio)
 const mapa=new Uint8ClampedArray(S*S*4);for(let i=0;i<S*S;i++){if(!reg[i])continue;const x=px3[i*3]-ax,z=px3[i*3+2]-az;mapa[i*4]=reg[i]*20+(z<0?10:0);mapa[i*4+1]=Math.round((px3[i*3+1]-y0)/H*255);mapa[i*4+2]=Math.round(T.MathUtils.clamp(.5+x/(.64*H),0,1)*255);mapa[i*4+3]=255}
 for(let passo=0;passo<6;passo++){const m0=mapa.slice();for(let y=1;y<S-1;y++)for(let x=1;x<S-1;x++){const i=y*S+x;if(m0[i*4+3])continue;for(const j of [i-1,i+1,i-S,i+S])if(m0[j*4+3]){for(let k=0;k<4;k++)mapa[i*4+k]=m0[j*4+k];break}}}
 const mc=document.createElement('canvas');mc.width=mc.height=S;mc.getContext('2d').putImageData(new ImageData(mapa,S,S),0,0);await window.__grava('jogador-uniforme.png',mc.toDataURL('image/png'))
 // (imagem de conferência: cada região numa cor)
 const CORES=[[0,0,0],[230,180,140],[90,50,20],[220,30,30],[240,140,0],[250,240,0],[30,90,220],[30,180,60],[40,40,40]],dbg=new Uint8ClampedArray(S*S*4)
 for(let i=0;i<S*S;i++){const c=CORES[reg[i]];dbg[i*4]=c[0];dbg[i*4+1]=c[1];dbg[i*4+2]=c[2];dbg[i*4+3]=255}
 const dc=document.createElement('canvas');dc.width=dc.height=S;dc.getContext('2d').putImageData(new ImageData(dbg,S,S),0,0);await window.__grava('../../tmp-tripo/regioes.png',dc.toDataURL('image/png'))
 // branco de referência do pano (luminância linear mediana): no jogo, sombra = luminância ÷ esse branco
 const lin=c=>{c/=255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4},lums=[];for(let i=0;i<S*S;i+=7)if(reg[i]>=3&&reg[i]<=7)lums.push(.2126*lin(bd[i*4])+.7152*lin(bd[i*4+1])+.0722*lin(bd[i*4+2]))
 lums.sort((a,b)=>a-b);const branco=lums[lums.length>>1]
 const cont={ilhas:ilha.size,ilhasMistas:mistas,texelsRoupa:nRoupa,branco:+branco.toFixed(3),cintura:+((cint-y0)/H).toFixed(3),gola:+((golaY-y0)/H).toFixed(3)}
 const tex=new T.Texture(img);tex.needsUpdate=true;tex.colorSpace=T.SRGBColorSpace;tex.flipY=fy;tex.userData.mimeType='image/jpeg';mesh.material=new T.MeshStandardMaterial({map:tex,roughness:.6,metalness:0,name:'jogador'})
 if(SO_MAPA)return{uniforme:cont}
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
 // ── exporta o boneco + movimentos ── (vértices repetidos do FBX juntados: 31 mil → ~5 mil)
 const {mergeVertices}=await import('/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js');const antes=mesh.geometry.attributes.position.count;mesh.geometry=mergeVertices(mesh.geometry,1e-5);const depois=mesh.geometry.attributes.position.count
 const glb=await new GLTFExporter().parseAsync(g,{binary:true,animations:clips,onlyVisible:true})
 const blob=new Blob([glb]),url=await new Promise(res=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.readAsDataURL(blob)})
 await window.__grava('jogador.glb',url)
 const metaTxt=JSON.stringify({fonte:'Tripo (boneco do Diego, uniforme branco) + esqueleto e movimentos Mixamo (Adobe) baixados pela conta do Diego',triangulos:idx.length/3,altura,uniforme:cont,clips:meta},null,1)
 await window.__gravaTexto('jogador-meta.json',metaTxt)
 return {flipY:fy,verts:[antes,depois],tri:idx.length/3,clips:clips.length,uniforme:cont,altura,glbMB:(glb.byteLength/1e6).toFixed(2)}
},{PASTA,CLIPS,MED,SO_MAPA})
console.log(JSON.stringify(r),'erros',JSON.stringify(logs.slice(0,5)));await browser.close()
