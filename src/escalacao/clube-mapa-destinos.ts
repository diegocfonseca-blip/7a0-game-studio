import type {LimitesComplexo} from './presidencia-complexo-model'
export type DestinoClubeMapa='presidencia'|'financas'|'loja'|'agencia'|'escritorio'|'patrocinio'|'veiculos'|'arena'
/** 🏢 05/11 (Diego: *"a loja do clube e a agência estão próximos da área do visitante… colocar num local melhor"*):
 * a Agência saiu do leste (x 229, perto da saída do visitante) e foi pro lado da TORCIDA DA CASA, ao sul,
 * de frente pra calçada da 2ª parada de ônibus (z≈124), vizinha da Loja do Clube. A fachada olha pro norte
 * (pro estádio e pro caminho da torcida); os carros executivos ficam no pátio da frente.
 * Fora: rota do ônibus dos times (z 120), calçada do terminal (x −29…−27), estacionamento sudoeste e o abrigo da parada (x −77…−71). */
const BX0=-67.5,BX1=-54.5,BZ0=134,BZ1=149
export const LOTE_AGENCIA_CLUBE={id:'agencia-clube',x:(BX0+BX1)/2,z:(BZ0+BZ1)/2,width:BX1-BX0,depth:BZ1-BZ0,height:10.4,
 /** +Z local olha pra fora da porta; π = a fachada olha pro norte (−z). */
 heading:Math.PI,
 building:{minX:BX0,maxX:BX1,minZ:BZ0,maxZ:BZ1},
 /** porta no meio da fachada; o visitante chega pela calçada da parada */
 door:{x:(BX0+BX1)/2,z:BZ0},
 visit:[{x:-64.5,z:124.6},{x:-61,z:126.2},{x:-61,z:BZ0-.7}],
 /** pátio da frente (carros) + prédio; reservado pra árvore/rua/poste não entrar */
 footprint:[{x:BX0-1.5,z:126.2},{x:BX1+1.2,z:126.2},{x:BX1+1.2,z:BZ1+1.5},{x:BX0-1.5,z:BZ1+1.5}]} as const
export function nomeAgenciaClube(club:string){return `Agência ${club.trim()||'do Clube'}`}
export function lugarDoPainelClube(destination:DestinoClubeMapa){return destination==='arena'?'arena-online':destination==='loja'?'loja':destination==='veiculos'?'vadico':destination==='presidencia'||destination==='financas'?'casa-usuario':'agencia-clube'}
export type AlvoClubeMapa={destination:DestinoClubeMapa;bounds:LimitesComplexo;minY:number;maxY:number}
