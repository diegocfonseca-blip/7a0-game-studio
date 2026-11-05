import {customerJourney} from './activity-route.mjs';

/** Pequenos encontros nas calçadas reais. O mesmo orçamento de moradores é
 * redistribuído; não são ingressos, novos estabelecimentos ou renda simulada. */
export function residentGatherings(hotspots,valid){
 const groups=[];
 for(const hub of hotspots){
  const [a,b]=hub.frontage,d=Math.hypot(b.x-a.x,b.z-a.z);if(d<4)continue;
  const dx=(b.x-a.x)/d,dz=(b.z-a.z)/d;
  const point=(along,lane=0)=>({x:a.x+dx*along-dz*lane,y:.16,z:a.z+dz*along+dx*lane});
  const jobs=[];
  for(let slot=0;slot<4;slot++){
   const end=d/2+(slot-1.5)*1.6;
   // A faixa de circulação fica à frente de quem parou; nenhum novo piso é criado.
   for(const lane of [.85,-.85]){
    const start=Math.max(.8,Math.min(d-.8,end+(slot%2?3:-3)));
    const points=[point(start,lane),point(end,lane),point(end)];
    let clear=true;
    for(let i=1;i<points.length&&clear;i++){
     const p=points[i-1],q=points[i],steps=Math.ceil(Math.hypot(q.x-p.x,q.z-p.z)/.3);
     for(let j=0;j<=steps;j++){const t=j/steps;if(!valid({x:p.x+(q.x-p.x)*t,y:.16,z:p.z+(q.z-p.z)*t})){clear=false;break}}
    }
    if(!clear)continue;
    jobs.push({id:hub.id+'-encontro-'+slot,destination:hub.id,purpose:hub.purpose,publicWaiting:true,hideInside:false,position:points[0],points,journey:customerJourney(points,{speed:.95,wait:4+slot,stay:32+slot*7})});break;
   }
  }
  if(jobs.length)groups.push(jobs);
 }
 // Intercalar locais antes de aumentar o grupo de um só ponto.
 return Array.from({length:4},(_,slot)=>groups.flatMap(jobs=>jobs[slot]?[jobs[slot]]:[])).flat();
}

export function residentJob(index,gatherings,journeys){
 // Dois moradores nos encontros para um circulando pelo bairro. Índice estável:
 // mudar qualidade/quantidade não transfere quem já existe para outro lugar.
 const socialIndex=index-Math.floor(index/3);
 if(index%3!==2&&socialIndex<gatherings.length)return gatherings[socialIndex];
 return journeys.length?journeys[(Math.floor(index/3)*13+index%3*7)%journeys.length]:gatherings[index%gatherings.length];
}

/** Validar a faixa da criança uma vez, sem raycasts por personagem a cada frame. */
export function companionGathering(job,valid){
 if(!job?.publicWaiting)return job;
 for(const [dx,dz] of [[0,.85],[0,-.85],[.8,0],[-.8,0]]){
  const at=time=>{const pose=job.journey.at(time);return{...pose,x:pose.x+dx,z:pose.z+dz}};
  let clear=true;
  for(let i=1;i<job.points.length&&clear;i++){
   const a=job.points[i-1],b=job.points[i],steps=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.3);
   for(let j=0;j<=steps;j++){const t=j/steps;if(!valid({x:a.x+(b.x-a.x)*t+dx,y:.16,z:a.z+(b.z-a.z)*t+dz})){clear=false;break}}
  }
  if(clear)return{...job,journey:{...job.journey,at},points:job.points.map(p=>({...p,x:p.x+dx,z:p.z+dz}))};
 }
 return job;
}
