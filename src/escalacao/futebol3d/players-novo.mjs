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

// velocidade (m/s) em que cada corrida do Mixamo foi gravada, por ciclo — o passo acompanha o chão sem patinar
const CICLO_M=2.9
// direção da corrida em relação ao corpo (0 = pra frente, + = pra direita) → movimento
const DIRS=[[0,'trote'],[Math.PI/4,'diag_fd'],[Math.PI/2,'lado_d'],[3*Math.PI/4,'diag_td'],[Math.PI,'re'],[-3*Math.PI/4,'diag_te'],[-Math.PI/2,'lado_e'],[-Math.PI/4,'diag_fe']]
const LOOPS=['idle','idle_bola','gk_idle','gk_idle_bola','conduz',...DIRS.map(d=>d[1])]
const CHUTES=new Set(['chute','chutao'])
const PASSES=new Set(['passe','enfiada','lancamento','inversao','cruzamento','cobranca'])
const angulo=a=>Math.atan2(Math.sin(a),Math.cos(a))

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
 let disposed=false,lastTime=null,inspection={full:0,intermediate:0,far:0,hidden:0,tiros:0}
 onPrepared?.()
 // um movimento de lance por cima da corrida: entra em 0,12 s, sai nos últimos 0,25 s
 const dispara=(a,nome,{inicio=0,agora}={})=>{const c=asset.clips.get(nome);if(!c)return;if(a.tiro){a.acao(a.tiro.nome)?.setEffectiveWeight(0)}const act=a.acao(nome);act.reset();act.play();act.timeScale=0;act.setLoop(T.LoopOnce,1);act.clampWhenFinished=true;a.tiro={nome,t0:agora-inicio,dur:c.duration,depois:nome==='cai'?'levanta':null};inspection.tiros++}
 const toque=nome=>asset.meta.clips?.[nome]?.toque??.4
 return{
  update(frame,camera,viewportHeight=720){
   if(disposed)return
   const dt=lastTime===null||frame.time<lastTime||frame.time-lastTime>1?0:frame.time-lastTime,reset=dt===0&&lastTime!==null&&frame.time!==lastTime;lastTime=frame.time
   inspection={full:0,intermediate:0,far:0,hidden:0,tiros:inspection.tiros}
   const acao=frame.officialAction,evs=frame.official?.events??[],usados=new Set()
   // eventos dos últimos 0,4 s, por nome do motor (o mesmo que o teatro do players.mjs usa)
   const recentes=[];for(let i=evs.length-1;i>=0;i--){const e=evs[i],idade=frame.time-e.t;if(idade>.4)break;if(idade>=0)recentes.push(e)}
   for(const p of frame.players){
    const a=atores.find(x=>x.key===p.key&&!usados.has(x))??atores.find(x=>!usados.has(x)&&x.side===p.side&&x.keeper===p.keeper&&!frame.players.some(q=>q.key===x.key));if(!a)continue;usados.add(a);a.key=p.key
    a.detail=p.visible===false?'hidden':camera?playerDetail(camera,{x:p.mx,y:0,z:p.mz},viewportHeight,a.detail):'full';inspection[a.detail]++
    a.holder.visible=a.detail!=='hidden'
    // deslocamento de verdade deste quadro (a velocidade do motor sozinha não sabe de cobrança/teleporte)
    const ult=a.ultimo,dx=ult&&dt>0?p.mx-ult.x:0,dz=ult&&dt>0?p.mz-ult.z:0,salto=Math.hypot(dx,dz)>2.5;a.ultimo={x:p.mx,z:p.mz}
    const vel=dt>0&&!salto?Math.min(9,Math.hypot(dx,dz)/dt):0,comBola=frame.owner===p.key
    // pra onde o CORPO olha: correndo forte ou com a bola = pra onde vai; trotando/parado = pra bola (aí aparece o de costas e o de lado)
    const bx=frame.ball.x-p.mx,bz=frame.ball.z-p.mz,praBola=Math.atan2(bx,bz),praOnde=vel>.3?Math.atan2(dx,dz):p.heading
    const alvo=p.mergulho?a.rumo:comBola||vel>4.2?praOnde:Math.hypot(bx,bz)<45?praBola:praOnde
    a.rumo+=angulo(alvo-a.rumo)*(dt>0?1-Math.exp(-dt/.16):1)
    a.holder.position.set(p.mx,0,p.mz);a.holder.rotation.set(0,a.rumo,0)
    // ── lances: o motor diz quem fez o quê; o corpo mostra ──
    const agora=frame.time
    if(acao&&acao.actor===p.key&&acao.startedAt!==undefined&&!a.lances.has('a'+acao.startedAt)&&agora-acao.startedAt<.35&&agora>=acao.startedAt){a.lances.add('a'+acao.startedAt)
     const desde=agora-acao.startedAt,mao=acao.requiredContact==='hands',cab=acao.requiredContact==='head',corre=vel>2.6
     const nome=cab?'cabeca2':mao?(frame.phase==='lateral'||acao.restartOrigin?.type==='lateral'?'lateral':p.keeper?(acao.type==='passe'?'gk_rola':'gk_lanca'):null)
      :p.keeper&&acao.restartOrigin?.type!=='tiro-de-meta'&&acao.restartOrigin?.type!=='tiro_de_meta'&&frame.ball.y>.5?'gk_chutao'
      :CHUTES.has(acao.type)?(corre?'chute_corrida':'chute'):PASSES.has(acao.type)?(corre||acao.type==='lancamento'||acao.type==='cruzamento'?'chute_corrida':'passe'):null
     // (a bola sai no `startedAt`: o movimento entra já perto do contato pra o pé bater junto com a saída)
     if(nome)dispara(a,nome,{inicio:Math.max(0,toque(nome)-.1)+desde,agora})}
    for(const e of recentes){const id=e.tipo+e.t;if(a.lances.has(id))continue
     const nomeP=p.name
     if((e.tipo==='falta'||e.tipo==='vantagem')&&e.b&&String(e.b).startsWith(nomeP)){a.lances.add(id);dispara(a,'cai',{inicio:.35,agora})}
     else if(e.tipo==='carrinho'&&e.a&&String(e.a).startsWith(nomeP)){a.lances.add(id);dispara(a,'carrinho',{inicio:0,agora})}
     else if(e.tipo==='drible'&&e.a&&String(e.a).startsWith(nomeP)&&(e.golpe==='roleta'||e.golpe==='cruyff'||e.golpe==='giro')){a.lances.add(id);dispara(a,'giro',{inicio:.05,agora})}}
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
  },
  presentFrame:frame=>frame,
  prepared:()=>Promise.resolve(null),
  inspect:()=>({...inspection,style:'jogador-novo'}),
  inspectActors:()=>({slots:atores.map((a,slot)=>({slot,key:a.key,heading:a.rumo,visible:a.holder.visible,detail:a.detail,tiro:a.tiro?.nome??null}))}),
  dispose(){if(disposed)return;disposed=true;for(const a of atores)a.dispose()},
 }
}
