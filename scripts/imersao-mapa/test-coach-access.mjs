import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
import {registerHooks} from 'node:module'
registerHooks({
 resolve(s,c,n){if(s.startsWith('.')&&c.parentURL?.startsWith('file:')){const p=new URL(s+'.ts',c.parentURL);if(existsSync(p))return{url:p.href,shortCircuit:true}}return n(s,c)},
 load(u,c,n){if(u.endsWith('/lang.ts'))return{format:'module',source:"export const getLang=()=> 'pt'",shortCircuit:true};return n(u,c)},
})

const {teamCoachAccess,TEAM_COACH:C}=await import('../../src/escalacao/cidade3d/coach-access.mjs');
const {activityRoute}=await import('../../src/escalacao/cidade3d/activity-route.mjs');
const {PLANTA_COMPLEXO,mapaParaMundo}=await import('../../src/escalacao/presidencia-complexo-model.ts');
const {LOTES_ESTACIONAMENTO_COMPLEXO}=await import('../../src/escalacao/presidencia-complexo-transporte-model.ts');
const T=await import('three');const {OBB}=await import('three/addons/math/OBB.js');
const plan=teamCoachAccess(),inside=(p,poly)=>{let x=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)x=!x}return x};
const cross=(a,b,c)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
const meet=(a,b,c,d)=>cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0;
const overlaps=(a,b)=>a.some(p=>inside(p,b))||b.some(p=>inside(p,a))||a.some((p,i)=>b.some((q,j)=>meet(p,a[(i+1)%a.length],q,b[(j+1)%b.length])));
const rect=(x,z,w,d)=>[{x:x-w/2,z:z-d/2},{x:x+w/2,z:z-d/2},{x:x+w/2,z:z+d/2},{x:x-w/2,z:z+d/2}];
const obstacles=[...Object.entries(PLANTA_COMPLEXO.footprints).filter(([name])=>/fonte|canteiro|jardim/.test(name)).map(([name,polygon])=>({name,polygon})),...Object.entries(PLANTA_COMPLEXO.lots).map(([name,l])=>({name,polygon:l.footprint})),...LOTES_ESTACIONAMENTO_COMPLEXO.map((polygon,i)=>({name:'reserved-parking-'+i,polygon})),...[-32,32].map(x=>({name:'paid-front-garden-'+x,polygon:rect(x,100,20,3)}))];
const footprint=p=>[[-1.45,-6.45],[1.45,-6.45],[1.45,6.45],[-1.45,6.45]].map(([x,z])=>({x:p.x+x*Math.cos(p.heading)+z*Math.sin(p.heading),z:p.z-x*Math.sin(p.heading)+z*Math.cos(p.heading)}));
const circle=(x,z,r)=>Array.from({length:16},(_,i)=>({x:x+Math.cos(i*Math.PI/8)*r,z:z+Math.sin(i*Math.PI/8)*r}));for(const [x,y]of [[532,640],[598,691],[605,752],[929,741],[988,665],[1043,598]]){const p=mapaParaMundo({x,y});obstacles.push({name:'paid-palm',polygon:circle(p.x,p.z,.45)},...[-1,1].map(side=>({name:'paid-cypress',polygon:circle(p.x+side*3.8,p.z,.9)})))}
obstacles.push({name:'temporary-cordon-outside-manoeuvre',polygon:rect(-98.5,13,.2,18.2)});
let probes=0;for(const points of [plan.inbound,plan.outbound]){const route=activityRoute(points,4.2,2);for(let t=0;t<route.duration;t+=.05){const p=route.at(t),poly=footprint(p);for(const o of obstacles)assert(!overlaps(poly,o.polygon),'Coach crosses '+o.name+' at '+JSON.stringify(p));probes++}}
const incoming=activityRoute(plan.inbound,4.2,2),outgoing=activityRoute(plan.outbound,4.2,2),unload=incoming.duration+1.4,depart=unload+10*1.45+4.5+1.4,slot=depart+outgoing.duration+6;
const drive=t=>t<incoming.duration?incoming.at(t):t<depart?incoming.at(incoming.duration):outgoing.at(t-depart);
const obb=p=>new OBB(new T.Vector3(p.x,1.8,p.z),new T.Vector3(1.45,1.8,6.45),new T.Matrix3().setFromMatrix4(new T.Matrix4().makeRotationY(p.heading)));
let pairs=0;for(let t=slot;t<depart+outgoing.duration;t+=.02){if(t-slot>depart+outgoing.duration)break;assert(!obb(drive(t)).intersectsOBB(obb(drive(t-slot))),'Team coaches overlap at '+t);pairs++}
assert(slot>depart+outgoing.duration,'Second team waits outside the access until the first clears it');assert.equal(plan.publicTerminalUsed,false);assert(plan.minimumWallClearance>1.5&&plan.minimumWallClearance<4);
assert(C.length>12&&C.height>3.5&&C.floorHeight>1);assert(plan.passenger[4].x>plan.bay.x+C.width/2);
console.log(JSON.stringify({status:'PASS',reservedSiteProbes:probes,coachPairProbes:pairs,wallClearance:plan.minimumWallClearance,publicStopUsed:false}));
