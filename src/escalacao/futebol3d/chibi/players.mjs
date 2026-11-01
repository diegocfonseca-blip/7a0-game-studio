import {secondaryFootballAction} from './secondary-football-action.mjs';
import {liveGroundInterval} from './live-ground-interval.mjs';
import {groundReceptionContact,groundArrivalTail} from './ground-reception-contact.mjs';
import {receivingRollIntent,verifiedControlTiming,gaitPhaseAtContact,planVerifiedDribbles} from './verified-dribble-plan.mjs';
import {runningReceptionFacing} from './reception-locomotion.mjs';
import {isFirstTimeReception} from './first-time-reception.mjs';
import {actionTravelFreedom} from './action-travel-freedom.mjs';
import {stableActionFacing} from './stable-action-facing.mjs';
import {resilientContactSteps,activeCapturedAction} from './resilient-contact-clock.mjs';
import {planCapturedKickTiming,planMovingPickupTiming,capturedActionTime} from './captured-kick-timing.mjs';
import {verifyClearanceWarnings} from './verify-clearance-warning.mjs';
import {separateContactBodies,applyContactLean} from './contact-preserving-separation.mjs';
import {reachCapturedHandContact} from './reach-surface-contact.mjs';
import {collectivePresentation} from './collective-presentation.mjs';
import {prepareActionRootPath} from './action-root-plan.mjs';
import {boundVerifiedRecovery} from './verified-root-recovery.mjs';
import {prepareControlledApproach} from './controlled-ball-approach.mjs';
import {prepareGroundControlTrack} from './ground-control-track.mjs';
import {preparePossessionBodyPath} from './possession-body-path.mjs';
import {isImmediateLooseContinuation} from './ground-continuation-kind.mjs';
import {capturedBodyFeint} from './captured-body-feint.mjs';
import {selectDribblePresentation,prepareBodyFeints,sampleBodyFeint} from './contextual-dribble-presentation.mjs';
import {footActionProximity} from './foot-action-proximity.mjs';
import {contactBlend,easedBlend} from './motion-refinements.mjs';
// LOCAL full-body foundation experiment; existing rig, clips and contact calibration preserved.
import {createBustActionTrack as createFootballActionTrack} from './bust-action-track.mjs';
// 🧍⚽ 27/10 — os 22 do campo 3D com o JOGADOR NOVO (boneco do Tripo + movimentos de futebol do Mixamo). Mesmo contrato do
// players.mjs (update · presentFrame · inspect · dispose), então o resto do 3D não muda. Só apresentação: posição, bola, placar e
// quem faz o quê continuam do motor — aqui só se escolhe COMO o corpo mostra o que o motor já decidiu.
//  · corrida em 8 direções (de frente, de costas, de lado, na diagonal) misturada pela velocidade de verdade; quem tem a bola conduz
//  · cada lance do motor (passe, chute, cabeceio, lateral, falta sofrida, carrinho, drible, goleiro voando) toca o movimento dele
//  · uniforme = a ficha do TIME em que joga (uniformes.mjs; Diego: "o Pirlo no Neymarzetti veste a camisa do Neymarzetti")
//  · pele e cabelo nunca recebem cor de uniforme; lenda com rosto na carta ganha o tom de pele dela
import * as T from 'three'
import {carregaJogadorNovo,criarJogadorNovo} from './chibi-player-asset.mjs'
import {clubKitFor} from '../club-kit.mjs'
import {matchKitPlan} from '../kit-contrast.mjs'
import {uniformeDoTime,GOLEIRO} from '../uniformes.mjs'
import {playerDetail} from '../lod.mjs'
import {BATISMOS} from '../../batismos.ts'
import {legendAvatar} from '../../legend-avatars.ts'
import {peDe} from '../../campo2d-estilos.ts'
import {RotacaoBola3D,RAIO_BOLA_FUTEBOL_3D} from '../../presidencia-bola-rotacao.ts'
import {nearest} from '../motion/nearest.mjs'
import {bootContact} from '../motion/map-contact.mjs'
import {createMapRigSurface} from '../motion/map-rig-surface.mjs'
import {prepareMapTimeline} from '../motion/map-football-timeline.mjs'
import {groundDelivery,sampleGroundDelivery} from '../motion/map-ball-flight.mjs'
import {prepareBodyTrack} from './segmented-body-track.mjs'
import {MapFootPlant} from '../motion/map-foot-plant.mjs'
import {groundContactShadows} from '../motion/ground-contact-shadows.mjs'
import {prepareMapGaits,gaitTime} from './captured-gait-cycle.mjs'
import {keeperCatchIntent} from '../motion/map-keeper-intent.mjs'
import {contactFrame} from '../motion/map-contact-clock.mjs'
import {keeperFlight,sampleKeeperFlight} from '../motion/map-keeper-flight.mjs'
import {selectMapKick} from './contextual-kick-selection.mjs'
import {VisualPlayerCollisions} from '../visual-player-collisions.mjs'
import {createMapReferee} from '../referee-novo.mjs'
import {FALL_CLIPS,prepareFoulReactions,sampleFoulReaction,foulRoot} from '../motion/map-foul-reaction.mjs'

// direção da corrida em relação ao corpo (0 = pra frente, + = pra direita) → movimento
const DIRS=[[0,'trote'],[Math.PI/4,'diag_fd'],[Math.PI/2,'lado_d'],[3*Math.PI/4,'diag_td'],[Math.PI,'re'],[-3*Math.PI/4,'diag_te'],[-Math.PI/2,'lado_e'],[-Math.PI/4,'diag_fe']]
const LOOPS=['caminhada','idle','idle_bola','gk_idle','gk_idle_bola','conduz',...DIRS.map(d=>d[1])]
// ✂️ trecho usado de cada movimento gravado de jogador de verdade (pacote do Anderson Rohr: cada arquivo tem o jogador parado
// antes e depois do lance) — segundos do arquivo
const TRECHOS={passe_chapa:{de:.85,ate:2.1},passe_movimento:{de:.85,ate:2.1},chute_forte:{de:1.55,ate:3.4},drible3:{de:.35,ate:2.1},comemora1:{de:.25,ate:3.45},comemora2:{de:.25,ate:3.5},comemora3:{de:.25,ate:3.15}}
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

export async function loadPlayersNovo(scene,state,frame,{onPrepared,onWhistle}={}){
 let diagnostics=false;try{diagnostics=!!import.meta.env.DEV&&localStorage.getItem('esc3d-contact-audit')==='1'}catch{}
 const [original,timeline]=await Promise.all([carregaJogadorNovo(),prepareMapTimeline(state,{traceGroundTouches:true})])
 // Measured on the supplied rig: peak whole-foot speed was 42 ms AFTER the
 // ground strike (toe already 29 cm high). Keep shared imported clips intact.
 const asset={...original,meta:{...original.meta,clips:{...original.meta.clips,chute_forte:{...original.meta.clips.chute_forte,toque:2.5833333333333},chute_corrida:{...original.meta.clips.chute_corrida,toque:5/12},conduz:{...original.meta.clips.conduz,toque:2/3,pe:'r'},cabeca:{...original.meta.clips.cabeca,toque:1.1333333333333},gk_recolhe:{...original.meta.clips.gk_recolhe,toque:.75},gk_lanca:{...original.meta.clips.gk_lanca,toque:1.6166666666667},gk_lanca_longe:{...original.meta.clips.gk_lanca_longe,toque:1.45},gk_rola:{...original.meta.clips.gk_rola,toque:1.1333333333333},lateral:{...original.meta.clips.lateral,toque:1.5333333333333},controle_corrida:{...original.meta.clips.conduz,toque:2/3,pe:'r'}}}}
 asset.clips=new Map(original.clips);const runningControl=original.clips.get('conduz').clone();runningControl.name='controle_corrida';asset.clips.set(runningControl.name,runningControl)
 // The actual side-foot capture, including the existing left-foot mirror.
 // Keep its original tracks shared and preserve the supplied rig/geometry.
 asset.meta.clips.passe_movimento={...original.meta.clips.passe_chapa};
 for(const suffix of ['', '_e']){const source=original.clips.get('passe_chapa'+suffix);asset.clips.set('passe_movimento'+suffix,new T.AnimationClip('passe_movimento'+suffix,source.duration,source.tracks))}
 const bodyFeintClip=capturedBodyFeint(original.clips.get('drible3'));asset.clips.set(bodyFeintClip.name,bodyFeintClip);
 const gaitActor=criarJogadorNovo(asset,GOLEIRO),gaits=prepareMapGaits(asset,gaitActor,['caminhada','conduz',...DIRS.map(d=>d[1])]);gaitActor.dispose();
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
  j.holder.name='foundation-player:'+p.key;scene.add(j.holder)
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
  const floor=calibrator.surface.floor(/^gk_(recolhe|pega|rola|lanca)/.test(nome)),ground=Math.max(0,.003-floor);calibrator.holder.position.y+=ground;calibrator.holder.updateMatrixWorld(true)
  const point=n=>calibrator.bones.get('mixamorig'+n).getWorldPosition(new T.Vector3()),meta=asset.meta.clips[nome.replace(/_e$/,'')],left=(meta?.pe==='l')!==nome.endsWith('_e')
  const catchHands=region==='catchHands',handHeight=catchHands||region==='hands'||nome==='gk_recolhe';if(catchHands)region='hands';region??=/^cabeca/.test(nome)?'head':/^gk_|lateral/.test(nome)?'hands':/^peito/.test(nome)?'chest':left?'left':'right'
  let off,fit=true
  if(region==='hands'){off=point('RightHand').add(point('LeftHand')).multiplyScalar(.5);const height=handHeight?ballHeight:off.y,direction=new T.Vector3(0,0,1);let anchor=catchHands?calibrator.surface.anchor('rightHand',point('RightHand'),direction,{height}):calibrator.surface.anchor('hands',off,direction,{height});
   // In an open-hand save the middle of the palms is empty space. Fit an
   // actual glove instead of treating that empty-space fallback as contact.
   if(!catchHands&&!anchor.fitted)for(const side of ['Right','Left']){const candidate=calibrator.surface.anchor('hands',point(side+'Hand'),direction,{height});if(candidate.fitted){anchor=candidate;break}}
   off=anchor.point;fit=anchor.fitted}
  else if(region==='rightHand'){off=point('RightHand');const anchor=calibrator.surface.anchor('rightHand',off,new T.Vector3(0,0,1),{height:off.y});off=anchor.point;fit=anchor.fitted}
  else if(region==='chest'){const anchor=calibrator.surface.anchor('chest',point('Spine2'),new T.Vector3(0,0,1),{height:ballHeight});off=anchor.point;fit=anchor.fitted}
  else{const origin=point(region==='head'?'Head':region==='left'?'LeftToeBase':'RightToeBase'),height=region==='head'?origin.y+.12:ballHeight,anchor=calibrator.surface.anchor(region,origin,new T.Vector3(0,0,1),{height});off=anchor.point;fit=anchor.fitted}
  const handBone=region==='hands'&&calibrator.surface.probe(off,'leftHand').gap<calibrator.surface.probe(off,'rightHand').gap?'mixamorigLeftHand':'mixamorigRightHand';
  const handLocal=['hands','rightHand'].includes(region)?calibrator.bones.get(handBone).worldToLocal(off.clone()).toArray():null;const value={handLocal,handBone,off:{x:off.x,y:off.y,z:off.z},ground,floor,region,fitted:fit,feetHeight:Math.max(0,floor),head:point('Head').toArray()};poseCache.set(key,value);action.setEffectiveWeight(0);return value
 }
 for(const nome of ['conduz','chute','chute_corrida','passe','passe_curto','cavadinha','cabeca','cabeca2','dominio','peito','passe_chapa','passe_movimento','chute_forte','gk_recolhe','gk_pega','gk_pega_baixo','gk_idle_bola','gk_rola','gk_lanca','gk_lanca_longe','lateral'].flatMap(n=>[n,n+'_e'])){
  if(!asset.clips.has(nome))continue;const sample=samplePose(nome);CONTATO[nome]={...sample,alto:['head','chest','hands'].includes(sample.region),ang:0}
 }
 // A touchline restart needs the ball to be picked up before the imported
 // throw. The source's ground-to-two-metres placement is never drawn as a jump.
 for(const release of [...agenda])if(release.hands&&!release.keeper){const t=release.t-.4,f=timeline.sample(t,release.key),movingPickup=f.player.speed>2&&Math.hypot(f.ball.x-f.player.x,f.ball.z-f.player.z)>1.2;agenda.push({id:'pickup:'+release.id,key:release.key,kind:'recebe',pickup:true,movingPickup,hands:true,keeper:false,t,h:f.ball.y-.11,requiredContact:'hands',dir:movingPickup?Math.atan2(f.ball.x-f.player.x,f.ball.z-f.player.z):release.dir,bola:f.ball,rec:f.player})}
 agenda.sort((a,b)=>a.t-b.t);
 const dribbleCapturePlan=planVerifiedDribbles(agenda);
 for(const it of agenda.filter(e=>e.verifiedGroundTouch)){const plan=dribbleCapturePlan.find(p=>p.id===it.id);if(!plan.capture){it.disabled=true;it.adaptation=plan.reason}}
 const keeperFlights=agenda.filter(it=>it.physicalImpact&&!it.disabled).map(it=>keeperFlight(it,timeline.sample,agenda)).filter(Boolean);
 // Choose a pose once from the official sequence, independent of camera/FPS.
 for(const it of agenda){const a=atores.find(a=>a.key===it.key);if(!a)continue
  const prevReceive=agenda.findLast(o=>o.key===it.key&&o.kind==='recebe'&&o.t<=it.t+.001),quick=prevReceive&&it.t-prevReceive.t<.28;const executionMoving=(it.rec?.speed??0)>2||prevReceive&&it.t>prevReceive.t&&it.t-prevReceive.t<.9&&Math.hypot(it.rec.x-prevReceive.rec.x,it.rec.z-prevReceive.rec.z)>.7
  if(it.kind==='carry')it.nome='controle_corrida'
  else if(it.save)it.nome=it.bola.y>1.5?'gk_pega_alto':it.bola.y>.95?'gk_pega':'gk_pega_baixo'
  else if(it.kind==='recebe'){const next=agenda.find(e=>e.key===it.key&&e.kind==='toque'&&e.t>it.t);it.nome=it.goleiro||it.pickup?'gk_recolhe':it.h>.9?'peito':((it.rec?.speed??0)>2||next&&next.t-it.t<.9)?'controle_corrida':'dominio'}
  else if(it.hands){const outgoing=timeline.sample(it.t+.05).ball;it.nome=it.keeper?(it.tipo==='lancamento'?'gk_lanca_longe':outgoing.vy>2?'gk_lanca':'gk_rola'):'lateral'}
  else if(it.cab)it.nome=it.bola.y>1.7?'cabeca':'cabeca2'
  else{const actorSpeed=(it.rec?.speed??0)>2?it.rec.speed:prevReceive&&it.t>prevReceive.t?Math.hypot(it.rec.x-prevReceive.rec.x,it.rec.z-prevReceive.rec.z)/(it.t-prevReceive.t):3.4;it.variation=selectMapKick(it,{quick:!!quick,moving:!!executionMoving,actorSpeed,availablePreparation:prevReceive?Math.max(0,it.t-prevReceive.t-.1):it.t});it.nome=it.variation.clip;}
  if(it.kind==='toque'&&!it.hands&&!it.cab){const wantLeft=a.pe==='canhota'||a.pe!=='direita'&&a.canhoto,baseLeft=asset.meta.clips[it.nome]?.pe==='l';if(wantLeft!==baseLeft&&asset.clips.has(it.nome+'_e'))it.nome+='_e'}
  if(it.goleiro||it.save){const intent=keeperCatchIntent(it,agenda,key=>atores.find(a=>a.key===key)?.side);it.dir=intent.heading;it.incomingShot=intent.shot}
  it.mira=it.dir??it.rec.heading
 }
 // Calibrate saves by glove height/reach in the imported captures. Metadata
 // inherited from foot-contact detection cannot time a goalkeeper's hands.
 for(const it of agenda){if(it.disabled||!(it.save||(it.goleiro||it.pickup)&&it.bola.y>.35))continue;
  const localX=(it.bola.x-it.rec.x)*Math.cos(it.mira)-(it.bola.z-it.rec.z)*Math.sin(it.mira),high=it.bola.y>1.55;
  const ranges=high?[[Math.abs(localX)>1&&it.bola.y<1.95?(localX<0?'gk_voo_d':'gk_voo_e'):'gk_pega_alto',.55,1.0]]:it.bola.y>.95?[['gk_pega',.2,.85]]:[['gk_pega_baixo',.4,.9]];
  let best=null;
  for(const [name,begin,end]of ranges)for(let time=begin;time<=end+1e-7;time+=1/60){
   const natural=samplePose(name,time),rise=Math.max(0,it.bola.y-natural.off.y),candidate=samplePose(name,time,it.goleiro||it.pickup?'catchHands':'hands',it.bola.y-Math.min(.45,rise));
   if(!candidate.fitted||rise>.45)continue;
   const cost=rise*2+Math.abs(time-(name==='gk_pega'?.4:.8))*.08;
   if(!best||cost<best.cost)best={name,time,candidate,rise,cost};
  }
  if(best){it.nome=best.name;it.rawTouch=best.time;it.contactHeight=it.bola.y-best.rise;it.extraRise=best.rise;it.handPoseFitted=true}else it.handPoseFitted=false;
 }
 for(const it of agenda){if(it.kind!=='recebe'||it.goleiro||it.pickup)continue;
  const next=agenda.find(o=>o.key===it.key&&o.kind==='toque'&&o.t>=it.t);
  // The available reception capture is a ground control. An airborne assignment
  // is anticipation until the ball descends, never an invented knee/chest trap.
  if(it.bola.y>.3&&it.bola.y<1.1||it.nome==='peito'&&!samplePose(it.nome,rawTouch(it.nome),'chest',it.bola.y).fitted){it.assignedAt=it.t;const end=Math.min(next?.t??it.t+.5,it.t+.5);while(it.t<end&&timeline.sample(it.t).ball.y>.22)it.t=Math.min(end,it.t+1/60);const f=timeline.sample(it.t,it.key);it.bola=f.ball;it.rec=f.player;it.adaptation='wait-for-ground';if(it.bola.y<=.3){it.nome=(it.rec?.speed??0)>2?'controle_corrida':'dominio'}else{it.disabled=true;it.adaptation='unreachable-aerial-contact'}}
  if(isFirstTimeReception(it,next)){it.firstTime=next.id;next.firstTime=true}
  // Receive with an open body when the next pass leaves immediately. Facing
  // directly backwards then attempting a 170-degree turn in .25 s is impossible.
  const nextDribble=agenda.find(o=>!o.disabled&&o.key===it.key&&o.verifiedGroundTouch&&o.t>it.t&&(next?.t??Infinity)>o.t);
  const reception=groundReceptionContact(it,timeline.sample,{nextRelease:next,nextDribble});
  if(reception){it.assignedAt??=it.t;it.t=reception.t;it.bola=reception.ball;it.rec=reception.body;it.dir=reception.heading;it.mira=reception.heading;it.adaptation='wait-for-reachable-ground-contact';it.receptionDelay=reception.delay;it.nativeContactGap=reception.nativeGap}
  const facing=receivingRollIntent(it,nextDribble,timeline.sample)??runningReceptionFacing(it,next);it.receptionFacing=facing.reason;it.mira=facing.heading;it.dir=facing.heading
 }
 agenda.sort((a,b)=>a.t-b.t);
 for(const it of agenda)if(it.kind==='carry'&&!it.verifiedGroundTouch){it.disabled=true;it.adaptation='source-velocity-change-is-not-a-verified-foot-contact'}
 const groundFlights=[];
 for(const it of agenda){if(it.kind!=='toque'||it.hands||it.cab||!['passe','enfiada','inversao'].includes(it.tipo)||it.bola.y>.13)continue;
  let receive=agenda.find(o=>o.kind==='recebe'&&o.t>it.t&&!o.goleiro&&!o.pickup);if(!receive)continue;
  if(receive.firstTime)receive=agenda.find(o=>o.id===receive.firstTime);
  if(!receive||receive.bola.y>.13||receive.t-it.t>4)continue;
  const intervening=agenda.find(o=>o.kind==='toque'&&o.t>it.t+.001&&o.t<receive.t-.001);if(intervening)continue;
  const flight=liveGroundInterval(it.t,receive.t,timeline.sample)?groundDelivery(it.t,receive.t,it.bola,receive.bola,it.delivery):null;if(flight)groundFlights.push(flight);
 }
 const groundArrivalTails=[];
 for(const it of agenda.filter(e=>e.receptionDelay)){
  if(groundFlights.some(f=>f.start<it.t&&f.end>=it.t-1e-7))continue;
  const prior=agenda.findLast(e=>!e.disabled&&e.t<it.assignedAt&&!(e.firstTime&&e.kind==='recebe'));
  const tail=groundArrivalTail(it,timeline.sample,{startLimit:prior?.t??0});
  if(tail){const flight=groundDelivery(tail.start,tail.end,tail.from,tail.to);if(flight){groundFlights.push(flight);groundArrivalTails.push({key:it.key,start:tail.start,end:tail.end})}}
 }
 // Cues for both reception and release share one continuous root track.
 for(const it of agenda){const a=atores.find(a=>a.key===it.key);if(!a||it.firstTime&&it.kind==='recebe'||it.disabled)continue
  const pose=samplePose(it.nome,it.rawTouch??rawTouch(it.nome),it.hands&&it.kind==='toque'&&it.keeper?'rightHand':(it.goleiro||it.pickup)&&it.bola.y>.35?'catchHands':it.save||it.goleiro?'hands':null,it.contactHeight??it.bola.y),cs=Math.cos(it.mira),sn=Math.sin(it.mira),off=pose.off
  it.contact=pose;it.root={x:it.bola.x-it.rec.x-(off.x*cs+off.z*sn),z:it.bola.z-it.rec.z-(-off.x*sn+off.z*cs)}
  if(it.cab){const airborne=Math.max(0,pose.feetHeight-.006);it.extraRise=T.MathUtils.clamp(it.bola.y-off.y,-airborne,Math.max(0,1-pose.feetHeight))}
  // Hand ownership is attachment after a measured catch, never a foot action.
  if(it.hands&&it.keeper&&it.kind==='toque')continue
  it.rootBudget=it.pickup?Math.min(6,Math.max(4.5,Math.hypot(it.root.x,it.root.z)+.02)):it.kind==='recebe'&&it.bola.y<=.3?Math.min(4.5,Math.max(3,Math.hypot(it.root.x,it.root.z))):3;
  a.knots.push({t:it.t,...it.root,budget:it.rootBudget,approach:it.pickup?2:undefined,plan:it})
 }
 // Receiving ownership in the source is a tactical assignment. Its settling
 // spring must not be drawn as a ball moving away and returning by itself.
 // Connect measured control contacts, and move the body along that same fixed
 // interval instead of adding offsets to a source root that may run elsewhere.
 const groundInterval=(p,q)=>liveGroundInterval(p.t,q.t,timeline.sample);
 const controlSpans=[];
 for(const a of atores){a.controls=[];for(let i=0;i<a.knots.length-1;i++){const first=a.knots[i],last=a.knots[i+1],p=first.plan,q=last.plan;
  if(!['recebe','carry'].includes(p.kind)||p.hands||p.goleiro||p.firstTime||q.hands||q.cab||q.t-p.t>1.9||p.bola.y>.23||q.bola.y>.13||!groundInterval(p,q))continue;
  let owned=true;for(let t=p.t+.04;t<q.t-.015;t+=.05)if(timeline.sample(t).owner!==a.key){owned=false;break}if(!owned)continue;
  const flight=groundDelivery(p.t,q.t,p.bola,q.bola);if(flight){groundFlights.push(flight);controlSpans.push(flight)}
  a.controls.push({start:p.t,end:q.t,verified:!!(p.verifiedGroundTouch||q.verifiedGroundTouch),from:{x:p.rec.x+p.root.x,z:p.rec.z+p.root.z},to:{x:q.rec.x+q.root.x,z:q.rec.z+q.root.z}});
 }}
 // A failed control can roll to an opponent. Keep that loose interval free
 // of the same ownership spring, without manufacturing another touch/decision.
 const physical=agenda.filter(it=>!it.disabled&&!(it.firstTime&&it.kind==='recebe'));
 for(let i=0;i<physical.length-1;i++){const p=physical[i],q=physical[i+1];if(!['recebe','carry'].includes(p.kind)||p.hands||p.goleiro||q.hands||p.bola.y>.13||q.bola.y>.13||q.t-p.t>2.5||!groundInterval(p,q)||groundFlights.some(f=>Math.abs(f.start-p.t)<1e-5))continue;
  // A receiver who keeps possession is conducting the ball. Another athlete
  // being the next contact does not turn the whole run into a failed touch.
  if(!isImmediateLooseContinuation(p,q,t=>timeline.sample(t)))continue;
  const f=groundDelivery(p.t,q.t,p.bola,q.bola);if(!f)continue;groundFlights.push(f);controlSpans.push(f);
  // A spilled first touch stays loose. The receiver follows its fixed roll
  // until the source relinquishes possession, instead of running past it while
  // playing a dribbling loop. No extra touch or ball attraction is manufactured.
  if(p.key!==q.key){const a=atores.find(a=>a.key===p.key),dx=f.to.x-f.from.x,dz=f.to.z-f.from.z,d=Math.hypot(dx,dz);if(!a||d<.4)continue;
   let end=Math.min(q.t-.18,p.t+1.5);for(let t=p.t+.05;t<end;t+=1/60)if(timeline.sample(t).owner!==p.key){end=t;break}
   let to;while(end>p.t+.35){const ball=sampleGroundDelivery(f,end),base=timeline.sample(end,p.key).player;to={x:ball.x-dx/d*.8,z:ball.z-dz/d*.8};if(Math.hypot(to.x-base.x,to.z-base.z)<2.85)break;end-=.05}
   if(end>p.t+.35)a.controls.push({start:p.t,end,from:{x:p.rec.x+p.root.x,z:p.rec.z+p.root.z},to,loose:true,intent:Math.atan2(dx,dz),recovery:1});
  }
 }
 for(const a of atores){
  const breaks=[];let previous=timeline.sample(0,a.key).player;
  for(let i=1;i<=Math.ceil(timeline.duration*60);i++){const p=timeline.sample(i/60,a.key).player;if(Math.hypot(p.x-previous.x,p.z-previous.z)>2.5)breaks.push({before:(i-1)/60,after:i/60});previous=p}
  a.rootBreaks=breaks;
  a.bodyTrack=prepareBodyTrack(a.knots,a.controls,time=>timeline.sample(time,a.key).player,{breaks,budget:Math.max(3,...a.knots.map(k=>k.budget??3))});
 }

 let foulReactions={plans:[],skipped:[]};
 const bodyTrack=(a,time)=>{const offset=a.bodyTrack(time),reaction=sampleFoulReaction(foulReactions.plans,a.key,time);if(!reaction)return offset;const base=timeline.sample(time,a.key).player,p=foulRoot(reaction,{x:base.x+offset.x,z:base.z+offset.z});return{x:p.x-base.x,z:p.z-base.z}};
 for(const action of calibrator.mixer._actions)action.setEffectiveWeight(0)
 calibrator.holder.position.set(0,0,0);calibrator.holder.rotation.set(0,0,0)
 // Fit each captured action into the available official interval. In particular,
 // a keeper must finish collecting before starting a throw; crop its idle lead-in.
 for(const a of atores){let previous=null;for(const it of agenda.filter(i=>i.key===a.key&&!i.disabled&&!(i.firstTime&&i.kind==='recebe'))){
  const raw=it.rawTouch??rawTouch(it.nome),begin=it.kind==='carry'?.27:trecho(it.nome)?.de??0;
  it.start=it.t-(raw-begin);const moving=!it.hands&&!it.goleiro&&!it.pickup&&!it.cab&&(it.rec?.speed??0)>3.5;if(moving&&(it.kind==='recebe'||it.kind==='carry'||['passe','enfiada'].includes(it.tipo)))it.start=Math.max(it.start,it.t-(it.kind==='recebe'?.24:.28));
  // React to the shot first. The low collection starts only when the ball is
  // approaching the ground, not a full second before a high shot reaches goal.
  if(it.goleiro&&it.incomingShot&&!it.save&&it.bola.y<.35)it.start=Math.max(it.start,it.t-.28);
  const settle=(previous?.goleiro||previous?.pickup) ? .18 : .10;
  if(previous&&previous.t<it.t&&it.start<previous.t+settle)it.start=it.hands?Math.min(it.t-.025,previous.t+Math.min(.04,(it.t-previous.t)*.15)):Math.min(it.t-.19,previous.t+settle);
  const shortPass=it.kind==='toque'&&!it.hands&&['passe','enfiada'].includes(it.tipo);
  it.clipStart=raw-(it.t-it.start);it.clipEnd=Math.min(trecho(it.nome)?.ate??asset.clips.get(it.nome).duration,raw+(it.goleiro ? .3 : moving ? .30 : (it.kind==='recebe'||shortPass) ? .4 : .65));
  if(it.kind==='toque'&&!it.hands&&!it.cab){it.timing=planCapturedKickTiming(it,{raw,begin,end:trecho(it.nome)?.ate??asset.clips.get(it.nome).duration,earliestStart:previous?previous.t+Math.min(.1,(it.t-previous.t)*.25):0});Object.assign(it,{start:it.timing.start,clipStart:it.timing.clipStart,clipEnd:it.timing.clipEnd});}
  if(it.movingPickup){it.timing=planMovingPickupTiming(it,{raw,end:asset.clips.get(it.nome).duration,earliestStart:previous?previous.t+.04:0});Object.assign(it,{start:it.timing.start,clipStart:it.timing.clipStart,clipEnd:it.timing.clipEnd})}
  if(it.verifiedGroundTouch){it.timing=verifiedControlTiming(it,{raw,end:asset.clips.get(it.nome).duration,earliestStart:previous?previous.t+.10:0});Object.assign(it,{start:it.timing.start,clipStart:it.timing.clipStart,clipEnd:it.timing.clipEnd})}
  previous=it;
 }}
 // Orientation must use the final capture window, not a shorter independent
 // heuristic built before kick preparation was timed.
 const footballActionTrack=createFootballActionTrack(timeline,{captureTiming:true});
 for(const a of atores){
  const native=a.bodyTrack;
  const world=t=>{
   const p=timeline.sample(t,a.key).player,o=native(t);
   return{x:p.x+o.x,z:p.z+o.z};
  };
  const events=agenda.filter(e=>e.key===a.key),breaks=a.rootBreaks;
  const chase=a.keeper?null:preparePossessionBodyPath(world,t=>timeline.sample(t),a.key,events,{
   duration:timeline.duration,controls:a.controls,
   ballAt:t=>sampleGroundDelivery(groundFlights.find(f=>t>=f.start&&t<=f.end),t),
  });
  const fixedBall=t=>sampleGroundDelivery(groundFlights.find(f=>t>=f.start&&t<=f.end),t)??timeline.sample(t).ball,ownedAt=t=>timeline.sample(t).owner===a.key;
  const recovered=boundVerifiedRecovery(prepareActionRootPath(chase?.sample??world,events,{controls:a.controls,breaks,ballAt:fixedBall,ownedAt}),events,{breaks,ballAt:fixedBall,ownedAt});
  const approach=prepareControlledApproach(recovered,events,a.controls,{ballAt:fixedBall,ownedAt,breaks});
  const path=prepareGroundControlTrack(approach,events,a.controls,{ballAt:fixedBall,ownedAt,breaks});
  a.possessionPath=chase;a.rootPlan=path;
  a.bodyTrack=t=>{const p=timeline.sample(t,a.key).player,r=path.sample(t);return{x:r.x-p.x,z:r.z-p.z}};
 }

 if(import.meta.env.DEV||diagnostics)globalThis.qaFootballRootAudit={actors:atores,timeline,footballActionTrack,gaits};
 foulReactions=prepareFoulReactions({events:timeline.official?.events??[],actors:frame.players,agenda,durations:Object.fromEntries(FALL_CLIPS.map(n=>[n,asset.clips.get(n)?.duration])),world:(key,time)=>{const a=atores.find(a=>a.key===key),p=timeline.sample(time,key).player;if(!a||!p)return null;const o=a.bodyTrack(time);return{...p,x:p.x+o.x,z:p.z+o.z}}});
 const bodyFeints=prepareBodyFeints(timeline.official.events,atores,agenda),dribbleDecisions=[],secondaryDecisions=[];
 const referee=createMapReferee(scene,asset,gaits,agenda,timeline,{onWhistle}),shadowActors=[...atores,referee.actor];
 const navigation=new VisualPlayerCollisions({radius:.35,budget:.42})
 const soleShadows=groundContactShadows(scene,shadowActors.length,{bones:{left:'mixamorigLeftFoot',right:'mixamorigRightFoot'},contacts:a=>a.plants});
 // Release collision steering gradually around a fixed contact. A binary
 // lock used to erase up to 60 cm of avoidance in a single video frame.
 const contactFreedom=(a,time)=>{const distance=Math.min(Infinity,...(a?.knots??[]).map(k=>Math.abs(k.t-time))),reaction=sampleFoulReaction(foulReactions.plans,a?.key,time);return T.MathUtils.smoothstep(distance,.08,.4)*(1-(reaction?.lock??0))};
 // A runner recovering from a spilled touch swings his arms while passing
 // the interceptor. Reserve that extra body space gradually, without shifting
 // the interceptor's fixed contact or enlarging any visible model.
 const recoveryRadius=(a,time)=>Math.max(.30,...(a?.controls??[]).filter(s=>s.loose).map(s=>.30+.36*T.MathUtils.smoothstep(time,s.end-.3,s.end)*(1-T.MathUtils.smoothstep(time,s.end+.5,s.end+(s.recovery??1)))));
 let disposed=false,lastTime=null,inspection={full:0,intermediate:0,far:0,hidden:0,tiros:0},navInfo=null
 const bola={modo:'livre',dono:null,toques:0},medidas=[];let visualBall=null,visualRotation=null,spin=null,handState=null,handFlight=null
 onPrepared?.()
 // um movimento de lance por cima da corrida: entra em 0,12 s, sai nos últimos 0,25 s
 const dispara=(a,nome,{inicio=0,agora,ate=Infinity,mira=null,ponto=null}={})=>{const c=asset.clips.get(nome);if(!c)return;if(a.fade){a.acao(a.fade.nome)?.setEffectiveWeight(0);a.fade=null}if(a.tiro){const old=a.acao(a.tiro.nome);if(a.tiro.nome!==nome)a.fade={...a.tiro,weight:old?.getEffectiveWeight()??0,fadeAt:agora};old?.setEffectiveWeight(0)}const act=a.acao(nome);act.reset();act.play();act.timeScale=0;act.setLoop(T.LoopOnce,1);act.clampWhenFinished=true;const tr=trecho(nome);a.tiro={nome,t0:agora-inicio,base:tr?.de??0,dur:Math.min(tr?tr.ate-tr.de:c.duration,ate),mira,bate:mira!==null||ponto!==null};inspection.tiros++}
 const toque=nome=>(asset.meta.clips?.[nome.replace(/_e$/,'')]?.toque??.4)-(trecho(nome)?.de??0) // (contado do começo do trecho)
 const deCabeca=it=>it.cab
 const activePlan=(a,now)=>agenda.find(it=>it.key===a.key&&!it.disabled&&!(it.firstTime&&it.kind==='recebe')&&it.bola&&it.t>=now-.05&&it.t<now+(it.kind==='carry'?.65:1.2))
 const planName=it=>it?.nome??'dominio'
 const handReleasePoint=it=>{const a=atores.find(a=>a.key===it.key),root=bodyTrack(a,it.t),off=it.contact.off,c=Math.cos(it.mira),s=Math.sin(it.mira);return{x:it.rec.x+root.x+off.x*c+off.z*s,y:off.y,z:it.rec.z+root.z-off.x*s+off.z*c}}
 const handArc=it=>({t:it.t,end:Math.min(it.t+.55,agenda.find(o=>o.kind==='recebe'&&o.t>it.t+.001)?.t??Infinity),start:handReleasePoint(it),source:timeline.sample(it.t).ball});
 const contactRegion=it=>it.hands||it.goleiro?'hands':it.cab?'head':it.contact?.region==='chest'?'chest':'feet';
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
    else if(plan.contact?.region==='chest')measured=a.surface.probe(ballPoint,'chest');
    else{const left=a.surface.probe(ballPoint,'left'),right=a.surface.probe(ballPoint,'right');measured=left.gap<right.gap?left:right}
    const sampleGap=measured.gap,region=contactRegion(plan);let interpolated=false;
    // At 30 Hz the 20 Hz official impact can fall between rendered frames.
    // Interpolate the actual deformed triangles, not a planned toe-radius proxy.
    if(frame.time-plan.t>1e-6&&old?.time<plan.t&&old.mesh?.region===region&&frame.time-old.time<=.07){const u=(plan.t-old.time)/(frame.time-old.time),current=a.surface.triangles(region),before=old.mesh.triangles;
     if(current.length===before.length){const triangles=current.map((t,i)=>new T.Triangle(...['a','b','c'].map(k=>before[i][k].clone().lerp(t[k],u)))),point=plan.hands&&plan.kind==='toque'?handReleasePoint(plan):plan.bola,hit=nearest(new T.Vector3(point.x,point.y,point.z),triangles);measured={gap:hit.distance-.11,floor:measured.floor};interpolated=true}
    }
    const confirmed=measured.gap>=-.025&&measured.gap<=.03;medidas.push({contactType:hands?'hands':aerial?'head':region==='chest'?'chest':'foot',kind:plan.kind,t:plan.t,assignedAt:plan.assignedAt,adaptation:plan.adaptation,sampledAt:frame.time,interpolated,gapAtSample:sampleGap,key:a.key,tipo:plan.tipo??(plan.kind==='carry'?'conduz':'recepcao'),nome:planName(plan),dist:measured.gap+.11,gap:measured.gap,floor:measured.floor,confirmed,swept:false,bodyAngleDegrees:Math.abs(angulo(a.rumo-plan.mira))*180/Math.PI,chestAimDegrees:(()=>{const v=a.visibleFacing?.('mixamorigSpine2');return v?Math.abs(angulo(Math.atan2(v.x,v.z)-(plan.dir??plan.mira)))*180/Math.PI:null})(),headAimDegrees:(()=>{const v=a.visibleFacing?.('mixamorigHead');return v?Math.abs(angulo(Math.atan2(v.x,v.z)-(plan.dir??plan.mira)))*180/Math.PI:null})(),rootSpeed:a.actualTravelSpeed});if(confirmed)bola.toques++}
   const next=agenda.find(it=>it.key===a.key&&!it.disabled&&!(it.firstTime&&it.kind==='recebe')&&it.t>frame.time+1e-7&&it.t-frame.time<=.051);if(next&&diagnostics){const region=contactRegion(next);a.contactHistory.mesh={region,triangles:a.surface.triangles(region)}}
   if(owned&&hit.contact&&frame.time-a.lastConfirmed>.2){a.lastConfirmed=frame.time;bola.toques++;medidas.push({t:frame.time,key:a.key,tipo:'conduz',dist:hit.gap+.175,gap:hit.gap,confirmed:true,swept:hit.swept})}
  }
  if(medidas.length>200)medidas.splice(0,medidas.length-200)
 }
 let contactSubsteps=0,collectiveOffsets=new Map(),collectiveInfo=null;
 const updateFrame=(frame,camera,viewportHeight=720)=>{
   if(disposed)return
   // Orbit/zoom and a paused clock may draw the SAME football frame again.
   // Re-evaluating a zero-speed gait here used to replace a running pose with
   // idle and turn the body while the ball and match were paused.
   if(lastTime===frame.time&&!frame.official?.finished){
    inspection={full:0,intermediate:0,far:0,hidden:0,tiros:inspection.tiros}
    for(const a of atores){const p=frame.players.find(p=>p.key===a.key);a.detail=!p||p.visible===false?'hidden':camera?playerDetail(camera,{x:p.mx,y:0,z:p.mz},viewportHeight,a.detail):'full';inspection[a.detail]++;a.holder.visible=!!p&&p.visible!==false}
    soleShadows.update(shadowActors);return
   }
   if(lastTime!==null&&frame.time>lastTime&&atores.some(a=>a.rootBreaks.some(c=>c.after>lastTime&&c.after<=frame.time)))frame={...frame,placementReset:true};
   const firstFrame=lastTime===null;const dt=lastTime===null||frame.time<lastTime||frame.time-lastTime>1?0:frame.time-lastTime,reset=dt===0&&lastTime!==null&&frame.time!==lastTime;lastTime=frame.time
   if(reset||frame.placementReset){handState=null;handFlight=null;collectiveOffsets.clear()}
   inspection={full:0,intermediate:0,far:0,hidden:0,tiros:inspection.tiros}
   const deflection=keeperFlights.find(f=>frame.time>=f.start&&frame.time<=f.end),groundFlight=groundFlights.find(f=>frame.time>=f.start&&frame.time<=f.end),groundBall=sampleKeeperFlight(deflection,frame.time)??sampleGroundDelivery(groundFlight,frame.time);if(groundBall)frame={...frame,ball:{...frame.ball,presentation:groundBall}};
   const evs=frame.official?.events??[],usados=new Set()
   // eventos dos últimos 0,4 s, por nome do motor (o mesmo que o teatro do players.mjs usa)
   const recentes=[];for(let i=evs.length-1;i>=0;i--){const e=evs[i],idade=frame.time-e.t;if(idade>.4)break;if(idade>=0)recentes.push(e)}
   const plannedWorld=new Map(frame.players.map(p=>{const a=atores.find(a=>a.key===p.key),r=a?bodyTrack(a,frame.time):{x:0,z:0},b=p.sourceAnchor??{x:p.mx,z:p.mz};return[p.key,{x:b.x+r.x,z:b.z+r.z}]}));
   const collective=collectivePresentation(frame,plannedWorld,collectiveOffsets,reset||firstFrame?0:dt);collectiveOffsets=collective.offsets;collectiveInfo=collective.diagnostics;
   const roleOffset=(a,key)=>{const o=collectiveOffsets.get(key)??{x:0,z:0},k=contactFreedom(a,frame.time);return{x:o.x*k,z:o.z*k}};
   const proposed=frame.players.map(p=>{const a=atores.find(a=>a.key===p.key),root0=a?bodyTrack(a,frame.time):{x:0,z:0},role=roleOffset(a,p.key),root={x:root0.x+role.x,z:root0.z+role.z},base=p.sourceAnchor??{x:p.mx,z:p.mz},future=timeline.sample(frame.time+.15,p.key).player,rf=a?bodyTrack(a,frame.time+.15):{x:0,z:0};return{...p,mx:base.x+root.x,mz:base.z+root.z,navigationVelocity:future?{x:(future.x+rf.x+role.x-base.x-root.x)/.15,z:(future.z+rf.z+role.z-base.z-root.z)/.15}:undefined}})
   navInfo=navigation.sample({...frame,players:proposed},{action:(key,time)=>{const freedom=contactFreedom(atores.find(a=>a.key===key),time);return freedom<1?{collisionFreedom:freedom}:null}})
   const safety=navigation.finalize(proposed.filter(p=>p.visible!==false).map(p=>{const shift=navInfo.positions.get(p.key)??{x:0,z:0},a=atores.find(a=>a.key===p.key);return{key:p.key,sourceX:p.mx,sourceZ:p.mz,rootX:p.mx+shift.x,rootZ:p.mz+shift.z,x:p.mx+shift.x,z:p.mz+shift.z,y:1,radius:recoveryRadius(a,frame.time),freedom:contactFreedom(a,frame.time)}}));
   for(const [key,shift]of safety.shifts){const p=navInfo.positions.get(key);if(p){p.x+=shift.x;p.z+=shift.z}}navInfo.diagnostics.final=safety.diagnostics;
   for(const p of frame.players){
    const a=atores.find(x=>x.key===p.key&&!usados.has(x))??atores.find(x=>!usados.has(x)&&x.side===p.side&&x.keeper===p.keeper&&!frame.players.some(q=>q.key===x.key));if(!a)continue;usados.add(a);a.key=p.key
    a.detail=p.visible===false?'hidden':camera?playerDetail(camera,{x:p.mx,y:0,z:p.mz},viewportHeight,a.detail):'full';inspection[a.detail]++
    a.holder.visible=p.visible!==false
    // deslocamento de verdade deste quadro (a velocidade do motor sozinha não sabe de cobrança/teleporte)
    // A aproximação visual do corpo também conta na distância da passada.
    const reaction=sampleFoulReaction(foulReactions.plans,p.key,frame.time);
    for(const pose of a.reaction?.clips??[])a.acao(pose.name)?.setEffectiveWeight(0);
    if(reaction&&!a.reaction){if(a.tiro)a.acao(a.tiro.nome)?.setEffectiveWeight(0);if(a.fade)a.acao(a.fade.nome)?.setEffectiveWeight(0);a.tiro=null;a.fade=null}
    a.reaction=reaction;
    const placementAt=a.rootBreaks.findLast(c=>c.after<=frame.time)?.after??-Infinity;
    const plan=activePlan(a,frame.time),facingPlan=frame.ball.heldBy===p.key&&plan?.t<frame.time-1e-6?(agenda.find(it=>it.key===p.key&&it.hands&&it.kind==='toque'&&it.t>frame.time&&it.t-frame.time<.8)??plan):plan,name=planName(facingPlan),aim=facingPlan?.dir!=null?facingPlan.dir-(CONTATO[name]?.ang??0):a.rumo
    const target0=bodyTrack(a,frame.time),role=roleOffset(a,p.key),target={x:target0.x+role.x,z:target0.z+role.z},nav=navInfo.positions.get(p.key)??{x:0,z:0},base=p.sourceAnchor??{x:p.mx,z:p.mz}
    a.corrAlvo=target;a.corr={x:target.x+nav.x,z:target.z+nav.z}
    if(reset||frame.placementReset){a.ultimo=null;a.contactHistory=null;a.mergulhou=false;a.lances.clear();if(a.tiro){a.acao(a.tiro.nome)?.setEffectiveWeight(0);a.tiro=null}if(a.fade){a.acao(a.fade.nome)?.setEffectiveWeight(0);a.fade=null}}
    const px=base.x+a.corr.x,pz=base.z+a.corr.z
    const agora=frame.time,ult=a.ultimo,dx=ult&&dt>0?px-ult.x:0,dz=ult&&dt>0?pz-ult.z:0,salto=Math.hypot(dx,dz)>2.5;a.ultimo={x:px,z:pz}
    a.stepDistance=Math.hypot(dx,dz);a.unplannedJump=salto&&!reset&&!frame.placementReset&&!['gol','fim','saida','falta','lateral','escanteio','penalti','tiro-de-meta'].includes(frame.phase);
    a.actualTravelSpeed=dt>0&&!salto?Math.hypot(dx,dz)/dt:0;
    const shownBall=frame.ball.presentation??frame.ball,loose=a.controls.find(s=>s.loose&&agora>=s.start&&agora<=s.end);
    const vel=dt>0&&!salto?Math.min(9,Math.hypot(dx,dz)/dt):0,comBola=frame.owner===p.key&&!p.keeper&&!loose&&shownBall.y<.45&&Math.hypot(shownBall.x-px,shownBall.z-pz)<.9
    // pra onde o CORPO olha (27/10, Diego: "completamente perdidos… desgovernados"): quem se MEXE olha pra onde vai, como gente de
    // verdade; só quem está quase parado vira pra bola (passinho de lado/de costas só aí). Com folga entre os dois limites, senão o
    // corpo ficava trocando de frente a cada passo
    const bx=shownBall.x-px,bz=shownBall.z-pz,praBola=Math.atan2(bx,bz),praOnde=vel>.3?Math.atan2(dx,dz):p.heading
    // A dead-ball placement already resets the stance and position. Do not
    // carry the old goal/dive heading into the new formation, then turn late.
    if(frame.placementReset)a.rumo=p.keeper?praBola:p.heading;
    if(vel>1.7||comBola)a.olhaBola=false;else if(vel<.8)a.olhaBola=true
    const holdIntent=(a.tiro?.kind==='recebe'&&!p.keeper) ? .12 : /^passe/.test(a.tiro?.nome??'') ? .22 : .4;
    const antecipa=facingPlan?.dir!=null&&facingPlan.t-agora<.8&&agora>=Math.max(facingPlan.start??facingPlan.t-.8,facingPlan.t-.8);const mirando=antecipa||a.tiro?.mira!=null&&agora-a.tiro.t0<(a.tiro.touch??toque(a.tiro.nome))+holdIntent
    const activeDive=p.mergulho&&!plan&&a.tiro&&/^gk_(voo|bloqueio|pega)/.test(a.tiro.nome);
    const alvo=reaction?.lock>.5?reaction.anchor.heading:activeDive?a.rumo:mirando?(antecipa?aim:a.tiro.mira):loose?loose.intent:(p.keeper||a.olhaBola&&Math.hypot(bx,bz)<45)?praBola:praOnde
    const actionPose=footballActionTrack.sample(p.key,frame.time);const planned=!p.keeper&&!reaction&&(actionPose.contactAt??Infinity)>=placementAt&&actionPose.phase!=='locomotion';const giro=angulo(alvo-a.rumo),controlIntent=!reaction&&!p.keeper?a.rootPlan.controlledFacing?.(agora):null;if(controlIntent){a.rumo=stableActionFacing(a.rumo,controlIntent.heading,controlIntent.contactHeading,controlIntent.contactAt-agora,dt)}else if(planned){const intent=actionPose.heading-(CONTATO[name]?.ang??0),travel=vel>.1?Math.atan2(dx,dz):intent,freedom=actionTravelFreedom({speed:vel,travel,intent,phase:actionPose.phase,elapsed:frame.time-(actionPose.contactAt??frame.time),weight:reset||firstFrame?1:activeCapturedAction(agenda,p.key,agora)?.id===a.tiro?.planId?(a.actionWeight??1):0});const desired=intent+angulo(travel-intent)*freedom,remaining=(actionPose.contactAt??-1)-frame.time,contactHeading=remaining>=0?footballActionTrack.sample(p.key,actionPose.contactAt).heading-(CONTATO[name]?.ang??0):NaN;a.rumo=stableActionFacing(a.rumo,desired,contactHeading,remaining,dt);}else a.rumo+=dt>0?T.MathUtils.clamp(giro*(1-Math.exp(-dt/(mirando?.10:.18))),-7*dt,7*dt):giro;a.footballPhase=actionPose.phase
    a.holder.position.set(px,0,pz);a.holder.rotation.set(0,a.rumo,0)
    // ── lances: o motor diz quem fez o quê; o corpo mostra ──
    // (pé e cabeça: pela PREVISÃO — o movimento começa antes, e o contato dele cai no instante em que a bola sai)
    const capture=activeCapturedAction(agenda,p.key,agora);
    for(const it of capture&&capture.t>=placementAt?[capture]:[]){if(reaction)break;
     const nome=it.nome,ini=it.start;
     if(a.tiro?.planId===it.id)continue
     // Replay/seek uses the same planned capture and exact contact clock.
     if(a.tiro?.planId&&a.tiro.contactAt>=agora-.04&&a.tiro.contactAt<it.t)continue
     dispara(a,nome,{inicio:Math.max(0,agora-ini),agora,ate:it.kind==='recebe'?toque(nome)+.45:Infinity,mira:it.mira,ponto:true})
     a.tiro.base=it.clipStart;a.tiro.dur=it.clipEnd-it.clipStart;a.tiro.touch=it.t-it.start;a.tiro.planId=it.id;a.tiro.kind=it.kind;a.tiro.contactAt=it.t;a.tiro.extraRise=it.extraRise??0;a.tiro.pose=it.contact;a.tiro.blendIn=(it.hands||it.goleiro) ? Math.min(.18,Math.max(.025,(it.t-it.start)*.45)) : .12
     if(it.timing)Object.assign(a.tiro,{dur:it.timing.duration,touch:it.timing.touch,captureTouch:it.timing.captureTouch,preRate:it.timing.preRate,followRate:it.timing.followRate});
    }
    for(const e of recentes){const id=e.tipo+e.t;if(reaction||a.lances.has(id))continue
     const nomeP=p.name
     // Foul reactions use the complete, contact-checked timeline above.
     // Names alone are ambiguous when both clubs field the same legend.
     const author=e.a===nomeP&&(e.lado===0)===(p.side==='home');
     if(e.tipo==='carrinho'&&author){a.lances.add(id);const choice=secondaryFootballAction(e,{capture,plannedAction:a.tiro?.planId});const row={key:p.key,t:e.t,...choice},seen=secondaryDecisions.findIndex(c=>c.key===p.key&&c.t===e.t);if(seen>=0)secondaryDecisions[seen]=row;else secondaryDecisions.push(row);if(secondaryDecisions.length>80)secondaryDecisions.shift();if(choice.clip)dispara(a,choice.clip,{inicio:0,agora})}
     else if(e.tipo==='drible'&&author){
      a.lances.add(id);const point=new T.Vector3(shownBall.x,shownBall.y,shownBall.z),footGap=Math.min(a.surface.probe(point,'left').gap,a.surface.probe(point,'right').gap);
      const choice=selectDribblePresentation(e,{busy:!!capture||!!a.tiro?.planId,owned:frame.owner===p.key,distance:Math.hypot(bx,bz),footGap,height:shownBall.y,bodyPlan:bodyFeints.plans.some(c=>c.key===p.key&&Math.abs(c.t-e.t)<1e-6)});
      const decision={key:p.key,t:e.t,technique:e.golpe,...choice},seen=dribbleDecisions.findIndex(c=>c.key===p.key&&c.t===e.t);if(seen>=0)dribbleDecisions[seen]=decision;else dribbleDecisions.push(decision);if(dribbleDecisions.length>80)dribbleDecisions.shift();
      if(choice.clip)dispara(a,choice.clip,{inicio:.05,agora});
     }
     else if(e.tipo==='gol'&&e.a&&String(e.a).startsWith(nomeP)&&(e.lado===0)===(p.side==='home')){a.lances.add(id)
      let h=0;for(const ch of String(e.a))h=(h*31+ch.charCodeAt(0))|0;const n='comemora'+(1+Math.abs(h+Math.floor(e.t*10))%3)
      if(asset.clips.has(n))dispara(a,n,{inicio:0,agora})}}
    if(p.mergulho&&agenda.some(it=>it.key===p.key&&!it.disabled&&(it.save||it.goleiro)&&agora>=it.start&&agora<=it.t+.35))a.mergulhou=true;
    if(p.mergulho&&!a.mergulhou){a.mergulhou=true;const m=p.mergulho,mx=m.x-(m.ax??p.mx),mz=m.z-(m.az??p.mz),len=Math.hypot(mx,mz)
     const collection=agenda.find(it=>it.key===p.key&&it.goleiro&&it.t>agora-1.2&&it.t-agora<1);
     const direita=(mx*-Math.cos(a.rumo)+mz*Math.sin(a.rumo))>0
     const nome=m.vertical||(len<=.6&&m.y>1.2)?'gk_pega_alto':len<.9?(m.y<.6?'gk_pega_baixo':'gk_pega'):len<1.7&&m.y<.8?(direita?'gk_bloqueio_d':'gk_bloqueio_e'):direita?'gk_voo_d':'gk_voo_e'
     // (o mergulho do motor chega no ponto em ~0,42 s: o voo do Mixamo encosta na bola no `toque` dele)
     if(collection&&agora<collection.start){
      // A nearby rebound pickup has no time for a complete dive and stand-up.
      // Use the existing standing reach, without attaching the ball or adding
      // a save event. The collection still requires its measured hand contact.
      dispara(a,m.y>.9?'gk_pega':'gk_pega_baixo',{inicio:Math.max(0,agora-(collection.t-.75)),agora,ate:.75,mira:collection.mira});a.tiro.reactionOnly=true;
     }else if(!collection)dispara(a,nome,{inicio:Math.max(0,toque(nome)-.42*(1-m.k)),agora})}
    if(!p.mergulho)a.mergulhou=false
    if(a.lances.size>40)a.lances=new Set([...a.lances].slice(-20))
    // Keep contact sampling and animation time independent of camera culling.
    // ── corrida: 8 direções em fase comum, peso pela velocidade ──
    const fw=vel>.05?angulo(Math.atan2(dx,dz)-a.rumo):0,lado=-fw // (+ = pra direita do corpo; o eixo do three gira ao contrário)
    const direction=((lado%(2*Math.PI))+2*Math.PI)%(2*Math.PI),di=Math.floor(direction/(Math.PI/4))%8,du=easedBlend(direction/(Math.PI/4)-di);
    const gaitName=i=>DIRS[i][1]==='trote'&&comBola?'conduz':DIRS[i][1],n0=gaitName(di),n1=gaitName((di+1)%8);
    const walkWeight=!comBola&&Math.abs(fw)<.5?1-T.MathUtils.smoothstep(vel,1.35,2.65):0;
    const stride=(gaits[n0].distance*(1-du)+gaits[n1].distance*du)*(1-walkWeight)+gaits.caminhada.distance*walkWeight;
    a.fase=(a.fase+(dt>0?Math.min(3.6,vel/stride)*dt:0))%2;
    if(capture?.verifiedGroundTouch&&Math.abs(agora-capture.t)<1e-6)a.fase=gaitPhaseAtContact(gaits.conduz,capture.rawTouch??rawTouch(capture.nome));
    const anda=T.MathUtils.smoothstep(vel,.25,1.1),segura=p.keeper&&frame.ball.y>.6&&frame.ball.y<1.6&&Math.hypot(bx,bz)<1.3
    const parado=p.keeper?(frame.ball.heldBy===p.key||segura?'gk_idle_bola':'gk_idle'):(comBola?'idle_bola':'idle')
    const alvos=new Map(LOOPS.map(n=>[n,0]));alvos.set(parado,1-anda)
    alvos.set(n0,alvos.get(n0)+anda*(1-du)*(1-walkWeight));alvos.set(n1,alvos.get(n1)+anda*du*(1-walkWeight));alvos.set('caminhada',anda*walkWeight)
    // lance por cima: o tempo do movimento é o relógio do jogo (pausa e replay param junto)
    let wTiro=0
    if(a.tiro){const t=agora-a.tiro.t0,act=a.acao(a.tiro.nome)
     if(t<0||t>a.tiro.dur){act.setEffectiveWeight(0);a.tiro=null}
     else{wTiro=contactBlend(t,a.tiro.dur,a.tiro.touch??Math.min(a.tiro.dur*.6,.5),a.tiro.blendIn??.12);act.time=capturedActionTime(a.tiro,t);act.setEffectiveWeight(wTiro)}}
    a.footProximity=1;
    if(a.tiro&&!reaction){
     const near=Number.isFinite(a.tiro.contactAt)?1-T.MathUtils.smoothstep(Math.abs(agora-a.tiro.contactAt),.025,.13):0,alignment=1-T.MathUtils.smoothstep(Math.abs(fw),.75,1.7),compatible=vel<.8?1:alignment;
     if(a.tiro.planId){const off=a.tiro.pose?.off;a.footProximity=footActionProximity({kind:a.tiro.kind,region:a.tiro.pose?.region,time:agora,contactAt:a.tiro.contactAt,distance:Math.hypot(bx,bz),reach:off?Math.hypot(off.x,off.z):.4})}
     wTiro*=Math.max(near,compatible)*a.footProximity;a.acao(a.tiro.nome).setEffectiveWeight(wTiro);
    }a.actionWeight=wTiro;a.travelAngle=fw;
    let wFade=0;if(a.fade){const old=a.acao(a.fade.nome),u=T.MathUtils.clamp((agora-a.fade.fadeAt)/(a.tiro?.blendIn??.12),0,1);if(u>=1||!old){old?.setEffectiveWeight(0);a.fade=null}else{wFade=(1-wTiro)*a.fade.weight*(1-u);old.time=capturedActionTime(a.fade,Math.min(a.fade.dur,Math.max(0,agora-a.fade.t0)));old.setEffectiveWeight(wFade)}}
    if(reaction){wTiro=reaction.weight;for(const pose of reaction.clips){const act=a.acao(pose.name);act.play();act.enabled=true;act.timeScale=0;act.setLoop(T.LoopOnce,1);act.clampWhenFinished=true;act.time=pose.time;act.setEffectiveWeight(pose.weight)}}
    const k=dt>0?1-Math.exp(-dt/.15):1
    for(const n of LOOPS){const act=a.acao(n);if(!act)continue;const w0=a.pesos.get(n)??0,w=w0+((alvos.get(n)??0)-w0)*(reset?1:k);a.pesos.set(n,w);act.setEffectiveWeight(w*Math.max(0,1-wTiro-wFade));const dur=act.getClip().duration;act.time=gaits[n]?gaitTime(gaits[n],a.fase):agora%dur}
    const feint=sampleBodyFeint(bodyFeints.plans,p.key,agora,{owned:frame.owner===p.key,distance:Math.hypot(bx,bz),height:shownBall.y,blocked:!!capture||!!a.tiro||!!reaction});
    const bodyAction=a.acao('finta_corpo');bodyAction.play();bodyAction.timeScale=0;bodyAction.setLoop(T.LoopOnce,1);bodyAction.clampWhenFinished=true;
    bodyAction.setEffectiveWeight(feint?.weight??0);if(feint){const mark=bodyFeintClip.userData.capturedTorso.peakTime;bodyAction.time=feint.progress<=1?mark*feint.progress:mark+(bodyFeintClip.duration-mark)*(feint.progress-1)}a.bodyFeint=feint;
    a.mixer.update(0)
    applyContactLean(a,agora)
    // Small balance/gaze corrections supplement captured movement outside actions.
    if(!plan&&!reaction&&!a.tiro&&!p.keeper){
     const acceleration=dt>0&&dt<.25?(vel-(a.balanceSpeed??vel))/dt:0;
     const lean=T.MathUtils.clamp(acceleration*.005,-.035,.035)*Math.cos(fw);
     a.balanceLean=(a.balanceLean??0)+(lean-(a.balanceLean??0))*(dt>0?1-Math.exp(-dt/.18):1);
     a.bones.get('mixamorigSpine')?.rotateX(a.balanceLean*.6);a.bones.get('mixamorigSpine1')?.rotateX(a.balanceLean*.4);
     const look=T.MathUtils.clamp(angulo(praBola-a.rumo),-.35,.35)*(comBola?.3:vel<2?.8:.35);
     a.gaze=(a.gaze??0)+(look-(a.gaze??0))*(dt>0?1-Math.exp(-dt/.18):1);a.bones.get('mixamorigHead')?.rotateY(a.gaze);
    }else{a.balanceLean=0;a.gaze=0}a.balanceSpeed=vel;
    const officiating=referee.cueAt(agora);if(!reaction&&officiating?.waiting&&officiating.taker===p.key&&agora>officiating.since+.2){const R=frame.referee;if(R)a.bones.get('mixamorigHead').rotateY(T.MathUtils.clamp(angulo(Math.atan2(R.x-px,R.z-pz)-a.rumo),-.45,.45)*officiating.weight)}
    a.holder.updateMatrixWorld(true);const groundedKeeper=/^gk_(recolhe|pega|rola|lanca)/.test(a.tiro?.nome??''),rawFloor=a.surface.floor(groundedKeeper),floorBudget=groundedKeeper?.16:.08;a.holder.position.y+=Math.max(0,Math.min(floorBudget,.003-rawFloor))
    if(a.tiro?.extraRise){const capturedFlight=Math.max(0,rawFloor),height=a.tiro.pose?.feetHeight??.3;a.holder.position.y+=a.tiro.extraRise*T.MathUtils.clamp(capturedFlight/Math.max(.05,height),0,1)*wTiro}
    if(a.fade?.extraRise)a.holder.position.y+=a.fade.extraRise*wFade;
    // Keep the striking limb and every calibrated impact untouched. Only the
    // support foot / gait receives bounded residual IK, on the original rig.
    const excluded=[],contactSide=a.tiro?.pose?.region;
    if(['left','right'].includes(contactSide))excluded.push(contactSide);
    const passingSupport=a.tiro&&/^passe_(movimento|chapa)/.test(a.tiro.nome)&&['left','right'].includes(contactSide);
    if(plan&&Math.abs(plan.t-agora)<.09&&!passingSupport)excluded.push('left','right');
    const plantingBall=frame.ball.presentation??frame.ball;
    for(const side of ['left','right']){const foot=a.bones.get('mixamorig'+(side==='left'?'Left':'Right')+'Foot').getWorldPosition(new T.Vector3()),ballPoint=new T.Vector3(plantingBall.x,plantingBall.y,plantingBall.z);if(foot.distanceTo(ballPoint)<.38){const safeSupport=passingSupport&&side!==contactSide&&a.surface.probe(ballPoint,side).gap>.02;if(!safeSupport)excluded.push(side)}}
    a.plants=a.grounding.apply(a,agora,{reset:reset||!!frame.placementReset||salto,excluded,airborne:!!reaction||groundedKeeper||/^(cabeca|gk_voo|gk_pega_alto|carrinho|cai|levanta|bicicleta|giro)/.test(a.tiro?.nome??'')});
    // Surface clearance is bounded to ten centimetres on the original rig.
    // It moves the limb only; the ball never follows a corrective IK target.
    if(!frame.replay&&!frame.restart&&(comBola||plan&&Math.abs(plan.t-agora)<.09)){
     a.holder.updateMatrixWorld(true);const B=frame.ball.presentation??frame.ball;
     if(B.y<.4)for(const side of ['left','right']){
      const toe=a.bones.get('mixamorig'+(side==='left'?'Left':'Right')+'ToeBase').getWorldPosition(new T.Vector3());
      if(toe.distanceTo(new T.Vector3(B.x,B.y,B.z))<.38)a.surface.clearBall(new T.Vector3(B.x,B.y,B.z),side);
     }
    }
    if(plan?.kind==='recebe'&&(plan.hands||plan.goleiro)&&agora<=plan.t+1e-6&&plan.t-agora<.14){a.handReach=reachCapturedHandContact(a,frame.ball.presentation??frame.ball)}else a.handReach=null;
    // The incoming rebound remains on its fixed trajectory. Correct only the
    // residual arm overlap just before collection; the calibrated impact stays
    // untouched and is still required before the ball can attach.
    if(plan?.goleiro&&agora<plan.t-1e-5&&plan.t-agora<.09){const B=frame.ball.presentation??frame.ball,point=new T.Vector3(B.x,B.y,B.z);for(const side of ['left','right'])a.surface.clearHand(point,side)}
    if(a.tiro?.kind==='defende'&&agora>a.tiro.contactAt+1e-5&&agora-a.tiro.contactAt<.15){const B=frame.ball.presentation??frame.ball,point=new T.Vector3(B.x,B.y,B.z);for(const side of ['left','right'])a.surface.clearHand(point,side,{includeArm:true})}
   }
   for(const a of atores)if(!usados.has(a))a.holder.visible=false
   soleShadows.update(shadowActors);
   // Hands attach only after a measured catch/pickup (or a verified seek restore).
   // Foot deliveries have fixed endpoints; live feet never attract the ball.
   visualBall=groundBall;
   const throwIn=agenda.find(it=>it.pickup&&frame.time>=it.t-1e-7&&frame.time<=(agenda.find(o=>o.id===it.id.slice(7))?.t??it.t)+1e-7),held=frame.ball.heldBy??throwIn?.key,keeper=held?atores.find(a=>a.key===held):null;
   if(keeper){
    const catchCue=agenda.findLast(it=>it.key===held&&(it.goleiro||it.pickup)&&it.t<=frame.time+.001),releaseCue=catchCue&&agenda.find(it=>it.key===held&&it.hands&&it.kind==='toque'&&it.t>catchCue.t),bone=keeper.bones.get(catchCue?.contact?.handBone??'mixamorigRightHand'),local=catchCue?.contact?.handLocal;
    const anchor=local?bone.localToWorld(new T.Vector3(...local)):bone.getWorldPosition(new T.Vector3()),shot=keeper.tiro,throwing=shot&&(/^gk_(rola|lanca)/.test(shot.nome)||shot.nome==='lateral'),transfer=throwing?T.MathUtils.smoothstep(frame.time,Math.max(shot.t0,shot.contactAt-.35),shot.contactAt):0;
    if(releaseCue?.contact?.handLocal)anchor.lerp(keeper.bones.get(releaseCue.contact.handBone??'mixamorigRightHand').localToWorld(new T.Vector3(...releaseCue.contact.handLocal)),transfer);
    if(!handState||handState.key!==held||reset){const catchCue=agenda.findLast(it=>it.key===held&&(it.goleiro||it.pickup)&&it.t<=frame.time+.001),B=frame.ball.presentation??frame.ball,gap=anchor.distanceTo(new T.Vector3(B.x,B.y,B.z));
     const point=new T.Vector3(B.x,B.y,B.z);
     // Correct a small finger penetration by moving the limb, never the free ball.
     if(catchCue?.contact?.fitted&&gap<.25)for(const side of ['left','right']){const g=keeper.surface.probe(point,side+'Hand').gap;if(g<-.002&&g>-.06)keeper.surface.clearHand(point,side,{maxCorrection:.06,maxAngle:.25})}
     const surfaceGap=Math.min(keeper.surface.probe(point,'leftHand').gap,keeper.surface.probe(point,'rightHand').gap);
     const restore=(reset||firstFrame)&&catchCue?.contact?.fitted&&Math.hypot(catchCue.root.x,catchCue.root.z)<=(catchCue.rootBudget??3);if(catchCue&&catchCue.contact.fitted&&(gap<.25&&surfaceGap>=-.025&&surfaceGap<=.03||restore)){handState={key:held,t:frame.time,offset:point.sub(anchor),catchGap:restore?null:gap,restored:!!restore,release:agenda.find(it=>it.key===held&&it.hands&&it.kind==='toque'&&it.t>catchCue.t)};if(restore)handState.offset.set(0,0,0)}
    }
    if(handState?.key===held){anchor.addScaledVector(handState.offset,1-T.MathUtils.smoothstep(frame.time,handState.t,handState.t+.12));
     // After a verified catch, constrain the held sphere to the carrying glove.
     // Blending two palm anchors can cut through the skinned fingers. This
     // bounded clearance is only for an already held ball, never an attraction
     // of an incoming/free ball or a change to its official path.
     const carrying=bone.name.includes('Left')&&transfer<.5?'left':'right',palm=keeper.surface.probe(anchor,carrying+'Hand');
     if(palm.gap<-.002&&palm.gap>-.06)anchor.addScaledVector(anchor.clone().sub(palm.surface).normalize(),-palm.gap+.001);
     visualBall={x:anchor.x,y:anchor.y,z:anchor.z};
     keeper.surface.clearHand(anchor,carrying==='left'?'right':'left');handState.last={...visualBall};handState.lastTime=frame.time}
   }else if(handState){
    const release=handState.release;
    if(release&&frame.time>=release.t&&frame.time-release.t<.12){handFlight=handArc(release);
     // Some official releases remove heldBy on the impact frame, others on the
     // next sample. In both cases release from the actual glove, including the
     // remaining body turn of a quick throw, rather than its ideal future pose.
     if(Math.abs(frame.time-release.t)<1e-5&&release.contact.handLocal){const actor=atores.find(a=>a.key===release.key),bone=actor.bones.get(release.contact.handBone),point=bone.localToWorld(new T.Vector3(...release.contact.handLocal));actor.surface.clearHand(point,bone.name.includes('Right')?'left':'right');handFlight.start={x:point.x,y:point.y,z:point.z}}
     else if(handState.last&&Math.abs(handState.lastTime-release.t)<1e-5)handFlight.start={...handState.last}
    }
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
   verifyClearanceWarnings(atores,navInfo?.diagnostics);separateContactBodies(atores,navInfo?.diagnostics,{time:frame.time});observeContacts(frame,dt,reset);for(const a of atores)a.updateFrustumBounds?.()
  };
 return{
  update(frame,camera,viewportHeight=720){
   if(disposed)return;
   referee.update(frame);
   for(const time of resilientContactSteps(agenda,lastTime,frame.time)){updateFrame(contactFrame(frame,time,timeline),camera,viewportHeight);contactSubsteps++}
   updateFrame(frame,camera,viewportHeight);
  },
  presentFrame:frame=>({...frame,referee:referee.frame(frame.referee),ball:{...frame.ball,presentation:visualBall??frame.ball.presentation,rotation:visualRotation??frame.ball.rotation}}),
  cameraSubjects:()=>atores.map(a=>({key:a.key,mx:a.holder.position.x,mz:a.holder.position.z,visible:a.holder.visible,side:a.side,keeper:a.keeper})),
  prepared:()=>Promise.resolve(null),
  debug:()=>({prepared:true,duration:timeline.duration,ft:lastTime,agenda:agenda.map(({key,...o})=>({k:key,...o})),medidas}),
  inspect:()=>({...inspection,style:'fullbody-chibi-match',design:asset.design,actors:atores.length,legends:frame.players.filter(p=>state.officialInput[p.side==='home'?'casa':'fora'].find(c=>c.name===p.name)?.fame>=5).map(p=>p.name),football:{motionRevision:'chibi-career-fundamentals-27',groundArrivalTails,groundControlTracks:atores.flatMap(a=>(a.rootPlan.diagnostics.groundControlTracks??[]).map(p=>({key:a.key,...p}))),receptionTangents:atores.flatMap(a=>(a.rootPlan.diagnostics.receptionTangents??[]).map(p=>({key:a.key,...p}))),groundReceptionAdjustments:agenda.filter(e=>e.receptionDelay).map(e=>({key:e.key,assignedAt:e.assignedAt,contactAt:e.t,delay:e.receptionDelay,nativeGap:e.nativeContactGap})),sourceGroundTouches:timeline.groundTouches,controlledApproaches:atores.flatMap(a=>(a.rootPlan.diagnostics.controlledApproaches??[]).map(p=>({key:a.key,...p}))),dribbleCapturePlan,verifiedRootRecoveries:atores.flatMap(a=>(a.rootPlan.diagnostics.verifiedRecoveries??[]).map(r=>({key:a.key,...r}))),looseRecoveries:atores.flatMap(a=>(a.possessionPath?.pursuits??[]).map(p=>({key:a.key,...p}))),secondaryActions:secondaryDecisions.slice(),dribbles:dribbleDecisions.slice(),bodyFeints:{plans:bodyFeints.plans,skipped:bodyFeints.skipped,active:atores.filter(a=>a.bodyFeint).map(a=>({key:a.key,...a.bodyFeint}))},collective:collectiveInfo,motionQuality:atores.map(a=>({key:a.key,speed:a.actualTravelSpeed??0,angle:a.travelAngle??0,angleRadians:a.travelAngle??0,angleDegrees:(a.travelAngle??0)*180/Math.PI,stepDistance:a.stepDistance??0,unplannedJump:!!a.unplannedJump,weight:a.actionWeight??0,clip:a.tiro?.nome??null})),actionController:'planned-decision-preparation-contact-recovery',refinements:{contactPreservingBlend:true,closeBallControl:.9,easedDirectionalBlend:true,clipSelection:'contextual'},variety:agenda.filter(a=>a.kind==='toque').map(a=>({time:a.t,type:a.tipo,clip:a.nome,style:a.variation?.style,adaptation:a.variation?.adaptation,preparation:a.variation?.preparation,height:a.variation?.heightBand,power:a.variation?.powerBand,trajectory:a.variation?.trajectory,curveRate:a.variation?.curveRate,preparationSeconds:a.timing?.touch,followThroughSeconds:a.timing?a.timing.duration-a.timing.touch:null})),diagnostics,handReach:atores.filter(a=>a.handReach?.applied).map(a=>({key:a.key,...a.handReach})),contactSubsteps,referee:referee.inspect(),fouls:{planned:foulReactions.plans.map(p=>({key:p.key,t:p.t,end:p.end,rate:p.rate,clips:p.clips.map(c=>c.name)})),skipped:foulReactions.skipped,active:atores.filter(a=>a.reaction).map(a=>({key:a.key,clips:a.reaction.clips,lock:a.reaction.lock}))},grounding:atores.flatMap(a=>(a.plants??[]).filter(p=>p.applied).map(p=>({key:a.key,...p}))),spin:spin?.inspect(),controlledIntervals:controlSpans.length,groundDeliveries:groundFlights.length-controlSpans.length,handContact:handState?{key:handState.key,gap:handState.catchGap}:null,handFlight:handFlight?{start:handFlight.t,end:handFlight.end}:null,navigation:navInfo?.diagnostics,preparedBytes:timeline.bytes,actions:atores.filter(a=>a.tiro).map(a=>({key:a.key,tiro:a.tiro,plan:activePlan(a,lastTime),contact:CONTATO[a.tiro.nome],target:a.corrAlvo,root:a.corr,heading:a.rumo})),mode:bola.modo,touches:bola.toques,contacts:medidas.slice(),corrections:atores.filter(a=>Math.hypot(a.corr.x,a.corr.z)>.01).map(a=>({key:a.key,x:a.corr.x,z:a.corr.z}))}}),
  inspectActors:()=>({slots:atores.map((a,slot)=>({slot,key:a.key,heading:a.rumo,visible:a.holder.visible,detail:a.detail,tiro:a.tiro?.nome??null}))}),
  dispose(){if(disposed)return;disposed=true;referee.dispose();soleShadows.dispose();for(const a of atores)a.dispose()},
 }
}
