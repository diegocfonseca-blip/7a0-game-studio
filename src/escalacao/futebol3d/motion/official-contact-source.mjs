import {FutebolOficial3D} from '../../presidencia-futebol-oficial.ts';
const MINUTE=90/93,EPS=5e-10;
/** Read-only pass through the SAME deterministic official input. Collects
 * contact requirements only; cannot save a score, advance a career or decide
 * a different match. No wall-clock, new seed, attribute edits or random AI. */
export async function collectOfficialContacts(input,state,{yieldTask=async()=>{},until=120}={}){
 const engine=new FutebolOficial3D(input),seen=new Set(),contacts=[],history=[];let final;
 for(let i=0;i<=Math.round(until*20);i++){
  const time=i/20,before=engine.sample(state,Math.max(0,time-1/240+EPS)/MINUTE),now=engine.sample(state,(time+EPS)/MINUTE),action=now.officialAction;
  const row={time,ball:{x:now.ball.x,y:now.ball.y,z:now.ball.z},players:now.players.map(p=>({key:p.key,name:p.name,mx:p.mx,mz:p.mz,heading:p.heading,speed:p.speed})),owner:now.owner,phase:now.phase};
  for(const c of contacts)if(time<=c.time+.55)c.window.push(row);
  if(action){const id=action.actor+':'+action.startedAt+':'+action.type;
   if(!seen.has(id)){seen.add(id);const p=now.players.find(p=>p.key===action.actor),old=before.players.find(p=>p.key===action.actor),entry=history.find(f=>f.time>=action.startedAt-.65-1e-8)?.players.find(p=>p.key===action.actor);
    if(p&&old&&Math.abs(action.startedAt-time)<1e-5)contacts.push({id,key:p.key,type:action.type,time:action.startedAt,requiredContact:action.requiredContact,delivery:action.delivery,player:{...p},ball:{...row.ball},beforeBall:{x:before.ball.x,y:before.ball.y,z:before.ball.z},playerVelocity:[(p.mx-old.mx)*240,0,(p.mz-old.mz)*240],entryHeading:entry?.heading??p.heading,receiver:action.receiver,window:[...history.filter(f=>f.time>=action.startedAt-.7),row]});
   }
  }
  for(const contact of contacts)if(contact.exitHeading===undefined&&time>=contact.time+.4){contact.exitHeading=now.players.find(p=>p.key===contact.key)?.heading??contact.player.heading;}
  history.push(row);while(history[0]?.time<time-.7)history.shift();
  if(i%80===0)await yieldTask();
  final=now.official;if(final.finished)break;
 }
 if(!final?.finished)throw Error('Replay oficial não terminou na preparação de contatos');
 const impulses=new Set(['passe','enfiada','lancamento','inversao','cruzamento','chutao','chute','cabeceio','corte']);
 const releaseTimes=[...new Set([...contacts.map(c=>c.time),...final.events.filter(e=>impulses.has(e.tipo)).map(e=>e.t)])].sort((a,b)=>a-b);
 return{contacts,releaseTimes,official:final,sourceBallAndEventsUnchanged:true};
}
