import assert from 'node:assert/strict'
import fs from 'node:fs'
import * as THREE from 'three'
import {atletasEmCampo} from '../src/escalacao/presidencia-partida-model.ts'
import {person,pose} from '../src/escalacao/presidencia-atleta-3d.ts'
import {criarSequenciaLance,amostrarSequenciaLance} from '../src/escalacao/presidencia-lance-sequencia.ts'
import {criarRelogioLance,ajustarRelogioLance,tempoLance} from '../src/escalacao/presidencia-lance-tempo.ts'
import {planejarFinalizacaoFutebol,amostrarFinalizacaoFutebol} from '../src/escalacao/presidencia-futebol-finalizacao.ts'

// Independent presentation acceptance test. Distances are measured in metres
// from sampled output, not inferred from the planner's requested destinations.
// The contact check uses the actual rendered boot mesh, not its anchor helper.
const output='test-results/futebol-3d/jogada-continua-20261016.json'
const report={limits:{bodySpeed:6,ballSpeed:36,turnSpeed:5.05,refereeSpeed:3.1,minimumSeparation:.63,ballRadius:.11},cases:[],integration:[],naturalPlanning:[],postEvent:[],visualReception:undefined,clockChecks:0,sampledFrames:0,failures:[]}
const team=side=>['GOL','LAT','LAT','ZAG','ZAG','MEI','MEI','MEI','ATA','ATA','ATA'].map((pos,i)=>({id:side+i,name:i===9||i===10?'Atacante homônimo':i===5||i===6?'Meia homônimo':`${side}${i}`,pos}))
const state={context:{id:'continuous-independent',home:team('h'),away:team('a')},minute:20,homeScore:0,awayScore:0,paused:false,finished:false,homeColor:'#1b7a3d',awayColor:'#c2452f'}
const originalState=JSON.stringify(state)
const body=person('#1b7a3d','#b9815b'),local=new THREE.Vector3(),nearest=new THREE.Vector3()
const bodyParts=[]
body.group.traverse(mesh=>{
 // The rendered silhouette is sculpted geometry; its semantic collision
 // identity survives that change without replacing real triangle checks.
 if(mesh.isMesh&&mesh.userData.bodyCollider)bodyParts.push({part:mesh.userData.bodyCollider,mesh})
})
const triangle=new THREE.Triangle(),spherePoint=new THREE.Vector3(),normal=new THREE.Vector3(),difference=new THREE.Vector3(),triangleClosest=new THREE.Vector3()
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)
const bodyDist=(a,b)=>Math.hypot(a.mx-b.mx,a.mz-b.mz)
const angle=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)))
const clone=value=>structuredClone(value)
const expectedKeys=atletasEmCampo(state).map(p=>p.key).sort()
const check=(condition,message,details)=>{if(!condition&&!report.failures.some(f=>f.case===activeCase&&f.message===message))report.failures.push({case:activeCase,message,...details})}
let activeCase='setup'

function fixture(right,kind){
 const sign=right?1:-1,side=right?'home':'away',prefix=right?'h':'a',opposite=right?'away':'home',other=right?'a':'h'
 const players=atletasEmCampo(state).map((p,i)=>({...p,mx:(i%11-5)*8,mz:p.side==='home'?-24:24,heading:(i%4)*Math.PI/2,distance:i*.23,speed:0,kick:0,throwing:0,control:0,save:0,dive:0}))
 for(const p of players)if(p.keeper){p.mx=p.side==='home'?-49:49;p.mz=0}
 const authorKey=`${side}:${prefix}10`,assistKey=`${side}:${prefix}6`
 const author=players.find(p=>p.key===authorKey),assist=players.find(p=>p.key===assistKey)
 Object.assign(author,{mx:-sign*12,mz:3,heading:-sign*Math.PI/2})
 Object.assign(assist,{mx:-sign*23,mz:-7,heading:Math.PI})
 let ball={x:-sign*31,y:.11,z:6}
 if(kind==='solo-wide'){Object.assign(author,{mx:sign*2,mz:-10});ball={x:-sign*9,y:.11,z:-29}}
 if(kind==='assisted-airborne'){Object.assign(author,{mx:sign*14,mz:12});ball={x:-sign*17,y:2.1,z:-14}}
 if(kind==='solo-marked'){
  Object.assign(author,{mx:-sign*8,mz:0,heading:sign*Math.PI/2})
  const marker=players.find(p=>p.key===`${opposite}:${other}4`)
  Object.assign(marker,{mx:-sign*6,mz:0,heading:-sign*Math.PI/2})
  ball={x:-sign*19,y:.11,z:-2}
 }
 if(kind==='keeper'){Object.assign(author,{mx:sign*22,mz:-6});ball={x:sign*11,y:.11,z:8}}
 let owner
 if(kind==='solo-owned'){
  Object.assign(author,{mx:-sign*4,mz:4,heading:sign*Math.PI/2})
  const marker=players.find(p=>p.key===`${opposite}:${other}4`)
  Object.assign(marker,{mx:-sign*2,mz:4,heading:-sign*Math.PI/2})
  owner=authorKey;ball={x:author.mx+Math.sin(author.heading)*.38-Math.cos(author.heading)*.065,y:.11,z:author.mz+Math.cos(author.heading)*.38+Math.sin(author.heading)*.065}
 }
 if(kind==='assisted-owned'){
  const source=players.find(p=>p.key===`${side}:${prefix}5`)
  Object.assign(source,{mx:-sign*34,mz:5,heading:sign*Math.PI/2})
  owner=source.key;ball={x:source.mx+Math.sin(source.heading)*.38-Math.cos(source.heading)*.065,y:.11,z:source.mz+Math.cos(source.heading)*.38+Math.sin(source.heading)*.065}
 }
 const frame={players,ball,phase:owner?'dominio':'passe',...(owner?{owner}:{}),referee:{x:0,z:14,heading:0,distance:2,speed:0},time:17.25}
 const assisted=kind.startsWith('assisted')
 const outcome=({'assisted-central':'goal','solo-wide':'isolou','assisted-airborne':'trave','solo-marked':'fora',keeper:'defendeu','solo-owned':'goal','assisted-owned':'goal'})[kind]
 return {frame,options:{authorKey,...(assisted?{assistKey}:{}),right,outcome,id:`continuous-${right}-${kind}`}}
}

function bootSurfaceDistance(player,ball){
 pose(body,player);body.group.updateMatrixWorld(true)
 let distance=Infinity
 for(const leg of body.legs){
  if(!leg.boot.geometry.boundingBox)leg.boot.geometry.computeBoundingBox()
  const box=leg.boot.geometry.boundingBox
  local.set(ball.x,ball.y,ball.z);leg.boot.worldToLocal(local)
  nearest.copy(local).clamp(box.min,box.max)
  distance=Math.min(distance,nearest.distanceTo(local))
 }
 return distance
}

// The torso and rounded shorts are convex meshes, not boxes. Compare the
// sphere to their real world-space triangles, and treat a centre inside the
// solid as penetrating even if it is farther than its radius from a surface.
function meshClearance(mesh,ball){
 const positions=mesh.geometry.attributes.position,indices=mesh.geometry.index
 let minimum=Infinity,inside=true
 spherePoint.set(ball.x,ball.y,ball.z)
 for(let i=0;i<(indices?.count??positions.count);i+=3){
  const vertex=(to,k)=>to.fromBufferAttribute(positions,indices?indices.getX(i+k):i+k).applyMatrix4(mesh.matrixWorld)
  vertex(triangle.a,0);vertex(triangle.b,1);vertex(triangle.c,2)
  if(triangle.getArea()<1e-12)continue // duplicated capsule pole vertices
  triangle.getNormal(normal)
  if(normal.dot(difference.subVectors(spherePoint,triangle.a))>1e-8)inside=false
  triangle.closestPointToPoint(spherePoint,triangleClosest)
  minimum=Math.min(minimum,spherePoint.distanceTo(triangleClosest))
 }
 return inside?0:minimum
}
function bodySurfaceDistance(player,ball){
 pose(body,player);body.group.updateMatrixWorld(true)
 let result={part:'',distance:Infinity}
 for(const {part,mesh} of bodyParts){const distance=meshClearance(mesh,ball);if(distance<result.distance)result={part,distance}}
 return result
}
pose(body,{mx:0,mz:0,heading:0,distance:0,speed:0,kick:0,throwing:0});body.group.updateMatrixWorld(true)
assert.equal(bodyParts.length,4)
for(const {mesh} of bodyParts){const center=mesh.getWorldPosition(new THREE.Vector3());assert.equal(meshClearance(mesh,center),0,'The collision test recognises a sphere centre inside each solid body part')}

function assertOrigin(frame,first){
 check(dist(first.ball,frame.ball)<1e-4,'A sequência começa na bola visível, sem reposicionamento',{from:frame.ball,to:first.ball})
 for(const p of frame.players){
  const found=first.players.find(a=>a.key===p.key)
  check(!!found,'Todos os jogadores originais permanecem no quadro',{key:p.key})
  if(!found)continue
  check(bodyDist(found,p)<1e-4,'Nenhum participante salta para uma marca de início',{key:p.key,metres:bodyDist(found,p)})
  check(angle(found.heading,p.heading)<1e-4,'A orientação inicial é preservada',{key:p.key,radians:angle(found.heading,p.heading)})
 }
}

function clockChecks(sequence){
 const at=t=>amostrarSequenciaLance(sequence,t)
 const target=sequence.shotStartMs*.61
 for(const rate of [.25,.5,1,2,4,8]){
  const clock=criarRelogioLance(1000,rate,true)
  const wall=1000+target/rate
  assert.ok(Math.abs(tempoLance(clock,wall)-target)<1e-8)
  const before=at(tempoLance(clock,wall))
  ajustarRelogioLance(clock,wall,rate,false)
  assert.deepEqual(at(tempoLance(clock,wall+3600000)),before,'Pause freezes the whole frame, not only the ball')
  ajustarRelogioLance(clock,wall+3600000,8/rate>8?8:8/rate,true)
  const resumeRate=clock.rate,elapsed=target+123
  assert.ok(Math.abs(tempoLance(clock,wall+3600000+123/resumeRate)-elapsed)<1e-7)
  const after=at(tempoLance(clock,wall+3600000+123/resumeRate)),expected=at(elapsed)
  // Large wall-clock values can differ by fractions of a nanosecond. Compare
  // geometry rather than requiring identical final IEEE-754 bits.
  assert.ok(dist(after.ball,expected.ball)<1e-7)
  for(let i=0;i<after.players.length;i++)assert.ok(bodyDist(after.players[i],expected.players[i])<1e-7)
  report.clockChecks++
 }
 // Frequent sampling by the map must not change a delayed room camera's frame.
 const expected=at(sequence.durationMs*.83)
 for(let i=0;i<=100;i++)at(sequence.durationMs*i/100)
 assert.deepEqual(at(sequence.durationMs*.83),expected,'Sampling order never advances shared mutable physics')
}

for(const right of [true,false])for(const kind of ['assisted-central','solo-wide','assisted-airborne','solo-marked','keeper','solo-owned','assisted-owned']){
 activeCase=`${right?'direita':'esquerda'}:${kind}`
 const {frame,options}=fixture(right,kind),source=JSON.stringify(frame)
 const entry={case:activeCase,options,initialBall:frame.ball,frames:0,maxBodySpeed:0,maxBallSpeed:0,maxTurnSpeed:0,maxRefereeSpeed:0,maxRefereeTurnSpeed:0,minSeparation:Infinity,minRefereeSeparation:Infinity,maxControlledDistance:0,maxBootPenetration:0,bootChecks:0,maxBodyPenetration:0,bodyChecks:0,authorTravel:0,assistTravel:0,contacts:[],boundaries:[]}
 report.cases.push(entry)
 try{
  // This fixture itself must start physically valid, so a separation failure
  // cannot be blamed on initially superimposed player centres.
  for(let i=0;i<frame.players.length;i++)for(let j=i+1;j<frame.players.length;j++)assert.ok(bodyDist(frame.players[i],frame.players[j])>=.63)
  const supplied=clone(frame),sequence=criarSequenciaLance(supplied,options)
  assert.equal(JSON.stringify(supplied),source,'The planner must not mutate the supplied initial frame')
  assert.ok(sequence&&Number.isFinite(sequence.durationMs)&&sequence.durationMs>0&&sequence.durationMs<120000,'The sequence has a finite bounded duration')
  assert.ok(sequence.shotStartMs>0&&sequence.shotStartMs<sequence.durationMs,'The shot follows preparation and precedes impact')
  assert.ok(Array.isArray(sequence.boundaries)&&sequence.boundaries.length>0)
  const endMs=Math.max(sequence.durationMs,...sequence.boundaries.map(p=>p.endMs))
  entry.durationMs=sequence.durationMs;entry.endMs=endMs;entry.shotStartMs=sequence.shotStartMs;entry.boundaries=sequence.boundaries
  const first=amostrarSequenciaLance(sequence,0)
  assertOrigin(frame,first)
  assert.deepEqual(first.players.map(p=>p.key).sort(),expectedKeys)
  const periods=sequence.boundaries
  const passes=periods.filter(p=>p.kind==='pass'),pass=passes.at(-1),shot=periods.find(p=>p.kind==='shoot')
  const preparatoryPass=frame.owner&&frame.owner!==(options.assistKey??options.authorKey)
  check(!!shot,'Há uma fase explícita de finalização')
  check(periods.some(p=>p.kind==='receive'),'O jogador domina a bola antes de finalizar')
  check(periods.some(p=>p.kind==='carry'),'Há condução antes da finalização')
  check(passes.length===(options.assistKey?1:0)+(preparatoryPass?1:0),'Passes usam quem já tinha a posse e o assistente real')
  if(pass)check(pass.startMs<sequence.shotStartMs&&pass.endMs<=sequence.shotStartMs,'A assistência termina antes do chute')
  for(const period of periods){
   check(Number.isFinite(period.startMs)&&Number.isFinite(period.endMs)&&period.endMs>=period.startMs,'Fases possuem intervalo válido',{period})
   check(period.startMs>=0&&(period.kind==='impact'||period.endMs<=sequence.durationMs+1e-5),'Somente reação após impacto ultrapassa o instante do resultado',{period})
  }
  // Include ±1 ms around every phase boundary; 60 Hz alone can hide a small
  // instantaneous teleport under an apparently acceptable average speed.
  const times=new Set([0,endMs,sequence.durationMs,sequence.shotStartMs])
  for(let t=1000/60;t<endMs;t+=1000/60)times.add(t)
  for(const period of periods)for(const boundary of [period.startMs,period.endMs])for(const offset of [-1,0,1])if(boundary+offset>=0&&boundary+offset<=endMs)times.add(boundary+offset)
  const ordered=[...times].sort((a,b)=>a-b).filter((t,i,a)=>i===0||t-a[i-1]>.001)
  const travelled=new Map(frame.players.map(p=>[p.key,0]))
  let previous=first,previousTime=0
  for(const t of ordered){
   const sample=amostrarSequenciaLance(sequence,t),dt=(t-previousTime)/1000
   const sequencePhase=periods.find(b=>t>=b.startMs&&t<b.endMs)?.kind??'boundary'
   entry.frames++;report.sampledFrames++
   check(Number.isFinite(sample.ball.x+sample.ball.y+sample.ball.z),'Bola sempre possui coordenadas finitas',{t,ball:sample.ball})
   check(sample.ball.y>=.11-1e-4,'Bola não atravessa o gramado',{t,y:sample.ball.y})
   if(dt>0){
    const v=dist(sample.ball,previous.ball)/dt;entry.maxBallSpeed=Math.max(entry.maxBallSpeed,v)
    check(v<=report.limits.ballSpeed,'Bola não teletransporta entre fases',{t,speed:v,from:previous.ball,to:sample.ball})
    const refereeSpeed=Math.hypot(sample.referee.x-previous.referee.x,sample.referee.z-previous.referee.z)/dt
    const refereeTurnSpeed=angle(sample.referee.heading,previous.referee.heading)/dt
    entry.maxRefereeSpeed=Math.max(entry.maxRefereeSpeed,refereeSpeed);entry.maxRefereeTurnSpeed=Math.max(entry.maxRefereeTurnSpeed,refereeTurnSpeed)
    check(refereeSpeed<=report.limits.refereeSpeed,'Árbitro segue a jogada sem teletransporte',{t,speed:refereeSpeed})
    check(refereeTurnSpeed<=report.limits.turnSpeed,'Árbitro muda de orientação gradualmente',{t,radiansPerSecond:refereeTurnSpeed})
   }
   check(sample.players.length===22,'São onze jogadores de cada lado em todos os quadros',{t,count:sample.players.length})
   for(let i=0;i<sample.players.length;i++){
    const p=sample.players[i],prev=previous.players.find(a=>a.key===p.key)
    check(!!prev,'Identidade não muda durante a sequência',{t,key:p.key})
    check(Number.isFinite(p.mx+p.mz+p.heading+p.distance+p.speed),'Corpos sempre possuem coordenadas finitas',{t,key:p.key})
    if(['pass','receive'].includes(sequencePhase)&&sample.ball.y<1.65&&Math.hypot(sample.ball.x-p.mx,sample.ball.z-p.mz)<1.2){
     const contact=bodySurfaceDistance(p,sample.ball),penetration=Math.max(0,.11-contact.distance)
     entry.bodyChecks++
     if(penetration>entry.maxBodyPenetration){entry.maxBodyPenetration=penetration;entry.worstBodyPenetration={t,key:p.key,phase:sequencePhase,part:contact.part,metres:penetration,ball:sample.ball}}
     check(penetration<=1e-4,'Passe e recepção não atravessam tronco ou shorts',{t,key:p.key,phase:sequencePhase,part:contact.part,metres:penetration,ball:sample.ball})
    }
    if(t<=sequence.shotStartMs&&sample.ball.y<.3&&Math.hypot(sample.ball.x-p.mx,sample.ball.z-p.mz)<1){
     const clearance=bootSurfaceDistance(p,sample.ball),penetration=Math.max(0,.11-clearance)
     const period=sequencePhase
     entry.bootChecks++
     if(penetration>entry.maxBootPenetration){entry.maxBootPenetration=penetration;entry.worstBootPenetration={t,key:p.key,phase:period,metres:penetration,ball:sample.ball}}
     check(penetration<=1e-4,'Esfera não penetra o volume da chuteira durante preparação, recepção e condução',{t,key:p.key,phase:period,metres:penetration})
    }
    const refereeDistance=Math.hypot(p.mx-sample.referee.x,p.mz-sample.referee.z)
    entry.minRefereeSeparation=Math.min(entry.minRefereeSeparation,refereeDistance)
    check(refereeDistance>=report.limits.minimumSeparation,'Árbitro não atravessa jogadores',{t,key:p.key,metres:refereeDistance})
    if(prev&&dt>0){
     const d=bodyDist(p,prev),v=d/dt,w=angle(p.heading,prev.heading)/dt
     entry.maxBodySpeed=Math.max(entry.maxBodySpeed,v);entry.maxTurnSpeed=Math.max(entry.maxTurnSpeed,w)
     travelled.set(p.key,(travelled.get(p.key)??0)+d)
     check(v<=report.limits.bodySpeed,'Jogador não teletransporta nem excede corrida humana contratada',{t,key:p.key,speed:v})
     check(w<=report.limits.turnSpeed,'Orientação não muda instantaneamente',{t,key:p.key,radiansPerSecond:w})
     check(p.distance>=prev.distance-1e-4,'Passada não rebobina enquanto o corpo avança',{t,key:p.key,before:prev.distance,after:p.distance})
    }
    for(let j=i+1;j<sample.players.length;j++){
     const d=bodyDist(p,sample.players[j]);entry.minSeparation=Math.min(entry.minSeparation,d)
     check(d>=report.limits.minimumSeparation,'Centros dos jogadores não se sobrepõem',{t,a:p.key,b:sample.players[j].key,metres:d})
    }
   }
   if(sample.owner){
    const p=sample.players.find(p=>p.key===sample.owner)
    check(!!p,'Posse pertence a um jogador que está em campo',{t,owner:sample.owner})
    if(p){const d=Math.hypot(sample.ball.x-p.mx,sample.ball.z-p.mz);entry.maxControlledDistance=Math.max(entry.maxControlledDistance,d);check(d<=.85,'Bola sob controle continua ao alcance dos pés',{t,owner:p.key,metres:d})}
   }
   previous=sample;previousTime=t
  }
  for(const key of [options.authorKey,options.assistKey].filter(Boolean)){
   const distance=travelled.get(key),initial=frame.players.find(p=>p.key===key),last=previous.players.find(p=>p.key===key)
   check(distance>.5,'Participante se desloca na jogada, em vez de ficar congelado',{key,metres:distance})
   check(last.distance-initial.distance>=distance-.1,'Animação da passada acompanha a distância real percorrida',{key,physical:distance,animated:last.distance-initial.distance})
   if(key===options.authorKey)entry.authorTravel=distance;else entry.assistTravel=distance
  }
  for(const contact of [{kind:'shoot',time:sequence.shotStartMs,key:options.authorKey},...(pass&&options.assistKey?[{kind:'pass',time:pass.startMs,key:options.assistKey}]:[]),...(preparatoryPass&&passes.length?[{kind:'prepare-pass',time:passes[0].startMs,key:frame.owner}]:[])]){
   const sample=amostrarSequenciaLance(sequence,contact.time),p=sample.players.find(p=>p.key===contact.key)
   assert.ok(p,'The intended ID is present at contact')
   const metres=bootSurfaceDistance(p,sample.ball)
   entry.contacts.push({...contact,metres,kick:p.kick})
   check(Math.abs(metres-.11)<1e-4,'A bola toca o volume real da chuteira no passe/chute',{...contact,metres})
   check(p.kick>=.25,'O autor do toque executa a pose de chute no contato',{...contact,kick:p.kick})
  }
  const end=amostrarSequenciaLance(sequence,sequence.durationMs),sign=right?1:-1
  if(options.outcome==='goal'){
   check(Math.abs(sign*end.ball.x-.11-52.5)<1e-3,'Gol ocorre quando a bola inteira cruza a linha',{ball:end.ball})
   check(Math.abs(end.ball.z)+.11<3.66&&end.ball.y+.11<2.44,'Bola do gol cabe entre os postes e abaixo do travessão',{ball:end.ball})
  }
  if(options.outcome==='fora')check(Math.abs(end.ball.z)-.11>3.66,'Chute para fora passa ao lado da baliza',{ball:end.ball})
  if(options.outcome==='isolou')check(end.ball.y-.11>2.44,'Chute alto passa acima do travessão',{ball:end.ball})
  if(options.outcome==='defendeu'){
   const author=frame.players.find(p=>p.key===options.authorKey),keeper=end.players.find(p=>p.keeper&&p.side!==author.side)
   pose(body,keeper);body.group.updateMatrixWorld(true)
   const gloves=body.hands[0].getWorldPosition(new THREE.Vector3()).add(body.hands[1].getWorldPosition(new THREE.Vector3())).multiplyScalar(.5)
   const metres=gloves.distanceTo(new THREE.Vector3(end.ball.x,end.ball.y,end.ball.z))
   check(metres<1e-4,'Defesa termina nas mãos visíveis do goleiro',{metres})
   entry.gloveContact=metres
  }
  clockChecks(sequence)
  // Rebuilding from the same arbitrary initial state must not depend on a
  // previous camera's sampling history or the global motor cache.
  const repeated=criarSequenciaLance(clone(frame),options)
  assert.equal(repeated.durationMs,sequence.durationMs)
  for(const fraction of [0,.17,.53,.91,1])assert.deepEqual(amostrarSequenciaLance(repeated,repeated.durationMs*fraction),amostrarSequenciaLance(sequence,sequence.durationMs*fraction))
  assert.equal(JSON.stringify(frame),source,'The input frame must not be changed')
 }catch(error){report.failures.push({case:activeCase,message:error.message,stack:error.stack})}
}
// The public identity contract uses scorerId/assistId. Display names alone
// deliberately collide in this roster, so the integrated path must select IDs.
const {MotorFutebol,planejarLanceFutebol,quadroFutebol3D}=await import('../src/escalacao/presidencia-futebol-motor.ts')
for(const home of [true,false]){
 activeCase=`integracao:${home?'casa':'fora'}`
 try{
  const prefix=home?'h':'a',side=home?'home':'away',now=40000
  const match={...state,context:{...state.context,id:activeCase},visualClock:{seconds:20,sampledAt:now,running:false}}
  const event={id:`event-${home}`,home,minute:20,scorerId:prefix+'10',assistId:prefix+'6',name:'Atacante homônimo',assist:'Meia homônimo',phase:'shot',startedAt:now}
  const before=JSON.stringify(match),plan=planejarLanceFutebol(match,event,now)
  assert.ok(plan?.sequence,'The integrated planner must supply the continuous sequence')
  assert.equal(plan.author.key,`${side}:${prefix}10`)
  assert.equal(plan.assist.key,`${side}:${prefix}6`)
  const motor=new MotorFutebol(match),clock=criarRelogioLance(now),live={...match,goal:{...event,plan,clock}}
  motor.sample(match,20,now)
  for(const elapsed of [0,plan.sequence.shotStartMs,plan.durationMs-1,plan.durationMs,plan.durationMs+1]){
   const displayed=motor.sample(live,20+elapsed/1000,now+elapsed),expected=amostrarSequenciaLance(plan.sequence,elapsed)
   assert.ok(dist(displayed.ball,expected.ball)<1e-7,'The integrated ball follows the exact shared sequence')
   assert.deepEqual(displayed.players.map(p=>p.key),expected.players.map(p=>p.key),'The integrated bodies preserve the same real identities')
   for(let i=0;i<displayed.players.length;i++)for(const field of ['mx','mz','heading','distance','speed','kick','control','save','dive'])assert.ok(Math.abs((displayed.players[i][field]??0)-(expected.players[i][field]??0))<1e-7,`The integrated bodies follow the same sequence as the ball: ${field}`)
   if(elapsed===plan.durationMs){
    const confirmed=motor.sample({...live,goal:{...live.goal,phase:'confirmed'}},20+elapsed/1000,now+elapsed)
    assert.ok(dist(confirmed.ball,displayed.ball)<1e-7,'Score confirmation cannot move the ball')
    for(let i=0;i<confirmed.players.length;i++)for(const field of ['mx','mz','heading','distance','speed','kick','control','save','dive'])assert.ok(Math.abs((confirmed.players[i][field]??0)-(displayed.players[i][field]??0))<1e-7,'Score confirmation cannot reposition players')
   }
  }
  const shot=amostrarSequenciaLance(plan.sequence,plan.sequence.shotStartMs),author=shot.players.find(p=>p.key===plan.author.key)
  assert.ok(Math.abs(bootSurfaceDistance(author,shot.ball)-.11)<1e-4,'The real scoring ID executes the physical strike')
  assert.equal(JSON.stringify(match),before,'The integrated presentation leaves competition state untouched')
  report.integration.push({home,author:plan.author.key,assist:plan.assist.key,durationMs:plan.durationMs})
 }catch(error){report.failures.push({case:activeCase,message:error.message,stack:error.stack})}
}
// A light coverage probe for the concrete fallback found at 20 s. It builds
// plans from natural match snapshots; the dense physical loops above are not
// repeated. Timing excludes the cost of advancing the initial natural match.
for(const seconds of [0,10,20,40,60])for(const home of [true,false]){
 activeCase=`natural:${seconds}:${home?'casa':'fora'}`
 try{
  const prefix=home?'h':'a',side=home?'home':'away',now=100000
  const match={...state,context:{...state.context,id:activeCase},visualClock:{seconds,sampledAt:now,running:false}}
  const event={id:activeCase,home,minute:20,scorerId:prefix+'10',assistId:prefix+'6',name:'Atacante homônimo',assist:'Meia homônimo'}
  const startSnapshot=performance.now(),frame=quadroFutebol3D(match,now),snapshotMs=performance.now()-startSnapshot
  const startPlan=performance.now(),plan=planejarLanceFutebol(match,event,now),planningMs=performance.now()-startPlan
  const sequence=plan?.sequence
  const result={seconds,home,owner:frame.owner,snapshotMs,planningMs,continuous:!!sequence,bytes:sequence?.bytes,storedFrames:sequence?.frames.length,durationMs:plan?.durationMs}
  if(!sequence){
   result.fallbackReason='Helper did not return a sequence: an unfinished route/stage or the cumulative time limit rejected the physical plan; no stage diagnostic is exposed.'
   result.origin={ball:frame.ball,author:frame.players.find(p=>p.key===`${side}:${prefix}10`),assist:frame.players.find(p=>p.key===`${side}:${prefix}6`)}
  }
  report.naturalPlanning.push(result)
  check(!!sequence,'Snapshot natural usa sequência física, sem cair no plano legado',{seconds,home,planningMs})
  if(sequence){
   assert.equal(plan.author.key,`${side}:${prefix}10`)
   assert.equal(plan.assist.key,`${side}:${prefix}6`)
   assert.ok(Number.isFinite(sequence.bytes)&&sequence.bytes>0)
  }
 }catch(error){report.failures.push({case:activeCase,message:error.message,stack:error.stack})}
}
// Persist the exact visual regression: the h5 -> h10 pass approached the back
// of the receiver and crossed his shorts 109 ms before the final reception.
activeCase='recepcao-visual-h5-h10'
try{
 const visualTeam=side=>team(side).map((p,i)=>({...p,name:`${side==='h'?'Mandante':'Visitante'} ${i+1}`}))
 const bench=side=>['GOL','ZAG','LAT','MEI','MEI','ATA','ATA'].map((pos,i)=>({id:side+'b'+i,name:'Reserva '+side+i,pos}))
 const match={...state,context:{id:'qa-continuo-16',homeClubId:17,home:visualTeam('h'),away:visualTeam('a'),homeBench:bench('h'),awayBench:bench('a')},paused:true,visualClock:{seconds:20,sampledAt:10000,running:false}}
 const event={id:'qa-assist-goal',home:true,name:'Mandante 11',scorerId:'h10',assistId:'h5',assist:'Mandante 6',minute:20,startedAt:10000,phase:'shot'}
 const plan=planejarLanceFutebol(match,event,10000)
 assert.ok(plan?.sequence)
 const pass=plan.sequence.boundaries.filter(b=>b.kind==='pass').at(-1),receive=plan.sequence.boundaries.filter(b=>b.kind==='receive').at(-1)
 const result={context:match.context.id,event:event.id,author:plan.author.key,assist:plan.assist.key,pass,receive,checks:0,maxPenetration:0,minimumSurfaceDistance:Infinity,maxBallSpeed:0}
 let previous
 for(let t=pass.startMs;t<=receive.endMs;t+=1000/240){
  const frame=amostrarSequenciaLance(plan.sequence,t),p=frame.players.find(p=>p.key===plan.author.key)
  if(previous)result.maxBallSpeed=Math.max(result.maxBallSpeed,dist(frame.ball,previous.ball)*240)
  if(frame.ball.y<1.65&&Math.hypot(frame.ball.x-p.mx,frame.ball.z-p.mz)<1.2){
   const contact=bodySurfaceDistance(p,frame.ball),penetration=Math.max(0,.11-contact.distance)
   result.checks++;result.minimumSurfaceDistance=Math.min(result.minimumSurfaceDistance,contact.distance)
   if(penetration>result.maxPenetration){result.maxPenetration=penetration;result.worst={t,part:contact.part,metres:penetration,ball:frame.ball,player:{mx:p.mx,mz:p.mz,heading:p.heading}}}
   check(penetration<=1e-4,'Regressão visual: assistência não atravessa o quadril do finalizador',{t,part:contact.part,metres:penetration,ball:frame.ball})
  }
  previous=frame
 }
 result.referenceFrames=[15455,receive.startMs-120].map(t=>{
  const frame=amostrarSequenciaLance(plan.sequence,t),p=frame.players.find(p=>p.key===plan.author.key),contact=bodySurfaceDistance(p,frame.ball)
  check(contact.distance>=.11-1e-4,'Quadros visuais de referência mantêm a esfera fora do corpo',{t,part:contact.part,distance:contact.distance})
  return {t,ball:frame.ball,player:{mx:p.mx,mz:p.mz,heading:p.heading},part:contact.part,distance:contact.distance,clearance:contact.distance-.11}
 })
 check(result.maxBallSpeed<=36,'Correção da recepção preserva velocidade contínua da bola',{speed:result.maxBallSpeed})
 report.visualReception=result
}catch(error){report.failures.push({case:activeCase,message:error.message,stack:error.stack})}

// Removing the event after 1.3 s, or a delayed 5 s read, cannot freeze a rebound.
// Compare against the independent finishing sampler only until real reception
// or a boundary restart takes over. This is not another full match simulation.
for(const home of [true,false])for(const surface of ['poste','travessao'])for(const afterImpactMs of [1300,5000]){
 activeCase=`rebote-apos-evento:${home}:${surface}:${afterImpactMs}`
 try{
  let id
  for(let i=0;i<100;i++){
   const candidate=`continuity-rebound-${home}-${i}`,plan=planejarFinalizacaoFutebol(candidate,'trave',home,{x:0,y:.11,z:0})
   if(surface==='travessao'?plan.surface==='travessao':plan.surface.startsWith('poste')){id=candidate;break}
  }
  assert.ok(id,'A deterministic incident ID must cover each rebound surface')
  const now=30000,prefix=home?'h':'a',match={...state,context:{...state.context,id:activeCase},visualClock:{seconds:20,sampledAt:now,running:false}}
  const event={id,home,minute:20,scorerId:prefix+'10',name:'Atacante homônimo',outcome:'trave',startedAt:now}
  const plan=planejarLanceFutebol(match,event,now)
  assert.ok(plan?.sequence&&plan.finishing)
  const motor=new MotorFutebol(match),clock=criarRelogioLance(now),live={...match,chance:{...event,plan,clock}}
  motor.sample(match,20,now);motor.sample(live,20,now)
  const removeAt=plan.durationMs+afterImpactMs,time=20+removeAt/1000
  let previous=motor.sample(live,time,now+removeAt)
  const released=motor.sample(match,time,now+removeAt)
  assert.ok(dist(previous.ball,released.ball)<1e-7,'Removing the event preserves its visible ball')
  assert.ok(motor.looseShot,'A post/bar rebound remains a free moving shot after event removal')
  const continuationElapsed=motor.looseShot.elapsedMs
  previous=released
  let maxBallSpeed=0,maxAnalyticError=0,frames=0,travelled=0
  for(let i=1;i<=180;i++){
   const frame=motor.sample(match,time+i/60,now+removeAt+i*1000/60),distance=dist(frame.ball,previous.ball),speed=distance*60
   maxBallSpeed=Math.max(maxBallSpeed,speed);travelled+=distance;frames++
   assert.ok(speed<=36,'A free rebound cannot jump after narration has ended')
   assert.ok(frame.ball.y>=.11-1e-7,'A rebound stays above the grass')
   if(!motor.looseShot){previous=frame;break}
   const expected=amostrarFinalizacaoFutebol(plan.finishing,continuationElapsed+i*1000/60)
   const error=dist(frame.ball,expected);maxAnalyticError=Math.max(maxAnalyticError,error)
   assert.ok(error<1e-6,'The visible rebound keeps its analytic momentum until reception/out')
   assert.deepEqual(motor.sample(match,time+i/60,now+removeAt+i*1000/60+5000).ball,frame.ball,'A paused visual time freezes the loose shot too')
   previous=frame
  }
  assert.ok(travelled>.1,'The rebound must visibly continue rather than freeze in the air')
  report.postEvent.push({home,surface:plan.finishing.surface,afterImpactMs,continuationElapsed,frames,travelled,maxBallSpeed,maxAnalyticError,finalPhase:previous.phase,stillLoose:!!motor.looseShot})
 }catch(error){report.failures.push({case:activeCase,message:error.message,stack:error.stack})}
}
activeCase='defesa-espalmada-lado-escanteio'
try{
 const now=30000,match={...state,context:{...state.context,id:activeCase},visualClock:{seconds:0,sampledAt:now,running:false}}
 const event={id:'audit-save:0:true:0',home:true,minute:20,scorerId:'h10',name:'Atacante homônimo',outcome:'defendeu',startedAt:now}
 const plan=planejarLanceFutebol(match,event,now)
 assert.ok(plan?.sequence?.parry,'This fixed incident is a parry, not a catch')
 const motor=new MotorFutebol(match),live={...match,chance:{...event,plan,clock:criarRelogioLance(now)}}
 motor.sample(match,0,now);motor.sample(live,0,now)
 const removeAt=plan.durationMs+1300,time=removeAt/1000,before=motor.sample(live,time,now+removeAt)
 const after=motor.sample(match,time,now+removeAt)
 assert.ok(dist(before.ball,after.ball)<1e-7,'A parry-to-corner transition preserves the visible ball')
 assert.equal(after.phase,'escanteio')
 assert.ok(before.ball.z<0,'This fixture covers the formerly broken negative-z corner')
 assert.equal(motor.restart.point.z,Math.sign(before.ball.z||1)*34,'The corner is taken on the same side where the parry left the pitch')
 assert.equal(motor.restart.side,'home','The attacking team keeps the corner')
 report.postEvent.push({kind:'parry-corner',ball:before.ball,corner:motor.restart.point,side:motor.restart.side})
}catch(error){report.failures.push({case:activeCase,message:error.message,stack:error.stack})}
assert.equal(JSON.stringify(state),originalState,'Presentation cannot write competition scores, players or statistics')
fs.mkdirSync('test-results/futebol-3d',{recursive:true})
fs.writeFileSync(output,JSON.stringify(report,null,2))
if(report.failures.length){
 console.error(JSON.stringify(report.failures,null,2))
 throw new Error(`${report.failures.length} independent continuity criteria failed; see ${output}`)
}
console.log(`PASS: ${report.cases.length} arbitrary-origin plays, ${report.sampledFrames} frames, ${report.clockChecks} pause/rate checks, ${report.integration.length} integrated ID/score checks, ${report.naturalPlanning.length} natural planning snapshots and ${report.postEvent.length} post-event checks. Report: ${output}`)
