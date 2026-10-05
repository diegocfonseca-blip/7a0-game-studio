import {roupaModularValida} from './presidente-vestuario-modular'
/** Aparência da base unificada. Não aceita IDs v2 nem concede plano/peças. */
import {PECAS_PRESIDENTE,type PecaPresidente,type CategoriaPeca} from './presidente-pecas'
import {montarPresidenteLayers} from './presidente-rig'
import {tomPeleValido,type TomPele} from './presidente-pele'
export type PresidenteAparencia={version:16;hair:'none'|'classic';beard:'none'|'classic'}|{version:22;hair:string;beard:string;accessories:string[];skinTone?:TomPele}
export function aparenciaValida(v:unknown,catalog:readonly PecaPresidente[]=PECAS_PRESIDENTE):v is PresidenteAparencia{
 if(!v||typeof v!=='object')return false
 const p=v as PresidenteAparencia
 if(p.version===16)return (p.hair==='none'||p.hair==='classic')&&(p.beard==='none'||p.beard==='classic')
 if(p.version!==22||!Array.isArray(p.accessories)||p.accessories.length>3||new Set(p.accessories).size!==p.accessories.length)return false
 if(p.skinTone!==undefined&&!tomPeleValido(p.skinTone))return false
 const slots=new Set<string>()
 for(const [kind,ids] of [['hair',[p.hair]],['beard',[p.beard]],['accessory',p.accessories]] as const){
  for(const id of ids){
   if(id==='none'&&kind!=='accessory')continue
   const matches=catalog.filter(x=>x.id===id&&x.category===kind)
   if(matches.length!==1||!matches[0].ready||!matches[0].layers.length)return false
   if(kind==='accessory'){
    const slot=matches[0].slot
    if(!slot||slots.has(slot))return false
    slots.add(slot)
   }
  }
 }
 return true
}
export function copiarAparencia(p:PresidenteAparencia):PresidenteAparencia{return p.version===22?{...p,accessories:[...p.accessories]}:{...p}}
export function aparenciaModular(p:PresidenteAparencia):Extract<PresidenteAparencia,{version:22}>{
 return p.version===22?{...p,accessories:[...p.accessories]}:{version:22,hair:p.hair==='classic'?'classic-hair':'none',beard:p.beard==='classic'?'classic-beard':'none',accessories:[]}
}
/** Muda SOMENTE a categoria solicitada, preservando as outras peças. */
export function escolherPeca(p:PresidenteAparencia,category:CategoriaPeca,id:string):PresidenteAparencia|null{
 if(!aparenciaValida(p))return null
 const next=aparenciaModular(p)
 if(category==='accessory'){
  if(id==='none')next.accessories=[]
  else if(next.accessories.includes(id))next.accessories=next.accessories.filter(x=>x!==id)
  else{
   const piece=PECAS_PRESIDENTE.find(x=>x.id===id&&x.category==='accessory')
   if(!piece?.ready||!piece.slot)return null
   next.accessories=next.accessories.filter(x=>PECAS_PRESIDENTE.find(c=>c.id===x)?.slot!==piece.slot)
   next.accessories.push(id)
  }
 }else next[category]=id
 return aparenciaValida(next)?next:null
}
export function aparenciaInicial():PresidenteAparencia{return {version:16,hair:'classic',beard:'classic'}}
export function escolherTomPele(p:PresidenteAparencia,tone:unknown):PresidenteAparencia|null{
 if(!aparenciaValida(p)||!tomPeleValido(tone))return null
 return {...aparenciaModular(p),skinTone:tone}
}
export function camadasDoPresidente(v:{outfit:string;appearance?:PresidenteAparencia}):string[]{
 if(!roupaModularValida(v.outfit))return ['invalid-outfit']
 const p=v.appearance??aparenciaInicial()
 if(!aparenciaValida(p))return ['invalid-appearance']
 if(p.version===16)return ['base-neutra-'+v.outfit,...(p.hair==='classic'?['cabelo-classico']:[]),...(p.beard==='classic'?['barba-classico']:[])]
 const ids=[p.hair,p.beard,...p.accessories].filter(id=>id!=='none')
 const base='base-neutra-'+v.outfit+(p.skinTone&&p.skinTone!=='medium'?'-'+p.skinTone:'')
 const layers=[base,...ids.flatMap(id=>PECAS_PRESIDENTE.find(x=>x.id===id)!.layers)]
 return montarPresidenteLayers(layers).ok?layers:['invalid-appearance']
}
