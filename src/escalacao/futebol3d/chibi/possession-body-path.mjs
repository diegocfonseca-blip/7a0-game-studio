const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
const limit=(x,z,r)=>{const d=Math.hypot(x,z),k=d>r?r/d:1;return{x:x*k,z:z*k}};

/** A received ball keeps its precomputed trajectory. The runner follows it;
 * possession is never permission to attach/pull the ball to a moving foot.
 * This local presentation path starts only AFTER a planned foot reception.
 * Free/missed passes, hands, restarts and the calibrated impact poses win.
 */
export function preparePossessionBodyPath(source,sample,key,events,{duration,ballAt,controls=[],rate=60,budget=2,looseBudget=3.25,reactionWindow=1.25}={}){
 const count=Math.ceil(duration*rate)+1,offsets=new Float32Array(count*2);
 const cues=events.filter(e=>!e.disabled&&!(e.firstTime&&e.kind==='recebe')).sort((a,b)=>a.t-b.t);
 let cursor=0,received=null,receivingOffset=null,lostAt=null,pursuit=null,returningUntil=-Infinity,offset={x:0,z:0},previous=null,maxCorrection=0;
 const pursuits=[];
 for(let i=0;i<count;i++){
  const t=i/rate,frame=sample(t),base=source(t),ball=ballAt?.(t)??frame.ball;
  while(cursor<cues.length&&cues[cursor].t<=t+1e-7){const e=cues[cursor++];received=(e.kind==='recebe'||e.verifiedGroundTouch)&&!e.hands&&!e.goleiro&&!e.pickup&&e.bola?.y<.24&&frame.owner===key?e:null;lostAt=null;receivingOffset=null;
   if(received&&e.contact?.fitted){const p=source(e.t),b=ballAt?.(e.t)??sample(e.t).ball,d=Math.hypot(p.x-b.x,p.z-b.z);if(d>=.15&&d<=.95)receivingOffset={x:p.x-b.x,z:p.z-b.z}}
  }
  // Losing tactical ownership is not a command to abandon a loose ball.
  // Keep the recovery intent until another player controls it, a restart/kick
  // intervenes, or the bounded reaction window expires. No ball path or owner
  // is changed and a failed touch never becomes a successful reception here.
  if(received&&frame.owner!==key){
   if(frame.owner||frame.phase!=='dominio'||frame.placementReset){received=null;receivingOffset=null;returningUntil=t+.6}
   else{lostAt??=t;if(t-lostAt>reactionWindow){received=null;receivingOffset=null;returningUntil=t+.6}}
  }
  const recovering=!!received&&lostAt!==null&&frame.owner!==key;
  if(recovering&&!pursuit){pursuit={start:t,end:t,receivedAt:received.t};pursuits.push(pursuit)}
  if(pursuit){pursuit.end=t;if(!recovering){pursuit.reason=frame.owner?'controlled-by-player':frame.phase!=='dominio'?'play-changed':'reaction-ended';pursuit=null;returningUntil=t+.6}}
  let desired={x:0,z:0};
  const loose=controls.some(c=>c.loose&&t>=c.start&&t<=c.end+(c.recovery??1));
  if(received&&frame.phase==='dominio'&&ball.y<.3&&!loose){
   const dx=ball.x-base.x,dz=ball.z-base.z,d=Math.hypot(dx,dz);
   // Keep the native stance when already close. For a distant touch, move
   // toward the actual rolling ball, without inventing another successful touch.
   if(receivingOffset&&!recovering){
    // Stay on the receiving side of the fixed ball after a measured touch.
    // A distance-only dead zone allowed the runner to cross over the ball,
    // then chase it again from the wrong side once it was 85 cm behind him.
    desired=limit(dx+receivingOffset.x,dz+receivingOffset.z,budget);
   }else if(d>.85){const k=(d-.72)/d;desired=limit(dx*k,dz*k,recovering?looseBudget:budget)}
  }
  // Exact impact fitting still owns both ends of every captured action.
  const freedom=Math.min(1,...cues.map(e=>(e.kind==='recebe'||e.verifiedGroundTouch)&&!e.hands&&!e.goleiro&&!e.pickup&&t>=e.t?smooth((t-e.t-(e.contact?.fitted?.015:.035))/(e.contact?.fitted?.06:.12)):smooth((Math.abs(e.t-t)-.20)/.28)));
  desired.x*=freedom;desired.z*=freedom;
  // Rejoin tactical positioning smoothly after the opponent gains control.
  // Previously clearing ownership also erased the approach offset in 140ms,
  // visibly making the receiver turn/run away while the ball was still free.
  const smoothingSeconds=!received&&t<returningUntil ? .4 : receivingOffset&&!recovering ? .055 : .14;
  const a=1-Math.exp(-1/(rate*smoothingSeconds)),delta=limit((desired.x-offset.x)*a,(desired.z-offset.z)*a,(receivingOffset?6:3.5)/rate);
  offset={x:offset.x+delta.x,z:offset.z+delta.z};
  // Authoritative dead-ball placement is a reset, never a chase across the pitch.
  if(frame.placementReset||previous&&Math.hypot(base.x-previous.x,base.z-previous.z)>2.5)offset={x:0,z:0};
  offsets[i*2]=offset.x*freedom;offsets[i*2+1]=offset.z*freedom;
  maxCorrection=Math.max(maxCorrection,Math.hypot(offsets[i*2],offsets[i*2+1]));previous=base;
 }
 return{maxCorrection,pursuits,sample:t=>{const f=Math.max(0,Math.min(count-1,t*rate)),i=Math.floor(f),j=Math.min(count-1,i+1),u=f-i,p=source(t);return{x:p.x+offsets[i*2]*(1-u)+offsets[j*2]*u,z:p.z+offsets[i*2+1]*(1-u)+offsets[j*2+1]*u}}};
}
