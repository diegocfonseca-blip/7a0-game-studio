import type {PresidenteBaseSave} from './presidencia-carreira'
import {aparenciaModular,aparenciaInicial,camadasDoPresidente} from './presidente-aparencia'
import {montarPresidenteLayers} from './presidente-rig'
import {PECAS_PRESIDENTE} from './presidente-pecas'
import {VESTUARIO_MODULAR} from './presidente-vestuario-modular'
import {podeVestirModular} from './presidente-vestuario-acesso'
import type {PresidenteRoupaTier} from './presidente-roupas'

/** Só rascunho, só peças integradas. Nome, tom de pele e mandato são mantidos.
 * Nenhum pacote de jogador inteiro; cabelo e barba são sorteados à parte. */
export function sortearPresidente(value:PresidenteBaseSave,random:()=>number=Math.random,tier:PresidenteRoupaTier|null=null):PresidenteBaseSave{
 const outfits=VESTUARIO_MODULAR.filter(roupa=>podeVestirModular(roupa.id,tier))
 if(!outfits.length)return value
 const pick=<T,>(items:readonly T[]):T=>{const n=random();return items[Number.isFinite(n)&&n>=0&&n<1?Math.floor(n*items.length):0]}
 const ready=PECAS_PRESIDENTE.filter(p=>p.ready)
 const hair=pick(['none',...ready.filter(p=>p.category==='hair').map(p=>p.id)])
 const beard=pick(['none',...ready.filter(p=>p.category==='beard').map(p=>p.id)])
 const accessories:string[]=[]
 for(const slot of ['ears','face','head'] as const){
  const id=pick(['none',...ready.filter(p=>p.category==='accessory'&&p.slot===slot).map(p=>p.id)])
  if(id!=='none')accessories.push(id)
 }
 const appearance=aparenciaModular(value.appearance??aparenciaInicial())
 const next={...value,outfit:pick(outfits).id,appearance:{...appearance,hair,beard,accessories}}
 return montarPresidenteLayers(camadasDoPresidente(next)).ok?next:value
}
