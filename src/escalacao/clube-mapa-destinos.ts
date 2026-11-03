import type {LimitesComplexo} from './presidencia-complexo-model'
export type DestinoClubeMapa='presidencia'|'financas'|'loja'|'agencia'|'escritorio'|'patrocinio'
export const LOTE_AGENCIA_CLUBE={id:'agencia-clube',x:229,z:90,width:38,depth:40,height:7,
 footprint:[{x:210,z:70},{x:248,z:70},{x:248,z:110},{x:210,z:110}]} as const
export function nomeAgenciaClube(club:string){return `Agência ${club.trim()||'do Clube'}`}
export function lugarDoPainelClube(destination:DestinoClubeMapa){return destination==='loja'?'loja':destination==='presidencia'||destination==='financas'?'room':'agencia-clube'}
export type AlvoClubeMapa={destination:DestinoClubeMapa;bounds:LimitesComplexo;minY:number;maxY:number}
