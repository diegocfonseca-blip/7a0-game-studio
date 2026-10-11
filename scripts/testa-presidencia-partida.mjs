await import('./testa-presidencia-evolucao.mjs')
import assert from 'node:assert/strict'
import fs from 'node:fs'
const {escalaValida,atletasEmCampo,quadroPartida,projetarCampo,progressoChute}=await import('../src/escalacao/presidencia-partida-model.ts')
const {segmentoLivre,caminhoSeguro,obstaculosDoEstadio}=await import('../src/escalacao/presidencia-estadio-navegacao.ts')
const {aproximarMapa,limitarVistaMapa,atoresDoMapa,raioCorpoAtor,quadroAtor,comprimentoRota}=await import('../src/escalacao/presidencia-estadio-mapa-model.ts')
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
