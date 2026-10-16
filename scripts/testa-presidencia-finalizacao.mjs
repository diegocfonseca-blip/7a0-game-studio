import assert from 'node:assert/strict'
import fs from 'node:fs'
import {planejarFinalizacaoFutebol,amostrarFinalizacaoFutebol,duracaoFinalizacaoFutebol} from '../src/escalacao/presidencia-futebol-finalizacao.ts'

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z
const length=v=>Math.hypot(v.x,v.y,v.z)
const close=(a,b,label)=>assert.ok(Math.abs(a-b)<1e-7,`${label}: ${a} / ${b}`)
const outcomes=['goal','fora','isolou','trave','defendeu']
const origins=[{x:18,y:.11,z:0},{x:34,y:.11,z:-19},{x:40,y:.11,z:21}]
const surfaces=new Map(),goalSides=new Set(),wideSides=new Set(),goalHeights=new Set()
let plans=0,samples=0,maxSpeed=0,minPostClearance=Infinity,minBarClearance=Infinity
for(let id=0;id<384;id++)for(const outcome of outcomes)for(const origin of origins){
 const key=`league:round:minute:${id}:author:${id%22}`
 const original=JSON.stringify(origin),plan=planejarFinalizacaoFutebol(key,outcome,true,origin)
 assert.equal(JSON.stringify(origin),original,'planning does not mutate the input')
 assert.deepEqual(planejarFinalizacaoFutebol(key,outcome,true,origin),plan,'same ID and geometry produce the same finalization')
 assert.equal(plan.outcome,outcome,'the presentation never changes an authoritative result')
 const mirroredFrom={x:-origin.x,y:origin.y,z:-origin.z}
 const mirror=planejarFinalizacaoFutebol(key,outcome,false,mirroredFrom)
 close(mirror.target.x,-plan.target.x,'target x rotates with attack direction')
 close(mirror.target.z,-plan.target.z,'target z rotates with attack direction')
 close(mirror.target.y,plan.target.y,'height is independent of attack direction')
 close(mirror.shotMs,plan.shotMs,'the half change does not alter duration')
 assert.equal(mirror.surface,plan.surface)
 if(plan.rebound){
  close(mirror.rebound.normal.x,-plan.rebound.normal.x,'normal x rotates')
  close(mirror.rebound.normal.z,-plan.rebound.normal.z,'normal z rotates')
  close(mirror.rebound.normal.y,plan.rebound.normal.y,'normal y remains vertical')
 }
 for(const [candidate,sign] of [[plan,1],[mirror,-1]]){
  plans++;surfaces.set(candidate.surface,(surfaces.get(candidate.surface)??0)+1)
  assert.equal(distance(amostrarFinalizacaoFutebol(candidate,0),candidate.from),0,'the shot begins at the actual contact point')
  assert.ok(distance(amostrarFinalizacaoFutebol(candidate,candidate.shotMs),candidate.target)<1e-12,'the official impact is the planned target')
  assert.ok(candidate.shotMs>=350)
  let previous=candidate.from
  for(let frame=1;frame<=100;frame++){
   const sample=amostrarFinalizacaoFutebol(candidate,candidate.shotMs*frame/100)
   const speed=distance(sample,previous)/(candidate.shotMs/100000)
   maxSpeed=Math.max(maxSpeed,speed);assert.ok(speed<=28.00001,'all incoming positions obey the 28 m/s limit')
   assert.ok(sample.y>=.11,'the sphere never goes below the turf')
   const a=amostrarFinalizacaoFutebol(candidate,candidate.shotMs*frame/100)
   assert.deepEqual(a,sample,'sampling is stateless and reproducible')
   if(outcome==='goal'&&frame<100)assert.ok(sign*sample.x-.11<52.5,'the entire ball has not crossed before impact')
   if(outcome==='trave'){
    const postZ=sign*(candidate.surface==='poste-esquerdo'?-3.66:3.66)
    const clearance=candidate.surface==='travessao'?Math.hypot(sample.x-sign*52.5,sample.y-2.44):Math.hypot(sample.x-sign*52.5,sample.z-postZ)
    assert.ok(clearance>=.17-1e-8,'the sphere does not enter the woodwork before its planned contact')
    if(candidate.surface==='travessao')minBarClearance=Math.min(minBarClearance,clearance)
    else minPostClearance=Math.min(minPostClearance,clearance)
   }
   previous=sample;samples++
  }
  const atImpact=amostrarFinalizacaoFutebol(candidate,candidate.shotMs)
  const justAfter=amostrarFinalizacaoFutebol(candidate,candidate.shotMs+.001)
  assert.ok(distance(atImpact,justAfter)<.00004,'no position jump at impact or confirmation')
  if(outcome==='goal'){
   close(sign*candidate.target.x-.11,52.5,'the whole ball crosses the line exactly at confirmation')
   assert.ok(Math.abs(candidate.target.z)+.17<3.66&&candidate.target.y+.17<2.44,'the entire ball fits inside the goal mouth')
   goalSides.add(Math.sign(candidate.target.z));goalHeights.add(Math.floor(candidate.target.y))
   for(const delta of [1,50,120,400,2000,8000]){
    const ball=amostrarFinalizacaoFutebol(candidate,candidate.shotMs+delta)
    assert.ok(sign*ball.x>=52.61-1e-8&&sign*ball.x<=54.5-.11,'a goal remains inside the physical net depth')
    assert.ok(Math.abs(ball.z)<=3.49&&ball.y>=.11&&ball.y<=2.27,'a goal never teleports through the net frame')
   }
  }else if(outcome==='fora'||outcome==='isolou'){
   const lineT=(sign*52.5-candidate.from.x)/(candidate.target.x-candidate.from.x)
   const lineBall=amostrarFinalizacaoFutebol(candidate,candidate.shotMs*lineT)
   if(outcome==='fora'){
    assert.ok(Math.abs(lineBall.z)>3.66+.17,'wide shots already miss the posts as they cross the line')
    wideSides.add(Math.sign(lineBall.z))
   }else assert.ok(lineBall.y>2.44+.17,'high shots clear the bar as they cross the line')
   const impactVelocity={x:(candidate.target.x-candidate.from.x)/(candidate.shotMs/1000),y:(candidate.target.y-candidate.from.y-4*candidate.arcHeight)/(candidate.shotMs/1000),z:(candidate.target.z-candidate.from.z)/(candidate.shotMs/1000)}
   const epsilon=.000001,near=amostrarFinalizacaoFutebol(candidate,candidate.shotMs+epsilon*1000)
   assert.ok(Math.abs((near.x-candidate.target.x)/epsilon-impactVelocity.x)<.001,'guided miss retains the incoming horizontal velocity at impact')
   assert.ok(Math.abs((near.z-candidate.target.z)/epsilon-impactVelocity.z)<.001,'guided miss does not snap its lateral velocity')
   for(const delta of [1,50,250,1300,3000,8000]){
    const ball=amostrarFinalizacaoFutebol(candidate,candidate.shotMs+delta)
    assert.ok(Math.abs(ball.x)<=54.6+1e-8&&Math.abs(ball.z)<=35.6+1e-8,'miss remains reachable by the ball retriever')
    assert.ok(ball.y>=.11,'guided miss never enters the turf')
    if(delta===8000)close(ball.y,.11,'high misses eventually land')
   }
  }else if(outcome==='trave'){
   const n=candidate.rebound.normal,v=candidate.rebound.velocity
   close(length(n),1,'impact normal is unit length')
   const duration=candidate.shotMs/1000
   const incoming={x:(candidate.target.x-candidate.from.x)/duration,y:(candidate.target.y-candidate.from.y-4*candidate.arcHeight)/duration,z:(candidate.target.z-candidate.from.z)/duration}
   assert.ok(dot(incoming,n)<0&&dot(v,n)>0,'the ball reaches and then leaves the surface')
   close(dot(v,n),-.62*dot(incoming,n),'the normal impulse obeys the specified restitution')
   assert.ok(length(v)<=length(incoming),'woodwork does not add kinetic energy')
   assert.ok(v.x*sign<0,'woodwork rebounds back towards the field instead of inventing a goal')
   const tangentIn={x:incoming.x-dot(incoming,n)*n.x,y:incoming.y-dot(incoming,n)*n.y,z:incoming.z-dot(incoming,n)*n.z}
   const tangentOut={x:v.x-dot(v,n)*n.x,y:v.y-dot(v,n)*n.y,z:v.z-dot(v,n)*n.z}
   assert.ok(distance(tangentIn,tangentOut)<1e-8,'the cylinder preserves tangential velocity')
   for(const delta of [1,10,250,600,2000,8000]){
    const ball=amostrarFinalizacaoFutebol(candidate,candidate.shotMs+delta)
    assert.ok(sign*ball.x<52.5&&ball.y>=.11,'the rebound stays out of the net and above the ground')
   }
  }
 }
}
// Very acute misses must be outside at the line, not only at their endpoint.
for(const outcome of ['fora','isolou'])for(const z of [-30,30]){
 const plan=planejarFinalizacaoFutebol(`acute:${outcome}:${z}`,outcome,true,{x:51,y:.11,z})
 const ratio=(52.5-51)/(plan.target.x-51),ball=amostrarFinalizacaoFutebol(plan,ratio*plan.shotMs)
 assert.ok(outcome==='fora'?Math.abs(ball.z)>3.83:ball.y>2.61)
}
assert.ok(surfaces.has('poste-esquerdo')&&surfaces.has('poste-direito')&&surfaces.has('travessao'),'all three woodwork contacts occur')
assert.deepEqual([...goalSides].sort(),[-1,1]);assert.deepEqual([...wideSides].sort(),[-1,1])
assert.ok(goalHeights.size>=3,'goals finish low, medium and high')
// A glove override uses the same analytic speed bound, including a raised save.
assert.ok(duracaoFinalizacaoFutebol({x:20,y:.11,z:-20},{x:50,y:1.8,z:2},.6)>=Math.hypot(30,1.69+2.4,22)/28*1000)
fs.mkdirSync('test-results/futebol-3d',{recursive:true})
const report={plans,samples,surfaces:Object.fromEntries(surfaces),maxSpeed,minPostClearance,minBarClearance,goalSides:[...goalSides],wideSides:[...wideSides],goalHeights:[...goalHeights]}
fs.writeFileSync('test-results/futebol-3d/finalizacao-variada-20261016.json',JSON.stringify(report,null,2))
console.log(`PASS ${plans} planos, ${samples} amostras: alvos variados, dois postes e travessão, rebotes físicos, simetria, resultado preservado e velocidade máxima ${maxSpeed.toFixed(3)} m/s.`)
