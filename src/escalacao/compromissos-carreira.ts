/** Projeção de despesas conhecidas; receitas futuras nunca são prometidas. */
export function projetarCompromissos(p: { caixa:number; custo:number; folha:number; salarioNovo?:number; salarioSubstituido?:number; multa?:number; cobraFolha?:boolean }) {
  const compra=Math.max(0,p.custo),multa=Math.max(0,p.multa??0)
  const folha=Math.max(0,p.folha+(p.salarioNovo??0)-(p.salarioSubstituido??0))
  const aposCompra=p.caixa-compra-multa
  return { compra,multa,folha,aposCompra,aposReserva:aposCompra-(p.cobraFolha===false?0:folha) }
}
