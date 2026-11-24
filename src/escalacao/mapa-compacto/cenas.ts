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
