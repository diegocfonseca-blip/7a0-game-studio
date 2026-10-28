const limit=(x,z,r)=>{const d=Math.hypot(x,z);return d>r?[x*r/d,z*r/d]:[x,z]},clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
/** Local navigation around official trajectories. Does not edit source players.
 * Predict crossing pairs, steer to opposite sides, then project overlapping
 * head/body capsules within a bounded visual budget. Reports infeasible pairs. */
export class VisualPlayerCollisions{
 constructor({radius=.35,budget=.38}={}){this.radius=radius;this.budget=budget;this.offsets=new Map();this.pairs=new Map();this.last=null;this.sources=new Map();}
 reset(){this.offsets.clear();this.pairs.clear();this.last=null;this.sources=new Map();}
 sample(frame,controller){const deadBall=['saida','gol','falta','lateral','tiro-de-meta','escanteio','penalti','fim'].includes(frame.phase),sourceReset=deadBall&&frame.players.some(p=>{const old=this.sources.get(p.key);return old&&Math.hypot(p.mx-old.x,p.mz-old.z)>2.5});this.sources=new Map(frame.players.map(p=>[p.key,{x:p.mx,z:p.mz}]));const dt=this.last===null?0:frame.time-this.last,reset=this.last===null||dt<0||dt>.5||sourceReset;if(reset){this.offsets.clear();this.pairs.clear()}this.last=frame.time;
 const ps=frame.players.filter(p=>p.visible!==false).map(p=>({...p,vx:p.navigationVelocity?.x??Math.sin(p.heading)*p.speed,vz:p.navigationVelocity?.z??Math.cos(p.heading)*p.speed,freedom:controller?.action(p.key,frame.time)?.collisionFreedom??(frame.owner===p.key?.25:1),scheduled:!!controller?.action(p.key,frame.time),ox:0,oz:0}));
 for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){const a=ps[i],b=ps[j],dx=b.mx-a.mx,dz=b.mz-a.mz,vx=b.vx-a.vx,vz=b.vz-a.vz,v2=vx*vx+vz*vz,t=v2>1e-6?clamp(-(dx*vx+dz*vz)/v2,0,.45):0,d=Math.hypot(dx,dz),future=Math.hypot(dx+vx*t,dz+vz*t),key=[a.key,b.key].sort().join('|');let pair=this.pairs.get(key);
 if(t>0&&future<2*this.radius+.12&&v2>1&&!pair){const v=Math.sqrt(v2);pair={nx:-vz/v,nz:vx/v};this.pairs.set(key,pair)}
 if(pair&&d>1.2&&t===0){this.pairs.delete(key);pair=null}
 if(pair){const weight=clamp((.45-t)/.25,.3,1),amount=this.radius*weight;a.ox+=pair.nx*amount*a.freedom;a.oz+=pair.nz*amount*a.freedom;b.ox-=pair.nx*amount*b.freedom;b.oz-=pair.nz*amount*b.freedom}
 }
 // Coincident source anchors need a two-dimensional layout. A line cannot
 // fit three caricature heads inside the same 60 cm presentation envelope.
 // Stable identity ordering is a geometric tie-break, never an AI decision.
 const unseen=new Set(ps);while(unseen.size){const seed=unseen.values().next().value,group=[seed];unseen.delete(seed);for(let i=0;i<group.length;i++)for(const p of [...unseen])if(Math.hypot(p.mx-group[i].mx,p.mz-group[i].mz)<.06){group.push(p);unseen.delete(p)}if(group.length<3)continue;group.sort((a,b)=>a.key.localeCompare(b.key));let hash=0;for(const ch of group.map(p=>p.key).join('|'))hash=(Math.imul(hash,31)+ch.charCodeAt(0))>>>0;const phase=hash/4294967296*Math.PI*2;group.forEach((p,i)=>{const angle=phase+i*Math.PI*2/group.length;p.ox+=Math.cos(angle)*this.budget*p.freedom;p.oz+=Math.sin(angle)*this.budget*p.freedom})}
 // Smooth only the steering target. Constraint projection below always checks
 // actual remaining overlap; no post-projection damping that hides violations.
 for(const p of ps){const target=limit(p.ox,p.oz,p.limit),old=this.offsets.get(p.key)??{x:0,z:0},alpha=reset?1:1-Math.exp(-Math.max(0,dt)/.10);p.limit=p.scheduled?Math.max(this.budget*p.freedom,.6*p.freedom):Math.max(this.budget*p.freedom,Math.min(.6,Math.hypot(old.x,old.z)));p.ox=old.x+(target[0]-old.x)*alpha;p.oz=old.z+(target[1]-old.z)*alpha;[p.ox,p.oz]=limit(p.ox,p.oz,p.limit)}
 let pushes=0;for(let step=0;step<8;step++)for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){const a=ps[i],b=ps[j];let dx=b.mx+b.ox-a.mx-a.ox,dz=b.mz+b.oz-a.mz-a.oz,d=Math.hypot(dx,dz);if(d>=2*this.radius-1e-5)continue;const free=a.freedom+b.freedom;if(free<1e-6)continue;if(d<1e-8){dx=1e-8;dz=0;d=1e-8}const need=2*this.radius-d+.001,wa=a.freedom/free,wb=b.freedom/free;a.ox-=dx/d*need*wa;a.oz-=dz/d*need*wa;b.ox+=dx/d*need*wb;b.oz+=dz/d*need*wb;[a.ox,a.oz]=limit(a.ox,a.oz,a.limit);[b.ox,b.oz]=limit(b.ox,b.oz,b.limit);pushes++}
 // Steering is predictive. Do not teleport a runner to satisfy its coarse
 // 70 cm circles; the measured head/body projection below owns final safety.
 // Reviewed contact envelopes retain priority over this speed limiter.
 if(!reset&&dt>0)for(const p of ps){const old=this.offsets.get(p.key);if(!old||p.scheduled)continue;const delta=limit(p.ox-old.x,p.oz-old.z,4*dt);p.ox=old.x+delta[0];p.oz=old.z+delta[1];[p.ox,p.oz]=limit(p.ox,p.oz,p.limit)}
 const unresolved=[];let maxOffset=0,maxCorrectionSpeed=0;for(const p of ps){const old=this.offsets.get(p.key);if(old&&dt>0)maxCorrectionSpeed=Math.max(maxCorrectionSpeed,Math.hypot(p.ox-old.x,p.oz-old.z)/dt);this.offsets.set(p.key,{x:p.ox,z:p.oz});maxOffset=Math.max(maxOffset,Math.hypot(p.ox,p.oz))}
 for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){const d=Math.hypot(ps[i].mx+ps[i].ox-ps[j].mx-ps[j].ox,ps[i].mz+ps[i].oz-ps[j].mz-ps[j].oz);if(d<2*this.radius-.01)unresolved.push({a:ps[i].key,b:ps[j].key,distance:d})}
 return{positions:new Map(ps.map(p=>[p.key,{x:p.ox,z:p.oz}])),diagnostics:{pushes,maxOffset,maxCorrectionSpeed,unresolved,sourcePositionsUnchanged:true,radius:this.radius,budget:this.budget,reset,sourceReset}};
 }
 finalize(volumes){const shifts=new Map(volumes.map(p=>[p.key,{x:0,z:0}]));let pushes=0;
  const move=(p,x,z)=>{const offset=shifts.get(p.key),remaining=limit(p.rootX+x-p.sourceX,p.rootZ+z-p.sourceZ,.60),actualX=p.sourceX+remaining[0]-p.rootX,actualZ=p.sourceZ+remaining[1]-p.rootZ;p.rootX+=actualX;p.rootZ+=actualZ;p.x+=actualX;p.z+=actualZ;offset.x+=actualX;offset.z+=actualZ};
  for(const p of volumes)move(p,0,0);
  for(let n=0;n<10;n++)for(let i=0;i<volumes.length;i++)for(let j=i+1;j<volumes.length;j++){const a=volumes[i],b=volumes[j],dy=b.y-a.y,required=Math.sqrt(Math.max(0,(a.radius+b.radius)**2-dy*dy));let dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),need=required-d;const bodyDX=b.rootX-a.rootX,bodyDZ=b.rootZ-a.rootZ,bodyDistance=Math.hypot(bodyDX,bodyDZ);if(.38-bodyDistance>need){dx=bodyDX;dz=bodyDZ;d=bodyDistance;need=.38-d;}if(need<=.002)continue;const free=a.freedom+b.freedom;if(free<1e-6)continue;if(d<1e-9){dx=1e-9;dz=0;d=1e-9}const amount=need+.002;move(a,-dx/d*amount*a.freedom/free,-dz/d*amount*a.freedom/free);move(b,dx/d*amount*b.freedom/free,dz/d*amount*b.freedom/free);pushes++;}
  const unresolved=[];for(let i=0;i<volumes.length;i++)for(let j=i+1;j<volumes.length;j++){const a=volumes[i],b=volumes[j],distance=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);if(distance<a.radius+b.radius-.01||Math.hypot(a.rootX-b.rootX,a.rootZ-b.rootZ)<.37)unresolved.push({a:a.key,b:b.key,penetration:Math.max(a.radius+b.radius-distance,.38-Math.hypot(a.rootX-b.rootX,a.rootZ-b.rootZ))})}
  // Carry final projections forward within the overall 60 cm envelope.
  // Navigation eases them toward the 38 cm steering target instead of
  // abruptly clamping the previous resolved position on the next frame.
  for(const [key,shift]of shifts){const old=this.offsets.get(key);if(old){[old.x,old.z]=limit(old.x+shift.x,old.z+shift.z,.6)}}
  return{shifts,diagnostics:{pushes,unresolved,maxAdditionalShift:Math.max(0,...[...shifts.values()].map(p=>Math.hypot(p.x,p.z))),measuredHeadVolumes:true,budget:.6}};
 }

}
