// 🧍 27/10 — JOGADOR do 3D: o boneco do Tripo (uniforme branco liso, sem rosto) com esqueleto Mixamo e os movimentos de futebol
// do Mixamo. UM boneco só pra todos os times: a geometria, o esqueleto, as animações e a textura original são compartilhados.
//
// 👕 COMO O UNIFORME É VESTIDO (sem pintar o boneco inteiro): o boneco tem UMA textura pra tudo (pele, cabelo e roupa no mesmo
// atlas, em ~100 pedaços — 26 deles misturam pele e pano). Por isso não dá pra trocar a cor do material (pintaria a pele) nem
// adivinhar pela cor (sombra de pele e pano cinza se confundem). O build (scripts/futebol3d/monta-jogador.mjs) grava um MAPA DE
// REGIÕES texel a texel (jogador-uniforme.png), decidido pela posição de cada ponto no corpo + o osso + a cor original:
//   R = região (1 pele · 2 cabelo · 3 camisa · 4 mangas · 5 gola · 6 calção · 7 meião · 8 chuteira)
//   (+10 nas costas) · G = altura do ponto no corpo · B = posição lateral → listras e faixas seguem o CORPO, não os pedaços do atlas
// No shader, só as regiões de roupa trocam de cor; o volume do pano (dobras e sombra) vem da textura original. Pele, rosto e
// cabelo passam intactos. A ficha de cada time mora em uniformes.mjs.
import * as T from 'three'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
import {clone} from 'three/addons/utils/SkeletonUtils.js'
import {TIPOS,chaveUniforme,completa} from './uniformes.mjs'
export const ALTURA_JOGADOR=1.78
let pronto=null
/** Carrega uma vez (cacheado): boneco + movimentos + mapa de regiões + dados dos movimentos. */
export function carregaJogadorNovo(base=(import.meta.env?.BASE_URL??'/')){
 pronto??=(async()=>{
  const [gltf,regioes,meta]=await Promise.all([
   new GLTFLoader().loadAsync(base+'futebol3d/jogador.glb'),
   new T.TextureLoader().loadAsync(base+'futebol3d/jogador-uniforme.png'),
   fetch(base+'futebol3d/jogador-meta.json').then(r=>r.json()),
  ])
  // (região é número: nunca misturar dois texels vizinhos — sem filtro e sem mipmap. O mapa fica na convenção do FBX original)
  regioes.flipY=true;regioes.colorSpace=T.NoColorSpace;regioes.generateMipmaps=false;regioes.minFilter=regioes.magFilter=T.NearestFilter
  const clips=new Map(gltf.animations.map(c=>[c.name,c]))
  for(const nome of ESPELHADOS){const c=clips.get(nome);if(c)clips.set(nome+'_e',espelhar(c,gltf.scene))}
  const bb=new T.Box3().setFromObject(gltf.scene),escala=ALTURA_JOGADOR/bb.getSize(new T.Vector3()).y
  return{gltf,regioes,meta,clips,escala}
 })()
 return pronto
}
// 🦶 PÉ ESQUERDO (27/10): o Mixamo só tem batida de pé direito. O espelho de cada uma vira a versão de canhota ('<nome>_e'),
// feita uma vez no carregamento: a rotação de cada osso, medida no corpo inteiro, é refletida no plano do meio do corpo e entregue
// ao osso do outro lado (o braço esquerdo faz o que o direito fazia, e vice-versa)
const ESPELHADOS=['passe','passe_curto','chute','chute_corrida','cavadinha','dominio','peito','carrinho']
const troca=n=>n.includes('Left')?n.replace('Left','Right'):n.includes('Right')?n.replace('Right','Left'):n
const reflete=q=>q.set(q.x,-q.y,-q.z,q.w) // reflexo no plano x = 0 (o meio do corpo)
function espelhar(clip,cena){
 const raiz=clone(cena),ossos=new Map();raiz.position.set(0,0,0);raiz.quaternion.identity();raiz.scale.set(1,1,1)
 raiz.traverse(o=>{if(o.isBone)ossos.set(o.name,o)});raiz.updateMatrixWorld(true)
 const repouso=new Map([...ossos].map(([n,o])=>[n,o.getWorldQuaternion(new T.Quaternion())]))
 const mixer=new T.AnimationMixer(raiz),act=mixer.clipAction(clip);act.play()
 const passo=1/30,n=Math.max(2,Math.round(clip.duration/passo)+1),tempos=new Float32Array(n),rot=new Map([...ossos.keys()].map(k=>[k,new Float32Array(n*4)])),quadril=new Float32Array(n*3)
 const hips=ossos.get('mixamorigHips'),paiHips=hips.parent,W=new Map(),D=new T.Quaternion(),Q=new T.Quaternion(),P=new T.Vector3()
 // (do pai pros filhos: o osso precisa da rotação NOVA do pai pra virar rotação local)
 const ordem=[];hips.traverse(o=>{if(o.isBone)ordem.push(o)})
 for(let i=0;i<n;i++){const t=Math.min(clip.duration,i*passo);tempos[i]=t;act.time=t;mixer.update(0);raiz.updateMatrixWorld(true)
  for(const [k,o] of ossos)W.set(k,o.getWorldQuaternion(new T.Quaternion()))
  const novo=new Map()
  for(const o of ordem){const fonte=ossos.has(troca(o.name))?troca(o.name):o.name
   D.copy(W.get(fonte)).multiply(Q.copy(repouso.get(fonte)).invert());reflete(D) // quanto a fonte girou desde o repouso, refletido
   const w=D.clone().multiply(repouso.get(o.name));novo.set(o.name,w)
   const pai=o.parent.isBone?novo.get(o.parent.name):o.parent.getWorldQuaternion(new T.Quaternion())
   Q.copy(pai).invert().multiply(w).toArray(rot.get(o.name),i*4)}
  hips.getWorldPosition(P);P.x=-P.x;paiHips.worldToLocal(P);P.toArray(quadril,i*3)}
 act.stop();mixer.uncacheRoot(raiz)
 const tracks=[new T.VectorKeyframeTrack(hips.name+'.position',tempos,quadril)]
 for(const o of ordem)tracks.push(new T.QuaternionKeyframeTrack(o.name+'.quaternion',tempos,rot.get(o.name)))
 const meta=clip.userData;const c=new T.AnimationClip(clip.name+'_e',clip.duration,tracks).optimize();c.userData=meta;return c
}
// valores do uniforme DIVIDIDOS por todos os jogadores com a mesma ficha (um time = um conjunto de valores; nada vaza entre times)
const fichas=new Map(),imagens=new Map()
function valoresDaFicha(k){
 const ch=chaveUniforme(k);let u=fichas.get(ch)
 if(!u){u={uTipo:{value:TIPOS[k.tipo]??0},uCorpo:{value:new T.Color(k.corpo)},uDetalhe:{value:new T.Color(k.detalhe)},uMangas:{value:new T.Color(k.mangas)},
   uGola:{value:new T.Color(k.gola)},uCalcao:{value:new T.Color(k.calcao)},uMeiao:{value:new T.Color(k.meiao)},uChuteira:{value:new T.Color(k.chuteira??'#000000')},
   uUsaChuteira:{value:k.chuteira?1:0},uN:{value:k.n},uLarg:{value:k.largura},uPadrao:{value:null},uUsaPadrao:{value:0}}
  if(k.tipo==='padrao'&&k.padrao){let t=imagens.get(k.padrao);if(!t){t=new T.TextureLoader().load(k.padrao);t.colorSpace=T.SRGBColorSpace;t.wrapS=T.RepeatWrapping;imagens.set(k.padrao,t)}u.uPadrao.value=t;u.uUsaPadrao.value=1}
  fichas.set(ch,u)}
 return u
}
const FRAG=`{
 vec4 rg=texture2D(uReg,vMapUv);float rr=rg.r*255.;float id=floor(rr/20.+.01);float costas=step(9.5,rr-id*20.);
 // emenda dos pedaços do atlas: o ponto caiu fora da roupa mas a arte original é pano claro → pega a região do vizinho
 if(id<2.5){vec3 b0=diffuseColor.rgb;float mx=max(b0.r,max(b0.g,b0.b)),sat=(mx-min(b0.r,min(b0.g,b0.b)))/max(mx,1e-3);
  if(sat<.22&&mx>.18){vec2 px=vec2(1.5/1024.);for(int k=0;k<4;k++){vec2 o=k==0?vec2(px.x,0.):k==1?vec2(-px.x,0.):k==2?vec2(0.,px.y):vec2(0.,-px.y);vec4 v=texture2D(uReg,vMapUv+o);float j=floor(v.r*255./20.+.01);if(j>2.5&&j<7.5){rg=v;rr=v.r*255.;id=j;costas=step(9.5,rr-j*20.);break;}}}}
 if(id>2.5&&id<7.5){
  // volume do pano: a luminância da textura original ÷ o branco de referência (a dobra e a sombra continuam; a cor é do time)
  float sh=clamp(dot(diffuseColor.rgb,vec3(.2126,.7152,.0722))/uBranco,.22,1.25);vec3 cor;
  if(id<3.5){float x=rg.b,y=clamp((rg.g-uY0)/(uY1-uY0),0.,1.);cor=uCorpo;
   // (x = posição lateral no corpo: .5 é o meio do peito/das costas; as listras ficam retas na frente e nas costas, como na vida real)
   if(uTipo==1){float f=(x-.5)*uN*1.9+.5,d=abs(fract(f)-.5),w=fwidth(f)*.75+.01;cor=mix(uCorpo,uDetalhe,smoothstep(uLarg*.5+w,uLarg*.5-w,d));}
   else if(uTipo==2){float f=y*uN,d=abs(fract(f)-.5),w=fwidth(f)*.75+.01;cor=mix(uCorpo,uDetalhe,smoothstep(uLarg*.5+w,uLarg*.5-w,d));}
   else if(uTipo==3){float lado=costas>.5?-1.:1.,s=(x-.5)*lado*1.6+(y-.5)*.9,w=fwidth(s)*.75+.004;cor=mix(uCorpo,uDetalhe,smoothstep(uLarg*.5+w,uLarg*.5-w,abs(s)));}
   else if(uTipo==4){float w=fwidth(x)*.75+.003;cor=mix(uCorpo,uDetalhe,smoothstep(.5-w,.5+w,x));}
   else if(uTipo==5&&uUsaPadrao>.5){cor=texture2D(uPadrao,vec2(costas>.5?1.-x*.5:x*.5,y)).rgb;}}
  else if(id<4.5)cor=uMangas;else if(id<5.5)cor=uGola;else if(id<6.5)cor=uCalcao;else cor=uMeiao;
  diffuseColor.rgb=cor*sh;}
 else if(id>7.5&&uUsaChuteira>.5){diffuseColor.rgb=uChuteira*clamp(dot(diffuseColor.rgb,vec3(.2126,.7152,.0722))/.03,.35,2.5);}
 else if(id>.5&&id<1.5)diffuseColor.rgb*=uPele;
 if(uDebug>.5){vec3 dc[9];dc[0]=vec3(0.);dc[1]=vec3(.9,.7,.55);dc[2]=vec3(.35,.2,.08);dc[3]=vec3(.85,.1,.1);dc[4]=vec3(.95,.55,0.);dc[5]=vec3(1.,.95,0.);dc[6]=vec3(.1,.35,.85);dc[7]=vec3(.1,.7,.25);dc[8]=vec3(.15);diffuseColor.rgb=dc[int(id)];}
}`
const UNIFS='uniform sampler2D uReg;uniform float uBranco;uniform float uY0;uniform float uY1;uniform int uTipo;uniform vec3 uCorpo;uniform vec3 uDetalhe;uniform vec3 uMangas;uniform vec3 uGola;uniform vec3 uCalcao;uniform vec3 uMeiao;uniform vec3 uChuteira;uniform float uUsaChuteira;uniform float uN;uniform float uLarg;uniform sampler2D uPadrao;uniform float uUsaPadrao;uniform vec3 uPele;uniform float uDebug;'
// tom de pele da arte original (o boneco do Tripo), em linear: a pele de uma lenda vira um FATOR sobre ele (a sombra pintada fica)
const PELE_BASE=new T.Color('#d9a07a')
const fatorPele=css=>{if(!css)return new T.Color(1,1,1);const c=new T.Color(css);return new T.Color(Math.min(1.6,c.r/PELE_BASE.r),Math.min(1.6,c.g/PELE_BASE.g),Math.min(1.6,c.b/PELE_BASE.b))}
/** Material de UM jogador: o programa é o mesmo pra todos (uma compilação só); os valores do uniforme são os do time (divididos),
 *  e só a pele é dele. */
function materialJogador(base,asset,ficha,pele){
 const m=base.clone(),un=asset.meta.uniforme??{},jog={uReg:{value:asset.regioes},uBranco:{value:un.branco??.6},uY0:{value:un.cintura??.6},uY1:{value:un.gola??.77},uPele:{value:fatorPele(pele)},uDebug:{value:0}}
 m.userData.u={jog,time:valoresDaFicha(completa(ficha))}
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,m.userData.u.jog,m.userData.u.time)
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\n'+UNIFS).replace('#include <map_fragment>','#include <map_fragment>\n'+FRAG)}
 m.customProgramCacheKey=()=>'jogador-uniforme-v2'
 return m
}
/** Um jogador (clone do esqueleto, mixer próprio). `ficha`: o uniforme do time (uniformes.mjs) · `pele`: tom da lenda (opcional). */
export function criarJogadorNovo(asset,ficha,pele=null){
 const root=clone(asset.gltf.scene),holder=new T.Group();holder.name='jogador-novo';holder.add(root);root.scale.multiplyScalar(asset.escala)
 let mesh;root.traverse(o=>{if(o.isSkinnedMesh){mesh=o;o.frustumCulled=false;o.castShadow=true;o.receiveShadow=true}})
 mesh.material=materialJogador(mesh.material,asset,ficha,pele)
 const mixer=new T.AnimationMixer(root),acoes=new Map()
 const acao=nome=>{let a=acoes.get(nome);if(!a){const c=asset.clips.get(nome);if(!c)return null;a=mixer.clipAction(c);acoes.set(nome,a)}return a}
 return{holder,root,mesh,mixer,acao,
  /** troca o uniforme (outro time): passa a usar os valores divididos da ficha nova — nenhum outro jogador muda */
  setUniforme(f){mesh.material.userData.u.time=valoresDaFicha(completa(f));mesh.material.needsUpdate=true /* (o programa é o mesmo: só religa os valores) */},
  setPele(css){mesh.material.userData.u.jog.uPele.value.copy(fatorPele(css))},
  setDebug(on){mesh.material.userData.u.jog.uDebug.value=on?1:0},
  dispose(){mixer.stopAllAction();mixer.uncacheRoot(root);mesh.material.dispose();holder.removeFromParent()}}
}
