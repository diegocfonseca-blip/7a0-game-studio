const live=new Set(['dominio','passe','lancamento','cruzamento','finalizacao']);
export const isLiveFootballFrame=frame=>live.has(frame.phase)&&!frame.placementReset&&!frame.heldBy;

/** Fixed contacts may share a rolling trajectory only during uninterrupted
 * live play. A free-kick/goal-kick placement is not a spilled first touch.
 * Check both endpoints and every canonical source frame; height alone is not
 * proof of a continuous football action. */
export function liveGroundInterval(start,end,sample,{rate=60,maxHeight=.3}={}){
 if(!(end>=start))return false;
 let previous=null;
 const count=Math.max(1,Math.ceil((end-start)*rate));
 for(let i=0;i<=count;i++){
  const t=start+(end-start)*i/count,frame=sample(t),ball=frame.ball;
  if(!isLiveFootballFrame(frame)||!ball||ball.y>maxHeight||![ball.x,ball.y,ball.z].every(Number.isFinite))return false;
  if(previous){const dt=t-previous.t,d=Math.hypot(ball.x-previous.ball.x,ball.z-previous.ball.z);if(d>45*dt+.1)return false}
  previous={t,ball};
 }
 return true;
}
