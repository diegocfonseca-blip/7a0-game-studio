/** A source standing tackle is a physical ball contact, including when it
 * knocks the ball loose and never assigns possession to the defender. Reuse
 * the existing ground-control capture; never invent a tackle from an owner
 * change or alter the official event, trajectory, winner or match clock. */
export function defensiveContacts(agenda,events,actors,sample){
 const result=agenda.map(e=>({...e})),planned=[],skipped=[];
 for(const event of events){
  if(event.tipo!=='desarme')continue;
  const candidates=actors.filter(a=>a.name===event.a&&(a.side==='home'?0:1)===event.lado);
  const actor=candidates.length===1?candidates[0]:candidates.find(a=>a.key===sample(event.t+.02).owner);
  if(!actor){skipped.push({t:event.t,reason:'actor-unresolved'});continue}
  const frame=sample(event.t,actor.key),b=frame.ball,p=frame.player;
  if(!p||b.y>.24||frame.placementReset){skipped.push({t:event.t,key:actor.key,reason:'not-ground-foot-contact'});continue}
  const owns=sample(event.t+.02).owner===actor.key;
  let cue=owns?result.find(c=>c.key===actor.key&&c.kind==='recebe'&&!c.goleiro&&!c.disabled&&c.t>=event.t-.04&&c.t<=event.t+.25):null;
  if(!cue){cue={id:'standing-tackle:'+actor.key+':'+event.t,key:actor.key,kind:'toque',tipo:'desarme'};result.push(cue)}
  const victims=actors.filter(a=>a.name===event.b&&a.side!==actor.side);
  const victim=victims.length===1?victims[0]:victims.find(a=>a.key===sample(Math.max(0,event.t-.02)).owner);
  Object.assign(cue,{defensive:true,defenseType:'desarme',victimKey:victim?.key,officialContactAt:event.t,t:event.t,bola:{...b},rec:{...p},h:0,requiredContact:'foot',dir:Math.atan2(b.x-p.x,b.z-p.z)});
  planned.push({id:cue.id,t:cue.t,key:actor.key,victimKey:victim?.key,loose:!owns,adaptation:'existing-ground-control-capture'});
 }
 return{agenda:result.sort((a,b)=>a.t-b.t),planned,skipped};
}
