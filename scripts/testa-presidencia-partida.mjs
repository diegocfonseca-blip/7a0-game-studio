await import('./testa-presidencia-evolucao.mjs')
import assert from 'node:assert/strict'
import fs from 'node:fs'
const {escalaValida,atletasEmCampo,quadroPartida,projetarCampo,progressoChute}=await import('../src/escalacao/presidencia-partida-model.ts')
const {segmentoLivre,caminhoSeguro,obstaculosDoEstadio}=await import('../src/escalacao/presidencia-estadio-navegacao.ts')
const {aproximarMapa,limitarVistaMapa,atoresDoMapa,raioCorpoAtor,quadroAtor,comprimentoRota,ROTAS_ESTADIO}=await import('../src/escalacao/presidencia-estadio-mapa-model.ts')
const roles=['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA']
const team=side=>roles.map((pos,i)=>({id:side+i,name:`Atleta demonstrativo ${side} ${i+1}`,pos}))
const state={context:{id:'fixture-local',home:team('casa'),away:team('fora')},minute:20,homeScore:0,awayScore:0,paused:false,finished:false,homeColor:'#1B7A3D',awayColor:'#C2452F'}
assert.ok(escalaValida(state.context.home));assert.equal(atletasEmCampo(state).length,22)
assert.equal(escalaValida(state.context.home.slice(1)),false)
assert.equal(escalaValida(state.context.home.map((p,i)=>i===1?{...p,id:state.context.home[0].id}:p)),false)
assert.equal(escalaValida(state.context.home.map((p,i)=>i===1?{...p,fake:true}:p)),false)
assert.equal(atletasEmCampo({...state,context:{...state.context,away:[]}}).length,0)
for(let second=0;second<120;second++)for(const p of quadroPartida(state,second).actors){assert.ok(p.x>0&&p.x<1&&p.y>0&&p.y<1)}
const replacement={...state.context.home[10],id:'reserva-real',name:'Reserva demonstrativo'}
const second={...state,minute:46,context:{...state.context,homeSecondHalf:[...state.context.home.slice(0,10),replacement]}}
assert.ok(atletasEmCampo(second).some(p=>p.id===replacement.id))
assert.ok(!atletasEmCampo(second).some(p=>p.id==='casa10'))
assert.ok(atletasEmCampo(second).find(p=>p.id==='casa0').x>.9)
assert.ok(atletasEmCampo({...second,minute:45,paused:true}).some(p=>p.id==='casa10'))
const goal={id:'fixture:0',home:true,name:state.context.home[10].name,phase:'shot'}
const shot=quadroPartida({...state,goal},0,1)
assert.equal(shot.ball.inNet,false);assert.equal(shot.homeScore,0)
const confirmed=quadroPartida({...state,goal:{...goal,phase:'confirmed'},homeScore:1},0,0)
assert.equal(confirmed.ball.inNet,true);assert.equal(confirmed.homeScore,1)
assert.notEqual(quadroPartida({...state,goal:{...goal,id:'fixture:1'}},0).ball.goalId,shot.ball.goalId)
assert.deepEqual(quadroPartida({...state,paused:true},12).actors,quadroPartida(state,12).actors,'Pausar conserva a posição e pose no instante congelado')
assert.deepEqual(quadroPartida({...state,finished:true},12).actors,quadroPartida(state,12).actors,'Fim não reposiciona atletas')
assert.deepEqual(projetarCampo(0,0,[[1,2],[3,4],[5,6],[7,8]]),{x:1,y:2})
assert.deepEqual(projetarCampo(1,1,[[1,2],[3,4],[5,6],[7,8]]),{x:7,y:8})
const wall=[{id:'parede',polygon:[{x:5,y:-10},{x:6,y:-10},{x:6,y:10},{x:5,y:10}]}]
assert.equal(segmentoLivre({x:0,y:0},{x:10,y:0},wall,0),false,'Segmento não atravessa parede mesmo com pontas livres')
assert.equal(segmentoLivre({x:0,y:11},{x:10,y:11},wall,2),false,'Raio do corpo respeita quina')
assert.equal(segmentoLivre({x:0,y:13},{x:10,y:13},wall,2),true)
const safe=caminhoSeguro([{x:0,y:0},{x:10,y:0}],wall,2)
assert.ok(safe.at(-1).x<3);assert.ok(segmentoLivre(safe[0],safe[1],wall,2))
assert.deepEqual(caminhoSeguro([{x:5.5,y:0},{x:10,y:0}],wall,0),[])
const stages=JSON.parse(fs.readFileSync(new URL('../test-results/estadio-mapa-model.json',import.meta.url),'utf8'))
for(const stage of stages)for(const actor of atoresDoMapa(stage.stadium)){
 const points=actor.path.points
 for(let i=1;i<points.length;i++)assert.ok(segmentoLivre(points[i-1],points[i],obstaculosDoEstadio(stage.stadium),raioCorpoAtor(actor)),stage.name+': '+actor.id)
}
fs.writeFileSync(new URL('../test-results/partida-model.json',import.meta.url),JSON.stringify(state))
console.log('PASS: 22 atletas, escalações inválidas, intervalo, placar/evento autoritativo, projeção dos pés e segmentos/raios contra os obstáculos cadastrados nas 47 etapas. Sem navegador ou conta real.')

const camera={zoom:2,x:0,y:0},anchor={x:40,y:20}
const zoomed=aproximarMapa(camera,4,anchor,600,400,6)
assert.equal((anchor.x-zoomed.x)/zoomed.zoom,(anchor.x-camera.x)/camera.zoom)
assert.equal((anchor.y-zoomed.y)/zoomed.zoom,(anchor.y-camera.y)/camera.zoom)
assert.equal(limitarVistaMapa({zoom:10,x:9000,y:-9000},600,400,6).zoom,6)
assert.equal(limitarVistaMapa({zoom:10,x:9000,y:-9000},600,400).zoom,4)
const startShot=quadroPartida({...state,goal},12,0),idle=quadroPartida(state,12)
assert.deepEqual(startShot.actors,idle.actors,'Gol não teleporta os atletas')
const author=startShot.actors.find(p=>p.name===goal.name&&p.side==='home')
assert.equal(startShot.ball.x,author.x);assert.equal(startShot.ball.y,author.y)
assert.ok(confirmed.ball.x>1,'Bola confirmada cruza a linha e fica na rede')
console.log('PASS: ancoragem do zoom, limite 6×/mapa 4× e chute sem teleporte')

const {CAMPO_INTERNO,FACES_REDE}=await import('../src/escalacao/presidencia-partida-geometria.ts')
const {dentroPoligono}=await import('../src/escalacao/presidencia-estadio-navegacao.ts')
for(const home of [true,false]){const f=quadroPartida({...state,goal:{...goal,home,phase:'confirmed'}},0);const point=projetarCampo(f.ball.x,f.ball.y,CAMPO_INTERNO);assert.ok(FACES_REDE.some(face=>dentroPoligono(point,face.map(([x,y])=>({x,y})))),'Gol termina dentro da rede registrada')}
console.log('PASS: bola confirmada dentro das duas balizas da câmera interna')

assert.ok(quadroPartida({...state,minute:46,goal:{...goal,minute:45,phase:'confirmed'}},0).ball.x>1,'Gol do primeiro tempo na fila mantém o lado correto')
assert.ok(quadroPartida({...state,minute:46,goal:{...goal,minute:46,phase:'confirmed'}},0).ball.x<0,'Gol do segundo tempo respeita a troca de lado')
const queuedHalf=quadroPartida({...second,goal:{...goal,minute:45}},0,0)
const queuedScorer=queuedHalf.actors.find(p=>p.id==='casa10')
assert.ok(queuedScorer,'Autor do lance de 45 permanece até a fila terminar')
assert.ok(!queuedHalf.actors.some(p=>p.id===replacement.id),'Substituto não entra no meio do chute anterior')
assert.equal(queuedHalf.ball.x,queuedScorer.x)
assert.equal(queuedHalf.ball.y,queuedScorer.y)
assert.ok(queuedHalf.actors.find(p=>p.id==='casa0').x<.1,'Time inteiro conserva o lado do lance')
assert.ok(atletasEmCampo({...second,goal:undefined}).some(p=>p.id===replacement.id),'Escalação do segundo tempo assume ao terminar o lance')
console.log('PASS: lado do gol usa o minuto do evento, mesmo em fila após o intervalo')

const parked=atoresDoMapa({inv:{},ext:['estac']}).find(a=>a.route==='parking')
const lengthParking=comprimentoRota(parked.path),forward=(.4-parked.phase)*lengthParking/parked.speed,backward=(1.6-parked.phase)*lengthParking/parked.speed
const entering=quadroAtor(parked,forward),leaving=quadroAtor(parked,backward)
assert.ok(Math.hypot(entering.x-leaving.x,entering.y-leaving.y)<1e-7)
assert.ok(Math.abs(entering.angle-leaving.angle)<1e-7,'Sai de ré sem girar a carroceria')
assert.ok(raioCorpoAtor(parked)>=Math.hypot(parked.width,parked.height)/2,'Colisão contém carro inteiro')
const blockedRoad={...parked,route:'roadOut',phase:0,path:{id:'bloqueada',points:[{x:50,y:50},{x:100,y:50}],loop:false}}
assert.equal(quadroAtor(blockedRoad,100).x,100,'Rota bloqueada não teleporta no meio da imagem')
console.log('PASS: carroceria inteira, saída de ré e tráfego sem reaparecimento dentro da cena')

const timed={...goal,startedAt:1000}
assert.equal(progressoChute(timed,1450,900),.5,'Câmera aberta no meio do chute usa o instante original')
assert.equal(progressoChute(timed,1900,900),1)
assert.equal(progressoChute({...timed,startedAt:1900},1900,900),0,'Próximo gol tem novo instante')
assert.equal(progressoChute({...timed,phase:'confirmed'},1100,900),1,'Confirmação autoritativa vence a animação')
assert.equal(progressoChute({...goal,startedAt:NaN},1450,900),0)
assert.ok(quadroPartida({...state,goal:timed},12,1).ball.x<1,'Bola só cruza a linha após confirmação')
assert.ok(atletasEmCampo({...second,paused:true}).find(p=>p.id==='casa0').x>.9,'Pausa no segundo tempo não inverte o campo')
for(let t=1;t<80;t+=.37){const current=quadroPartida(state,t).actors,next=quadroPartida(state,t+.0001).actors;for(let i=0;i<current.length;i++)if(!current[i].keeper)assert.equal(current[i].back,next[i].y<current[i].y,'Pose de costas segue deslocamento real')}
console.log('PASS: pausa/fim sem salto, direção das poses, chute sem reinício e linha de gol autoritativa')

const {requisitoExtraNoProjeto}=await import('../src/escalacao/presidencia-estadio-projeto.ts')
assert.equal(requisitoExtraNoProjeto('asfalto'),'Loja do Clube ou Geral concluída')
assert.equal(requisitoExtraNoProjeto('asfalto',true),'Club Store or completed Terraces')
assert.equal(requisitoExtraNoProjeto('loja'),undefined)
console.log('PASS: requisitos exibidos na loja sem variável de save inexistente')

const pedestrian={id:'visitante-teste',kind:'fan',src:'',route:'sidewalk',speed:10,phase:0,width:11.25,height:15,frames:4,path:{id:'entrada-teste',points:[{x:100,y:100},{x:100,y:200}],loop:false}}
for(const time of [10,10.5,11.99]){
 const frame=quadroAtor(pedestrian,time)
 assert.equal(frame.y,200,'Pedestre espera no destino antes de retornar')
 assert.equal(frame.frame,0,'Pés não caminham durante a espera')
 assert.equal(frame.back,false,'Mantém orientação de chegada enquanto espera')
}
assert.ok(quadroAtor(pedestrian,12.1).y<200,'Retorno começa após a espera')
assert.equal(quadroAtor(pedestrian,12.1).back,true)
for(const time of [22,23.9]){
 const frame=quadroAtor(pedestrian,time)
 assert.equal(frame.y,100);assert.equal(frame.frame,0);assert.equal(frame.back,true)
}
assert.ok(quadroAtor(pedestrian,24.1).y>100,'Novo percurso começa sem salto')
for(let time=0;time<50;time+=.017){
 const a=quadroAtor(pedestrian,time),b=quadroAtor(pedestrian,time+.001)
 assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<=.010001,'Espera não causa teleporte nas viradas')
}
console.log('PASS: pedestres aguardam nos destinos sem caminhar parados, saltos ou giro durante a espera')

const portraitWorld={width:972,height:648},portraitFit=320/972
assert.deepEqual(limitarVistaMapa({zoom:1,x:9999,y:9999},320,648,4,portraitWorld,portraitFit),{zoom:1,x:326,y:0},'Mapa grande permite explorar as laterais sem ultrapassar o cenário')
assert.deepEqual(limitarVistaMapa({zoom:portraitFit,x:999,y:999},320,648,4,portraitWorld,portraitFit),{zoom:portraitFit,x:0,y:0},'Ver tudo centraliza a planta inteira sem esticar')
const portraitAnchor={x:35,y:20},portraitZoom=aproximarMapa({zoom:1,x:0,y:0},2,portraitAnchor,320,648,4,portraitWorld,portraitFit)
assert.equal((portraitAnchor.x-portraitZoom.x)/portraitZoom.zoom,portraitAnchor.x)
assert.equal((portraitAnchor.y-portraitZoom.y)/portraitZoom.zoom,portraitAnchor.y)
console.log('PASS: mapa alto, limites laterais, vista inteira e zoom ancorado preservam proporção')

const {tempoVisualPartida}=await import('../src/escalacao/presidencia-partida-model.ts')
const {escalaNoGramado,CAMPO_MAPA}=await import('../src/escalacao/presidencia-partida-geometria.ts')
assert.equal(tempoVisualPartida({...state,visualClock:{seconds:10,sampledAt:1000,running:true}},2500),11.5)
assert.equal(tempoVisualPartida({...state,visualClock:{seconds:10,sampledAt:1000,running:false}},2500),10)
for(const field of [CAMPO_INTERNO,CAMPO_MAPA])for(const y of [0,.5,1]){
 const scale=escalaNoGramado(field,y)
 assert.ok(Math.abs(scale.ballDiameter/scale.athleteHeight-.22/(1.8*scale.verticalProjection))<1e-12,'Altura considera a inclinação; diâmetro esférico conserva a escala métrica')
 assert.ok(scale.athleteHeight>0)
}
console.log('PASS: relógio compartilhado e escala física comum para atletas e bola')

// Chegar ao destino também importa: recortar uma rota antes da parede evita
// atravessar o prédio, mas não pode deixar o visitante da loja preso na praça.
const businessKeys=['loja','hotel','chopp','praca','estacao','asfalto','estac']
for(let mask=0;mask<2**businessKeys.length;mask++){
 const stadium={inv:{grama:30,geral:40,cadeiras:90,visitante:120,camarote:150},ext:businessKeys.filter((_,i)=>mask&(1<<i))}
 const actors=atoresDoMapa(stadium),obstacles=obstaculosDoEstadio(stadium)
 for(const key of businessKeys.slice(0,5)){
  const visitor=actors.find(a=>a.id==='visitor-'+key)
  assert.equal(!!visitor,stadium.ext.includes(key),'Só estabelecimento comprado recebe visitante: '+key)
  if(!visitor)continue
  assert.deepEqual(visitor.path.points.at(-1),ROTAS_ESTADIO[visitor.route].points.at(-1),'Rota chega ao acesso mesmo com vizinhos: '+key+' '+mask)
  for(let i=1;i<visitor.path.points.length;i++)assert.ok(segmentoLivre(visitor.path.points[i-1],visitor.path.points[i],obstacles,raioCorpoAtor(visitor)),'Corpo inteiro passa pelo caminho do visitante')
 }
}
console.log('PASS: visitantes chegam aos cinco destinos nas 128 combinações de negócios, asfalto e estacionamento, sem atravessar volumes cadastrados')

for(const home of [true,false])for(const minute of [20,70])for(const outcome of ['defendeu','trave','fora','isolou']){
 const chance={id:'chance-local',home,minute,startedAt:1000,outcome},s={...state,minute,chance},right=home!==(minute>45)
 const start=quadroPartida(s,0,0,0),impact=quadroPartida(s,0,0,.6),end=quadroPartida(s,0,0,1.2)
 assert.ok(start.actors.some(p=>p.side===(home?'home':'away')&&!p.keeper&&p.x===start.ball.x&&p.y===start.ball.y),'Bola parte dos pés de um atleta da equipe correta')
 assert.equal(end.ball.inNet,false);assert.equal(end.homeScore,0);assert.equal(end.awayScore,0)
 if(outcome==='defendeu'||outcome==='trave')assert.ok(right?end.ball.x<impact.ball.x:end.ball.x>impact.ball.x,'Rebote volta para dentro do campo')
 if(outcome==='fora')assert.ok(Math.abs(end.ball.y-.5)>7.32/68/2,'Chute passa por fora da baliza')
 if(outcome==='isolou')assert.ok(end.ball.elevation>2.44,'Bola passa acima do travessão')
 const priority=quadroPartida({...s,goal:{...goal,phase:'confirmed'}},0,1,1)
 assert.equal(priority.ball.inNet,true,'Evento de gol tem prioridade sobre chance anterior')
}
console.log('PASS: chances herdadas do placar preservam lado, rebote, fora, altura e resultado, com prioridade do gol')

for(const paved of [false,true]){
 const actors=atoresDoMapa({inv:{grama:30,geral:40,cadeiras:90,visitante:120,camarote:50},ext:paved?['asfalto']:[]})
 const guard=actors.find(a=>a.kind==='security'),post=quadroAtor(guard,0)
 const exclusion=[{id:'posto-seguranca',polygon:[{x:post.x-2,y:post.y-2},{x:post.x+2,y:post.y-2},{x:post.x+2,y:post.y+2},{x:post.x-2,y:post.y+2}]}]
 for(const actor of actors.filter(a=>a.kind!=='security'))for(let i=1;i<actor.path.points.length;i++)assert.ok(segmentoLivre(actor.path.points[i-1],actor.path.points[i],exclusion,raioCorpoAtor(actor)),'Segurança não bloqueia torcedores, trabalhadores ou veículos')
}
console.log('PASS: posto do segurança fica fora da circulação com e sem asfalto, inclusive durante obras')

for(const ext of [[],['asfalto']]){
 const stadium={inv:{grama:30,geral:40,cadeiras:90,visitante:120,camarote:50},ext},obstacles=obstaculosDoEstadio(stadium)
 const actors=atoresDoMapa(stadium).filter(a=>a.lane)
 for(let seconds=0;seconds<600;seconds+=.1){
  const frames=actors.map(a=>quadroAtor(a,seconds))
  for(let i=0;i<actors.length;i++){
   const p=frames[i],next=quadroAtor(actors[i],seconds+.001)
   assert.ok(segmentoLivre(p,next,obstacles,raioCorpoAtor(actors[i])),'Faixas e curvas de retorno respeitam corpo e obstáculos')
   assert.ok(Math.hypot(next.x-p.x,next.y-p.y)<.02,'Não há salto lateral nos cantos ou ao retornar')
   for(let j=i+1;j<actors.length;j++)if(actors[i].route===actors[j].route)assert.ok(Math.hypot(p.x-frames[j].x,p.y-frames[j].y)>raioCorpoAtor(actors[i])+raioCorpoAtor(actors[j]),'Pedestres da mesma rota não atravessam uns aos outros')
  }
 }
}
console.log('PASS: dez minutos de circulação em dois sentidos, sem cruzar corpos nas rotas compartilhadas, sem salto no retorno e sem penetrar obstáculos cadastrados')

const streetActors=atoresDoMapa({inv:{grama:30,geral:40,cadeiras:90,visitante:120,camarote:150},ext:['asfalto']})
const pavement=streetActors.find(a=>a.route==='sidewalk')
for(const car of streetActors.filter(a=>a.kind==='car'&&a.route.startsWith('road'))){
 const laneSegments=car.path.points.slice(1).map((p,i)=>({id:'faixa-carro',polygon:[car.path.points[i],p]}))
 const clearance=raioCorpoAtor(car)+raioCorpoAtor(pavement)+(pavement.lane??0)
 for(let i=1;i<pavement.path.points.length;i++)assert.ok(segmentoLivre(pavement.path.points[i-1],pavement.path.points[i],laneSegments,clearance),'Calçada separa todo o corpo do pedestre da carroceria, inclusive nas curvas')
}
console.log('PASS: calçada conserva separação física das duas faixas de veículos ao longo de todo o trajeto')

// Regressão visual: a antiga via direita atravessava o estacionamento.
// Os lotes registrados na própria composição precisam ficar fora da via,
// mesmo enquanto ainda não foram comprados.
const {AREAS_MUNDO}=await import('../src/escalacao/presidencia-estadio-mundo.ts')
// parkingLeft inclui uma faixa de calçada no recorte da arte, portanto seu
// polígono de composição não serve como volume físico de estacionamento.
const privatePlots=['parkingRight','hotel','loja','praca'].map(id=>({id,polygon:AREAS_MUNDO[id].map(([x,y])=>({x,y}))}))
for(const actor of streetActors.filter(a=>a.route==='sidewalk'||a.route.startsWith('road'))){
 const route=actor.path.points,radius=raioCorpoAtor(actor)+(actor.lane??0)
 for(let i=1;i<route.length;i++)assert.ok(segmentoLivre(route[i-1],route[i],privatePlots,radius),`${actor.id}: via pública não corta estacionamento ou lote de negócio`)
}
console.log('PASS: tráfego público e calçada ficam fora do estacionamento direito e dos lotes comerciais, incluindo a margem do corpo')

const assistedGoal={...goal,assist:state.context.home[7].name}
const passStart=quadroPartida({...state,goal:assistedGoal},0,0),passEnd=quadroPartida({...state,goal:assistedGoal},0,.25)
const helper=passStart.actors.find(p=>p.name===assistedGoal.assist),finisher=passEnd.actors.find(p=>p.name===assistedGoal.name)
assert.equal(passStart.ball.x,helper.x);assert.equal(passStart.ball.y,helper.y)
assert.equal(passEnd.ball.x,finisher.x);assert.equal(passEnd.ball.y,finisher.y)
assert.equal(passEnd.homeScore,0);assert.equal(passEnd.ball.inNet,false)
assert.equal(quadroPartida({...state,goal:{...assistedGoal,phase:'confirmed'},homeScore:1},0,1).ball.inNet,true)
assert.deepEqual(quadroPartida({...state,goal:{...goal,assist:'nome ausente'}},0,.5).ball,quadroPartida({...state,goal},0,.5).ball,'Não inventa assistente ausente do XI')
console.log('PASS: assistência registrada parte do passador real, chega ao finalizador e conserva o instante de confirmação do gol')

for(let step=0;step<30;step++){
 for(const local of [.1,.5,2,2.7]){
  const frame=quadroPartida(state,step*2.8+local)
  assert.ok(frame.actors.some(p=>Math.hypot(p.x-frame.ball.x,p.y-frame.ball.y)<1e-10),'Domínio e recepção apoiam a bola nos pés de um atleta do XI')
  assert.equal(frame.ball.inNet,false);assert.equal(frame.homeScore,state.homeScore);assert.equal(frame.awayScore,state.awayScore)
 }
 const a=quadroPartida(state,(step+1)*2.8-.000001),b=quadroPartida(state,(step+1)*2.8+.000001)
 assert.ok(Math.hypot(a.ball.x-b.ball.x,a.ball.y-b.ball.y)<.000001,'Recepção e próximo passe não teleportam a bola')
}
const kickoff=quadroPartida({...state,minute:0},0)
assert.equal(kickoff.ball.x,.5);assert.equal(kickoff.ball.y,.5)
console.log('PASS: bola dominada/recebida nos pés, circulação contínua entre passes e saída no centro, sem alterar placar ou inventar gol')
