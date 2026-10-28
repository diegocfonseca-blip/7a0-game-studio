import { AREA_LARG, AREA_PROF, G, W, frente, len } from './fisica.ts'

/** Proposta isolada: esperar a descida de um passe livre, em vez de
 * transformar toda bola alta em passe de cabeça. Sem sorteio ou posse nova.
 * A qualidade/erro do domínio continua sendo decidida pelo motor existente. */
export const ALTURA_DOMINIO_AEREO = 0.22
type Jogador = {id:number;lado:number;grupo:string;x:number;y:number;vx:number;vy:number;expulso?:boolean;atordoado:number}
type Contexto = {
 t:number;atl:Jogador[];
 bola:{x:number;y:number;h:number;vh:number;lance:null|{tipo:string;de:Jogador;para:Jogador|null}};
}
const PASSES = new Set(['passe','enfiada','lancamento','inversao','cruzamento','chutao'])
export function prefereDominarLancamento(g:Contexto,p:Jogador):boolean {
 const b=g.bola,lance=b.lance
 if(p.grupo==='GOL'||p.expulso||p.atordoado>g.t||!lance||!PASSES.has(lance.tipo)||lance.de.lado!==p.lado||lance.de.id===p.id)return false
 // Perto do gol adversário, o cruzamento ainda pode ser finalizado de cabeça.
 const distanciaGol=frente(p.lado as 0|1,b.y)
 if(distanciaGol<AREA_PROF+2&&Math.abs(b.x-W/2)<AREA_LARG+2)return false
 // Não esperar o domínio quando há uma disputa aérea iminente. A janela
 // considera a queda e a aproximação do adversário, sem consumir o RNG.
 const altura=Math.max(0,b.h-ALTURA_DOMINIO_AEREO)
 const queda=Math.max(0,(b.vh+Math.sqrt(b.vh*b.vh+2*G*altura))/G)
 for(const rival of g.atl){
  if(rival.lado===p.lado||rival.expulso||rival.atordoado>g.t)continue
  const dx=p.x-rival.x,dy=p.y-rival.y,d=len(dx,dy)
  const fechamento=d>1e-6?Math.max(0,(dx*(rival.vx-p.vx)+dy*(rival.vy-p.vy))/d):0
  if(d<1.8+Math.min(2.7,fechamento*Math.min(.6,queda)))return false
 }
 return true
}
