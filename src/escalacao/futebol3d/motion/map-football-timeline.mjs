import {FutebolOficial3D} from '../../presidencia-futebol-oficial.ts';
const RATE=60,MAX=120*RATE+1,angle=x=>Math.atan2(Math.sin(x),Math.cos(x));
const releases=new Set(['passe','enfiada','lancamento','inversao','cruzamento','chute','chutao','cabeceio','cabeceio_gol','corte','cobranca']);
/** Read-only presentation preparation of the same input and seed. The compact
 * canonical track replaces the old per-frame prediction with a stable clock;
 * it cannot emit events, persist a result or change a career. */
export async function prepareMapTimeline(state){
 const motor=new FutebolOficial3D(state.officialInput),first=motor.sample(state,0,{replay:false,postMatchWalk:false}),keys=first.players.map(p=>p.key),slots=new Map(keys.map((k,i)=>[k,i])),count=keys.length;
 const bodies=new Float32Array(MAX*count*5),balls=new Float32Array(MAX*6),curls=new Float32Array(MAX),owners=new Int16Array(MAX).fill(-1),held=new Int16Array(MAX).fill(-1),phases=new Uint8Array(MAX),placements=new Uint8Array(MAX),phaseNames=[],dives=new Map(),agenda=[],seen=new Set();
 let length=0,previous=null,official,ownerSince=0,started=performance.now();
 const keeperEvents=new Set(['defesa','espalma','rebote','encaixa']);
 for(let i=0;i<MAX;i++){
  const time=i/RATE,f=i?motor.sample(state,time*93/90,{replay:false,postMatchWalk:false}):first,b=f.ball,v=b.velocity??{x:0,y:0,z:0};
  for(const p of f.players){const slot=slots.get(p.key);if(slot===undefined)continue;const at=(i*count+slot)*5,pos=p.sourceAnchor??{x:p.mx,z:p.mz};bodies.set([pos.x,pos.z,p.heading,p.speed,p.visible===false?0:1],at)}
  balls.set([b.x,b.y,b.z,v.x,v.y,v.z],i*6);curls[i]=b.curl??0;owners[i]=slots.get(f.owner)??-1;held[i]=slots.get(b.heldBy)??-1;length=i+1;
  let phase=phaseNames.indexOf(f.phase);if(phase<0){phase=phaseNames.length;phaseNames.push(f.phase)}phases[i]=phase;placements[i]=f.placementReset?1:0;
  const diving=f.players.find(p=>p.mergulho);if(diving)dives.set(i,{key:diving.key,value:diving.mergulho});
  const action=f.officialAction;
  if(action){const id=action.actor+':'+action.startedAt+':'+action.type;if(!seen.has(id)){seen.add(id);if(releases.has(action.type)){
   const source=f.players.find(p=>p.key===action.actor),hands=action.requiredContact==='hands'||previous?.ball.heldBy===action.actor;
   agenda.push({id,key:action.actor,kind:'toque',tipo:action.type,t:action.startedAt,requiredContact:hands?'hands':action.requiredContact??'foot',cab:action.requiredContact==='head',hands,keeper:!!source?.keeper,dir:Math.atan2(v.x,v.z),longe:action.delivery?.receiverDistance??(action.type==='lancamento'?40:15),delivery:action.delivery});
  }}}
  if(previous&&f.owner!==previous.owner){ownerSince=time;if(f.owner&&!f.restart&&!['gol','fim'].includes(f.phase))agenda.push({id:'receive:'+f.owner+':'+time,key:f.owner,kind:'recebe',t:time,h:b.y-.11,requiredContact:b.y>.9?'chest':'foot',dir:Math.atan2(-(previous.ball.velocity?.x??0),-(previous.ball.velocity?.z??0))})}
  if(b.heldBy&&b.heldBy!==previous?.ball.heldBy)agenda.push({id:'catch:'+b.heldBy+':'+time,key:b.heldBy,kind:'recebe',goleiro:true,keeper:true,t:time,h:previous?.ball.y??.11,requiredContact:'hands',dir:Math.atan2(-(previous?.ball.velocity?.x??0),-(previous?.ball.velocity?.z??0))});
  for(const event of f.official?.events??[]){if(!keeperEvents.has(event.tipo))continue;const id='save:'+event.tipo+':'+event.t;if(seen.has(id))continue;seen.add(id);const keeper=f.players.find(p=>p.keeper&&p.name===event.a&&(p.side==='home'?0:1)===event.lado);if(keeper)agenda.push({id,key:keeper.key,kind:'defende',save:true,saveType:event.tipo,keeper:true,hands:true,requiredContact:'hands',t:event.t,dir:Math.atan2(-(previous?.ball.velocity?.x??0),-(previous?.ball.velocity?.z??0))})}
  if(previous&&f.owner&&f.owner===previous.owner&&time-ownerSince>.32&&!f.restart&&b.y<.2){const pv=previous.ball.velocity??v,p=f.players.find(p=>p.key===f.owner);if(Math.hypot(v.x,v.z)>(p?.speed??0)*1.12&&Math.hypot(v.x-pv.x,v.z-pv.z)>.65)agenda.push({id:'carry:'+f.owner+':'+time,key:f.owner,kind:'carry',t:time,requiredContact:'foot',dir:Math.atan2(v.x,v.z)})}
  previous=f;official=f.official;if(official?.finished)break;
  if(performance.now()-started>12){await new Promise(r=>setTimeout(r,0));started=performance.now()}
 }
 const sample=(time,key)=>{let f=Math.max(0,Math.min(length-1,time*RATE));if(Math.abs(f-Math.round(f))<1e-6)f=Math.round(f);const i=Math.floor(f),j=Math.min(length-1,i+1),u=f-i,slot=slots.get(key),mix=(xs,k,n)=>xs[i*n+k]+(xs[j*n+k]-xs[i*n+k])*u;
  const ball={x:mix(balls,0,6),y:mix(balls,1,6),z:mix(balls,2,6),vx:mix(balls,3,6),vy:mix(balls,4,6),vz:mix(balls,5,6),curl:curls[i]};let player;
  if(slot!==undefined){const at=(i*count+slot)*5,to=(j*count+slot)*5;player={x:bodies[at]+(bodies[to]-bodies[at])*u,z:bodies[at+1]+(bodies[to+1]-bodies[at+1])*u,heading:bodies[at+2]+angle(bodies[to+2]-bodies[at+2])*u,speed:bodies[at+3]+(bodies[to+3]-bodies[at+3])*u,visible:!!bodies[at+4],mergulho:dives.get(i)?.key===key?dives.get(i).value:undefined}}
  return{time,ball,player,owner:keys[owners[i]],heldBy:keys[held[i]],phase:phaseNames[phases[i]],placementReset:!!placements[i]};
 };
 // An encaixe and the following heldBy edge describe one contact, not two.
 for(const save of agenda.filter(a=>a.saveType==='encaixa')){const capture=agenda.find(a=>a.goleiro&&a.key===save.key&&Math.abs(a.t-save.t)<.06);if(capture){Object.assign(capture,{save:true,saveType:'encaixa',hands:true});save.disabled=true}}
 const impacts=motor.keeperImpacts();
 agenda.sort((a,b)=>a.t-b.t);for(const it of agenda){const f=sample(it.t,it.key);it.bola=f.ball;it.rec=f.player;if(it.save&&!it.disabled){const physical=impacts.find(p=>Math.abs(p.t-it.t)<1e-5&&it.key.includes(p.name));if(physical){it.bola={...physical.ball};it.physicalImpact=true}}}
 return{agenda,sample,keys,official,duration:(length-1)/RATE,bytes:bodies.byteLength+balls.byteLength+curls.byteLength+owners.byteLength+held.byteLength+phases.byteLength+placements.byteLength,prepared:true};
}
