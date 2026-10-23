const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
const mix=(a,b,q)=>a+(b-a)*q,angle=x=>Math.atan2(Math.sin(x),Math.cos(x));
// Playback of one authoritative source execution. No engine, RNG or decision.
export class SharedTimeline{
 constructor(record,{diagnostics=null}={}){
  this.diagnostics=diagnostics;
  if(record.schema!=='leilao-legends-shared-timeline/v1'||record.sourceEngine!=='Motor2'||!record.actors?.length||!record.frames?.length||record.frames.length<2)throw Error('Linha do tempo inválida');
  let previous=-Infinity,events=0;for(const f of record.frames){if(!Number.isFinite(f.seconds)||f.seconds<=previous||f.poses.some(p=>p.length!==6||!p.every(Number.isFinite)||!record.actors[p[0]])||new Set(f.poses.map(p=>p[0])).size!==f.poses.length||f.ball.length!==3||!f.ball.every(Number.isFinite)||f.eventCount<events||f.eventCount>record.events.length)throw Error('Quadro inválido');previous=f.seconds;events=f.eventCount;}
  this.record=freeze(record);this.start=record.frames[0].seconds;this.end=record.frames.at(-1).seconds;
 }
 sample(seconds){
  if(!Number.isFinite(seconds))throw Error('Tempo inválido');const t=Math.max(this.start,Math.min(this.end,seconds)),frames=this.record.frames;let lo=0,hi=frames.length-1;
  while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(frames[mid].seconds<=t+1e-9)lo=mid;else hi=mid-1;}
  const a=frames[lo],b=frames[Math.min(lo+1,frames.length-1)],q=b.seconds>a.seconds?(t-a.seconds)/(b.seconds-a.seconds):0,lookup=new Map(b.poses.map(p=>[p[0],p]));
  let tacticalSample=null;if(this.diagnostics){const samples=this.diagnostics.samples;let l=0,h=samples.length-1;while(l<h){const m=Math.ceil((l+h)/2);if(samples[m].sourceTime<=a.sourceTime+1e-9)l=m;else h=m-1;}tacticalSample=samples[l];}const tacticalPlayers=new Map(tacticalSample?.players.map(p=>[p.key,p])??[]);
  const players=a.poses.map(p=>{const next=lookup.get(p[0])??p,identity=this.record.actors[p[0]];const tactical=tacticalPlayers.get(identity.key);return {...identity,tacticalRole:tactical?.role??null,tacticalMetadataCurrent:!!tactical,...(tactical?{tactical,tacticalRole:tactical.role}:{}),position:{x:mix(p[1],next[1],q),y:0,z:mix(p[2],next[2],q)},speed:mix(p[4],next[4],q),heading:p[3]+angle(next[3]-p[3])*q,physicalState:{...identity.physicalState,current:null,...(tactical?.physicalState??{}),gas:p[5]},visible:true};});
  return freeze({schema:'leilao-legends-shared-match-frame/v1',matchId:this.record.matchId,kind:'campo2d-v2',time:t,sourceTime:a.sourceTime,minute:t/(90/93),players,...(tacticalSample?{collective:{formations:this.diagnostics.formations,possession:tacticalSample.possession,setPiece:tacticalSample.setPiece,blocks:tacticalSample.blocks}}:{}),ball:{x:mix(a.ball[0],b.ball[0],q),y:mix(a.ball[1],b.ball[1],q),z:mix(a.ball[2],b.ball[2],q),owner:a.owner},score:a.score,narration:a.narration,celebration:a.celebration,events:this.record.events.slice(0,a.eventCount),currentAction:a.currentAction,referee:{position:{x:mix(a.referee[0],b.referee[0],q),y:0,z:mix(a.referee[1],b.referee[1],q)},speed:a.referee[2],heading:a.referee[3],source:'campo2d.tsx presentation-follow rule'},contactAnimationReady:false,ballImpulseAllowed:false,writesToMotor:false,resultsEngineInvoked:false});
 }
}
export class TimelineSession{
 #timeline;#seconds=0;#paused=true;#view='3d';#frame;#advances=0;
 constructor(timeline){this.#timeline=timeline;this.#frame=timeline.sample(0);}
 get snapshot(){return this.#frame;}get endTime(){return this.#timeline.end;}get paused(){return this.#paused;}get view(){return this.#view;}get advanceCount(){return this.#advances;}
 selectView(view){if(!['cinema','2d','3d'].includes(view))throw Error('Apresentação inválida');this.#view=view;return this.#frame;}
 pause(value=true){if(typeof value!=='boolean')throw Error('Pausa inválida');this.#paused=value;}
 seek(seconds){if(!Number.isFinite(seconds)||seconds<0||seconds>this.#timeline.end)throw Error('Tempo inválido');this.#seconds=seconds;this.#frame=this.#timeline.sample(seconds);return this.#frame;}
 advanceToMinute(minute){const seconds=minute*(90/93);if(seconds<this.#seconds-1e-8)throw Error('Relógio retrocedeu');if(this.#paused)return this.#frame;this.#advances++;const frame=this.seek(Math.min(this.#timeline.end,seconds));if(this.#seconds>=this.#timeline.end)this.#paused=true;return frame;}
 advanceSeconds(seconds){if(!Number.isFinite(seconds)||seconds<0)throw Error('Passo inválido');if(this.#paused)return this.#frame;this.#advances++;const frame=this.seek(Math.min(this.#timeline.end,this.#seconds+seconds));if(this.#seconds>=this.#timeline.end)this.#paused=true;return frame;}
}
