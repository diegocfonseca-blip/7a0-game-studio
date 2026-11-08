import {STADIUM_SERVICE_GATE} from './stadium-entrances.mjs';
/** Club team service, separate from the public bus terminal. Metres, +Z forward.
 * No paving, purchase, attendance or official-match state is created here. */
export const TEAM_COACH={length:12.8,width:2.6,height:3.72,wheelRadius:.49,floorHeight:1.10,axles:[-3.9,3.75],door:{side:-1,longitudinal:5.35,width:1.0}};
export const COACH_BAY={x:-94,z:-14,heading:Math.PI,wallX:-89.5};
export function roundCoachRoute(vertices,radius=9){
 const out=[{...vertices[0],y:0}];
 for(let i=1;i<vertices.length-1;i++){
  const a=vertices[i-1],p=vertices[i],b=vertices[i+1],la=Math.hypot(p.x-a.x,p.z-a.z),lb=Math.hypot(b.x-p.x,b.z-p.z),u={x:(p.x-a.x)/la,z:(p.z-a.z)/la},v={x:(b.x-p.x)/lb,z:(b.z-p.z)/lb};
  const turn=Math.atan2(u.x*v.z-u.z*v.x,u.x*v.x+u.z*v.z);
  if(Math.abs(turn)<1e-5){out.push({...p,y:0});continue}
  const cut=radius*Math.tan(Math.abs(turn)/2);
  if(cut>Math.min(la,lb)*.49)throw Error('Coach bend lacks manoeuvring space at '+i);
  const sign=Math.sign(turn),from={x:p.x-u.x*cut,z:p.z-u.z*cut},c={x:from.x-u.z*radius*sign,z:from.z+u.x*radius*sign},start=Math.atan2(from.z-c.z,from.x-c.x),steps=Math.ceil(Math.abs(turn)*radius/.45);
  out.push({...from,y:0});for(let j=1;j<=steps;j++){const t=start+turn*j/steps;out.push({x:c.x+Math.cos(t)*radius,z:c.z+Math.sin(t)*radius,y:0})}
 }
 out.push({...vertices.at(-1),y:0});
 const dense=[];for(let i=1;i<out.length;i++){const a=out[i-1],b=out[i],n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.5));for(let j=i===1?0:1;j<=n;j++){const t=j/n;dense.push({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,y:0})}}
 return dense;
}
export function teamCoachAccess(){
 // 🚌 08/11: o ônibus dos times chega e sai pelo BAIRRO DO OESTE (rua de cima → rua x −186 → ramal de serviço → rua
 // interna oeste), nunca pela avenida. Desde a pista paralela de 04/11 a linha pública de ônibus roda a avenida inteira,
 // ida e volta; o caminho antigo (avenida → portão x 30 → frente do estádio) cruzava a linha dela na tela.
 const viaOeste=[{x:-240,z:-112},{x:-186,z:-112},{x:-186,z:-1},{x:-124,z:0},{x:-121,z:45},{x:-97,z:48}];
 const inbound=roundCoachRoute([...viaOeste,{x:-94,z:26},COACH_BAY]);
 const manoeuvre=roundCoachRoute([COACH_BAY,{x:-94,z:-32},{x:-107.6,z:-42},{x:-107.6,z:-60}],7.8);
 const turn=Array.from({length:80},(_,i)=>{const a=Math.PI+Math.PI*(i+1)/80;return{x:-99.8+Math.cos(a)*7.8,z:-60+Math.sin(a)*7.8,y:0}});
 const leave=roundCoachRoute([{x:-92,z:-60},{x:-94,z:26},...[...viaOeste].reverse()]);
 const outbound=[...manoeuvre,...turn,...leave.slice(1)];
 const passenger=[{x:-93.2,z:-19.35,y:1.10},{x:-92.92,z:-19.35,y:.83},{x:-92.64,z:-19.35,y:.56},{x:-92.36,z:-19.35,y:.29},{x:-91.94,z:-19.35,y:0},{x:-91.94,z:-5,y:0},{x:-94,z:-5,y:0},{...STADIUM_SERVICE_GATE.approach,y:.16},{...STADIUM_SERVICE_GATE.threshold,y:.16},{...STADIUM_SERVICE_GATE.inside,y:.16}];
 return{bay:COACH_BAY,inbound,outbound,passenger,publicTerminalUsed:false,minimumWallClearance:COACH_BAY.wallX-(COACH_BAY.x+TEAM_COACH.width/2)};
}
