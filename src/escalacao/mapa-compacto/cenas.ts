import {boundsForView} from './model'
/** Planos para a ação na calçada, em vez de enquadrar lote e telhado inteiros. */
export function planoCenaCompacta(view:string,aspect:number){
 if(view==='clube-lazer')return{target:[-177.85,1,67] as [number,number,number],camera:[-160,13,91] as [number,number,number]}
 if(view==='entrance'||view==='matchday')return{target:[-4.5,2,101] as [number,number,number],camera:[18,12,132] as [number,number,number]}
 if(view==='city-street')return{target:[-15,3,153] as [number,number,number],camera:[2,12,176] as [number,number,number]}
 const b=boundsForView(view);if(!b)return undefined
 const perto=['boteco-oswaldo','bar-esquina','balada','padaria','banca'].includes(view)
 if(!perto)return undefined
 const x=(b.minX+b.maxX)/2,z=b.maxZ+1.8,dist=Math.max(15,(b.maxX-b.minX)*.85/Math.max(.55,aspect))
 return{target:[x,view==='balada'?2.6:1.8,z] as [number,number,number],camera:[x+dist*.25,view==='balada'?6.6:5.3,z+dist] as [number,number,number]}
}

/** Close-up framing shares the same ground anchor as the four scene actors. */
export function centroTrecho(view:string){
 if(['entrance','matchday','city-street'].includes(view))return {x:-4.5,z:105}
 if(view==='clube-lazer')return {x:-177.85,z:74.02}
 if(view==='campinho'){const b=boundsForView(view)!;return {x:(b.minX+b.maxX)/2,z:b.maxZ-4}}
 const b=boundsForView(view)
 return b?{x:(b.minX+b.maxX)/2,z:b.maxZ+(view==='loja'?7:view==='balada'?6:2.8)}:{x:-144,z:202}
}
export function planoTrecho(view:string,aspect:number){
 if(view==='clube-lazer')return {target:[-177.85,1.2,74.02] as [number,number,number],camera:[-190.5,6.4,87] as [number,number,number]}
 const c=centroTrecho(view),distance=Math.max(8,8/Math.max(.8,aspect))
 return {target:[c.x,1.2,c.z] as [number,number,number],camera:[c.x+2.4,3.5,c.z+distance] as [number,number,number]}
}
