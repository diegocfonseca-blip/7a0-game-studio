import {LOTES_PATROCINADORES_CIDADE} from './presidencia-patrocinadores-planta'
import {vidaDoBairro,type ContextoBairro} from './presidencia-bairro-tradicoes'
const g=LOTES_PATROCINADORES_CIDADE.gecg
export function elencoPeladaGecg(light:boolean,mobile:boolean){
 const lines=light?1:mobile?2:3
 return([-1,1] as const).flatMap(side=>Array.from({length:lines+1},(_,slot)=>({side,keeper:slot===0,x:g.x+side*(slot===0?25:slot===1?10:6),z:g.z+(slot===0?0:slot===1?0:slot===2?-7:7)})))
}
/** Pelada decorativa, sem placar, sorteio, resultado ou relógio oficial. */
export function quadroPeladaGecg(seconds:number,light:boolean,mobile:boolean,contexto:ContextoBairro={}){
 const roster=elencoPeladaGecg(light,mobile),phase=((seconds%36)+36)%36,attack=phase<18?-1:1,local=phase%18,shot=local>=12&&local<15
 const line=roster.map((p,i)=>({...p,x:p.x+(p.keeper?0:Math.sin(seconds*.45+i)*1.8),z:p.z+(p.keeper?Math.sin(seconds*.7)*1.1:Math.cos(seconds*.36+i)*1.8)}))
 const own=line.map((p,i)=>({...p,index:i})).filter(p=>p.side===attack&&!p.keeper),other=own.length>1?own[1]:own[0]
 const owner=own[local<6||local>=12?0:Math.min(1,own.length-1)],to=local<6?other:own[0],u=Math.min(1,Math.max(0,(local%6-1.2)/1.8))
 let ball={x:owner.x+(attack<0?.55:-.55),y:.32,z:owner.z}
 if(local<12)ball={x:ball.x+(to.x-ball.x)*u,y:.32+Math.sin(u*Math.PI)*.22,z:ball.z+(to.z-ball.z)*u}
 else if(shot){const u=(local-12)/3,target=line.find(p=>p.side!==attack&&p.keeper)!;ball={x:owner.x+(target.x-owner.x)*u,y:.32+Math.sin(u*Math.PI)*.65,z:owner.z+(target.z-owner.z)*u}}
 else{const keeper=line.find(p=>p.side!==attack&&p.keeper)!,next=line.find(p=>p.side!==attack&&!p.keeper)!,u=(local-15)/3;ball={x:keeper.x-keeper.side*.45+(next.x-keeper.x)*u,y:.32,z:keeper.z+(next.z-keeper.z)*u}}
 const morning=vidaDoBairro(contexto).periodo==='manha'
 return{mode:morning?'escolinha':'pelada',players:line.map((p,i)=>({...p,heading:Math.atan2(ball.x-p.x,ball.z-p.z),kicking:!p.keeper&&i===owner.index,speed:p.keeper ? .35 : .7})),ball,shooter:owner.index,shot,children:morning}
}
