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
import {identidadeAtleta3D} from '../presidencia-futebol-identidade.ts'
import {peDe} from '../campo2d-estilos.ts'
import {RAIO_BOLA_FUTEBOL_3D} from '../presidencia-bola-rotacao.ts'
import {bootContact,advanceApproach,approachTarget} from './motion/map-contact.mjs'
import {solveLimbContact} from './motion/contact-ik.mjs'

// velocidade (m/s) em que cada corrida do Mixamo foi gravada, por ciclo — o passo acompanha o chão sem patinar
const CICLO_M=2.9
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
 const original=await carregaJogadorNovo()
 // Measured on the supplied rig: peak whole-foot speed was 42 ms AFTER the
 // ground strike (toe already 29 cm high). Keep shared imported clips intact.
 const asset={...original,meta:{...original.meta,clips:{...original.meta.clips,chute_forte:{...original.meta.clips.chute_forte,toque:2.5833333333333},conduz:{...original.meta.clips.conduz,toque:2/3,pe:'r'}}}}
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
  atores.push(ator)
 }
 // 🦶 ONDE e PRA ONDE o pé (ou a cabeça) bate em cada movimento do Mixamo, medido no próprio boneco no instante do toque:
 // `off` = o ponto do contato em relação ao corpo (o pé do chute fica ~0,4 m à direita, não no meio) · `ang` = pra onde ele
 // varre (o chute correndo varre ~20° pra esquerda). O corpo se prepara para alcançar a trajetória oficial da bola.
 const CONTATO={}
 {const a0=atores[0],osso=n=>{let r;a0.root.traverse(o=>{if(o.isBone&&o.name.toLowerCase().includes(n))r??=o});return r}
  const pes={r:osso('righttoe')??osso('rightfoot'),l:osso('lefttoe')??osso('leftfoot')},cabeca=osso('head'),peito=osso('spine2')
  const local=o=>a0.holder.worldToLocal(o.getWorldPosition(new T.Vector3()))
  const p0=a0.holder.position.clone(),r0=a0.holder.rotation.y;a0.holder.position.set(0,0,0);a0.holder.rotation.set(0,0,0)
  for(const nome of ['conduz','chute','chute_corrida','passe','passe_curto','cavadinha','cabeca2','dominio','peito','passe_chapa','chute_forte'].flatMap(n=>[n,n+'_e'])){const act=a0.acao(nome),m=asset.meta.clips?.[nome.replace(/_e$/,'')];if(!act||!m)continue
   const lado=nome.endsWith('_e')?(m.pe==='l'?'r':'l'):(m.pe??'r'),alto=/^(cabeca2|peito)/.test(nome),o=nome.startsWith('cabeca2')?cabeca:nome.startsWith('peito')?peito:pes[lado];if(!o)continue
   const pose=t=>{act.reset();act.play();act.setEffectiveWeight(1);act.time=t;a0.mixer.update(0);a0.holder.updateMatrixWorld(true);return local(o)}
   for(const n of LOOPS)a0.acao(n)?.setEffectiveWeight(0)
   const antes=pose(Math.max(0,m.toque-.03)),em=pose(m.toque)
   const varre=alto||nome.startsWith('dominio')?0:Math.atan2(em.x-antes.x,em.z-antes.z)
   // (cabeça e peito: a bola encosta um palmo À FRENTE do osso, não dentro dele)
   CONTATO[nome]={off:{x:em.x,y:em.y,z:em.z+(alto?.16:.14)},alto,ang:Math.abs(varre)<1?varre:0};act.setEffectiveWeight(0);act.stop()}
  a0.holder.position.copy(p0);a0.holder.rotation.y=r0}
 let disposed=false,lastTime=null,inspection={full:0,intermediate:0,far:0,hidden:0,tiros:0}
 // 🔮 OLHAR ADIANTE (o motor avança em MINUTOS de jogo — 93 em 90 s —, e o desenho e os lances andam em segundos): uma cópia do MESMO motor (mesma semente: o mesmo jogo) roda ~1 s à frente do desenho. Assim o corpo sabe que
 // VAI chutar/passar/cabecear antes de a bola sair e começa o movimento a tempo do pé (ou a cabeça) bater na bola no instante certo;
 // e sabe quem vai RECEBER a bola, pra fazer o domínio quando ela chega. Só apresentação: o placar continua do motor oficial.
 const {novoMotor2}=await import('../motor2/carreira.ts')
 const chaveDe=at=>identidadeAtleta3D(at.lado===0?'home':'away',at.nome,at.carta?.club,at.carta?.year)
 const ADIANTE=1.8,agenda=[];let prev=null,prevAte=0,ultLance=null,ultDono=null,previousForecastBall=null
 const observa=()=>{const b=prev.bola,l=b.lance
  if(l){const k=l.tipo+':'+l.de.id+':'+l.t0;if(k!==ultLance){ultLance=k;agenda.push({key:chaveDe(l.de),kind:'toque',tipo:l.tipo,golpe:l.golpe,t:l.t0,cab:l.tipo==='cabeceio'||l.tipo==='cabeceio_gol'||l.golpe==='cabeca',longe:l.para?Math.hypot(l.para.x-b.x,l.para.y-b.y):30,dir:Math.hypot(b.vx,b.vy)>.5?Math.atan2(b.vy,b.vx):null,ponto:{x:b.x-b.vx*(prev.t-l.t0),y:b.y-b.vy*(prev.t-l.t0)},hands:previousForecastBall?.held||previousForecastBall?.restart==='lateral',bola:{x:b.y-b.vy*(prev.t-l.t0+.05)-52.5,y:prev.bolaAnt.h+RAIO_BOLA_FUTEBOL_3D,z:b.x-b.vx*(prev.t-l.t0+.05)-34},rec:{x:(l.de.ay??l.de.y)-52.5,z:(l.de.ax??l.de.x)-34}})}}
  const d=b.dono&&b.h<2.4?b.dono:null
  if(d&&d!==ultDono)agenda.push({key:chaveDe(d),kind:'recebe',t:prev.t,h:prev.bolaAnt.h,goleiro:d.grupo==='GOL',dir:previousForecastBall?Math.atan2(-previousForecastBall.vy,-previousForecastBall.vx):null,bola:{x:prev.bolaAnt.y-52.5,y:prev.bolaAnt.h+RAIO_BOLA_FUTEBOL_3D,z:prev.bolaAnt.x-34},rec:{x:(d.ay??d.y)-52.5,z:(d.ax??d.x)-34}})
  if(d&&d===ultDono&&!prev.gkMao&&b.h<.1&&previousForecastBall&&Math.hypot(b.vx,b.vy)>Math.hypot(d.vx,d.vy)*1.12&&Math.hypot(b.vx-previousForecastBall.vx,b.vy-previousForecastBall.vy)>.65){
   agenda.push({key:chaveDe(d),kind:'carry',t:prev.t,dir:Math.atan2(b.vy,b.vx),bola:{x:prev.bolaAnt.y-52.5,y:.11,z:prev.bolaAnt.x-34},rec:{x:(d.ay??d.y)-52.5,z:(d.ax??d.x)-34}})
  }
  ultDono=d;previousForecastBall={vx:b.vx,vy:b.vy,held:!!prev.gkMao,restart:prev.parada?.tipo}}
 const preve=ate=>{if(!state.officialInput)return
  if(!prev||ate<prevAte-.3){prev=novoMotor2(structuredClone(state.officialInput));prevAte=0;ultLance=null;ultDono=null;previousForecastBall=null;agenda.length=0}
  while(prevAte<ate){prevAte=Math.min(ate,prevAte+.05);prev.avancaAte(prevAte*93/90);observa()}
  while(agenda.length&&agenda[0].t<ate-ADIANTE-3)agenda.shift()}
 const bola={modo:'livre',dono:null,toques:0},medidas=[];let sourceBall=null,sourceVelocity=new T.Vector3()
 onPrepared?.()
 // um movimento de lance por cima da corrida: entra em 0,12 s, sai nos últimos 0,25 s
 const dispara=(a,nome,{inicio=0,agora,ate=Infinity,mira=null,ponto=null}={})=>{const c=asset.clips.get(nome);if(!c)return;if(a.tiro){a.acao(a.tiro.nome)?.setEffectiveWeight(0)}const act=a.acao(nome);act.reset();act.play();act.timeScale=0;act.setLoop(T.LoopOnce,1);act.clampWhenFinished=true;const tr=trecho(nome);a.tiro={nome,t0:agora-inicio,base:tr?.de??0,dur:Math.min(tr?tr.ate-tr.de:c.duration,ate),depois:nome.startsWith('cai')?'levanta':null,mira,bate:mira!==null||ponto!==null};inspection.tiros++}
 const toque=nome=>(asset.meta.clips?.[nome.replace(/_e$/,'')]?.toque??.4)-(trecho(nome)?.de??0) // (contado do começo do trecho)
 // 🎯 cabeçada é coisa de ÁREA (cruzamento, finalização, rebatida do zagueiro). O motor às vezes chama de "cabeceio" um passe alto
 // no meio-campo — ali o desenho mostra o toque com o pé (a bola desce até ele), nunca um passe de cabeça pro companheiro
 const naArea=b=>!!b&&Math.abs(b.x)>36&&Math.abs(b.z)<20.2
 const deCabeca=it=>it.cab&&(it.tipo==='cabeceio_gol'||naArea(it.bola))
 // Only the actor approaches. The ball and its spin stay on the authoritative
 // map frame, including goal/net and restart presentation already supplied there.
 const release=it=>it.kind==='toque'&&!it.hands&&!['conduz','drible','desvio','rebote','arrancada'].includes(it.tipo)
 const activePlan=(a,now)=>agenda.find(it=>it.key===a.key&&it.bola&&it.t>=now-.10&&it.t<now+1.2&&(release(it)||it.kind==='recebe'&&!it.goleiro&&!agenda.some(o=>o.key===it.key&&release(o)&&o.t>=it.t-.05&&o.t<it.t+.85)))??agenda.find(it=>it.key===a.key&&it.kind==='carry'&&it.t>=now-.08&&it.t<now+.45)
 const planName=it=>it?.nome??(it?.kind==='carry'?'conduz':it?.kind==='recebe'?(it.h>.9?'peito':'dominio'):deCabeca(it??{})?'cabeca2':CHUTES.has(it?.tipo)?'chute_forte':'passe_chapa')
 const footPositions=a=>a.pes.map(b=>b.getWorldPosition(new T.Vector3()))
 function observeContacts(frame,dt,reset){
  bola.modo='livre';bola.dono=null
  const B=frame.ball.presentation??frame.ball
  for(const a of atores){
   a.holder.updateMatrixWorld(true)
   const feet=footPositions(a),old=reset||!(dt>0)||dt>.1?null:a.contactHistory,hit=bootContact(B,feet,old)
   a.contactHistory={ball:{...B},feet};a.contactGap=hit.gap
   const owned=frame.owner===a.key&&!a.keeper&&!frame.restart&&!frame.replay
   if(owned&&hit.contact){bola.modo='contato';bola.dono=a}
   const plan=agenda.find(it=>it.key===a.key&&!it.measured&&it.t<=frame.time+1e-7&&it.t>=frame.time-.1&&release(it))
   if(plan){plan.measured=true;const aerial=deCabeca(plan);let measured=hit;if(aerial){const head=a.bones.get('mixamorigHead')?.getWorldPosition(new T.Vector3());if(head){const gap=head.distanceTo(new T.Vector3(B.x,B.y,B.z))-.24;measured={gap,contact:gap<=.025,swept:false}}}medidas.push({contactType:aerial?'head':'foot',t:frame.time,key:a.key,tipo:plan.tipo,nome:planName(plan),dist:measured.gap+(aerial?.24:.175),gap:measured.gap,confirmed:measured.contact,swept:measured.swept});if(measured.contact)bola.toques++}
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
    return
   }
   const dt=lastTime===null||frame.time<lastTime||frame.time-lastTime>1?0:frame.time-lastTime,reset=dt===0&&lastTime!==null&&frame.time!==lastTime;lastTime=frame.time
   inspection={full:0,intermediate:0,far:0,hidden:0,tiros:inspection.tiros}
   const acao=frame.officialAction,evs=frame.official?.events??[],usados=new Set()
   // eventos dos últimos 0,4 s, por nome do motor (o mesmo que o teatro do players.mjs usa)
   const recentes=[];for(let i=evs.length-1;i>=0;i--){const e=evs[i],idade=frame.time-e.t;if(idade>.4)break;if(idade>=0)recentes.push(e)}
   if(sourceBall&&dt>0&&!reset&&!frame.placementReset){const v=new T.Vector3(frame.ball.x-sourceBall.x,frame.ball.y-sourceBall.y,frame.ball.z-sourceBall.z).divideScalar(dt);if(v.length()<40)sourceVelocity.lerp(v,1-Math.exp(-dt/.06));else sourceVelocity.set(0,0,0)}else sourceVelocity.set(0,0,0)
   sourceBall={...frame.ball}
   if(!frame.replay)preve(frame.time+ADIANTE) // (no replay do gol o tempo volta: a previsão espera ele acabar)
   for(const p of frame.players){
    const a=atores.find(x=>x.key===p.key&&!usados.has(x))??atores.find(x=>!usados.has(x)&&x.side===p.side&&x.keeper===p.keeper&&!frame.players.some(q=>q.key===x.key));if(!a)continue;usados.add(a);a.key=p.key
    a.detail=p.visible===false?'hidden':camera?playerDetail(camera,{x:p.mx,y:0,z:p.mz},viewportHeight,a.detail):'full';inspection[a.detail]++
    a.holder.visible=a.detail!=='hidden'
    // deslocamento de verdade deste quadro (a velocidade do motor sozinha não sabe de cobrança/teleporte)
    // A aproximação visual do corpo também conta na distância da passada.
    const plan=frame.replay?null:activePlan(a,frame.time),name=planName(plan),aim=plan?.dir!=null?plan.dir-(CONTATO[name]?.ang??0):a.rumo
    let target=approachTarget(plan,CONTATO[name],aim,frame.time,plan?.kind==='carry'?.45:1.2)??{x:0,z:0}
    if(plan&&plan.t-frame.time<.22){
     const remaining=Math.max(0,plan.t-frame.time),off=CONTATO[name]?.off
     if(off){const cs=Math.cos(aim),sn=Math.sin(aim),w=1-T.MathUtils.smoothstep(remaining,0,.22)
      const x=frame.ball.x+sourceVelocity.x*remaining-p.mx-(off.x*cs+off.z*sn),z=frame.ball.z+sourceVelocity.z*remaining-p.mz-(-off.x*sn+off.z*cs)
      target.x+=(x-target.x)*w;target.z+=(z-target.z)*w}
    }
    if(!plan&&frame.owner===p.key&&!p.keeper&&!frame.restart&&frame.ball.y<.3){
     const dx=frame.ball.x-p.mx,dz=frame.ball.z-p.mz,d=Math.hypot(dx,dz)
     if(d<3&&d>.32)target={x:dx/d*Math.min(1.3,d-.32),z:dz/d*Math.min(1.3,d-.32)}
    }
    // An approach may not walk through another athlete. Reject that offset,
    // preserving the official formation instead of teleporting the ball.
    for(const q of frame.players){if(q.key===p.key||q.visible===false)continue;const x=p.mx+target.x-q.mx,z=p.mz+target.z-q.mz,d=Math.hypot(x,z);if(d<.62&&d>.001){target.x+=x/d*(.62-d);target.z+=z/d*(.62-d)}}
    if(reset||frame.placementReset){a.corr={x:0,z:0};a.ultimo=null;a.contactHistory=null}
    a.corrAlvo=target;a.corr=advanceApproach(a.corr,target,dt)
    const px=p.mx+a.corr.x,pz=p.mz+a.corr.z
    const agora=frame.time,ult=a.ultimo,dx=ult&&dt>0?px-ult.x:0,dz=ult&&dt>0?pz-ult.z:0,salto=Math.hypot(dx,dz)>2.5;a.ultimo={x:px,z:pz}
    const vel=dt>0&&!salto?Math.min(9,Math.hypot(dx,dz)/dt):0,comBola=frame.owner===p.key&&!p.keeper&&Math.hypot(frame.ball.x-p.mx,frame.ball.z-p.mz)<2
    // pra onde o CORPO olha (27/10, Diego: "completamente perdidos… desgovernados"): quem se MEXE olha pra onde vai, como gente de
    // verdade; só quem está quase parado vira pra bola (passinho de lado/de costas só aí). Com folga entre os dois limites, senão o
    // corpo ficava trocando de frente a cada passo
    const bx=frame.ball.x-p.mx,bz=frame.ball.z-p.mz,praBola=Math.atan2(bx,bz),praOnde=vel>.3?Math.atan2(dx,dz):p.heading
    if(vel>1.7||comBola)a.olhaBola=false;else if(vel<.8)a.olhaBola=true
    const antecipa=plan?.kind!=='carry'&&plan?.dir!=null&&plan.t-agora<.8;const mirando=antecipa||a.tiro?.mira!=null&&agora-a.tiro.t0<toque(a.tiro.nome)+.4
    const alvo=p.mergulho?a.rumo:mirando?(antecipa?aim:a.tiro.mira):a.olhaBola&&Math.hypot(bx,bz)<45?praBola:praOnde
    const giro=angulo(alvo-a.rumo);a.rumo+=dt>0?T.MathUtils.clamp(giro*(1-Math.exp(-dt/(mirando?.10:.18))),-7*dt,7*dt):giro
    a.holder.position.set(px,0,pz);a.holder.rotation.set(0,a.rumo,0)
    // ── lances: o motor diz quem fez o quê; o corpo mostra ──
    // (mão: lateral e reposição do goleiro — vêm do lance de AGORA, com o instante passado pra segundos)
    if(acao&&acao.actor===p.key&&acao.requiredContact==='hands'&&acao.startedAt!==undefined&&!a.lances.has('a'+acao.startedAt)&&agora>=acao.startedAt&&agora-acao.startedAt<.35){a.lances.add('a'+acao.startedAt)
     const nome=frame.phase==='lateral'||acao.restartOrigin?.type==='lateral'?'lateral':p.keeper?(acao.type==='passe'?'gk_rola':acao.type==='lancamento'?'gk_lanca_longe':'gk_lanca'):null
     if(nome)dispara(a,nome,{inicio:Math.max(0,toque(nome)-.1)+agora-acao.startedAt,agora})}
    // (pé e cabeça: pela PREVISÃO — o movimento começa antes, e o contato dele cai no instante em que a bola sai)
    if(!frame.replay)for(const it of agenda){if(it.feito||it.key!==p.key)continue
     if(it.kind==='toque'){if(it.hands){it.feito=true;continue}if(['conduz','drible','desvio','rebote','arrancada'].includes(it.tipo)){it.feito=true;continue}
      // (27/10, Diego: "dá impressão que ele faz o mesmo lance pra chutar e passar"): cada jeito de bater tem o SEU movimento —
      // chute = a bomba (parado ou correndo) · bola longa/cruzamento/inversão = a batida por baixo que levanta a bola ·
      // passe/enfiada = o toque de lado do pé
      const corre=vel>2.6,longa=['cruzamento','lancamento','inversao'].includes(it.tipo)||it.longe>26
      // (⚽ 27/10: passe e chute são os GRAVADOS de jogador de verdade — passe de chapa e chute forte do pacote do Anderson Rohr;
      // o do Mixamo fica de reserva se o arquivo faltar)
      const tem=n=>asset.clips.has(n)
      let nome=deCabeca(it)?'cabeca2':CHUTES.has(it.tipo)||it.tipo==='corte'?(tem('chute_forte')?'chute_forte':corre?'chute_corrida':'chute'):longa?'cavadinha':tem('passe_chapa')?'passe_chapa':it.longe<13?'passe_curto':'passe'
      // 🦶 o pé: canhoto famoso bate de canhota, destro famoso de direita; o resto usa o pé do lado pra onde a bola vai
      // (bola saindo pra esquerda do corpo = pé esquerdo), e de frente decide o jeito de cada um (1 em 4 bate de canhota)
      if(!deCabeca(it)){const pe=a.pe,rel=it.dir==null?0:angulo(it.dir-a.rumo)
       const canhota=pe==='canhota'||(pe!=='direita'&&(rel>.9||(rel>=-.9&&a.canhoto)))
       const baseEsq=asset.meta.clips?.[nome]?.pe==='l' // (o gravado pode ser de canhota: aí o espelho é a versão de direita)
       if(canhota!==baseEsq&&asset.clips.has(nome+'_e'))nome+='_e'}
      const ini=it.t-toque(nome);if(agora<ini)continue;it.feito=true;if(agora>it.t+.25)continue
      it.nome=nome;it.ini=agora
      dispara(a,nome,{inicio:agora-ini,agora,mira:it.dir==null?null:it.dir-(CONTATO[nome]?.ang??0),ponto:true})}
     else if(it.kind==='recebe'&&!p.keeper){if(agora<it.t-.45)continue;it.feito=true;if(agora>it.t+.2)continue
      // Janela curta para a próxima batida: preserva a preparação do passe/chute.
      if(agenda.some(o=>o.kind==='toque'&&o.key===p.key&&o.t>=it.t-.05&&o.t<it.t+.85))continue
      const nome=it.h>.9?'peito':'dominio',ini=it.t-toque(nome);it.nome=nome;it.ini=agora;dispara(a,nome,{inicio:Math.max(0,agora-ini),agora,ate:toque(nome)+.45,mira:it.dir})}}
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
    if(p.mergulho&&!a.mergulhou){a.mergulhou=true;const m=p.mergulho,mx=m.x-(m.ax??p.mx),mz=m.z-(m.az??p.mz),len=Math.hypot(mx,mz)
     const direita=(mx*-Math.cos(a.rumo)+mz*Math.sin(a.rumo))>0
     const nome=m.vertical||(len<=.6&&m.y>1.2)?'gk_pega_alto':len<.9?(m.y<.6?'gk_pega_baixo':'gk_pega'):len<1.7&&m.y<.8?(direita?'gk_bloqueio_d':'gk_bloqueio_e'):direita?'gk_voo_d':'gk_voo_e'
     // (o mergulho do motor chega no ponto em ~0,42 s: o voo do Mixamo encosta na bola no `toque` dele)
     dispara(a,nome,{inicio:Math.max(0,toque(nome)-.42*(1-m.k)),agora})}
    if(!p.mergulho)a.mergulhou=false
    if(a.lances.size>40)a.lances=new Set([...a.lances].slice(-20))
    // Keep contact sampling and animation time independent of camera culling.
    // ── corrida: 8 direções em fase comum, peso pela velocidade ──
    const fw=vel>.05?angulo(Math.atan2(dx,dz)-a.rumo):0,lado=-fw // (+ = pra direita do corpo; o eixo do three gira ao contrário)
    a.fase=(a.fase+(dt>0?Math.min(2.6,vel/(comBola?4.75:CICLO_M))*dt:0))%1
    if(comBola&&plan?.kind==='carry'&&dt>0){
     const rate=Math.min(2.6,vel/4.75),remaining=plan.t-agora
     if(plan.phase===undefined){const ahead=a.fase+rate*remaining;plan.phase=[.385,.866].sort((x,y)=>Math.abs(angulo((x-ahead)*Math.PI*2))-Math.abs(angulo((y-ahead)*Math.PI*2)))[0]}
     const error=angulo((plan.phase-rate*remaining-a.fase)*Math.PI*2)/(Math.PI*2)
     a.fase=(a.fase+T.MathUtils.clamp(error*(1-Math.exp(-dt/.07)),-.8*dt,.8*dt)+1)%1
    }
    const anda=T.MathUtils.smoothstep(vel,.25,1.1),segura=p.keeper&&frame.ball.y>.6&&frame.ball.y<1.6&&Math.hypot(bx,bz)<1.3
    const parado=p.keeper?(segura?'gk_idle_bola':'gk_idle'):'idle'
    const alvos=new Map(LOOPS.map(n=>[n,0]));alvos.set(parado,1-anda)
    {const l=((lado%(2*Math.PI))+2*Math.PI)%(2*Math.PI),i=Math.floor(l/(Math.PI/4))%8,u=l/(Math.PI/4)-i // (DIRS vai de 45 em 45°)
     const nome=k=>DIRS[k][1]==='trote'&&comBola?'conduz':DIRS[k][1],n0=nome(i),n1=nome((i+1)%8)
     alvos.set(n0,alvos.get(n0)+anda*(1-u));alvos.set(n1,alvos.get(n1)+anda*u)}
    // lance por cima: o tempo do movimento é o relógio do jogo (pausa e replay param junto)
    let wTiro=0
    if(a.tiro){const t=agora-a.tiro.t0,act=a.acao(a.tiro.nome)
     if(t<0||t>a.tiro.dur){act.setEffectiveWeight(0);const {dur,depois}=a.tiro;a.tiro=null;if(t>dur&&depois)dispara(a,depois,{inicio:Math.min(t-dur,.2),agora})}
     else{wTiro=Math.min(1,t/.12,(a.tiro.dur-t)/.25);act.time=a.tiro.base+t;act.setEffectiveWeight(wTiro)}}
    const k=dt>0?1-Math.exp(-dt/.15):1
    for(const n of LOOPS){const act=a.acao(n);if(!act)continue;const w0=a.pesos.get(n)??0,w=w0+((alvos.get(n)??0)-w0)*(reset?1:k);a.pesos.set(n,w);act.setEffectiveWeight(w*(1-wTiro));const dur=act.getClip().duration;act.time=n.startsWith('idle')||n.startsWith('gk_idle')?agora%dur:a.fase*dur}
    a.mixer.update(0)
    // A small IK correction finishes an already reachable imported pose.
    // Larger gaps remain explicit; no stretching legs or moving the ball.
    if(!frame.replay&&!frame.restart&&(comBola||plan&&Math.abs(plan.t-agora)<.09)){
     a.holder.updateMatrixWorld(true);const B=frame.ball.presentation??frame.ball,feet=footPositions(a),hit=bootContact(B,feet)
     if(hit.gap<.15&&hit.side!==null&&B.y<.35){const side=hit.side?'Left':'Right',ankle=a.bones.get('mixamorig'+side+'Foot'),delta=new T.Vector3(B.x,B.y,B.z).sub(feet[hit.side]);
      if(hit.gap<0){delta.y=0;delta.setLength(-Math.min(.10,-hit.gap))}else delta.setLength(Math.min(.11,hit.gap));
      solveLimbContact(a,['mixamorig'+side+'UpLeg','mixamorig'+side+'Leg','mixamorig'+side+'Foot'],ankle.getWorldPosition(new T.Vector3()).add(delta),{maxCorrection:.11,maxAngle:.3})}
    }
   }
   for(const a of atores)if(!usados.has(a))a.holder.visible=false
   observeContacts(frame,dt,reset)
  },
  presentFrame:frame=>frame,
  prepared:()=>Promise.resolve(null),
  debug:()=>({prevAte,ft:lastTime,agenda:agenda.map(({key,...o})=>({k:key,...o})),medidas}),
  inspect:()=>({...inspection,style:'jogador-novo',football:{actions:atores.filter(a=>a.tiro).map(a=>({key:a.key,tiro:a.tiro,plan:activePlan(a,lastTime),contact:CONTATO[a.tiro.nome],target:a.corrAlvo,root:a.corr,heading:a.rumo})),mode:bola.modo,touches:bola.toques,contacts:medidas.slice(),corrections:atores.filter(a=>Math.hypot(a.corr.x,a.corr.z)>.01).map(a=>({key:a.key,x:a.corr.x,z:a.corr.z}))}}),
  inspectActors:()=>({slots:atores.map((a,slot)=>({slot,key:a.key,heading:a.rumo,visible:a.holder.visible,detail:a.detail,tiro:a.tiro?.nome??null}))}),
  dispose(){if(disposed)return;disposed=true;for(const a of atores)a.dispose()},
 }
}
