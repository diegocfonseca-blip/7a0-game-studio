// 🧍⚽ 27/10 — os 22 do campo 3D com o JOGADOR NOVO (boneco do Tripo + movimentos de futebol do Mixamo). Mesmo contrato do
// players.mjs (update · presentFrame · inspect · dispose), então o resto do 3D não muda. Só apresentação: posição, bola, placar e
// quem faz o quê continuam do motor — aqui só se escolhe COMO o corpo mostra o que o motor já decidiu.
//  · corrida em 8 direções (de frente, de costas, de lado, na diagonal) misturada pela velocidade de verdade; quem tem a bola conduz
//  · cada lance do motor (passe, chute, cabeceio, lateral, falta sofrida, carrinho, drible, goleiro voando) toca o movimento dele
//  · uniforme = a ficha do TIME em que joga (uniformes.mjs; Diego: "o Pirlo no Neymarzetti veste a camisa do Neymarzetti")
//  · pele e cabelo nunca recebem cor de uniforme; lenda com rosto na carta ganha o tom de pele dela
import * as T from 'three'
import {carregaJogadorNovo,criarJogadorNovo} from './jogador-novo.mjs'
import {clubKitFor} from './club-kit.mjs'
import {matchKitPlan} from './kit-contrast.mjs'
import {uniformeDoTime,GOLEIRO} from './uniformes.mjs'
import {playerDetail} from './lod.mjs'
import {BATISMOS} from '../batismos.ts'
import {legendAvatar} from '../legend-avatars.ts'
import {peDe} from '../campo2d-estilos.ts'
import {RotacaoBola3D,RAIO_BOLA_FUTEBOL_3D} from '../presidencia-bola-rotacao.ts'
import {nearest} from './motion/nearest.mjs'
import {bootContact} from './motion/map-contact.mjs'
import {createMapRigSurface} from './motion/map-rig-surface.mjs'
import {prepareMapTimeline} from './motion/map-football-timeline.mjs'
import {groundDelivery,sampleGroundDelivery} from './motion/map-ball-flight.mjs'
import {prepareBodyTrack} from './motion/map-root-track.mjs'
import {MapFootPlant} from './motion/map-foot-plant.mjs'
import {groundContactShadows} from './motion/ground-contact-shadows.mjs'
import {prepareMapGaits,gaitTime} from './motion/map-gait.mjs'
import {VisualPlayerCollisions} from './visual-player-collisions.mjs'

// direção da corrida em relação ao corpo (0 = pra frente, + = pra direita) → movimento
const DIRS=[[0,'trote'],[Math.PI/4,'diag_fd'],[Math.PI/2,'lado_d'],[3*Math.PI/4,'diag_td'],[Math.PI,'re'],[-3*Math.PI/4,'diag_te'],[-Math.PI/2,'lado_e'],[-Math.PI/4,'diag_fe']]
const LOOPS=['idle','idle_bola','gk_idle','gk_idle_bola','conduz',...DIRS.map(d=>d[1])]
const CHUTES=new Set(['chute','chutao'])
// ✂️ trecho usado de cada movimento gravado de jogador de verdade (pacote do Anderson Rohr: cada arquivo tem o jogador parado
// antes e depois do lance) — segundos do arquivo
const TRECHOS={passe_chapa:{de:.85,ate:2.1},chute_forte:{de:1.55,ate:3.4},drible3:{de:.35,ate:2.1},comemora1:{de:.25,ate:3.45},comemora2:{de:.25,ate:3.5},comemora3:{de:.25,ate:3.15}}
const trecho=nome=>TRECHOS[nome.replace(/_e$/,'')]
const angulo=a=>Math.atan2(Math.sin(a),Math.cos(a))
// ⏱️ o `time` do quadro já é o relógio do motor (o mesmo de `lance.t0` e `evento.t`): compara direto, sem converter

/** tom de pele (e cabelo) tirados do rosto da carta (só lendas que têm rosto). */
const aparencias=new Map()
function aparenciaDaCarta(src){
 if(!aparencias.has(src))aparencias.set(src,new Promise(res=>{const im=new Image();im.crossOrigin='anonymous';im.onerror=()=>res(null);im.onload=()=>{try{
  const S=96,cv=document.createElement('canvas');cv.width=cv.height=S;const cx=cv.getContext('2d',{willReadFrequently:true});cx.drawImage(im,0,0,S,S);const d=cx.getImageData(0,0,S,S).data
  let top=S,bot=0,l=S,r=0;for(let y=0;y<S;y++)for(let x=0;x<S;x++)if(d[(y*S+x)*4+3]>200){top=Math.min(top,y);bot=Math.max(bot,y);l=Math.min(l,x);r=Math.max(r,x)}
  if(bot<=top){res(null);return}
  const media=(y0,y1,x0,x1)=>{const c=[0,0,0];let n=0;for(let y=Math.floor(y0);y<y1;y++)for(let x=Math.floor(x0);x<x1;x++){const i=(y*S+x)*4;if(d[i+3]<200)continue;c[0]+=d[i];c[1]+=d[i+1];c[2]+=d[i+2];n++}return n?c.map(v=>v/n):null}
  const h=bot-top,cxm=(l+r)/2,w=r-l
  // (o rosto da carta é busto: o alto da cabeça fica nos primeiros ~8%, a bochecha perto de 30% da altura)
  const cab=media(top,top+h*.07,cxm-w*.12,cxm+w*.12),pele=media(top+h*.27,top+h*.33,cxm-w*.2,cxm-w*.08)
  if(!pele){res(null);return}
  const css=c=>'#'+c.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('')
  const parecido=cab&&Math.hypot(cab[0]-pele[0],cab[1]-pele[1],cab[2]-pele[2])<38
  res({pele:css(pele),cabelo:cab&&!parecido?css(cab):undefined,careca:!cab||parecido})
 }catch{res(null)}};im.src=src}))
 return aparencias.get(src)
}
function aparenciaDe(key,name){
 let club,year;try{[,,club,year]=JSON.parse(key)}catch{}
 const art=legendAvatar(name,club??undefined,year??undefined)
 if(art)return{lenda:true,src:(import.meta.env?.BASE_URL??'/').replace(/\/$/,'')+art.src}
 return{lenda:false}
}

export async function loadPlayersNovo(scene,state,frame,{onPrepared}={}){
 let diagnostics=false;try{diagnostics=!!import.meta.env.DEV&&localStorage.getItem('esc3d-contact-audit')==='1'}catch{}
 const [original,timeline]=await Promise.all([carregaJogadorNovo(),prepareMapTimeline(state)])
 // Measured on the supplied rig: peak whole-foot speed was 42 ms AFTER the
 // ground strike (toe already 29 cm high). Keep shared imported clips intact.
 const asset={...original,meta:{...original.meta,clips:{...original.meta.clips,chute_forte:{...original.meta.clips.chute_forte,toque:2.5833333333333},chute_corrida:{...original.meta.clips.chute_corrida,toque:5/12},conduz:{...original.meta.clips.conduz,toque:2/3,pe:'r'},cabeca:{...original.meta.clips.cabeca,toque:1.1333333333333},gk_recolhe:{...original.meta.clips.gk_recolhe,toque:.75},gk_lanca:{...original.meta.clips.gk_lanca,toque:1.6166666666667},gk_lanca_longe:{...original.meta.clips.gk_lanca_longe,toque:1.45},gk_rola:{...original.meta.clips.gk_rola,toque:1.1333333333333},lateral:{...original.meta.clips.lateral,toque:1.5333333333333},controle_corrida:{...original.meta.clips.conduz,toque:2/3,pe:'r'}}}}
 asset.clips=new Map(original.clips);const runningControl=original.clips.get('conduz').clone();runningControl.name='controle_corrida';asset.clips.set(runningControl.name,runningControl)
 const gaitActor=criarJogadorNovo(asset,GOLEIRO),gaits=prepareMapGaits(asset,gaitActor,['conduz',...DIRS.map(d=>d[1])]);gaitActor.dispose();
 const teams=state.officialTeams??[]
 const kitPlan=matchKitPlan(state,teams.map(clubKitFor),teams.map(name=>BATISMOS.find(c=>c.clube===name)?.manto??[]))
 // 👕 a ficha de uniforme de cada lado (uniformes.mjs): a cadastrada do clube ou a lisa das cores dele; se as duas camisas
 // brigam, o lado do rival ganha a cor de contraste que o jogo já escolhia (kit-contrast) — tudo dividido pelos 11 do time
 const fichaDe=side=>{const i=side==='home'?0:1,p=kitPlan[i],cfg=p.config,manto=BATISMOS.find(c=>c.clube===teams[i])?.manto??[]
  const c1=cfg?.colors?.primary??manto[0]??(side==='home'?state.homeColor:state.awayColor),c2=cfg?.colors?.secondary??manto[1]
  return uniformeDoTime(teams[i],c1,c2,p.generated?p.color:null)}
 const fichas={home:fichaDe('home'),away:fichaDe('away')}
 const atores=[]
 for(const p of frame.players){
  const ap=aparenciaDe(p.key,p.name),ficha=p.keeper?GOLEIRO:fichas[p.side]
  const j=criarJogadorNovo(asset,ficha) // (pele e cabelo: os originais do boneco; lenda com rosto na carta ganha o tom de pele dela)
  j.holder.name='jogador:'+p.key;scene.add(j.holder)
  for(const nome of LOOPS){const a=j.acao(nome);if(a){a.play();a.timeScale=0;a.setEffectiveWeight(0)}}
  const ator={...j,pe:ap.lenda?peDe(p.name,10):null,canhoto:[...p.name].reduce((h,c)=>(h*31+c.charCodeAt(0))>>>0,7)%4<1,key:p.key,side:p.side,keeper:p.keeper,ficha,fase:0,rumo:p.heading,ultimo:null,tiro:null,lances:new Set(),mergulhou:false,detail:'full',pesos:new Map()}
  {const osso=n=>{let r;j.root.traverse(o=>{if(o.isBone&&o.name.toLowerCase().includes(n))r??=o});return r};ator.pes=[osso('righttoe'),osso('lefttoe')].filter(Boolean);ator.corr={x:0,z:0};ator.corrAlvo={x:0,z:0};ator.bones=new Map();ator.root.traverse(o=>{if(o.isBone)ator.bones.set(o.name,o)});ator.contactHistory=null;ator.lastConfirmed=-Infinity}
  if(ap.lenda)aparenciaDaCarta(ap.src).then(c=>{if(c?.pele&&!disposed)ator.setPele(c.pele)})
  ator.surface=createMapRigSurface(ator);ator.grounding=new MapFootPlant();ator.knots=[];atores.push(ator)
 }
 // Contact calibration samples the imported pose on the ORIGINAL skinned mesh.
 const CONTATO={},agenda=timeline.agenda,calibrator=atores[0],poseCache=new Map()
 const rawTouch=nome=>asset.meta.clips?.[nome.replace(/_e$/,'')]?.toque??.4
 function samplePose(nome,time=rawTouch(nome),region=null,ballHeight=.11){
  const key=[nome,time.toFixed(5),region,ballHeight.toFixed(3)].join(':');if(poseCache.has(key))return poseCache.get(key)
  for(const action of calibrator.mixer._actions)action.setEffectiveWeight(0)
  calibrator.holder.position.set(0,0,0);calibrator.holder.rotation.set(0,0,0)
  const action=calibrator.acao(nome);action.reset().play();action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.time=time;action.timeScale=0;action.setEffectiveWeight(1);calibrator.mixer.update(0);calibrator.holder.updateMatrixWorld(true)
  const floor=calibrator.surface.floor(),ground=Math.max(0,.003-floor);calibrator.holder.position.y+=ground;calibrator.holder.updateMatrixWorld(true)
  const point=n=>calibrator.bones.get('mixamorig'+n).getWorldPosition(new T.Vector3()),meta=asset.meta.clips[nome.replace(/_e$/,'')],left=(meta?.pe==='l')!==nome.endsWith('_e')
  region??=/^cabeca/.test(nome)?'head':/^gk_|lateral/.test(nome)?'hands':/^peito/.test(nome)?'chest':left?'left':'right'
  let off,fit=true
  if(region==='hands'){off=point('RightHand').add(point('LeftHand')).multiplyScalar(.5);off=calibrator.surface.anchor('hands',off,new T.Vector3(0,0,1),{height:nome==='gk_recolhe'?ballHeight:off.y}).point}
  else if(region==='rightHand'){off=point('RightHand');off=calibrator.surface.anchor('rightHand',off,new T.Vector3(0,0,1),{height:off.y}).point}
  else if(region==='chest'){off=point('Spine2');off.z+=.20}
  else{const origin=point(region==='head'?'Head':region==='left'?'LeftToeBase':'RightToeBase'),height=region==='head'?origin.y+.12:ballHeight,anchor=calibrator.surface.anchor(region,origin,new T.Vector3(0,0,1),{height});off=anchor.point;fit=anchor.fitted}
  const handLocal=['hands','rightHand'].includes(region)?calibrator.bones.get('mixamorigRightHand').worldToLocal(off.clone()).toArray():null;const value={handLocal,off:{x:off.x,y:off.y,z:off.z},ground,floor,region,fitted:fit,feetHeight:Math.max(0,floor),head:point('Head').toArray()};poseCache.set(key,value);action.setEffectiveWeight(0);return value
 }
 for(const nome of ['conduz','chute','chute_corrida','passe','passe_curto','cavadinha','cabeca','cabeca2','dominio','peito','passe_chapa','chute_forte','gk_recolhe','gk_pega','gk_pega_baixo','gk_idle_bola','gk_rola','gk_lanca','gk_lanca_longe','lateral'].flatMap(n=>[n,n+'_e'])){
  if(!asset.clips.has(nome))continue;const sample=samplePose(nome);CONTATO[nome]={...sample,alto:['head','chest','hands'].includes(sample.region),ang:0}
 }
 // A touchline restart needs the ball to be picked up before the imported
 // throw. The source's ground-to-two-metres placement is never drawn as a jump.
 for(const release of [...agenda])if(release.hands&&!release.keeper){const t=release.t-.4,f=timeline.sample(t,release.key);agenda.push({id:'pickup:'+release.id,key:release.key,kind:'recebe',pickup:true,hands:true,keeper:false,t,h:f.ball.y-.11,requiredContact:'hands',dir:release.dir,bola:f.ball,rec:f.player})}
 agenda.sort((a,b)=>a.t-b.t);
 // Choose a pose once from the official sequence, independent of camera/FPS.
 for(const it of agenda){const a=atores.find(a=>a.key===it.key);if(!a)continue
  const prevReceive=agenda.findLast(o=>o.key===it.key&&o.kind==='recebe'&&o.t<=it.t+.001),quick=prevReceive&&it.t-prevReceive.t<.28
  if(it.kind==='carry')it.nome='controle_corrida'
  else if(it.kind==='recebe')it.nome=it.goleiro||it.pickup?'gk_recolhe':it.h>.9?'peito':'dominio'
  else if(it.hands)it.nome=it.keeper?(it.tipo==='lancamento'?'gk_lanca_longe':'gk_rola'):'lateral'
  else if(it.cab)it.nome=it.bola.y>1.7?'cabeca':'cabeca2'
  else if(CHUTES.has(it.tipo)||it.tipo==='corte')it.nome=quick?'chute_corrida':'chute_forte'
  else if(['cruzamento','lancamento','inversao'].includes(it.tipo)||it.longe>26)it.nome='cavadinha'
  else it.nome=prevReceive&&it.t-prevReceive.t<.8?'passe':'passe_chapa'
  if(it.kind==='toque'&&!it.hands&&!it.cab){const wantLeft=a.pe==='canhota'||a.pe!=='direita'&&a.canhoto,baseLeft=asset.meta.clips[it.nome]?.pe==='l';if(wantLeft!==baseLeft&&asset.clips.has(it.nome+'_e'))it.nome+='_e'}
  it.mira=it.dir??it.rec.heading
 }
 for(const it of agenda){if(it.kind!=='recebe'||it.goleiro||it.pickup)continue;
  const next=agenda.find(o=>o.key===it.key&&o.kind==='toque'&&o.t>=it.t);
  // The available reception capture is a ground control. An airborne assignment
  // is anticipation until the ball descends, never an invented knee/chest trap.
  if(it.bola.y>.3&&it.bola.y<1.1){it.assignedAt=it.t;const end=Math.min(next?.t??it.t+.5,it.t+.5);while(it.t<end&&timeline.sample(it.t).ball.y>.22)it.t=Math.min(end,it.t+1/60);const f=timeline.sample(it.t,it.key);it.bola=f.ball;it.rec=f.player;it.adaptation='wait-for-ground'}
  if(next&&next.t-it.t<.28){it.firstTime=next.id;next.firstTime=true}
  // Receive with an open body when the next pass leaves immediately. Facing
  // directly backwards then attempting a 170-degree turn in .25 s is impossible.
  if(next&&next.t-it.t<.8){it.mira=next.mira;it.dir=next.dir}
 }
 agenda.sort((a,b)=>a.t-b.t);
 for(const it of agenda)if(it.kind==='carry')it.disabled=agenda.some(o=>o.key===it.key&&o.kind!=='carry'&&Math.abs(o.t-it.t)<.4);
 const groundFlights=[];
 for(const it of agenda){if(it.kind!=='toque'||it.hands||it.cab||!['passe','enfiada','inversao'].includes(it.tipo)||it.bola.y>.13)continue;
  let receive=agenda.find(o=>o.kind==='recebe'&&o.t>it.t&&!o.goleiro&&!o.pickup);if(!receive)continue;
  if(receive.firstTime)receive=agenda.find(o=>o.id===receive.firstTime);
  if(!receive||receive.bola.y>.13||receive.t-it.t>4)continue;
  const intervening=agenda.find(o=>o.kind==='toque'&&o.t>it.t+.001&&o.t<receive.t-.001);if(intervening)continue;
  const flight=groundDelivery(it.t,receive.t,it.bola,receive.bola,it.delivery);if(flight)groundFlights.push(flight);
 }
 // Cues for both reception and release share one continuous root track.
 for(const it of agenda){const a=atores.find(a=>a.key===it.key);if(!a||it.firstTime&&it.kind==='recebe'||it.disabled)continue
  const pose=samplePose(it.nome,rawTouch(it.nome),it.hands&&it.kind==='toque'&&it.keeper?'rightHand':null,it.bola.y),cs=Math.cos(it.mira),sn=Math.sin(it.mira),off=pose.off
  it.contact=pose;it.root={x:it.bola.x-it.rec.x-(off.x*cs+off.z*sn),z:it.bola.z-it.rec.z-(-off.x*sn+off.z*cs)}
  if(it.cab)it.extraRise=Math.max(0,Math.min(.5,it.bola.y-off.y))
  // Hand ownership is attachment after a measured catch, never a foot action.
  if(it.hands&&it.keeper&&it.kind==='toque')continue
  a.knots.push({t:it.t,...it.root,budget:it.pickup?4.5:3,approach:it.pickup?2:undefined,plan:it})
 }
 // Receiving ownership in the source is a tactical assignment. Its settling
 // spring must not be drawn as a ball moving away and returning by itself.
 // Connect measured control contacts, and move the body along that same fixed
 // interval instead of adding offsets to a source root that may run elsewhere.
 const groundInterval=(p,q)=>{for(let t=p.t;t<=q.t;t+=.05)if(timeline.sample(t).ball.y>.3)return false;return true};
 const controlSpans=[];
 for(const a of atores){a.controls=[];for(let i=0;i<a.knots.length-1;i++){const first=a.knots[i],last=a.knots[i+1],p=first.plan,q=last.plan;
  if(!['recebe','carry'].includes(p.kind)||p.hands||p.goleiro||p.firstTime||q.hands||q.cab||q.t-p.t>1.9||p.bola.y>.23||q.bola.y>.13||!groundInterval(p,q))continue;
  let owned=true;for(let t=p.t+.04;t<q.t-.015;t+=.05)if(timeline.sample(t).owner!==a.key){owned=false;break}if(!owned)continue;
  const flight=groundDelivery(p.t,q.t,p.bola,q.bola);if(flight){groundFlights.push(flight);controlSpans.push(flight)}
  a.controls.push({start:p.t,end:q.t,from:{x:p.rec.x+p.root.x,z:p.rec.z+p.root.z},to:{x:q.rec.x+q.root.x,z:q.rec.z+q.root.z}});
 }}
 // A failed control can roll to an opponent. Keep that loose interval free
 // of the same ownership spring, without manufacturing another touch/decision.
 const physical=agenda.filter(it=>!it.disabled&&!(it.firstTime&&it.kind==='recebe'));
 for(let i=0;i<physical.length-1;i++){const p=physical[i],q=physical[i+1];if(!['recebe','carry'].includes(p.kind)||p.hands||p.goleiro||q.hands||p.bola.y>.13||q.bola.y>.13||q.t-p.t>2.5||!groundInterval(p,q)||groundFlights.some(f=>Math.abs(f.start-p.t)<1e-5))continue;const f=groundDelivery(p.t,q.t,p.bola,q.bola);if(f){groundFlights.push(f);controlSpans.push(f)}}
 for(const a of atores)a.bodyTrack=prepareBodyTrack(a.knots,a.controls,time=>timeline.sample(time,a.key).player);
 const bodyTrack=(a,time)=>a.bodyTrack(time);
 for(const action of calibrator.mixer._actions)action.setEffectiveWeight(0)
 calibrator.holder.position.set(0,0,0);calibrator.holder.rotation.set(0,0,0)
 // Fit each captured action into the available official interval. In particular,
 // a keeper must finish collecting before starting a throw; crop its idle lead-in.
 for(const a of atores){let previous=null;for(const it of agenda.filter(i=>i.key===a.key&&!i.disabled&&!(i.firstTime&&i.kind==='recebe'))){
  const raw=rawTouch(it.nome),begin=it.kind==='carry'?.27:trecho(it.nome)?.de??0;
  it.start=it.t-(raw-begin);const moving=!it.hands&&!it.goleiro&&!it.pickup&&!it.cab&&(it.rec?.speed??0)>3.5;if(moving&&(it.kind==='recebe'||it.kind==='carry'||['passe','enfiada'].includes(it.tipo)))it.start=Math.max(it.start,it.t-(it.kind==='recebe'?.24:.28));
  const settle=(previous?.goleiro||previous?.pickup) ? .18 : .10;
  if(previous&&previous.t<it.t&&it.start<previous.t+settle)it.start=Math.min(it.t-.19,previous.t+settle);
  const shortPass=it.kind==='toque'&&!it.hands&&['passe','enfiada'].includes(it.tipo);
  it.clipStart=raw-(it.t-it.start);it.clipEnd=Math.min(trecho(it.nome)?.ate??asset.clips.get(it.nome).duration,raw+(it.goleiro ? .3 : moving ? .30 : (it.kind==='recebe'||shortPass) ? .4 : .65));
  previous=it;
 }}
 const navigation=new VisualPlayerCollisions({radius:.32,budget:.42})
 const soleShadows=groundContactShadows(scene,atores.length,{bones:{left:'mixamorigLeftFoot',right:'mixamorigRightFoot'},contacts:a=>a.plants});
 // Release collision steering gradually around a fixed contact. A binary
 // lock used to erase up to 60 cm of avoidance in a single video frame.
 const contactFreedom=(a,time)=>{const distance=Math.min(Infinity,...(a?.knots??[]).map(k=>Math.abs(k.t-time)));return T.MathUtils.smoothstep(distance,.08,.4)};
 let disposed=false,lastTime=null,inspection={full:0,intermediate:0,far:0,hidden:0,tiros:0},navInfo=null
 const bola={modo:'livre',dono:null,toques:0},medidas=[];let visualBall=null,visualRotation=null,spin=null,handState=null,handFlight=null
 onPrepared?.()
 // um movimento de lance por cima da corrida: entra em 0,12 s, sai nos últimos 0,25 s
 const dispara=(a,nome,{inicio=0,agora,ate=Infinity,mira=null,ponto=null}={})=>{const c=asset.clips.get(nome);if(!c)return;if(a.fade){a.acao(a.fade.nome)?.setEffectiveWeight(0);a.fade=null}if(a.tiro){const old=a.acao(a.tiro.nome);if(a.tiro.nome!==nome)a.fade={...a.tiro,weight:old?.getEffectiveWeight()??0,fadeAt:agora};old?.setEffectiveWeight(0)}const act=a.acao(nome);act.reset();act.play();act.timeScale=0;act.setLoop(T.LoopOnce,1);act.clampWhenFinished=true;const tr=trecho(nome);a.tiro={nome,t0:agora-inicio,base:tr?.de??0,dur:Math.min(tr?tr.ate-tr.de:c.duration,ate),depois:nome.startsWith('cai')?'levanta':null,mira,bate:mira!==null||ponto!==null};inspection.tiros++}
 const toque=nome=>(asset.meta.clips?.[nome.replace(/_e$/,'')]?.toque??.4)-(trecho(nome)?.de??0) // (contado do começo do trecho)
 const deCabeca=it=>it.cab
 const activePlan=(a,now)=>agenda.find(it=>it.key===a.key&&!it.disabled&&!(it.firstTime&&it.kind==='recebe')&&it.bola&&it.t>=now-.05&&it.t<now+(it.kind==='carry'?.65:1.2))
 const planName=it=>it?.nome??'dominio'
 const handReleasePoint=it=>{const a=atores.find(a=>a.key===it.key),root=bodyTrack(a,it.t),off=it.contact.off,c=Math.cos(it.mira),s=Math.sin(it.mira);return{x:it.rec.x+root.x+off.x*c+off.z*s,y:off.y,z:it.rec.z+root.z-off.x*s+off.z*c}}
 const handArc=it=>({t:it.t,end:Math.min(it.t+.55,agenda.find(o=>o.kind==='recebe'&&o.t>it.t+.001)?.t??Infinity),start:handReleasePoint(it),source:timeline.sample(it.t).ball});
 const contactRegion=it=>it.hands||it.goleiro?'hands':it.cab?'head':'feet';
 const footPositions=a=>a.pes.map(b=>b.getWorldPosition(new T.Vector3()))
 function observeContacts(frame,dt,reset){
  bola.modo='livre';bola.dono=null
  const B=visualBall??frame.ball.presentation??frame.ball
  for(const a of atores){
   a.holder.updateMatrixWorld(true)
   const feet=footPositions(a),old=reset||!(dt>0)||dt>.1?null:a.contactHistory,hit=bootContact(B,feet,old)
   a.contactHistory={time:frame.time,ball:{...B},feet};a.contactGap=hit.gap
   const owned=frame.owner===a.key&&!a.keeper&&!frame.restart&&!frame.replay
   if(owned&&hit.contact){bola.modo='contato';bola.dono=a}
   const plan=agenda.find(it=>it.key===a.key&&!it.measured&&it.t<=frame.time+1e-7&&it.t>=frame.time-.1&&!it.disabled&&!(it.firstTime&&it.kind==='recebe'))
   if(plan&&diagnostics){plan.measured=true;const aerial=deCabeca(plan),hands=plan.hands||plan.goleiro,ballPoint=new T.Vector3(B.x,B.y,B.z);let measured;
    if(hands){const actual=visualBall??B,pt=new T.Vector3(actual.x,actual.y,actual.z),left=a.surface.probe(pt,'leftHand'),right=a.surface.probe(pt,'rightHand');measured=left.gap<right.gap?left:right}
    else if(aerial)measured=a.surface.probe(ballPoint,'head');
    else{const left=a.surface.probe(ballPoint,'left'),right=a.surface.probe(ballPoint,'right');measured=left.gap<right.gap?left:right}
    const sampleGap=measured.gap,region=contactRegion(plan);let interpolated=false;
    // At 30 Hz the 20 Hz official impact can fall between rendered frames.
    // Interpolate the actual deformed triangles, not a planned toe-radius proxy.
    if(frame.time-plan.t>1e-6&&old?.time<plan.t&&old.mesh?.region===region&&frame.time-old.time<=.07){const u=(plan.t-old.time)/(frame.time-old.time),current=a.surface.triangles(region),before=old.mesh.triangles;
     if(current.length===before.length){const triangles=current.map((t,i)=>new T.Triangle(...['a','b','c'].map(k=>before[i][k].clone().lerp(t[k],u)))),point=plan.hands&&plan.kind==='toque'?handReleasePoint(plan):plan.bola,hit=nearest(new T.Vector3(point.x,point.y,point.z),triangles);measured={gap:hit.distance-.11,floor:measured.floor};interpolated=true}
    }
    const confirmed=measured.gap>=-.025&&measured.gap<=.03;medidas.push({contactType:hands?'hands':aerial?'head':'foot',kind:plan.kind,t:plan.t,sampledAt:frame.time,interpolated,gapAtSample:sampleGap,key:a.key,tipo:plan.tipo??(plan.kind==='carry'?'conduz':'recepcao'),nome:planName(plan),dist:measured.gap+.11,gap:measured.gap,floor:measured.floor,confirmed,swept:false,bodyAngleDegrees:Math.abs(angulo(a.rumo-plan.mira))*180/Math.PI});if(confirmed)bola.toques++}
   const next=agenda.find(it=>it.key===a.key&&!it.disabled&&!(it.firstTime&&it.kind==='recebe')&&it.t>frame.time+1e-7&&it.t-frame.time<=.051);if(next&&diagnostics){const region=contactRegion(next);a.contactHistory.mesh={region,triangles:a.surface.triangles(region)}}
   if(owned&&hit.contact&&frame.time-a.lastConfirmed>.2){a.lastConfirmed=frame.time;bola.toques++;medidas.push({t:frame.time,key:a.key,tipo:'conduz',dist:hit.gap+.175,gap:hit.gap,confirmed:true,swept:hit.swept})}
  }
  if(medidas.length>200)medidas.splice(0,medidas.length-200)
 }
 return{
  update(frame,camera,viewportHeight=720){
   if(disposed)return
   // Orbit/zoom and a paused clock may draw the SAME football frame again.
   // Re-evaluating a zero-speed gait here used to replace a running pose with
   // idle and turn the body while the ball and match were paused.
   if(lastTime===frame.time&&!frame.official?.finished){
    inspection={full:0,intermediate:0,far:0,hidden:0,tiros:inspection.tiros}
    for(const a of atores){const p=frame.players.find(p=>p.key===a.key);a.detail=!p||p.visible===false?'hidden':camera?playerDetail(camera,{x:p.mx,y:0,z:p.mz},viewportHeight,a.detail):'full';inspection[a.detail]++;a.holder.visible=a.detail!=='hidden'}
    soleShadows.update(atores);return
   }
   const firstFrame=lastTime===null;const dt=lastTime===null||frame.time<lastTime||frame.time-lastTime>1?0:frame.time-lastTime,reset=dt===0&&lastTime!==null&&frame.time!==lastTime;lastTime=frame.time
   if(reset){handState=null;handFlight=null}
   inspection={full:0,intermediate:0,far:0,hidden:0,tiros:inspection.tiros}
   const groundFlight=groundFlights.find(f=>frame.time>=f.start&&frame.time<=f.end),groundBall=sampleGroundDelivery(groundFlight,frame.time);if(groundBall)frame={...frame,ball:{...frame.ball,presentation:groundBall}};
   const evs=frame.official?.events??[],usados=new Set()
   // eventos dos últimos 0,4 s, por nome do motor (o mesmo que o teatro do players.mjs usa)
   const recentes=[];for(let i=evs.length-1;i>=0;i--){const e=evs[i],idade=frame.time-e.t;if(idade>.4)break;if(idade>=0)recentes.push(e)}
   const proposed=frame.players.map(p=>{const a=atores.find(a=>a.key===p.key),root=a?bodyTrack(a,frame.time):{x:0,z:0},base=p.sourceAnchor??{x:p.mx,z:p.mz},future=timeline.sample(frame.time+.15,p.key).player,rf=a?bodyTrack(a,frame.time+.15):{x:0,z:0};return{...p,mx:base.x+root.x,mz:base.z+root.z,navigationVelocity:future?{x:(future.x+rf.x-base.x-root.x)/.15,z:(future.z+rf.z-base.z-root.z)/.15}:undefined}})
   navInfo=navigation.sample({...frame,players:proposed},{action:(key,time)=>{const freedom=contactFreedom(atores.find(a=>a.key===key),time);return freedom<1?{collisionFreedom:freedom}:null}})
   const safety=navigation.finalize(proposed.filter(p=>p.visible!==false).map(p=>{const shift=navInfo.positions.get(p.key)??{x:0,z:0},a=atores.find(a=>a.key===p.key);return{key:p.key,sourceX:p.mx,sourceZ:p.mz,rootX:p.mx+shift.x,rootZ:p.mz+shift.z,x:p.mx+shift.x,z:p.mz+shift.z,y:1,radius:.22,freedom:contactFreedom(a,frame.time)}}));
   for(const [key,shift]of safety.shifts){const p=navInfo.positions.get(key);if(p){p.x+=shift.x;p.z+=shift.z}}navInfo.diagnostics.final=safety.diagnostics;
   for(const p of frame.players){
    const a=atores.find(x=>x.key===p.key&&!usados.has(x))??atores.find(x=>!usados.has(x)&&x.side===p.side&&x.keeper===p.keeper&&!frame.players.some(q=>q.key===x.key));if(!a)continue;usados.add(a);a.key=p.key
    a.detail=p.visible===false?'hidden':camera?playerDetail(camera,{x:p.mx,y:0,z:p.mz},viewportHeight,a.detail):'full';inspection[a.detail]++
    a.holder.visible=a.detail!=='hidden'
    // deslocamento de verdade deste quadro (a velocidade do motor sozinha não sabe de cobrança/teleporte)
    // A aproximação visual do corpo também conta na distância da passada.
    const plan=activePlan(a,frame.time),name=planName(plan),aim=plan?.dir!=null?plan.dir-(CONTATO[name]?.ang??0):a.rumo
    const target=bodyTrack(a,frame.time),nav=navInfo.positions.get(p.key)??{x:0,z:0},base=p.sourceAnchor??{x:p.mx,z:p.mz}
    a.corrAlvo=target;a.corr={x:target.x+nav.x,z:target.z+nav.z}
    if(reset||frame.placementReset){a.ultimo=null;a.contactHistory=null;if(reset&&a.tiro){a.acao(a.tiro.nome)?.setEffectiveWeight(0);a.tiro=null}if(reset&&a.fade){a.acao(a.fade.nome)?.setEffectiveWeight(0);a.fade=null}}
    const px=base.x+a.corr.x,pz=base.z+a.corr.z
    const agora=frame.time,ult=a.ultimo,dx=ult&&dt>0?px-ult.x:0,dz=ult&&dt>0?pz-ult.z:0,salto=Math.hypot(dx,dz)>2.5;a.ultimo={x:px,z:pz}
    const vel=dt>0&&!salto?Math.min(9,Math.hypot(dx,dz)/dt):0,comBola=frame.owner===p.key&&!p.keeper&&Math.hypot(frame.ball.x-p.mx,frame.ball.z-p.mz)<2
    // pra onde o CORPO olha (27/10, Diego: "completamente perdidos… desgovernados"): quem se MEXE olha pra onde vai, como gente de
    // verdade; só quem está quase parado vira pra bola (passinho de lado/de costas só aí). Com folga entre os dois limites, senão o
    // corpo ficava trocando de frente a cada passo
    const bx=frame.ball.x-p.mx,bz=frame.ball.z-p.mz,praBola=Math.atan2(bx,bz),praOnde=vel>.3?Math.atan2(dx,dz):p.heading
    if(vel>1.7||comBola)a.olhaBola=false;else if(vel<.8)a.olhaBola=true
    const antecipa=plan?.dir!=null&&plan.t-agora<.8;const mirando=antecipa||a.tiro?.mira!=null&&agora-a.tiro.t0<(a.tiro.touch??toque(a.tiro.nome))+.4
    const alvo=p.mergulho&&!plan?a.rumo:mirando?(antecipa?aim:a.tiro.mira):a.olhaBola&&Math.hypot(bx,bz)<45?praBola:praOnde
    const giro=angulo(alvo-a.rumo);a.rumo+=dt>0?T.MathUtils.clamp(giro*(1-Math.exp(-dt/(mirando?.10:.18))),-7*dt,7*dt):giro
    a.holder.position.set(px,0,pz);a.holder.rotation.set(0,a.rumo,0)
    // ── lances: o motor diz quem fez o quê; o corpo mostra ──
    // (pé e cabeça: pela PREVISÃO — o movimento começa antes, e o contato dele cai no instante em que a bola sai)
    for(const it of agenda){if(it.key!==p.key||it.disabled||it.firstTime&&it.kind==='recebe')continue
     const nome=it.nome,ini=it.start;if(agora<ini||agora>it.t+.1)continue
     if(a.tiro?.planId===it.id)continue
     // Replay/seek uses the same planned capture and exact contact clock.
     if(a.tiro?.planId&&a.tiro.contactAt>=agora-.04&&a.tiro.contactAt<it.t)continue
     dispara(a,nome,{inicio:Math.max(0,agora-ini),agora,ate:it.kind==='recebe'?toque(nome)+.45:Infinity,mira:it.mira,ponto:true})
     a.tiro.base=it.clipStart;a.tiro.dur=it.clipEnd-it.clipStart;a.tiro.touch=it.t-it.start;a.tiro.planId=it.id;a.tiro.contactAt=it.t;a.tiro.extraRise=it.extraRise??0;a.tiro.pose=it.contact;a.tiro.blendIn=(it.hands||it.goleiro) ? .18 : .12
    }
    for(const e of recentes){const id=e.tipo+e.t;if(a.lances.has(id))continue
     const nomeP=p.name
     // (só FALTA derruba: na VANTAGEM o jogo segue e o motor continua levando o jogador — cair ali era o "cai do nada" deslizando)
     if(e.tipo==='falta'&&e.b===nomeP){a.lances.add(id)
      // (falta que veio de carrinho = tropeça por cima dele; correndo voa mais longe, parado cai ali mesmo)
      const deCarrinho=evs.some(o=>o.tipo==='carrinho'&&o.a===e.a&&e.t-o.t<1.2&&e.t>=o.t)
      dispara(a,deCarrinho?(vel>3?'cai_carrinho':'cai_parado'):'cai',{inicio:deCarrinho?.1:.35,agora})}
     else if(e.tipo==='carrinho'&&e.a===nomeP){a.lances.add(id);dispara(a,'carrinho',{inicio:0,agora})}
     else if(e.tipo==='drible'&&e.a===nomeP&&(e.golpe==='roleta'||e.golpe==='cruyff'||e.golpe==='giro')){a.lances.add(id);dispara(a,'giro',{inicio:.05,agora})}
     else if(e.tipo==='drible'&&e.a===nomeP&&asset.clips.has('drible3')){a.lances.add(id);dispara(a,'drible3',{inicio:.2,agora})}
     else if(e.tipo==='gol'&&e.a&&String(e.a).startsWith(nomeP)&&(e.lado===0)===(p.side==='home')){a.lances.add(id)
      let h=0;for(const ch of String(e.a))h=(h*31+ch.charCodeAt(0))|0;const n='comemora'+(1+Math.abs(h+Math.floor(e.t*10))%3)
      if(asset.clips.has(n))dispara(a,n,{inicio:0,agora})}}
    if(p.mergulho&&!a.mergulhou&&!agenda.some(it=>it.key===p.key&&it.goleiro&&Math.abs(it.t-agora)<1)){a.mergulhou=true;const m=p.mergulho,mx=m.x-(m.ax??p.mx),mz=m.z-(m.az??p.mz),len=Math.hypot(mx,mz)
     const direita=(mx*-Math.cos(a.rumo)+mz*Math.sin(a.rumo))>0
     const nome=m.vertical||(len<=.6&&m.y>1.2)?'gk_pega_alto':len<.9?(m.y<.6?'gk_pega_baixo':'gk_pega'):len<1.7&&m.y<.8?(direita?'gk_bloqueio_d':'gk_bloqueio_e'):direita?'gk_voo_d':'gk_voo_e'
     // (o mergulho do motor chega no ponto em ~0,42 s: o voo do Mixamo encosta na bola no `toque` dele)
     dispara(a,nome,{inicio:Math.max(0,toque(nome)-.42*(1-m.k)),agora})}
    if(!p.mergulho)a.mergulhou=false
    if(a.lances.size>40)a.lances=new Set([...a.lances].slice(-20))
    // Keep contact sampling and animation time independent of camera culling.
    // ── corrida: 8 direções em fase comum, peso pela velocidade ──
    const fw=vel>.05?angulo(Math.atan2(dx,dz)-a.rumo):0,lado=-fw // (+ = pra direita do corpo; o eixo do three gira ao contrário)
    const direction=((lado%(2*Math.PI))+2*Math.PI)%(2*Math.PI),di=Math.floor(direction/(Math.PI/4))%8,du=direction/(Math.PI/4)-di;
    const gaitName=i=>DIRS[i][1]==='trote'&&comBola?'conduz':DIRS[i][1],n0=gaitName(di),n1=gaitName((di+1)%8);
    const stride=gaits[n0].distance*(1-du)+gaits[n1].distance*du;
    a.fase=(a.fase+(dt>0?Math.min(3.6,vel/stride)*dt:0))%2;
    const anda=T.MathUtils.smoothstep(vel,.25,1.1),segura=p.keeper&&frame.ball.y>.6&&frame.ball.y<1.6&&Math.hypot(bx,bz)<1.3
    const parado=p.keeper?(frame.ball.heldBy===p.key||segura?'gk_idle_bola':'gk_idle'):'idle'
    const alvos=new Map(LOOPS.map(n=>[n,0]));alvos.set(parado,1-anda)
    alvos.set(n0,alvos.get(n0)+anda*(1-du));alvos.set(n1,alvos.get(n1)+anda*du)
    // lance por cima: o tempo do movimento é o relógio do jogo (pausa e replay param junto)
    let wTiro=0
    if(a.tiro){const t=agora-a.tiro.t0,act=a.acao(a.tiro.nome)
     if(t<0||t>a.tiro.dur){act.setEffectiveWeight(0);const {dur,depois}=a.tiro;a.tiro=null;if(t>dur&&depois)dispara(a,depois,{inicio:Math.min(t-dur,.2),agora})}
     else{wTiro=Math.min(1,t/(a.tiro.blendIn??.12),(a.tiro.dur-t)/.25);act.time=a.tiro.base+t;act.setEffectiveWeight(wTiro)}}
    let wFade=0;if(a.fade){const old=a.acao(a.fade.nome),u=T.MathUtils.clamp((agora-a.fade.fadeAt)/(a.tiro?.blendIn??.12),0,1);if(u>=1||!old){old?.setEffectiveWeight(0);a.fade=null}else{wFade=(1-wTiro)*a.fade.weight*(1-u);old.time=a.fade.base+Math.min(a.fade.dur,Math.max(0,agora-a.fade.t0));old.setEffectiveWeight(wFade)}}
    const k=dt>0?1-Math.exp(-dt/.15):1
    for(const n of LOOPS){const act=a.acao(n);if(!act)continue;const w0=a.pesos.get(n)??0,w=w0+((alvos.get(n)??0)-w0)*(reset?1:k);a.pesos.set(n,w);act.setEffectiveWeight(w*Math.max(0,1-wTiro-wFade));const dur=act.getClip().duration;act.time=gaits[n]?gaitTime(gaits[n],a.fase):agora%dur}
    a.mixer.update(0)
    a.holder.updateMatrixWorld(true);const rawFloor=a.surface.floor();a.holder.position.y+=Math.max(0,Math.min(.08,.003-rawFloor))
    if(a.tiro?.extraRise){const capturedFlight=Math.max(0,rawFloor),height=a.tiro.pose?.feetHeight??.3;a.holder.position.y+=a.tiro.extraRise*T.MathUtils.clamp(capturedFlight/Math.max(.05,height),0,1)}
    // Keep the striking limb and every calibrated impact untouched. Only the
    // support foot / gait receives bounded residual IK, on the original rig.
    const excluded=[],contactSide=a.tiro?.pose?.region;
    if(['left','right'].includes(contactSide))excluded.push(contactSide);
    if(plan&&Math.abs(plan.t-agora)<.09)excluded.push('left','right');
    const plantingBall=frame.ball.presentation??frame.ball;
    for(const side of ['left','right']){const foot=a.bones.get('mixamorig'+(side==='left'?'Left':'Right')+'Foot').getWorldPosition(new T.Vector3());if(foot.distanceTo(new T.Vector3(plantingBall.x,plantingBall.y,plantingBall.z))<.38)excluded.push(side)}
    a.plants=a.grounding.apply(a,agora,{reset:reset||!!frame.placementReset||salto,excluded,airborne:/^(cabeca|gk_voo|gk_pega_alto|carrinho|cai|bicicleta|giro)/.test(a.tiro?.nome??'')});
    // Surface clearance is bounded to ten centimetres on the original rig.
    // It moves the limb only; the ball never follows a corrective IK target.
    if(!frame.replay&&!frame.restart&&(comBola||plan&&Math.abs(plan.t-agora)<.09)){
     a.holder.updateMatrixWorld(true);const B=frame.ball.presentation??frame.ball;
     if(B.y<.4)for(const side of ['left','right']){
      const toe=a.bones.get('mixamorig'+(side==='left'?'Left':'Right')+'ToeBase').getWorldPosition(new T.Vector3());
      if(toe.distanceTo(new T.Vector3(B.x,B.y,B.z))<.38)a.surface.clearBall(new T.Vector3(B.x,B.y,B.z),side);
     }
    }
   }
   for(const a of atores)if(!usados.has(a))a.holder.visible=false
   soleShadows.update(atores);
   // Hands attach only after a measured catch/pickup (or a verified seek restore).
   // Foot deliveries have fixed endpoints; live feet never attract the ball.
   visualBall=groundBall;
   const throwIn=agenda.find(it=>it.pickup&&frame.time>=it.t-1e-7&&frame.time<=(agenda.find(o=>o.id===it.id.slice(7))?.t??it.t)+1e-7),held=frame.ball.heldBy??throwIn?.key,keeper=held?atores.find(a=>a.key===held):null;
   if(keeper){
    const catchCue=agenda.findLast(it=>it.key===held&&(it.goleiro||it.pickup)&&it.t<=frame.time+.001),releaseCue=catchCue&&agenda.find(it=>it.key===held&&it.hands&&it.t>catchCue.t),bone=keeper.bones.get('mixamorigRightHand'),local=catchCue?.contact?.handLocal;
    const anchor=local?bone.localToWorld(new T.Vector3(...local)):bone.getWorldPosition(new T.Vector3()),shot=keeper.tiro,throwing=shot&&(/^gk_(rola|lanca)/.test(shot.nome)||shot.nome==='lateral'),transfer=throwing?T.MathUtils.smoothstep(frame.time,shot.contactAt-.35,shot.contactAt):0;
    if(releaseCue?.contact?.handLocal)anchor.lerp(bone.localToWorld(new T.Vector3(...releaseCue.contact.handLocal)),transfer);
    if(!handState||handState.key!==held||reset){const catchCue=agenda.findLast(it=>it.key===held&&(it.goleiro||it.pickup)&&it.t<=frame.time+.001),B=frame.ball.presentation??frame.ball,gap=anchor.distanceTo(new T.Vector3(B.x,B.y,B.z));
     const restore=(reset||firstFrame)&&catchCue?.contact?.fitted&&Math.hypot(catchCue.root.x,catchCue.root.z)<=(catchCue.pickup?4.5:3);if(catchCue&&(gap<.25||restore)){handState={key:held,t:frame.time,offset:new T.Vector3(B.x,B.y,B.z).sub(anchor),catchGap:restore?null:gap,restored:!!restore,release:agenda.find(it=>it.key===held&&it.hands&&it.t>catchCue.t)};if(restore)handState.offset.set(0,0,0)}
    }
    if(handState?.key===held){anchor.addScaledVector(handState.offset,1-T.MathUtils.smoothstep(frame.time,handState.t,handState.t+.12));visualBall={x:anchor.x,y:anchor.y,z:anchor.z};handState.last={...visualBall};handState.lastTime=frame.time}
   }else if(handState){
    const release=handState.release;
    if(release&&frame.time>=release.t&&frame.time-release.t<.12)handFlight=handArc(release);
    handState=null;
   }
   if((reset||firstFrame)&&!keeper){const release=agenda.findLast(it=>it.kind==='toque'&&it.hands&&it.t<=frame.time&&frame.time-it.t<.55);if(release?.contact?.fitted)handFlight=handArc(release)}
   if(!keeper&&handFlight){const f=handFlight,t=frame.time-f.t,d=f.end-f.t;if(t>=0&&t<=d){const source=frame.ball.presentation??frame.ball;
     // Rejoin the source arc continuously after hand release, with a fixed
     // initial offset. No live receiver target or change to official events.
     const settle=Math.min(d,.55),fade=1-T.MathUtils.smoothstep(t,0,settle),y=source.y+(f.start.y-f.source.y)*fade;
     visualBall={x:source.x+(f.start.x-f.source.x)*fade,y:Math.max(.11,y),z:source.z+(f.start.z-f.source.z)*fade};
    }else if(t>d||t<0)handFlight=null;
   }
   const rollingPoint={...(visualBall??frame.ball.presentation??frame.ball),curl:frame.ball.curl,held:!!held};
   if(!spin||reset||frame.placementReset){spin=new RotacaoBola3D(RAIO_BOLA_FUTEBOL_3D,rollingPoint);if(frame.ball.rotation)spin.quaternion.fromArray(frame.ball.rotation)}
   visualRotation=spin.step(rollingPoint,dt).toArray();
   observeContacts(frame,dt,reset)
  },
  presentFrame:frame=>({...frame,ball:{...frame.ball,presentation:visualBall??frame.ball.presentation,rotation:visualRotation??frame.ball.rotation}}),
  prepared:()=>Promise.resolve(null),
  debug:()=>({prepared:true,duration:timeline.duration,ft:lastTime,agenda:agenda.map(({key,...o})=>({k:key,...o})),medidas}),
  inspect:()=>({...inspection,style:'jogador-novo',football:{diagnostics,grounding:atores.flatMap(a=>(a.plants??[]).filter(p=>p.applied).map(p=>({key:a.key,...p}))),spin:spin?.inspect(),controlledIntervals:controlSpans.length,groundDeliveries:groundFlights.length-controlSpans.length,handContact:handState?{key:handState.key,gap:handState.catchGap}:null,handFlight:handFlight?{start:handFlight.t,end:handFlight.end}:null,navigation:navInfo?.diagnostics,preparedBytes:timeline.bytes,actions:atores.filter(a=>a.tiro).map(a=>({key:a.key,tiro:a.tiro,plan:activePlan(a,lastTime),contact:CONTATO[a.tiro.nome],target:a.corrAlvo,root:a.corr,heading:a.rumo})),mode:bola.modo,touches:bola.toques,contacts:medidas.slice(),corrections:atores.filter(a=>Math.hypot(a.corr.x,a.corr.z)>.01).map(a=>({key:a.key,x:a.corr.x,z:a.corr.z}))}}),
  inspectActors:()=>({slots:atores.map((a,slot)=>({slot,key:a.key,heading:a.rumo,visible:a.holder.visible,detail:a.detail,tiro:a.tiro?.nome??null}))}),
  dispose(){if(disposed)return;disposed=true;soleShadows.dispose();for(const a of atores)a.dispose()},
 }
}
