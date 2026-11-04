import type {RuaComplexo} from './presidencia-complexo-ruas'
export type PontoEntrega={x:number;y:number;z:number}
type P={x:number;z:number}
const dist=(a:P,b:P)=>Math.hypot(a.x-b.x,a.z-b.z)
const project=(p:P,a:P,b:P)=>{const l=(b.x-a.x)**2+(b.z-a.z)**2,t=Math.max(0,Math.min(1,((p.x-a.x)*(b.x-a.x)+(p.z-a.z)*(b.z-a.z))/(l||1)));return{t,x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t}}
/** Routes only over the existing street centre-lines. Crossings and nearby lane
 * endpoints are split, rather than linking arbitrary houses across the city. */
export function caminhoPelasRuas(roads:readonly RuaComplexo[],start:P,end:P,maxPrivateAccess=24):P[]|null{
 const segs=roads.filter(r=>r.width>=4.5).flatMap(r=>r.points.slice(1).map((b,i)=>({a:r.points[i],b,cuts:[0,1],width:r.width})))
 const nearest=(p:P)=>{let best:{i:number;t:number;x:number;z:number;d:number}|undefined;for(let i=0;i<segs.length;i++){const q=project(p,segs[i].a,segs[i].b),d=dist(p,q);if(!best||d<best.d)best={...q,d,i}}return best}
 const first=nearest(start),last=nearest(end);if(!first||!last||first.d>18||last.d>maxPrivateAccess)return null
 segs[first.i].cuts.push(first.t);segs[last.i].cuts.push(last.t)
 const buckets=new Map<string,number[]>(),pairs=new Set<string>(),links:{i:number;t:number;j:number;u:number}[]=[]
 for(let i=0;i<segs.length;i++){const s=segs[i];for(let x=Math.floor((Math.min(s.a.x,s.b.x)-5)/32);x<=Math.floor((Math.max(s.a.x,s.b.x)+5)/32);x++)for(let z=Math.floor((Math.min(s.a.z,s.b.z)-5)/32);z<=Math.floor((Math.max(s.a.z,s.b.z)+5)/32);z++){const k=x+','+z,old=buckets.get(k)??[];for(const j of old)pairs.add(j+':'+i);old.push(i);buckets.set(k,old)}}
 for(const key of pairs){const[i,j]=key.split(':').map(Number),s=segs[i],q=segs[j],dx=s.b.x-s.a.x,dz=s.b.z-s.a.z,ex=q.b.x-q.a.x,ez=q.b.z-q.a.z,cross=dx*ez-dz*ex;
  if(Math.abs(cross)>1e-8){const vx=q.a.x-s.a.x,vz=q.a.z-s.a.z,t=(vx*ez-vz*ex)/cross,u=(vx*dz-vz*dx)/cross;if(t>=0&&t<=1&&u>=0&&u<=1){s.cuts.push(t);q.cuts.push(u);links.push({i,t,j,u})}}
  for(const[k,n]of[[i,j],[j,i]])for(const t of[0,1]){const a=segs[k],b=segs[n],p=t?a.b:a.a,r=project(p,b.a,b.b);if(dist(p,r)<=Math.min(a.width,b.width)/2){a.cuts.push(t);b.cuts.push(r.t);links.push({i:k,t,j:n,u:r.t})}}
 }
 const nodes:P[]=[],edges=new Map<number,{id:number;d:number}[]>(),ids=new Map<string,number>()
 const node=(p:P)=>{const key=Math.round(p.x*100)+','+Math.round(p.z*100);let id=ids.get(key);if(id===undefined){id=nodes.length;nodes.push({x:p.x,z:p.z});ids.set(key,id);edges.set(id,[])}return id}
 const at=(i:number,t:number)=>node({x:segs[i].a.x+(segs[i].b.x-segs[i].a.x)*t,z:segs[i].a.z+(segs[i].b.z-segs[i].a.z)*t})
 const edge=(a:number,b:number)=>{if(a===b)return;const d=dist(nodes[a],nodes[b]);edges.get(a)!.push({id:b,d});edges.get(b)!.push({id:a,d})}
 for(let i=0;i<segs.length;i++){const cuts=[...new Set(segs[i].cuts)].sort((a,b)=>a-b);for(let k=1;k<cuts.length;k++)edge(at(i,cuts[k-1]),at(i,cuts[k]))}for(const l of links)edge(at(l.i,l.t),at(l.j,l.u))
 const from=at(first.i,first.t),to=at(last.i,last.t),cost=new Map<number,number>([[from,0]]),previous=new Map<number,number>(),pending=new Set([from]),closed=new Set<number>()
 while(pending.size){let a=-1,score=Infinity;for(const n of pending){const v=cost.get(n)!+dist(nodes[n],nodes[to]);if(v<score){a=n;score=v}}if(a===to)break;pending.delete(a);closed.add(a);for(const e of edges.get(a)??[]){if(closed.has(e.id))continue;const next=cost.get(a)!+e.d;if(next<(cost.get(e.id)??Infinity)){cost.set(e.id,next);previous.set(e.id,a);pending.add(e.id)}}}
 if(from!==to&&!previous.has(to))return null;const found=[to];while(found[0]!==from)found.unshift(previous.get(found[0])!);return[start,...found.map(n=>nodes[n]),end].filter((p,i,a)=>!i||dist(p,a[i-1])>.05)
}
/** Trim each corner and sample an actual quadratic arc; heading follows its tangent. */
export function arredondarCaminho(points:readonly P[],radius=3):P[]{
 if(points.length<3)return points.map(p=>({...p}));const out:P[]=[points[0]]
 for(let i=1;i<points.length-1;i++){const a=points[i-1],b=points[i],c=points[i+1],ab=dist(a,b),bc=dist(b,c);if(ab<.1||bc<.1)continue;const d=Math.min(radius,ab*.32,bc*.32),p={x:b.x+(a.x-b.x)*d/ab,z:b.z+(a.z-b.z)*d/ab},q={x:b.x+(c.x-b.x)*d/bc,z:b.z+(c.z-b.z)*d/bc};out.push(p);for(let k=1;k<=8;k++){const t=k/8,s=1-t;out.push({x:s*s*p.x+2*s*t*b.x+t*t*q.x,z:s*s*p.z+2*s*t*b.z+t*t*q.z})}}
 out.push(points.at(-1)!);return out
}
/** Metric motion, acceleration and braking; no loops or return-to-shop teleport. */
export function viagemVeiculo(points:readonly PontoEntrega[],maxSpeed=7){
 if(points.length<2||!(maxSpeed>0)||points.some(p=>![p.x,p.y,p.z].every(Number.isFinite)))throw Error('Trajeto de veículo inválido')
 const nodes=[{...points[0],d:0}];let length=0;for(const p of points.slice(1)){const step=dist(nodes.at(-1)!,p);if(step<1e-5)continue;length+=step;nodes.push({...p,d:length})}if(length<1e-5)throw Error('Trajeto de veículo vazio');const ramp=Math.min(2,Math.sqrt(length/maxSpeed)),duration=length/maxSpeed+ramp
 function sample(d:number){let low=1,high=nodes.length-1;while(low<high){const mid=(low+high)>>1;if(nodes[mid].d<d)low=mid+1;else high=mid}const a=nodes[low-1],b=nodes[low],u=Math.max(0,Math.min(1,(d-a.d)/(b.d-a.d)));return{x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,z:a.z+(b.z-a.z)*u}}
 function at(t:number){t=Math.max(0,Math.min(duration,t));const left=duration-t,speed=t<ramp?maxSpeed*t/ramp:left<ramp?maxSpeed*left/ramp:maxSpeed,d=t<ramp?maxSpeed*t*t/(2*ramp):left<ramp?length-maxSpeed*left*left/(2*ramp):maxSpeed*(t-ramp/2),a=sample(Math.max(0,d-.35)),b=sample(Math.min(length,d+.35));return{...sample(d),heading:Math.atan2(b.x-a.x,b.z-a.z),speed,distance:d,done:t>=duration}}
 return{length,duration,points,at}
}
