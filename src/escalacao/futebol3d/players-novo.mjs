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

// velocidade (m/s) em que cada corrida do Mixamo foi gravada, por ciclo — o passo acompanha o chão sem patinar
const CICLO_M=2.9
// direção da corrida em relação ao corpo (0 = pra frente, + = pra direita) → movimento
const DIRS=[[0,'trote'],[Math.PI/4,'diag_fd'],[Math.PI/2,'lado_d'],[3*Math.PI/4,'diag_td'],[Math.PI,'re'],[-3*Math.PI/4,'diag_te'],[-Math.PI/2,'lado_e'],[-Math.PI/4,'diag_fe']]
const LOOPS=['idle','idle_bola','gk_idle','gk_idle_bola','conduz',...DIRS.map(d=>d[1])]
const CHUTES=new Set(['chute','chutao'])
const PASSES=new Set(['passe','enfiada','lancamento','inversao','cruzamento','cobranca'])
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
 const asset=await carregaJogadorNovo()
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
  const ator={...j,key:p.key,side:p.side,keeper:p.keeper,ficha,fase:0,rumo:p.heading,ultimo:null,tiro:null,lances:new Set(),mergulhou:false,detail:'full',pesos:new Map()}
  if(ap.lenda)aparenciaDaCarta(ap.src).then(c=>{if(c?.pele&&!disposed)ator.setPele(c.pele)})
  atores.push(ator)
 }
 // 🦶 ONDE e PRA ONDE o pé (ou a cabeça) bate em cada movimento do Mixamo, medido no próprio boneco no instante do toque:
 // `off` = o ponto do contato em relação ao corpo (o pé do chute fica ~0,4 m à direita, não no meio) · `ang` = pra onde ele
 // varre (o chute correndo varre ~20° pra esquerda). Com isso o corpo mira a bola pro lado CERTO e a bola espera no pé que bate
 const CONTATO={}
 {const a0=atores[0],osso=n=>{let r;a0.root.traverse(o=>{if(o.isBone&&o.name.toLowerCase().includes(n))r??=o});return r}
  const pes={r:osso('righttoe')??osso('rightfoot'),l:osso('lefttoe')??osso('leftfoot')},cabeca=osso('head')
  const local=o=>a0.holder.worldToLocal(o.getWorldPosition(new T.Vector3()))
  const p0=a0.holder.position.clone(),r0=a0.holder.rotation.y;a0.holder.position.set(0,0,0);a0.holder.rotation.set(0,0,0)
  for(const nome of ['chute','chute_corrida','passe','cabeca2']){const act=a0.acao(nome),m=asset.meta.clips?.[nome];if(!act||!m)continue
   const o=nome==='cabeca2'?cabeca:pes[m.pe??'r'];if(!o)continue
   const pose=t=>{act.reset();act.play();act.setEffectiveWeight(1);act.time=t;a0.mixer.update(0);a0.holder.updateMatrixWorld(true);return local(o)}
   for(const n of LOOPS)a0.acao(n)?.setEffectiveWeight(0)
   const antes=pose(Math.max(0,m.toque-.03)),em=pose(m.toque)
   const varre=nome==='cabeca2'?0:Math.atan2(em.x-antes.x,em.z-antes.z)
   CONTATO[nome]={off:{x:em.x,z:em.z},ang:Math.abs(varre)<.7?varre:0};act.setEffectiveWeight(0);act.stop()}
  a0.holder.position.copy(p0);a0.holder.rotation.y=r0}
 let disposed=false,lastTime=null,inspection={full:0,intermediate:0,far:0,hidden:0,tiros:0}
 // 🔮 OLHAR ADIANTE (o motor avança em MINUTOS de jogo — 93 em 90 s —, e o desenho e os lances andam em segundos): uma cópia do MESMO motor (mesma semente: o mesmo jogo) roda ~1 s à frente do desenho. Assim o corpo sabe que
 // VAI chutar/passar/cabecear antes de a bola sair e começa o movimento a tempo do pé (ou a cabeça) bater na bola no instante certo;
 // e sabe quem vai RECEBER a bola, pra fazer o domínio quando ela chega. Só apresentação: o placar continua do motor oficial.
 const {novoMotor2}=await import('../motor2/carreira.ts')
 const chaveDe=at=>identidadeAtleta3D(at.lado===0?'home':'away',at.nome,at.carta?.club,at.carta?.year)
 const ADIANTE=1.0,agenda=[];let prev=null,prevAte=0,ultLance=null,ultDono=null
 const observa=()=>{const b=prev.bola,l=b.lance
  if(l){const k=l.tipo+':'+l.de.id+':'+l.t0;if(k!==ultLance){ultLance=k;agenda.push({key:chaveDe(l.de),kind:'toque',tipo:l.tipo,golpe:l.golpe,t:l.t0,cab:l.tipo==='cabeceio'||l.tipo==='cabeceio_gol'||l.golpe==='cabeca',longe:l.para?Math.hypot(l.para.x-b.x,l.para.y-b.y):30,dir:Math.hypot(b.vx,b.vy)>.5?Math.atan2(b.vy,b.vx):null,ponto:{x:b.x-b.vx*(prev.t-l.t0),y:b.y-b.vy*(prev.t-l.t0)}})}}
  const d=b.dono&&b.h<2.4?b.dono:null
  if(d&&d!==ultDono)agenda.push({key:chaveDe(d),kind:'recebe',t:prev.t,h:b.h,goleiro:d.grupo==='GOL'})
  ultDono=d}
 const preve=ate=>{if(!state.officialInput)return
  if(!prev||ate<prevAte-.3){prev=novoMotor2(structuredClone(state.officialInput));prevAte=0;ultLance=null;ultDono=null;agenda.length=0}
  while(prevAte<ate){prevAte=Math.min(ate,prevAte+.05);prev.avancaAte(prevAte*93/90);observa()}
  while(agenda.length&&agenda[0].t<ate-ADIANTE-3)agenda.shift()}
 // ⚽ bola no pé: com a bola dominada, o desenho cola a bola no pé de quem conduz (o motor deixa ela 1–2 m solta na frente) e solta
 // no instante do toque — a bola sai DO PÉ. Só desenho: a bola do motor continua mandando no jogo
 let bolaW=0,bolaVis=null,bolaApresentada=null,offBola={x:0,z:.42}
 onPrepared?.()
 // um movimento de lance por cima da corrida: entra em 0,12 s, sai nos últimos 0,25 s
 const dispara=(a,nome,{inicio=0,agora,ate=Infinity,mira=null,ponto=null}={})=>{const c=asset.clips.get(nome);if(!c)return;if(a.tiro){a.acao(a.tiro.nome)?.setEffectiveWeight(0)}const act=a.acao(nome);act.reset();act.play();act.timeScale=0;act.setLoop(T.LoopOnce,1);act.clampWhenFinished=true;a.tiro={nome,t0:agora-inicio,dur:Math.min(c.duration,ate),depois:nome==='cai'?'levanta':null,mira,ponto};inspection.tiros++}
 const toque=nome=>asset.meta.clips?.[nome]?.toque??.4
 return{
  update(frame,camera,viewportHeight=720){
   if(disposed)return
   const dt=lastTime===null||frame.time<lastTime||frame.time-lastTime>1?0:frame.time-lastTime,reset=dt===0&&lastTime!==null&&frame.time!==lastTime;lastTime=frame.time
   inspection={full:0,intermediate:0,far:0,hidden:0,tiros:inspection.tiros}
   const acao=frame.officialAction,evs=frame.official?.events??[],usados=new Set()
   // eventos dos últimos 0,4 s, por nome do motor (o mesmo que o teatro do players.mjs usa)
   const recentes=[];for(let i=evs.length-1;i>=0;i--){const e=evs[i],idade=frame.time-e.t;if(idade>.4)break;if(idade>=0)recentes.push(e)}
   if(!frame.replay)preve(frame.time+ADIANTE) // (no replay do gol o tempo volta: a previsão espera ele acabar)
   for(const p of frame.players){
    const a=atores.find(x=>x.key===p.key&&!usados.has(x))??atores.find(x=>!usados.has(x)&&x.side===p.side&&x.keeper===p.keeper&&!frame.players.some(q=>q.key===x.key));if(!a)continue;usados.add(a);a.key=p.key
    a.detail=p.visible===false?'hidden':camera?playerDetail(camera,{x:p.mx,y:0,z:p.mz},viewportHeight,a.detail):'full';inspection[a.detail]++
    a.holder.visible=a.detail!=='hidden'
    // deslocamento de verdade deste quadro (a velocidade do motor sozinha não sabe de cobrança/teleporte)
    const agora=frame.time,ult=a.ultimo,dx=ult&&dt>0?p.mx-ult.x:0,dz=ult&&dt>0?p.mz-ult.z:0,salto=Math.hypot(dx,dz)>2.5;a.ultimo={x:p.mx,z:p.mz}
    const vel=dt>0&&!salto?Math.min(9,Math.hypot(dx,dz)/dt):0,comBola=frame.owner===p.key;a.vel=vel
    // pra onde o CORPO olha (27/10, Diego: "completamente perdidos… desgovernados"): quem se MEXE olha pra onde vai, como gente de
    // verdade; só quem está quase parado vira pra bola (passinho de lado/de costas só aí). Com folga entre os dois limites, senão o
    // corpo ficava trocando de frente a cada passo
    const bx=frame.ball.x-p.mx,bz=frame.ball.z-p.mz,praBola=Math.atan2(bx,bz),praOnde=vel>.3?Math.atan2(dx,dz):p.heading
    if(vel>1.7||comBola)a.olhaBola=false;else if(vel<.8)a.olhaBola=true
    const mirando=a.tiro?.mira!=null&&agora-a.tiro.t0<toque(a.tiro.nome)+.25
    const alvo=p.mergulho?a.rumo:mirando?a.tiro.mira:a.olhaBola&&Math.hypot(bx,bz)<45?praBola:praOnde
    a.rumo+=angulo(alvo-a.rumo)*(dt>0?1-Math.exp(-dt/(mirando?.07:.16)):1)
    a.holder.position.set(p.mx,0,p.mz);a.holder.rotation.set(0,a.rumo,0)
    // 🦶 o pé encontra a bola: na preparação da batida o corpo escorrega (no máx. 2,5 m) até o pé que bate ficar em cima do ponto de
    // onde a bola sai — o motor põe o jogador "perto" da bola, o desenho precisa do pé NELA. Depois do toque ele volta pro lugar
    if(a.tiro?.ponto&&CONTATO[a.tiro.nome]){const c=CONTATO[a.tiro.nome],tq=toque(a.tiro.nome),tt=agora-a.tiro.t0
     const w=tt<0?0:tt<tq?T.MathUtils.smoothstep(tt/tq,0,.8):Math.max(0,1-(tt-tq)/.35),cs=Math.cos(a.rumo),sn=Math.sin(a.rumo)
     const tx=a.tiro.ponto.x-(c.off.x*cs+c.off.z*sn),tz=a.tiro.ponto.z-(-c.off.x*sn+c.off.z*cs)
     if(w>0&&Math.hypot(tx-p.mx,tz-p.mz)<2.5)a.holder.position.set(p.mx+(tx-p.mx)*w,0,p.mz+(tz-p.mz)*w)}
    // ── lances: o motor diz quem fez o quê; o corpo mostra ──
    // (mão: lateral e reposição do goleiro — vêm do lance de AGORA, com o instante passado pra segundos)
    if(acao&&acao.actor===p.key&&acao.requiredContact==='hands'&&acao.startedAt!==undefined&&!a.lances.has('a'+acao.startedAt)&&agora>=acao.startedAt&&agora-acao.startedAt<.35){a.lances.add('a'+acao.startedAt)
     const nome=frame.phase==='lateral'||acao.restartOrigin?.type==='lateral'?'lateral':p.keeper?(acao.type==='passe'?'gk_rola':'gk_lanca'):null
     if(nome)dispara(a,nome,{inicio:Math.max(0,toque(nome)-.1)+agora-acao.startedAt,agora})}
    // (pé e cabeça: pela PREVISÃO — o movimento começa antes, e o contato dele cai no instante em que a bola sai)
    if(!frame.replay)for(const it of agenda){if(it.feito||it.key!==p.key)continue
     if(it.kind==='toque'){if(['conduz','drible','desvio','rebote','arrancada'].includes(it.tipo)){it.feito=true;continue}
      const corre=vel>2.6,nome=it.cab?'cabeca2':CHUTES.has(it.tipo)||it.tipo==='corte'?(corre?'chute_corrida':'chute'):(corre||it.longe>24?'chute_corrida':'passe')
      const ini=it.t-toque(nome);if(agora<ini)continue;it.feito=true;if(agora>it.t+.25)continue
      dispara(a,nome,{inicio:agora-ini,agora,mira:it.dir==null?null:it.dir-(CONTATO[nome]?.ang??0),ponto:it.ponto?{x:it.ponto.y-52.5,z:it.ponto.x-34}:null})}
     else if(it.kind==='recebe'&&!p.keeper){if(agora<it.t-.45)continue;it.feito=true;if(agora>it.t+.2)continue
      // de primeira (toca de novo em menos de meio segundo): não domina, já sai o passe/chute
      if(agenda.some(o=>o.kind==='toque'&&o.key===p.key&&o.t>=it.t-.05&&o.t<it.t+.5))continue
      const nome=it.h>.9?'peito':'dominio',ini=it.t-toque(nome);dispara(a,nome,{inicio:Math.max(0,agora-ini),agora,ate:toque(nome)+.45})}}
    for(const e of recentes){const id=e.tipo+e.t;if(a.lances.has(id))continue
     const nomeP=p.name
     // (só FALTA derruba: na VANTAGEM o jogo segue e o motor continua levando o jogador — cair ali era o "cai do nada" deslizando)
     if(e.tipo==='falta'&&e.b===nomeP){a.lances.add(id);dispara(a,'cai',{inicio:.35,agora})}
     else if(e.tipo==='carrinho'&&e.a===nomeP){a.lances.add(id);dispara(a,'carrinho',{inicio:0,agora})}
     else if(e.tipo==='drible'&&e.a===nomeP&&(e.golpe==='roleta'||e.golpe==='cruyff'||e.golpe==='giro')){a.lances.add(id);dispara(a,'giro',{inicio:.05,agora})}}
    if(p.mergulho&&!a.mergulhou){a.mergulhou=true;const m=p.mergulho,mx=m.x-(m.ax??p.mx),mz=m.z-(m.az??p.mz),len=Math.hypot(mx,mz)
     const direita=(mx*-Math.cos(a.rumo)+mz*Math.sin(a.rumo))>0
     const nome=m.vertical||(len<=.6&&m.y>1.2)?'gk_pega_alto':len<.9?(m.y<.6?'gk_pega_baixo':'gk_pega'):direita?'gk_voo_d':'gk_voo_e'
     // (o mergulho do motor chega no ponto em ~0,42 s: o voo do Mixamo encosta na bola no `toque` dele)
     dispara(a,nome,{inicio:Math.max(0,toque(nome)-.42*(1-m.k)),agora})}
    if(!p.mergulho)a.mergulhou=false
    if(a.lances.size>40)a.lances=new Set([...a.lances].slice(-20))
    if(!a.holder.visible)continue
    // ── corrida: 8 direções em fase comum, peso pela velocidade ──
    const fw=vel>.05?angulo(Math.atan2(dx,dz)-a.rumo):0,lado=-fw // (+ = pra direita do corpo; o eixo do three gira ao contrário)
    a.fase=(a.fase+(dt>0?Math.min(2.6,vel/CICLO_M)*dt:0))%1
    const anda=T.MathUtils.smoothstep(vel,.25,1.1),segura=p.keeper&&frame.ball.y>.6&&frame.ball.y<1.6&&Math.hypot(bx,bz)<1.3
    const parado=p.keeper?(segura?'gk_idle_bola':'gk_idle'):comBola?'idle_bola':'idle'
    const alvos=new Map(LOOPS.map(n=>[n,0]));alvos.set(parado,1-anda)
    {const l=((lado%(2*Math.PI))+2*Math.PI)%(2*Math.PI),i=Math.floor(l/(Math.PI/4))%8,u=l/(Math.PI/4)-i // (DIRS vai de 45 em 45°)
     const nome=k=>DIRS[k][1]==='trote'&&comBola?'conduz':DIRS[k][1],n0=nome(i),n1=nome((i+1)%8)
     alvos.set(n0,alvos.get(n0)+anda*(1-u));alvos.set(n1,alvos.get(n1)+anda*u)}
    // lance por cima: o tempo do movimento é o relógio do jogo (pausa e replay param junto)
    let wTiro=0
    if(a.tiro){const t=agora-a.tiro.t0,act=a.acao(a.tiro.nome)
     if(t<0||t>a.tiro.dur){act.setEffectiveWeight(0);const {dur,depois}=a.tiro;a.tiro=null;if(t>dur&&depois)dispara(a,depois,{inicio:Math.min(t-dur,.2),agora})}
     else{wTiro=Math.min(1,t/.12,(a.tiro.dur-t)/.25);act.time=t;act.setEffectiveWeight(wTiro)}}
    const k=dt>0?1-Math.exp(-dt/.15):1
    for(const n of LOOPS){const act=a.acao(n);if(!act)continue;const w0=a.pesos.get(n)??0,w=w0+((alvos.get(n)??0)-w0)*(reset?1:k);a.pesos.set(n,w);act.setEffectiveWeight(w*(1-wTiro));const dur=act.getClip().duration;act.time=n.startsWith('idle')||n.startsWith('gk_idle')?agora%dur:a.fase*dur}
    a.mixer.update(0)
   }
   for(const a of atores)if(!usados.has(a))a.holder.visible=false
   // bola no pé de quem conduz (ver `bolaW`)
   {let ultimo=null;for(const it of agenda)if(it.kind==='toque'&&it.t<=frame.time)ultimo=it
    const conduzindo=ultimo&&['conduz','arrancada','drible'].includes(ultimo.tipo)&&frame.time-ultimo.t<1.6?ultimo.key:null
    const quem=frame.owner??conduzindo
    const dono=quem&&!frame.replay&&frame.ball.y<.7&&!frame.ball.presentation?atores.find(a=>a.key===quem&&a.holder.visible&&!a.keeper):null
    const chutando=dono?.tiro&&!['dominio','peito'].includes(dono.tiro.nome)&&frame.time-dono.tiro.t0>=toque(dono.tiro.nome)-.02
    const alvo=dono&&!chutando?(dono.vel>3.2?.6:1):0,tau=alvo>bolaW?.12:.07
    bolaW=dt>0?bolaW+(alvo-bolaW)*(1-Math.exp(-dt/tau)):alvo
    // (a bola escorrega do meio da passada pro pé que bate em ~0,15 s — nada de pulo)
    const c=dono?.tiro&&CONTATO[dono.tiro.nome],quer=c?c.off:{x:0,z:.42},q=dt>0?1-Math.exp(-dt/.06):1
    offBola.x+=(quer.x-offBola.x)*q;offBola.z+=(quer.z-offBola.z)*q;const o=offBola,cs=dono&&Math.cos(dono.rumo),sn=dono&&Math.sin(dono.rumo)
    if(dono)bolaVis={x:dono.holder.position.x+o.x*cs+o.z*sn,z:dono.holder.position.z-o.x*sn+o.z*cs}
    bolaApresentada=bolaW>.01&&bolaVis?{x:frame.ball.x+(bolaVis.x-frame.ball.x)*bolaW,y:frame.ball.y+(.11-frame.ball.y)*bolaW,z:frame.ball.z+(bolaVis.z-frame.ball.z)*bolaW}:null}
  },
  presentFrame:frame=>bolaApresentada&&frame.time===lastTime&&!frame.ball.presentation?{...frame,ball:{...frame.ball,presentation:bolaApresentada}}:frame,
  prepared:()=>Promise.resolve(null),
  debug:()=>({prevAte,ft:lastTime,agenda:agenda.map(({key,...o})=>({k:key.slice(10,30),...o})),bolaW}),
  inspect:()=>({...inspection,style:'jogador-novo'}),
  inspectActors:()=>({slots:atores.map((a,slot)=>({slot,key:a.key,heading:a.rumo,visible:a.holder.visible,detail:a.detail,tiro:a.tiro?.nome??null}))}),
  dispose(){if(disposed)return;disposed=true;for(const a of atores)a.dispose()},
 }
}
