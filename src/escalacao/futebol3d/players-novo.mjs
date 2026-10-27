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
import {RotacaoBola3D,RAIO_BOLA_FUTEBOL_3D} from '../presidencia-bola-rotacao.ts'

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
  const ator={...j,pe:ap.lenda?peDe(p.name,10):null,canhoto:[...p.name].reduce((h,c)=>(h*31+c.charCodeAt(0))>>>0,7)%4<1,key:p.key,side:p.side,keeper:p.keeper,ficha,fase:0,rumo:p.heading,ultimo:null,tiro:null,lances:new Set(),mergulhou:false,detail:'full',pesos:new Map()}
  {const osso=n=>{let r;j.root.traverse(o=>{if(o.isBone&&o.name.toLowerCase().includes(n))r??=o});return r};ator.pes=[osso('righttoe'),osso('lefttoe')].filter(Boolean);ator.zPe=[null,null];ator.subindo=[false,false];ator.mov={x:0,z:1};ator.corr={x:0,z:0};ator.corrAlvo={x:0,z:0};ator.mpos={x:p.mx,z:p.mz}}
  if(ap.lenda)aparenciaDaCarta(ap.src).then(c=>{if(c?.pele&&!disposed)ator.setPele(c.pele)})
  atores.push(ator)
 }
 // 🦶 ONDE e PRA ONDE o pé (ou a cabeça) bate em cada movimento do Mixamo, medido no próprio boneco no instante do toque:
 // `off` = o ponto do contato em relação ao corpo (o pé do chute fica ~0,4 m à direita, não no meio) · `ang` = pra onde ele
 // varre (o chute correndo varre ~20° pra esquerda). Com isso o corpo mira a bola pro lado CERTO e a bola espera no pé que bate
 const CONTATO={}
 {const a0=atores[0],osso=n=>{let r;a0.root.traverse(o=>{if(o.isBone&&o.name.toLowerCase().includes(n))r??=o});return r}
  const pes={r:osso('righttoe')??osso('rightfoot'),l:osso('lefttoe')??osso('leftfoot')},cabeca=osso('head'),peito=osso('spine2')
  const local=o=>a0.holder.worldToLocal(o.getWorldPosition(new T.Vector3()))
  const p0=a0.holder.position.clone(),r0=a0.holder.rotation.y;a0.holder.position.set(0,0,0);a0.holder.rotation.set(0,0,0)
  for(const nome of ['chute','chute_corrida','passe','passe_curto','cavadinha','cabeca2','dominio','peito'].flatMap(n=>[n,n+'_e'])){const act=a0.acao(nome),m=asset.meta.clips?.[nome.replace(/_e$/,'')];if(!act||!m)continue
   const lado=nome.endsWith('_e')?(m.pe==='l'?'r':'l'):(m.pe??'r'),alto=/^(cabeca2|peito)/.test(nome),o=nome.startsWith('cabeca2')?cabeca:nome.startsWith('peito')?peito:pes[lado];if(!o)continue
   const pose=t=>{act.reset();act.play();act.setEffectiveWeight(1);act.time=t;a0.mixer.update(0);a0.holder.updateMatrixWorld(true);return local(o)}
   for(const n of LOOPS)a0.acao(n)?.setEffectiveWeight(0)
   const antes=pose(Math.max(0,m.toque-.03)),em=pose(m.toque)
   const varre=alto||nome.startsWith('dominio')?0:Math.atan2(em.x-antes.x,em.z-antes.z)
   // (cabeça e peito: a bola encosta um palmo À FRENTE do osso, não dentro dele)
   CONTATO[nome]={off:{x:em.x,y:em.y,z:em.z+(alto?.16:.06)},alto,ang:Math.abs(varre)<1?varre:0};act.setEffectiveWeight(0);act.stop()}
  a0.holder.position.copy(p0);a0.holder.rotation.y=r0}
 let disposed=false,lastTime=null,inspection={full:0,intermediate:0,far:0,hidden:0,tiros:0}
 // 🔮 OLHAR ADIANTE (o motor avança em MINUTOS de jogo — 93 em 90 s —, e o desenho e os lances andam em segundos): uma cópia do MESMO motor (mesma semente: o mesmo jogo) roda ~1 s à frente do desenho. Assim o corpo sabe que
 // VAI chutar/passar/cabecear antes de a bola sair e começa o movimento a tempo do pé (ou a cabeça) bater na bola no instante certo;
 // e sabe quem vai RECEBER a bola, pra fazer o domínio quando ela chega. Só apresentação: o placar continua do motor oficial.
 const {novoMotor2}=await import('../motor2/carreira.ts')
 const chaveDe=at=>identidadeAtleta3D(at.lado===0?'home':'away',at.nome,at.carta?.club,at.carta?.year)
 const ADIANTE=1.8,agenda=[];let prev=null,prevAte=0,ultLance=null,ultDono=null
 const observa=()=>{const b=prev.bola,l=b.lance
  if(l){const k=l.tipo+':'+l.de.id+':'+l.t0;if(k!==ultLance){ultLance=k;agenda.push({key:chaveDe(l.de),kind:'toque',tipo:l.tipo,golpe:l.golpe,t:l.t0,cab:l.tipo==='cabeceio'||l.tipo==='cabeceio_gol'||l.golpe==='cabeca',longe:l.para?Math.hypot(l.para.x-b.x,l.para.y-b.y):30,dir:Math.hypot(b.vx,b.vy)>.5?Math.atan2(b.vy,b.vx):null,ponto:{x:b.x-b.vx*(prev.t-l.t0),y:b.y-b.vy*(prev.t-l.t0)},bola:{x:b.y-b.vy*(prev.t-l.t0)-52.5,y:b.h+RAIO_BOLA_FUTEBOL_3D,z:b.x-b.vx*(prev.t-l.t0)-34}})}}
  const d=b.dono&&b.h<2.4?b.dono:null
  if(d&&d!==ultDono)agenda.push({key:chaveDe(d),kind:'recebe',t:prev.t,h:b.h,goleiro:d.grupo==='GOL',bola:{x:b.y-52.5,y:b.h+RAIO_BOLA_FUTEBOL_3D,z:b.x-34}})
  ultDono=d}
 const preve=ate=>{if(!state.officialInput)return
  if(!prev||ate<prevAte-.3){prev=novoMotor2(structuredClone(state.officialInput));prevAte=0;ultLance=null;ultDono=null;agenda.length=0}
  while(prevAte<ate){prevAte=Math.min(ate,prevAte+.05);prev.avancaAte(prevAte*93/90);observa()}
  while(agenda.length&&agenda[0].t<ate-ADIANTE-3)agenda.shift()}
 // ⚽ bola no pé: com a bola dominada, o desenho cola a bola no pé de quem conduz (o motor deixa ela 1–2 m solta na frente) e solta
 // no instante do toque — a bola sai DO PÉ. Só desenho: a bola do motor continua mandando no jogo
 let bolaApresentada=null,bolaGiro=undefined
 onPrepared?.()
 // um movimento de lance por cima da corrida: entra em 0,12 s, sai nos últimos 0,25 s
 const dispara=(a,nome,{inicio=0,agora,ate=Infinity,mira=null,ponto=null}={})=>{const c=asset.clips.get(nome);if(!c)return;if(a.tiro){a.acao(a.tiro.nome)?.setEffectiveWeight(0)}const act=a.acao(nome);act.reset();act.play();act.timeScale=0;act.setLoop(T.LoopOnce,1);act.clampWhenFinished=true;a.tiro={nome,t0:agora-inicio,dur:Math.min(c.duration,ate),depois:nome.startsWith('cai')?'levanta':null,mira,bate:mira!==null||ponto!==null};inspection.tiros++}
 const toque=nome=>asset.meta.clips?.[nome.replace(/_e$/,'')]?.toque??.4
 // 🎯 cabeçada é coisa de ÁREA (cruzamento, finalização, rebatida do zagueiro). O motor às vezes chama de "cabeceio" um passe alto
 // no meio-campo — ali o desenho mostra o toque com o pé (a bola desce até ele), nunca um passe de cabeça pro companheiro
 const naArea=b=>!!b&&Math.abs(b.x)>36&&Math.abs(b.z)<20.2
 const deCabeca=it=>it.cab&&(it.tipo==='cabeceio_gol'||naArea(it.bola))
 // ⚽ A BOLA DO DESENHO (27/10, Diego: "o domínio não parece real… o passe parece colado no jogador… não parece que foi com o pé").
 // O motor decide pra onde a bola vai e quem fica com ela; aqui ela é DESENHADA presa ao corpo de verdade, osso por osso:
 //  · 'livre' (rolando/voando): é a bola do motor. Quando alguém vai tocar nela (domínio, passe de primeira, cabeçada), ela vai
 //    se desviando aos poucos pra chegar EXATAMENTE no pé (peito/cabeça) dele no instante do toque
 //  · 'posse' (alguém conduz): ela rola sozinha no chão, com atrito, e só anda quando a PONTA DO PÉ do boneco encosta nela, no
 //    ponto da passada em que o pé vai mais à frente — cada toque empurra a bola o bastante pra o próximo pé alcançá-la de novo.
 //    No domínio ela acompanha o pé que amortece; no passe/chute ela espera no pé que bate e sai DELE, no instante do contato
 // Só desenho: placar, posse e trajetória continuam do motor (a diferença some em ~0,25 s depois que a bola sai do pé)
 const ATRITO=2.4,JANELA=2,bola={modo:'livre',dono:null,B:new T.Vector3(),V:new T.Vector3(),off:new T.Vector3(),offT:0,desde:0,toques:0,vm:new T.Vector3(),mAnt:null}
 let giro=null,giroT=null
 const _a=new T.Vector3(),_b=new T.Vector3()
 const atorDe=key=>atores.find(a=>a.key===key)
 const frente=a=>_b.set(Math.sin(a.rumo),0,Math.cos(a.rumo))
 /** onde o pé/peito/cabeça de `a` encosta na bola no movimento `nome`, com o corpo de agora */
 const pontoDe=(a,nome,base=a.holder.position)=>{const c=CONTATO[nome]??CONTATO.passe,cs=Math.cos(a.rumo),sn=Math.sin(a.rumo)
  return new T.Vector3(base.x+c.off.x*cs+c.off.z*sn,c.alto?c.off.y:RAIO_BOLA_FUTEBOL_3D,base.z-c.off.x*sn+c.off.z*cs)}
 const MEIO_CORPO=.7,CORR_MAX=1.6,TOQUES_CONDUZ=[.37,.86]
 const pegaPosse=(a,P,agora,peito)=>{Object.assign(bola,{modo:'posse',dono:a,desde:agora,voo:null});a.faseBola=a.fase;bola.B.copy(P)
  if(peito){const f=frente(a);bola.V.set(f.x*1.4+a.mov.x*a.vel*.6,.3,f.z*1.4+a.mov.z*a.vel*.6)}else bola.V.set(a.mov.x*a.vel*.5,0,a.mov.z*a.vel*.5)
  a.zPe=[null,null]}
 // 📏 conferência: em cada contato, a distância entre a bola desenhada e o osso que encosta (pé, peito, cabeça) — lida pela bancada
 const medidas=[],ossoDe=(a,nome)=>{a.holder.updateMatrixWorld(true);const alto=/^(cabeca2|peito)/.test(nome);let o
  if(alto){const n=nome.startsWith('cabeca2')?'head':'spine2';a.root.traverse(x=>{if(x.isBone&&x.name.toLowerCase().includes(n))o??=x})}
  else{const m=asset.meta.clips?.[nome.replace(/_e$/,'')],lado=nome.endsWith('_e')?(m?.pe==='l'?0:1):(m?.pe==='l'?1:0);o=a.pes[lado]}
  return o?o.getWorldPosition(new T.Vector3()):null}
 const mede=(a,nome,P,agora,tipo)=>{const o=ossoDe(a,nome);if(!o)return;const c=CONTATO[nome];const alvo=c?.alto?o.add(frente(a).clone().multiplyScalar(.16)):o
  medidas.push({t:+agora.toFixed(2),tipo,nome,dist:+Math.hypot(P.x-alvo.x,(c?.alto?P.y-alvo.y:0),P.z-alvo.z).toFixed(2)});if(medidas.length>200)medidas.shift()}
 const proximoToque=agora=>{let t=Infinity;for(const it of agenda)if(it.t>agora+.02&&it.t<t&&(it.kind==='recebe'||!['conduz','drible','desvio','rebote','arrancada'].includes(it.tipo)))t=it.t;return t}
 const largaEm=(P,M,agora)=>{bola.off.copy(P).sub(M);bola.offT=agora;bola.offDur=Math.min(1.6,Math.max(.35,proximoToque(agora)-agora))}
 const solta=(M,agora)=>{largaEm(bola.B,M,agora);bola.voo={R0:bola.B.clone(),M0:M.clone(),enc:null,trav:0};bola.modo='livre';bola.dono=null}
 function bolaDoDesenho(frame,dt,reset){
  const agora=frame.time,M=new T.Vector3(frame.ball.x,frame.ball.y,frame.ball.z)
  if(dt>0&&bola.mAnt){const v=_a.copy(M).sub(bola.mAnt).divideScalar(dt);bola.vm.lerp(v.length()>40?bola.vm:v,.6);if(bola.voo&&v.length()<=40)bola.voo.trav+=Math.hypot(M.x-bola.mAnt.x,M.z-bola.mAnt.z)}
  bola.mAnt=M.clone()
  if(frame.replay||frame.ball.presentation){bola.modo='livre';bola.dono=null;bola.off.set(0,0,0);bolaApresentada=null;bolaGiro=undefined;giro=null;return}
  if(reset){bola.modo='livre';bola.dono=null;bola.off.set(0,0,0)}
  // o próximo encontro com a bola (domínio, ou toque de primeira de quem NÃO está conduzindo)
  let enc=null
  // (o movimento ainda pode não ter começado: o nome previsto serve pro ponto de contato até lá)
  const nomeDe=it=>it.nome??(it.kind==='recebe'?(it.h>.9?'peito':'dominio'):deCabeca(it)?'cabeca2':'passe')
  for(const it of agenda){if(it.bolaFeita||!it.bola||it.t<agora-.03||it.t>agora+JANELA)continue
   if(it.kind==='toque'&&['conduz','drible','desvio','rebote','arrancada'].includes(it.tipo))continue
   if(it.kind==='recebe'&&(it.goleiro||agenda.some(o=>o.kind==='toque'&&o.key===it.key&&o.t>=it.t-.05&&o.t<it.t+.5)))continue
   if(it.kind==='toque'&&bola.modo==='posse'&&bola.dono?.key===it.key)continue
   if(!enc||it.t<enc.t)enc=it}
  // (quem ia receber continua sendo o alvo até aparecer outro — a previsão às vezes troca "domínio" por "toque de primeira" no meio do voo)
  if(!enc&&bola.modo==='livre'&&bola.voo?.enc&&!bola.voo.enc.bolaFeita&&bola.voo.enc.t>agora-.03)enc=bola.voo.enc
  const quemEnc=enc&&atorDe(enc.key)
  bola.encDbg=enc?[enc.kind,enc.key.slice(10,22),+enc.t.toFixed(2),enc.nome??null]:null
  if(bola.modo==='posse'){const a=bola.dono
   const doDonoAntes=quemEnc&&agenda.some(o=>o.kind==='toque'&&o.key===a?.key&&!o.bolaFeita&&o.t>agora-.05&&o.t<enc.t)
   if(!a||(quemEnc&&quemEnc!==a&&!doDonoAntes)||(frame.owner&&frame.owner!==a.key&&agora-bola.desde>.35)||a.keeper)solta(M,agora)}
  if(bola.modo==='posse'&&dt>0){bola.dono.corrAlvo.x=bola.dono.corrAlvo.z=0;const a=bola.dono,B=bola.B,V=bola.V,tiro=a.tiro,tt=tiro?agora-tiro.t0:0
   a.holder.updateMatrixWorld(true)
   if(tiro?.bate){const tq=toque(tiro.nome)
    if(tt>=tq-.005){B.copy(pontoDe(a,tiro.nome));mede(a,tiro.nome,B,agora,'bate');solta(M,agora);bola.toques++} // saiu DO pé, agora
    else{B.lerp(pontoDe(a,tiro.nome),1-Math.exp(-dt/Math.max(.015,(tq-tt)*.3)));V.set(0,0,0)}} // espera no pé que vai bater
   else if(tiro?.nome==='dominio'&&tt<tiro.dur){ // amortece: a bola acompanha a ponta do pé que domina, rente ao chão
    const pe=a.holder.visible&&a.pes[0]?.getWorldPosition(_a);if(pe){const f=frente(a);B.lerp(_a.set(pe.x+f.x*.1,RAIO_BOLA_FUTEBOL_3D,pe.z+f.z*.1),1-Math.exp(-dt/.09))}V.set(0,0,0)}
   else{
    // a bola rola sozinha (atrito no chão, gravidade no ar — o peito solta a bola pra cair na frente)
    V.y-=9.8*dt;B.addScaledVector(V,dt)
    if(B.y<RAIO_BOLA_FUTEBOL_3D){B.y=RAIO_BOLA_FUTEBOL_3D;V.y=V.y<-1?-V.y*.4:0}
    if(B.y<RAIO_BOLA_FUTEBOL_3D+.01){const f=Math.exp(-ATRITO*dt);V.x*=f;V.z*=f}
    const f=frente(a),fx=f.x,fz=f.z
    if(a.vel>.8){
     // 🦶 o TOQUE: a passada do movimento de conduzir tem dois toques do pé direito por ciclo (medidos no Mixamo: a ponta do pé
     // vai mais à frente em 37% e 86% do ciclo). Em cada toque a bola ganha a velocidade certa pra rolar (com atrito) e chegar
     // EXATAMENTE onde o pé vai estar no próximo toque — o corpo corre, o pé empurra, a bola nunca é arrastada
     const f0=a.faseBola??a.fase,f1=a.fase;a.faseBola=f1
     const cruzou=u=>f0<=f1?f0<u&&u<=f1:f0<u||u<=f1
     if(TOQUES_CONDUZ.some(cruzou)){
      const h=a.holder.position,pe=a.holder.visible&&a.pes[0]?a.pes[0].getWorldPosition(new T.Vector3()):new T.Vector3(h.x+fx*.3-fz*.06,0,h.z+fz*.3+fx*.06)
      const cps=Math.min(2.6,a.vel/CICLO_M),prox=TOQUES_CONDUZ.find(u=>u>f1+1e-4)??TOQUES_CONDUZ[0]+1,Ph=Math.max(.12,(prox-f1)/cps)
      const alvo=new T.Vector3(pe.x+a.mov.x*a.vel*Ph+fx*.12,RAIO_BOLA_FUTEBOL_3D,pe.z+a.mov.z*a.vel*Ph+fz*.12)
      const g=ATRITO/(1-Math.exp(-ATRITO*Ph));V.set((alvo.x-B.x)*g,0,(alvo.z-B.z)*g);V.clampLength(0,a.vel*2.2+2)
      medidas.push({t:+agora.toFixed(2),tipo:'conduz',dist:+Math.hypot(B.x-pe.x-fx*.12,B.z-pe.z-fz*.12).toFixed(2)});if(medidas.length>200)medidas.shift();bola.toques++}}
    else a.faseBola=a.fase
    // (segurança: bola muito longe do corpo — parada brusca, curva fechada — volta devagar pra frente dele)
    const q=_a.set(a.holder.position.x+fx*.5,B.y,a.holder.position.z+fz*.5),d=B.distanceTo(q);if(d>1.6)B.lerp(q,1-Math.exp(-dt*(d-1.6)*3))}
   if(bola.modo==='posse'&&B.distanceTo(_a.set(a.holder.position.x,B.y,a.holder.position.z))>3)solta(M,agora)}
  let P
  if(bola.modo==='posse')P=bola.B.clone()
  else{
   // a diferença do instante em que saiu do pé some em ~0,25 s; chegando num pé, a bola se desvia pra ele aos poucos
   if(enc)enc.visto??=agora // (o desvio começa do zero quando o toque fica conhecido — nunca no meio)
   const ini=enc?Math.max(bola.offT,enc.t-JANELA,enc.visto):0
   const w=quemEnc?T.MathUtils.smoothstep(enc.t-ini<.02?1:(agora-ini)/(enc.t-ini),0,1):0
   const u=Math.min(1,Math.max(0,(agora-bola.offT)/(bola.offDur??.35)))
   P=M.clone().addScaledVector(bola.off,(1-T.MathUtils.smootherstep(u,0,1))*(1-w))
   // onde a bola do motor vai estar no instante do toque (seguindo a velocidade de agora — quanto mais perto, mais exato): o
   // desvio é o que falta pra ela cair no pé. Bola PARADA (cobrança) não se mexe: quem anda até ela é o corpo
   // 🏃⚽ a distância que falta entre o pé e a bola é dividida: o CORPO anda metade até a bola (como gente de verdade, e a passada
   // acompanha) e a bola faz o resto; com a bola PARADA (cobrança) o corpo anda tudo e a bola não se mexe
   const parada=bola.vm.length()<.3
   for(const a of atores)if(a!==quemEnc&&a!==bola.dono)a.corrAlvo.x=a.corrAlvo.z=0
   // (onde a bola vai estar no toque: de longe vale a previsão do motor; no último 0,3 s, a bola de agora seguindo a velocidade dela)
   if(quemEnc){const falta=Math.max(0,enc.t-agora),Mt=_a.set(enc.bola.x,enc.bola.y,enc.bola.z).lerp(_b.copy(M).addScaledVector(bola.vm,falta),Math.min(1,Math.max(0,1-falta/.3))),Cm=pontoDe(quemEnc,nomeDe(enc),quemEnc.mpos),parte=1-T.MathUtils.smoothstep(bola.vm.length(),.3,1.5)*(1-MEIO_CORPO)
    let cx=(Mt.x-Cm.x)*parte*w,cz=(Mt.z-Cm.z)*parte*w;const l=Math.hypot(cx,cz);if(l>CORR_MAX){cx*=CORR_MAX/l;cz*=CORR_MAX/l}
    quemEnc.corrAlvo.x=cx;quemEnc.corrAlvo.z=cz
    // (suaviza só o LADO do corpo em que a bola encosta — trocar de pé no meio do caminho não faz a bola pular; o corpo correndo não atrasa nada)
    const h=quemEnc.holder.position,lado=pontoDe(quemEnc,nomeDe(enc)).sub(h);if(!enc.ladoSuav)enc.ladoSuav=lado.clone();else enc.ladoSuav.lerp(lado,dt>0?1-Math.exp(-dt/.08):1)
    enc.cSuav=new T.Vector3(h.x,0,h.z).add(enc.ladoSuav)
    // ✈️ o VOO: do ponto onde a bola saiu (o pé que bateu) até o pé que recebe, em LINHA (a bola não muda de direção no ar);
    // o quanto ela já andou e a altura vêm da bola do motor. Se quem vai receber só fica conhecido no meio do voo, a linha
    // recomeça de onde a bola está desenhada naquele instante — sem pulo
    if(bola.voo&&bola.voo.enc!==enc&&bolaApresentada){bola.voo={R0:new T.Vector3(bolaApresentada.x,bolaApresentada.y,bolaApresentada.z),M0:M.clone(),enc,trav:0}}
    // (quanto do voo já foi = o caminho que a bola do motor já andou ÷ esse caminho + o que falta até o toque)
    if(bola.voo){const {R0,M0,trav}=bola.voo,falta=Math.hypot(Mt.x-M.x,Mt.z-M.z)
     const sv=trav+falta<.3?T.MathUtils.clamp(w,0,1):T.MathUtils.clamp(trav/(trav+falta),0,1),C=enc.cSuav
     P.set(R0.x+(C.x-R0.x)*sv,M.y+(R0.y-M0.y)*(1-sv)+(C.y-Mt.y)*sv,R0.z+(C.z-R0.z)*sv);if(P.y<RAIO_BOLA_FUTEBOL_3D)P.y=RAIO_BOLA_FUTEBOL_3D}
    else if(w>0)P.addScaledVector(_b.copy(enc.cSuav).sub(Mt),w)}
   // (o quadro quase nunca cai no instante exato do toque: a bola do motor já andou v·Δt — no contato ela está NO pé, sempre)
   if(quemEnc&&agora>=enc.t){enc.bolaFeita=true;P=enc.cSuav?enc.cSuav.clone():pontoDe(quemEnc,nomeDe(enc));quemEnc.corrAlvo.x=quemEnc.corrAlvo.z=0;mede(quemEnc,nomeDe(enc),P,agora,enc.kind);{const Cm=pontoDe(quemEnc,nomeDe(enc),quemEnc.mpos);medidas.at(-1).gap=+Math.hypot(Cm.x-enc.bola.x,Cm.z-enc.bola.z).toFixed(2)}
    if(enc.kind==='recebe')pegaPosse(quemEnc,P,agora,nomeDe(enc)==='peito')
    else{largaEm(P,M,agora);bola.voo={R0:P.clone(),M0:M.clone(),enc:null,trav:0};bola.toques++}}
   // conduzindo sem aviso (cobrança, rebote): a posse vem do motor
   else if(!enc&&frame.owner&&M.y<.5){const a=atorDe(frame.owner);if(a&&!a.keeper&&Math.hypot(M.x-a.holder.position.x,M.z-a.holder.position.z)<2.2)pegaPosse(a,P,agora,false)}}
  // 🌀 o giro acompanha a bola DESENHADA (rola junto com o toque, não com a bola do motor)
  const pg={x:P.x,y:P.y,z:P.z,curl:bola.modo==='livre'?frame.ball.curl:undefined}
  if(!giro||giroT===null||agora<giroT||agora-giroT>1){giro=new RotacaoBola3D(RAIO_BOLA_FUTEBOL_3D,pg)}else giro.step(pg,agora-giroT)
  giroT=agora;bolaGiro=giro.quaternion.toArray();bolaApresentada={x:P.x,y:P.y,z:P.z}
 }
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
    // (🏃 o corpo pode dar uns passos até a bola — `corr`, decidido no quadro anterior pela bola — e isso conta na passada)
    const kc=dt>0?1-Math.exp(-dt/(a.corrAlvo.x||a.corrAlvo.z?.12:.5)):1;a.corr.x+=(a.corrAlvo.x-a.corr.x)*kc;a.corr.z+=(a.corrAlvo.z-a.corr.z)*kc
    a.mpos={x:p.mx,z:p.mz};const px=p.mx+a.corr.x,pz=p.mz+a.corr.z
    const agora=frame.time,ult=a.ultimo,dx=ult&&dt>0?px-ult.x:0,dz=ult&&dt>0?pz-ult.z:0,salto=Math.hypot(dx,dz)>2.5;a.ultimo={x:px,z:pz}
    const vel=dt>0&&!salto?Math.min(9,Math.hypot(dx,dz)/dt):0,comBola=frame.owner===p.key||bola.dono===a;a.vel=vel;if(vel>.3){const l=Math.hypot(dx,dz);a.mov={x:dx/l,z:dz/l}}
    // pra onde o CORPO olha (27/10, Diego: "completamente perdidos… desgovernados"): quem se MEXE olha pra onde vai, como gente de
    // verdade; só quem está quase parado vira pra bola (passinho de lado/de costas só aí). Com folga entre os dois limites, senão o
    // corpo ficava trocando de frente a cada passo
    const bx=frame.ball.x-p.mx,bz=frame.ball.z-p.mz,praBola=Math.atan2(bx,bz),praOnde=vel>.3?Math.atan2(dx,dz):p.heading
    if(vel>1.7||comBola)a.olhaBola=false;else if(vel<.8)a.olhaBola=true
    const mirando=a.tiro?.mira!=null&&agora-a.tiro.t0<toque(a.tiro.nome)+.25
    const alvo=p.mergulho?a.rumo:mirando?a.tiro.mira:a.olhaBola&&Math.hypot(bx,bz)<45?praBola:praOnde
    a.rumo+=angulo(alvo-a.rumo)*(dt>0?1-Math.exp(-dt/(mirando?.07:.16)):1)
    a.holder.position.set(px,0,pz);a.holder.rotation.set(0,a.rumo,0)
    // ── lances: o motor diz quem fez o quê; o corpo mostra ──
    // (mão: lateral e reposição do goleiro — vêm do lance de AGORA, com o instante passado pra segundos)
    if(acao&&acao.actor===p.key&&acao.requiredContact==='hands'&&acao.startedAt!==undefined&&!a.lances.has('a'+acao.startedAt)&&agora>=acao.startedAt&&agora-acao.startedAt<.35){a.lances.add('a'+acao.startedAt)
     const nome=frame.phase==='lateral'||acao.restartOrigin?.type==='lateral'?'lateral':p.keeper?(acao.type==='passe'?'gk_rola':acao.type==='lancamento'?'gk_lanca_longe':'gk_lanca'):null
     if(nome)dispara(a,nome,{inicio:Math.max(0,toque(nome)-.1)+agora-acao.startedAt,agora})}
    // (pé e cabeça: pela PREVISÃO — o movimento começa antes, e o contato dele cai no instante em que a bola sai)
    if(!frame.replay)for(const it of agenda){if(it.feito||it.key!==p.key)continue
     if(it.kind==='toque'){if(['conduz','drible','desvio','rebote','arrancada'].includes(it.tipo)){it.feito=true;continue}
      // (27/10, Diego: "dá impressão que ele faz o mesmo lance pra chutar e passar"): cada jeito de bater tem o SEU movimento —
      // chute = a bomba (parado ou correndo) · bola longa/cruzamento/inversão = a batida por baixo que levanta a bola ·
      // passe/enfiada = o toque de lado do pé
      const corre=vel>2.6,longa=['cruzamento','lancamento','inversao'].includes(it.tipo)||it.longe>26
      let nome=deCabeca(it)?'cabeca2':CHUTES.has(it.tipo)||it.tipo==='corte'?(corre?'chute_corrida':'chute'):longa?'cavadinha':it.longe<13?'passe_curto':'passe'
      // 🦶 o pé: canhoto famoso bate de canhota, destro famoso de direita; o resto usa o pé do lado pra onde a bola vai
      // (bola saindo pra esquerda do corpo = pé esquerdo), e de frente decide o jeito de cada um (1 em 4 bate de canhota)
      if(!deCabeca(it)){const pe=a.pe,rel=it.dir==null?0:angulo(it.dir-a.rumo)
       const canhota=pe==='canhota'||(pe!=='direita'&&(rel>.9||(rel>=-.9&&a.canhoto)))
       if(canhota&&asset.clips.has(nome+'_e'))nome+='_e'}
      const ini=it.t-toque(nome);if(agora<ini)continue;it.feito=true;if(agora>it.t+.25)continue
      it.nome=nome;it.ini=agora
      dispara(a,nome,{inicio:agora-ini,agora,mira:it.dir==null?null:it.dir-(CONTATO[nome]?.ang??0),ponto:true})}
     else if(it.kind==='recebe'&&!p.keeper){if(agora<it.t-.45)continue;it.feito=true;if(agora>it.t+.2)continue
      // de primeira (toca de novo em menos de meio segundo): não domina, já sai o passe/chute
      if(agenda.some(o=>o.kind==='toque'&&o.key===p.key&&o.t>=it.t-.05&&o.t<it.t+.5))continue
      const nome=it.h>.9?'peito':'dominio',ini=it.t-toque(nome);it.nome=nome;it.ini=agora;dispara(a,nome,{inicio:Math.max(0,agora-ini),agora,ate:toque(nome)+.45})}}
    for(const e of recentes){const id=e.tipo+e.t;if(a.lances.has(id))continue
     const nomeP=p.name
     // (só FALTA derruba: na VANTAGEM o jogo segue e o motor continua levando o jogador — cair ali era o "cai do nada" deslizando)
     if(e.tipo==='falta'&&e.b===nomeP){a.lances.add(id)
      // (falta que veio de carrinho = tropeça por cima dele; correndo voa mais longe, parado cai ali mesmo)
      const deCarrinho=evs.some(o=>o.tipo==='carrinho'&&o.a===e.a&&e.t-o.t<1.2&&e.t>=o.t)
      dispara(a,deCarrinho?(vel>3?'cai_carrinho':'cai_parado'):'cai',{inicio:deCarrinho?.1:.35,agora})}
     else if(e.tipo==='carrinho'&&e.a===nomeP){a.lances.add(id);dispara(a,'carrinho',{inicio:0,agora})}
     else if(e.tipo==='drible'&&e.a===nomeP&&(e.golpe==='roleta'||e.golpe==='cruyff'||e.golpe==='giro')){a.lances.add(id);dispara(a,'giro',{inicio:.05,agora})}}
    if(p.mergulho&&!a.mergulhou){a.mergulhou=true;const m=p.mergulho,mx=m.x-(m.ax??p.mx),mz=m.z-(m.az??p.mz),len=Math.hypot(mx,mz)
     const direita=(mx*-Math.cos(a.rumo)+mz*Math.sin(a.rumo))>0
     const nome=m.vertical||(len<=.6&&m.y>1.2)?'gk_pega_alto':len<.9?(m.y<.6?'gk_pega_baixo':'gk_pega'):len<1.7&&m.y<.8?(direita?'gk_bloqueio_d':'gk_bloqueio_e'):direita?'gk_voo_d':'gk_voo_e'
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
   bolaDoDesenho(frame,dt,reset)
  },
  presentFrame:frame=>bolaApresentada&&frame.time===lastTime&&!frame.ball.presentation?{...frame,ball:{...frame.ball,presentation:bolaApresentada,rotation:bolaGiro}}:frame,
  prepared:()=>Promise.resolve(null),
  debug:()=>({prevAte,ft:lastTime,agenda:agenda.map(({key,...o})=>({k:key.slice(10,30),...o})),bola:{modo:bola.modo,dono:bola.dono?.key.slice(10,30)??null,toques:bola.toques,off:bola.off.toArray().map(v=>+v.toFixed(2)),offT:bola.offT,offDur:bola.offDur,vm:+bola.vm.length().toFixed(2),enc:bola.encDbg},medidas}),
  inspect:()=>({...inspection,style:'jogador-novo'}),
  inspectActors:()=>({slots:atores.map((a,slot)=>({slot,key:a.key,heading:a.rumo,visible:a.holder.visible,detail:a.detail,tiro:a.tiro?.nome??null}))}),
  dispose(){if(disposed)return;disposed=true;for(const a of atores)a.dispose()},
 }
}
