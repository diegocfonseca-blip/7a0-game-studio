import type {TrofeuPresidencia} from './presidencia-trofeus'
import type {PresidenciaBem} from './presidencia-economia'
// Modelo de apresentação. Não compra móveis nem concede posse no save.
export const SALA_RASCUNHO_KEY='ll-presidencia-v2-preview'
export const SALA_MOVEIS=[
 {id:'tapete',pt:'Tapete',en:'Rug'},
 {id:'estante',pt:'Estante de troféus',en:'Trophy cabinet'},
 {id:'sofa',pt:'Sofá',en:'Sofa'},
 {id:'luminaria',pt:'Luminária',en:'Floor lamp'},
 {id:'lustre',pt:'Lustre',en:'Chandelier'},
 {id:'quadro',pt:'Moldura da camisa',en:'Shirt frame'},
 {id:'aquario',pt:'Aquário',en:'Aquarium'},
 {id:'planta',pt:'Planta',en:'Plant'},
 {id:'carro',pt:'Carro · fora da sala',en:'Car · outside the office'},
] as const
export type SalaMovel=typeof SALA_MOVEIS[number]['id']
export function normalizarSala(raw:unknown):SalaMovel[]{
 if(!Array.isArray(raw))return []
 return [...new Set(raw.filter((id):id is SalaMovel=>typeof id==='string'&&SALA_MOVEIS.some(p=>p.id===id)))]
}
export type PresidenciaDados={
 club:string; season?:number; fans?:number; games?:number;
 trophies?:TrofeuPresidencia[];
 timeline?:{id:string;label:string}[];
 cash?:number; stadiumValue?:number; squadValue?:number;
 owned?:PresidenciaBem[];
 promotions?:number; bestDivision?:string; sinceSeason?:number;
}
