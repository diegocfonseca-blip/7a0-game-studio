import type {JogadorFutebol,QuadroFutebol,FaseFutebol,PontoFutebol} from './presidencia-futebol-motor.ts'
import {contatoLuvas3D,contatoPe3D,conduzirBola3D,separarBolaDosPes3D} from './presidencia-atleta-3d.ts'
import {planejarFinalizacaoFutebol,amostrarFinalizacaoFutebol,duracaoFinalizacaoFutebol,type PlanoFinalizacaoFutebol,type ResultadoFinalizacaoFutebol} from './presidencia-futebol-finalizacao.ts'

type P3={x:number;y:number;z:number}
export type FaseSequenciaLance='prepare'|'receive'|'pass'|'carry'|'shoot'|'impact'
export type QuadroSequenciaLance={atMs:number;poses:Float32Array;ball:P3;referee:readonly number[];phase:FaseFutebol;ownerIndex?:number}
export type SequenciaLanceFutebol={version:1;players:JogadorFutebol[];keys:string[];frames:QuadroSequenciaLance[];boundaries:{kind:FaseSequenciaLance;startMs:number;endMs:number}[];shotStartMs:number;durationMs:number;finishing:PlanoFinalizacaoFutebol;parry:boolean;bytes:number}
const dt=1/60,stride=11,clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n)),dist=(a:PontoFutebol,b:PontoFutebol)=>Math.hypot(a.x-b.x,a.z-b.z),pos=(p:JogadorFutebol)=>({x:p.mx,z:p.mz})
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t,smooth=(t:number)=>{const q=clamp(t,0,1);return q*q*(3-2*q)}
const angle=(a:number,b:number)=>Math.atan2(Math.sin(b-a),Math.cos(b-a))
const toe=(p:JogadorFutebol):P3=>contatoPe3D({...p,speed:0,kick:.3,control:0,throwing:0,throwPreparation:0,save:0,dive:0})
const carried=(p:JogadorFutebol,previous?:P3):P3=>conduzirBola3D(p,previous,dt)
const pointSegment=(p:PontoFutebol,a:PontoFutebol,b:PontoFutebol)=>{const dx=b.x-a.x,dz=b.z-a.z,q=clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1),0,1);return dist(p,{x:a.x+q*dx,z:a.z+q*dz})}

/** Ephemeral choreography only: source actors and score are never mutated.
 * Simulate at 60 Hz, store compact poses at 30 Hz plus exact phase boundaries.
 * All cameras interpolate the same immutable path instead of steering twice. */
export function criarSequenciaLance(initial:QuadroFutebol,options:{authorKey:string;assistKey?:string;right:boolean;outcome:ResultadoFinalizacaoFutebol;id:string;parry?:boolean}):SequenciaLanceFutebol|undefined{
 const players=initial.players.map(p=>({...p})),author=players.find(p=>p.key===options.authorKey),assist=players.find(p=>p.key===options.assistKey)
 if(!author||players.length!==22)return
 const first=assist??author,dir=options.right?1:-1,referee={...initial.referee},frames:QuadroSequenciaLance[]=[],boundaries:SequenciaLanceFutebol['boundaries']=[]
 let ball={...initial.ball},seconds=0,phase:FaseFutebol='dominio',ownerIndex:number|undefined,steps=0,failed=false
 const starts=new Map(players.map(p=>[p.key,pos(p)])),paths=new Map<string,PontoFutebol[]>(),faces=new Map<string,number>(),stalled=new Map<string,number>()
 const blocked=(p:PontoFutebol,key:string,margin=.8)=>players.some(a=>a.key!==key&&dist(pos(a),p)<margin)||dist(referee,p)<margin
 const free=(desired:PontoFutebol,key:string)=>{
  const base={x:clamp(desired.x,-50.5,50.5),z:clamp(desired.z,-32.5,32.5)}
  if(!blocked(base,key,.95))return base
  for(let r=.8;r<5;r+=.6)for(let i=0;i<16;i++){const a=i*Math.PI/8,p={x:clamp(base.x+Math.sin(a)*r,-50.5,50.5),z:clamp(base.z+Math.cos(a)*r,-32.5,32.5)};if(!blocked(p,key,.95))return p}
  return pos(players.find(p=>p.key===key)!)
 }
 function route(p:JogadorFutebol,target:PontoFutebol){
  const from=pos(p),obstacles=[...players.filter(a=>a.key!==p.key).map(pos),referee]
  const clear=(a:PontoFutebol,b:PontoFutebol)=>obstacles.every(o=>pointSegment(o,a,b)>=.86||(dist(a,o)<.86&&dist(b,o)>dist(a,o)&&((b.x-a.x)*(o.x-a.x)+(b.z-a.z)*(o.z-a.z))<=0))
  if(clear(from,target)){paths.set(p.key,[target]);return}
  // Visibility graph around bodies, not a straight line through the marker.
  const nodes=[from,target]
  for(const o of obstacles)if(pointSegment(o,from,target)<4)for(let i=0;i<8;i++){const a=i*Math.PI/4,n={x:o.x+Math.sin(a)*1.2,z:o.z+Math.cos(a)*1.2};if(Math.abs(n.x)<=52&&Math.abs(n.z)<=33.5&&!blocked(n,p.key,.84))nodes.push(n)}
  const costs=nodes.map(()=>Infinity),previous=nodes.map(()=>-1),visited=new Set<number>();costs[0]=0
  while(visited.size<nodes.length){let index=-1,best=Infinity;for(let i=0;i<nodes.length;i++)if(!visited.has(i)&&costs[i]<best){best=costs[i];index=i}if(index<0||index===1)break;visited.add(index)
   for(let j=1;j<nodes.length;j++)if(!visited.has(j)&&clear(nodes[index],nodes[j])){const cost=best+dist(nodes[index],nodes[j]);if(cost<costs[j]){costs[j]=cost;previous[j]=index}}
  }
  const path:PontoFutebol[]=[];let index=1
  if(previous[index]>=0){while(index>0){path.unshift(nodes[index]);index=previous[index]}}
  else path.push(target)
  paths.set(p.key,path)
 }
 function record(force=false){
  if(!force&&steps%2)return
  const poses=new Float32Array(players.length*stride)
  players.forEach((p,i)=>poses.set([p.mx,p.mz,p.heading,p.distance,p.speed,p.kick,p.control??0,p.save??0,p.dive??0,p.throwing,p.throwPreparation??0],i*stride))
  const frame={atMs:seconds*1000,poses,ball:{...ball},referee:[referee.x,referee.z,referee.heading,referee.distance,referee.speed],phase,ownerIndex}
  if(frames.at(-1)?.atMs===frame.atMs)frames[frames.length-1]=frame;else frames.push(frame)
 }
 function move(){
  for(const p of players){
   p.kick=Math.max(0,p.kick-dt);p.control=Math.max(0,(p.control??0)-dt);p.save=0;p.dive=0;p.throwing=0;p.throwPreparation=0
   const path=paths.get(p.key)
   while(path&&path.length>1&&dist(pos(p),path[0])<.22)path.shift()
   const start=starts.get(p.key)!,target=path?.[0]??{x:clamp(start.x+(ball.x-initial.ball.x)*.07,-49,49),z:clamp(start.z+(ball.z-initial.ball.z)*.05,-32,32)}
   const length=dist(pos(p),target),desired=faces.get(p.key)??(length>.06?Math.atan2(target.x-p.mx,target.z-p.mz):p.heading)
   p.heading+=clamp(angle(p.heading,desired),-5*dt,5*dt)
   const facing=Math.abs(angle(p.heading,desired)),wanted=faces.has(p.key)?0:Math.min(path?5.4:2.4,length*3)*Math.max(0,Math.cos(facing))
   const speed=clamp(wanted,Math.max(0,p.speed-8*dt),p.speed+6*dt)
   let nx=p.mx+Math.sin(p.heading)*Math.min(length,speed*dt),nz=p.mz+Math.cos(p.heading)*Math.min(length,speed*dt)
   nx=clamp(nx,-Math.max(52.5,Math.abs(p.mx)),Math.max(52.5,Math.abs(p.mx)));nz=clamp(nz,-Math.max(34,Math.abs(p.mz)),Math.max(34,Math.abs(p.mz)))
   const proposed={x:nx,z:nz},oldPosition=pos(p),obstacles=[...players.filter(a=>a.key!==p.key).map(pos),referee]
   // Existing play may already put two shoulders within the steering margin.
   // They may separate gradually, never become closer or remain locked there.
   const overlap=obstacles.some(o=>dist(proposed,o)<.76&&(dist(oldPosition,o)>=.76||dist(proposed,o)<dist(oldPosition,o)-1e-8))
   if(!overlap&&length>.025){const moved=dist(pos(p),proposed);p.mx=nx;p.mz=nz;p.distance+=moved;p.speed=moved/dt;stalled.set(p.key,0)}else{
    p.speed=0
    if(overlap&&path&&length>.1){const count=(stalled.get(p.key)??0)+1;stalled.set(p.key,count);if(count>=6){const destination=path.at(-1)!;if(blocked(destination,p.key,.85))Object.assign(destination,free(destination,p.key));route(p,destination);stalled.set(p.key,0)}}
   }
   if(path&&length<.05)paths.set(p.key,[pos(p)])
  }
  // The referee follows a useful diagonal but yields to every body.
  const target={x:clamp(ball.x-dir*8,-43,43),z:clamp(ball.z+8,-27,27)},length=dist(referee,target),desired=Math.atan2(target.x-referee.x,target.z-referee.z)
  referee.heading+=clamp(angle(referee.heading,desired),-5*dt,5*dt)
  const travel=Math.min(length,3*dt)*Math.max(0,Math.cos(angle(referee.heading,desired)))
  if(length>.01){const p={x:referee.x+Math.sin(referee.heading)*travel,z:referee.z+Math.cos(referee.heading)*travel}
   if(players.every(a=>dist(pos(a),p)>.8)){referee.x=p.x;referee.z=p.z;referee.distance+=travel;referee.speed=travel/dt}else referee.speed=0
  }
 }
 function run(kind:FaseSequenciaLance,duration:number,update:(q:number)=>void,ready?:()=>boolean){
  const start=seconds,limit=Math.max(duration,0)+8,begin=frames.length
  record(true)
  do{seconds+=dt;steps++;move();const elapsed=seconds-start;update(clamp(elapsed/Math.max(duration,dt),0,1));record();if(elapsed>=duration&&(!ready||ready()))break}while(seconds-start<limit&&seconds<40)
  if((ready&&!ready())||seconds-start+1e-6<duration)failed=true
  record(true);boundaries.push({kind,startMs:start*1000,endMs:seconds*1000});return {start,end:seconds,begin}
 }
 function face(p:JogadorFutebol,target:PontoFutebol,kind:FaseSequenciaLance='prepare'){
  paths.set(p.key,[pos(p)]);const heading=Math.atan2(target.x-p.mx,target.z-p.mz);faces.set(p.key,heading)
  const from={...ball},save=p.save??0,throwing=p.throwing,preparation=p.throwPreparation??0;ownerIndex=players.indexOf(p);phase='dominio'
  run(kind,Math.max(.35,Math.abs(angle(p.heading,heading))/5),q=>{p.control=.32*(1-q);p.save=save*(1-q);p.throwing=throwing*(1-q);p.throwPreparation=preparation*(1-q);const end=carried(p),s=smooth(q);ball={x:lerp(from.x,end.x,s),y:lerp(from.y,end.y,s),z:lerp(from.z,end.z,s)}})
  faces.delete(p.key)
 }
 function receive(p:JogadorFutebol){
  paths.set(p.key,[pos(p)]);const from={...ball};ownerIndex=players.indexOf(p);phase='dominio'
  run('receive',.45,q=>{p.control=.32*(1-q);const to=carried(p),s=smooth(q);ball={x:lerp(from.x,to.x,s),y:lerp(from.y,to.y,s),z:lerp(from.z,to.z,s)}})
 }
 function faceLooseBall(p:JogadorFutebol){
  paths.set(p.key,[pos(p)]);const heading=Math.atan2(ball.x-p.mx,ball.z-p.mz),from={...ball}
  faces.set(p.key,heading)
  run('prepare',Math.max(.15,Math.abs(angle(p.heading,heading))/5),()=>{ball={...from}})
  faces.delete(p.key)
 }
 const collectionPoint=(p:JogadorFutebol,ball:PontoFutebol)=>{const heading=Math.atan2(ball.x-p.mx,ball.z-p.mz);return free({x:ball.x-Math.sin(heading)*.75,z:ball.z-Math.cos(heading)*.75},p.key)}
 function pass(source:JogadorFutebol,receiver:JogadorFutebol,target:PontoFutebol){
  face(source,target);route(receiver,target);paths.set(source.key,[pos(source)])
  const windup={...ball}
  run('prepare',.24,q=>{source.kick=.3*q;const end=toe(source),s=smooth(q);ball={x:lerp(windup.x,end.x,s),y:lerp(windup.y,end.y,s),z:lerp(windup.z,end.z,s)}})
  source.kick=.3;const from=toe(source);ball={...from};ownerIndex=undefined;phase=dist(from,target)>25?'lancamento':'passe'
  const before=frames.length-1,duration=Math.max(.6,dist(from,target)/18,dist(pos(receiver),target)/4.5+.35)
  const receiveHeading=()=>Math.atan2(from.x-receiver.mx,from.z-receiver.mz)
  const result=run('pass',duration,q=>{
   // Arrive, brake and open the body towards the incoming pass. A receiver
   // facing along his run puts the endpoint beyond his own hips, so a pass
   // arriving from behind would pass through the shorts before reaching a boot.
   if(dist(pos(receiver),target)<.4)faces.set(receiver.key,receiveHeading())
   ball={x:lerp(from.x,target.x,q),y:.11+Math.sin(q*Math.PI)*1.2,z:lerp(from.z,target.z,q)}
  },()=>dist(pos(receiver),target)<.45&&faces.has(receiver.key)&&Math.abs(angle(receiver.heading,receiveHeading()))<.025&&receiver.speed<.05)
  const to=carried(receiver),height=players.some(p=>p.key!==source.key&&p.key!==receiver.key&&pointSegment(pos(p),from,to)<1)?2.8:dist(from,to)>25?2:.25
  // Receiver's actual arrival, not an assumed spot: no correction at reception.
  for(let i=before;i<frames.length;i++){const f=frames[i],q=clamp((f.atMs-result.start*1000)/((result.end-result.start)*1000),0,1);f.ball={x:lerp(from.x,to.x,q),y:lerp(from.y,to.y,q)+Math.sin(q*Math.PI)*height,z:lerp(from.z,to.z,q)}}
  ball={...to};receive(receiver);faces.delete(receiver.key)
 }
 const source=players.find(p=>p.key===initial.owner)??(ball.y<.3?players.filter(p=>dist(pos(p),ball)<.65).sort((a,b)=>dist(pos(a),ball)-dist(pos(b),ball))[0]:undefined)
 record(true)
 if(source&&source.side!==first.side){
  // An opponent never supplies an intentional assist to the official scorer.
  // Show a heavy touch, the opponent over-running it, and a real recovery.
  const from={...ball},loose={x:clamp(ball.x+Math.sin(source.heading)*1.4,-50.5,50.5),z:clamp(ball.z+Math.cos(source.heading)*1.4,-32.5,32.5)}
  route(source,free({x:loose.x+Math.sin(source.heading)*3,z:loose.z+Math.cos(source.heading)*3},source.key))
  const target=collectionPoint(first,loose);route(first,target);ownerIndex=undefined;phase='dominio'
  const start=seconds
  run('prepare',Math.max(.6,dist(pos(first),target)/4.4),()=>{const q=clamp((seconds-start)/.5,0,1);ball={x:lerp(from.x,loose.x,q),y:lerp(from.y,.11,q),z:lerp(from.z,loose.z,q)}},()=>dist(pos(first),target)<.08)
  faceLooseBall(first);receive(first)
 }else if(source&&source.key!==first.key){const target=free({x:first.mx+dir*3.5,z:first.mz*.95},first.key);pass(source,first,target)}
 else if(source){receive(first)}
 else{
  const target=collectionPoint(first,ball),from={...ball};route(first,target);phase='dominio'
  run('prepare',Math.max(.45,dist(pos(first),target)/4.5),()=>{ball={...from,y:Math.max(.11,from.y-4.905*seconds*seconds)}},()=>dist(pos(first),target)<.08)
  faceLooseBall(first);receive(first)
 }
 if(assist){const target=free({x:author.mx+dir*4,z:author.mz*.85},author.key);pass(assist,author,target)}
 const carryTarget=free({x:author.mx+dir*Math.min(9,Math.max(2,dir*author.mx>35?3:9)),z:author.mz*.7},author.key)
 route(author,carryTarget);ownerIndex=players.indexOf(author);phase='dominio'
 run('carry',Math.max(.7,dist(pos(author),carryTarget)/4.4),()=>{ball=carried(author,ball)},()=>dist(pos(author),carryTarget)<.45)
 let finishing=planejarFinalizacaoFutebol(options.id,options.outcome,options.right,carried(author))
 face(author,finishing.target)
 // Plant the foot, complete the backswing, then strike from the actual boot.
 const windup={...ball};paths.set(author.key,[pos(author)])
 run('prepare',.24,q=>{author.kick=.3*q;const end=toe(author),s=smooth(q);ball={x:lerp(windup.x,end.x,s),y:lerp(windup.y,end.y,s),z:lerp(windup.z,end.z,s)}})
 finishing=planejarFinalizacaoFutebol(options.id,options.outcome,options.right,toe(author))
 const keeper=players.find(p=>p.keeper&&p.side!==author.side)!,keeperPoint=pos(keeper)
 paths.set(keeper.key,[keeperPoint]);faces.set(keeper.key,Math.atan2(author.mx-keeper.mx,author.mz-keeper.mz))
 const keeperTurn=Math.abs(angle(keeper.heading,faces.get(keeper.key)!))/5
 if(keeperTurn>.01)run('prepare',keeperTurn,()=>{author.kick=.3;ball=toe(author)})
 if(options.outcome==='defendeu'){
  finishing.target=contatoLuvas3D({...keeper,speed:0,kick:0,throwing:0,save:1,dive:options.parry?(options.right?1:-1):0})
  finishing.shotMs=duracaoFinalizacaoFutebol(finishing.from,finishing.target,finishing.arcHeight)
 }
 const shotStartMs=seconds*1000;ownerIndex=undefined;phase='finalizacao'
 run('shoot',finishing.shotMs/1000,q=>{
  ball=amostrarFinalizacaoFutebol(finishing,(seconds*1000-shotStartMs),finishing.shotMs)
  author.kick=.3*Math.max(0,1-q/.3);keeper.save=options.outcome==='defendeu'?smooth((q-.45)/.55):Math.sin(q*Math.PI)*.45
  if(options.outcome==='defendeu'&&options.parry)keeper.dive=(options.right?1:-1)*smooth((q-.45)/.55)
 })
 const durationMs=seconds*1000,shotMs=durationMs-shotStartMs;finishing.shotMs=shotMs
 // Re-evaluate the shot against the quantised physical impact timestamp.
 for(const f of frames)if(f.atMs>=shotStartMs)f.ball=amostrarFinalizacaoFutebol(finishing,f.atMs-shotStartMs,shotMs)
 ball={...finishing.target};phase=options.outcome==='goal'?'gol':'finalizacao'
 const held={...ball}
 run('impact',1.5,()=>{
  const after=seconds*1000-durationMs
  ball=options.outcome==='defendeu'?options.parry?{x:lerp(held.x,dir*53.5,clamp(after/600,0,1)),y:lerp(held.y,.11,clamp(after/600,0,1)),z:lerp(held.z,Math.sign(held.z||1)*8,clamp(after/600,0,1))}:{...held}:amostrarFinalizacaoFutebol(finishing,seconds*1000-shotStartMs,shotMs)
  if(options.outcome==='defendeu'){keeper.save=options.parry?1-smooth(after/900):1;keeper.dive=options.parry?(options.right?1:-1)*(1-smooth(after/900)):0}
 })
 if(failed)return
 const sequence={version:1 as const,players:initial.players.map(p=>({...p})),keys:players.map(p=>p.key),frames,boundaries,shotStartMs,durationMs,finishing,parry:!!options.parry,bytes:frames.reduce((sum,f)=>sum+f.poses.byteLength+96,0)}
 return sequence
}

/** One sample is pure and independent of previous render calls or camera FPS. */
export function amostrarSequenciaLance(sequence:SequenciaLanceFutebol,elapsedMs:number):QuadroFutebol{
 const frames=sequence.frames,t=clamp(elapsedMs,0,frames.at(-1)!.atMs)
 let low=0,high=frames.length-1
 while(low<high){const mid=Math.ceil((low+high)/2);if(frames[mid].atMs<=t)low=mid;else high=mid-1}
 const a=frames[low],b=frames[Math.min(low+1,frames.length-1)],q=b.atMs===a.atMs?0:(t-a.atMs)/(b.atMs-a.atMs)
 const players=sequence.players.map((p,i)=>{const n=i*stride,v=(j:number)=>lerp(a.poses[n+j],b.poses[n+j],q);return {...p,mx:v(0),mz:v(1),heading:v(2),distance:v(3),speed:v(4),kick:v(5),control:v(6),save:v(7),dive:v(8),throwing:v(9),throwPreparation:v(10)}})
 if(t===0)for(let i=0;i<players.length;i++)Object.assign(players[i],sequence.players[i])
 const r=(i:number)=>lerp(a.referee[i],b.referee[i],q)
 let ball={x:lerp(a.ball.x,b.ball.x,q),y:lerp(a.ball.y,b.ball.y,q),z:lerp(a.ball.z,b.ball.z,q)}
 // Poses between stored frames are also real poses. Resolve only actual boot
 // penetration there; do not move an already clear ball or alter the shot.
 const atPassContact=sequence.boundaries.some(b=>b.kind==='pass'&&Math.abs(b.startMs-t)<1e-5)
 const atShotContact=Math.abs(sequence.shotStartMs-t)<1e-5
 if(t>0&&t<sequence.shotStartMs&&!atPassContact&&!atShotContact&&ball.y<.35)for(const p of players)if(dist(pos(p),ball)<1)ball=separarBolaDosPes3D(p,ball)
 // A backgrounded camera can resume after the stored tail. Keep the analytic
 // rebound/fall moving instead of clamping it and then jumping on event removal.
 if(elapsedMs>frames.at(-1)!.atMs&&sequence.finishing.outcome!=='defendeu')ball=amostrarFinalizacaoFutebol(sequence.finishing,elapsedMs-sequence.shotStartMs)
 return {players,ball,phase:a.phase,owner:a.ownerIndex===undefined?undefined:sequence.keys[a.ownerIndex],referee:{x:r(0),z:r(1),heading:r(2),distance:r(3),speed:r(4)},time:t/1000}
}
