import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){if(s.startsWith('.')&&c.parentURL?.startsWith('file:')){const p=new URL(s+'.ts',c.parentURL);if(existsSync(p))return{url:p.href,shortCircuit:true}}return n(s,c)},load(u,c,n){if(u.endsWith('/lang.ts'))return{format:'module',source:"export const getLang=()=> 'pt'",shortCircuit:true};return n(u,c)}});
const {gerarPlantaTransporte}=await import('../../src/escalacao/presidencia-complexo-transporte-model.ts');
const {teamCoachAccess,TEAM_COACH}=await import('../../src/escalacao/cidade3d/coach-access.mjs');
const {activityRoute}=await import('../../src/escalacao/cidade3d/activity-route.mjs');
const {complexoDoEstadio}=await import('../../src/escalacao/presidencia-complexo-model.ts');
const plan=gerarPlantaTransporte(complexoDoEstadio({inv:{},ext:[]})),bus=plan.services.find(s=>s.kind==='bus'),coach=teamCoachAccess();
const pointSegment=(p,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,u=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(p.x-a.x-u*dx,p.z-a.z-u*dz)};
let min=Infinity;const publicPath=[...bus.inbound,...bus.outbound];for(const path of [coach.inbound,coach.outbound]){const route=activityRoute(path);for(let t=0;t<=route.duration;t+=.1){const p=route.at(t);for(let i=1;i<publicPath.length;i++)min=Math.min(min,pointSegment(p,publicPath[i-1],publicPath[i]))}}
const conservativeRadius=Math.hypot(TEAM_COACH.length,TEAM_COACH.width)/2+Math.hypot(bus.length,bus.width)/2;
assert(min>conservativeRadius+.5,`Bus and coach swept volumes conflict ${min}`);console.log(JSON.stringify({status:'PASS',minimumRouteDistance:min,combinedBoundingRadii:conservativeRadius,independentTerminals:true}));
