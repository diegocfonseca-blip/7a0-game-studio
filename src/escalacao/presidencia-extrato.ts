import {PRESIDENCIA_CATALOGO,itemPresidencia,type PresidenciaOrcamento} from './presidencia-economia'
/** Only called after a quote was accepted. Reporting never changes money. */
export function lancamentosPresidencia(quote:PresidenciaOrcamento):{label:string;amount:number}[]{
 const entries:{label:string;amount:number}[]=[]
 if(quote.sale&&quote.credit>0)entries.push({label:`Revenda de bem: ${itemPresidencia(quote.sale.id)!.pt}`,amount:quote.credit})
 if(quote.price>0)entries.push({label:`Compra de bem: ${itemPresidencia(quote.pedido.id)!.pt}`,amount:-quote.price})
 return entries
}
/** Saved Portuguese labels retain meaning when a career is reopened in English. */
export function traduzirLancamentoPresidencia(label:string):string{
 for(const item of PRESIDENCIA_CATALOGO){
  if(label===`Compra de bem: ${item.pt}`)return `Asset purchase: ${item.en}`
  if(label===`Revenda de bem: ${item.pt}`)return `Asset resale: ${item.en}`
 }
 return label
}
