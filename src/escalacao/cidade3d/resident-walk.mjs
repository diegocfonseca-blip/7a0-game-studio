const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const angle=x=>Math.atan2(Math.sin(x),Math.cos(x));
const mix=(a,b,u)=>({x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,z:a.z+(b.z-a.z)*u});
const distance=(a,b)=>Math.hypot(b.x-a.x,b.z-a.z);

/** Round only inside a validated pavement. Keep the original corner when its
 * rounded alternative is obstructed. The supplied ground test is authoritative. */
export function sidewalkRoute(points,valid,{radius=.9}={}){
 if(points.length<2)return null;
 // Ground validation densely samples long straight segments. Those samples
 // are not street corners and must not shrink a real bend to a 25cm radius.
 points=points.filter((b,i)=>{if(!i||i===points.length-1)return true;const a=points[i-1],c=points[i+1];return Math.abs(angle(Math.atan2(b.x-a.x,b.z-a.z)-Math.atan2(c.x-b.x,c.z-b.z)))>1e-5});
 const rounded=[{...points[0]}];
 for(let i=1;i<points.length-1;i++){
  const a=points[i-1],b=points[i],c=points[i+1],ab=distance(a,b),bc=distance(b,c),r=Math.min(radius,ab*.2,bc*.2);
  if(r<.05||Math.abs(angle(Math.atan2(b.x-a.x,b.z-a.z)-Math.atan2(c.x-b.x,c.z-b.z)))<.03){rounded.push({...b});continue}
  const enter=mix(b,a,r/ab),exit=mix(b,c,r/bc),arc=[];
  for(let j=0;j<=8;j++){const u=j/8,p=mix(mix(enter,b,u),mix(b,exit,u),u);arc.push(p)}
  if(arc.every(valid))rounded.push(...arc);else rounded.push({...b});
 }
 rounded.push({...points.at(-1)});
 const nodes=[{...rounded[0],at:0}];let length=0;
 for(let i=1;i<rounded.length;i++){
  const a=rounded[i-1],b=rounded[i],d=distance(a,b);if(d<1e-6)continue;
  const n=Math.ceil(d/.5);
  for(let j=1;j<=n;j++){const p=mix(a,b,j/n);if(!valid(p))return null;length+=d/n;nodes.push({...p,at:length})}
 }
 if(length<12)return null;
 for(let i=0;i<nodes.length;i++){const a=nodes[Math.max(0,i-1)],b=nodes[Math.min(nodes.length-1,i+1)],h=Math.atan2(b.x-a.x,b.z-a.z);nodes[i].heading=i?nodes[i-1].heading+angle(h-nodes[i-1].heading):h}
 const totalTurn=nodes.at(-1).heading-nodes[0].heading;
 return{nodes,length,totalTurn,sample(s){s=clamp(s,0,length);let lo=0,hi=nodes.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(nodes[m].at<=s)lo=m;else hi=m}const a=nodes[lo],b=nodes[hi],u=(s-a.at)/(b.at-a.at),p=mix(a,b,u),heading=a.heading+(b.heading-a.heading)*u;return{...p,heading,turnAngle:heading-nodes[0].heading,curvature:(b.heading-a.heading)/(b.at-a.at)}}};
}

/** Metres actually walked advance the gait; slow U-turns count their physical arc
 * instead of advancing the gait at full walking speed while waiting. Both directions have their own lane. */
export function residentWalk(route,seconds,{speed=1.05,turn=1.2,lane=.32}={}){
 const ramp=Math.min(.7,route.length/speed),travel=route.length/speed+ramp,half=travel+turn,period=2*half;
 const time=Math.max(0,seconds),cycles=Math.floor(time/period),phase=time-cycles*period,returning=phase>=half,t=returning?phase-half:phase;
 const moving=t<travel,elapsed=Math.min(t,travel);let d,v;
 if(elapsed<ramp){d=speed*elapsed*elapsed/(2*ramp);v=speed*elapsed/ramp}
 else if(elapsed>travel-ramp){const rest=travel-elapsed;d=route.length-speed*rest*rest/(2*ramp);v=speed*rest/ramp}
 else{d=speed*(elapsed-ramp*.5);v=speed}
 const position=route.sample(returning?route.length-d:d),base=position.heading+(returning?Math.PI:0);
 let heading=base,offset=lane,forward=0,turnDistance=0,turnSpeed=0;
 if(!moving){const u=clamp((t-travel)/turn,0,1),s=u*u*(3-2*u),theta=Math.PI*s;heading=base+theta;offset=lane*Math.cos(theta);forward=lane*Math.sin(theta);turnDistance=lane*theta;turnSpeed=lane*Math.PI*6*u*(1-u)/turn}
 const normal=position.heading+(returning?Math.PI:0);
 const laneDistance=returning?d+lane*((route.totalTurn??0)-(position.turnAngle??0)):d-lane*(position.turnAngle??0);
 const laneSpeed=v*Math.max(.2,1+(returning?1:-1)*lane*(position.curvature??0));
 return{x:position.x+Math.cos(normal)*offset+Math.sin(normal)*forward,y:position.y,z:position.z-Math.sin(normal)*offset+Math.cos(normal)*forward,heading:angle(heading),speed:moving?laneSpeed:turnSpeed,distance:cycles*2*(route.length+Math.PI*lane)+(returning?route.length-lane*(route.totalTurn??0)+Math.PI*lane:0)+laneDistance+turnDistance,phase:moving?'walking':'turning',period};
}
