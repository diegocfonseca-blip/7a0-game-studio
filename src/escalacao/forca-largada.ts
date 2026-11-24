/** Ajuste exclusivo de desempenho da largada. Nunca escreve no overall da carta. */
export type MarcaCalibracao =
  | {versao:1;ciclo:string;origem:string;loCatalogo:number;hiCatalogo:number}
  | {versao:2;ciclo:string;origem:string;ajuste:number;encerrado?:true}
type Carta = {lo:number;hi:number;calibracaoCarreira?:MarcaCalibracao}
const limite=(n:number)=>Math.max(25,Math.min(99,Math.round(n*10)/10))

/** A faixa de desempenho é temporária; a ficha, preços e salários usam lo/hi originais. */
export function faixaDeJogo(c:Carta):{lo:number;hi:number}{
  const m=c.calibracaoCarreira
  return m?.versao===2&&!m.encerrado?{lo:limite(c.lo+m.ajuste),hi:limite(c.hi+m.ajuste)}:{lo:c.lo,hi:c.hi}
}
export function nivelDeJogo(c:Carta):number{const f=faixaDeJogo(c);return(f.lo+f.hi)/2}

/** Negócio concluído: retira definitivamente o ajuste, inclusive ao voltar no futuro.
 * Listar, não vender e recuperar a própria carta preserva a situação anterior. */
export function aposContratacao<T extends Carta>(c:T,mesmoClube=false):T{
  if(mesmoClube||!c.calibracaoCarreira)return c
  const m=c.calibracaoCarreira
  if(m.versao===2)return m.encerrado?c:{...c,calibracaoCarreira:{...m,encerrado:true}}
  return {...c,lo:m.loCatalogo,hi:m.hiCatalogo,calibracaoCarreira:{versao:2,ciclo:m.ciclo,origem:m.origem,ajuste:0,encerrado:true}}
}
export function confereClubeDaLargada<T extends Carta>(c:T,clube:string):T{
  const m=c.calibracaoCarreira
  return m?.versao===2&&!m.encerrado&&m.origem!==clube?aposContratacao(c):c
}
