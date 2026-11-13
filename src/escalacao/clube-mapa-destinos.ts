import type {LimitesComplexo} from './presidencia-complexo-model'
export type DestinoClubeMapa='presidencia'|'financas'|'loja'|'agencia'|'escritorio'|'patrocinio'|'veiculos'|'arena'|'museu'|'estrutura'
/** 10/11: agência em lote comercial independente junto ao shopping. A fachada olha
 * ao sul; o acesso fica fora da esplanada, do anel e das entradas do estádio. */
const BX0=12,BX1=38,BZ0=-271,BZ1=-245
export const LOTE_AGENCIA_CLUBE={id:'agencia-clube',x:(BX0+BX1)/2,z:(BZ0+BZ1)/2,width:BX1-BX0,depth:BZ1-BZ0,height:11.8,
 heading:0,building:{minX:BX0,maxX:BX1,minZ:BZ0,maxZ:BZ1},door:{x:(BX0+BX1)/2,z:BZ1},
 visit:[{x:25,z:-225},{x:25,z:-237},{x:25,z:-244.3}],
 footprint:[{x:BX0-1.5,z:BZ0-1.5},{x:BX1+1.5,z:BZ0-1.5},{x:BX1+1.5,z:-236},{x:BX0-1.5,z:-236}]} as const
export function nomeAgenciaClube(club:string){return `Agência ${club.trim()||'do Clube'}`}
export function lugarDoPainelClube(destination:DestinoClubeMapa){return destination==='museu'?'museu-clube':destination==='arena'?'arena-online':destination==='loja'?'loja':destination==='veiculos'?'vadico':destination==='presidencia'?'casa-usuario':destination==='agencia'||destination==='escritorio'?'agencia-clube':'gestao-clube'}
export type AlvoClubeMapa={destination:DestinoClubeMapa;bounds:LimitesComplexo;minY:number;maxY:number}
