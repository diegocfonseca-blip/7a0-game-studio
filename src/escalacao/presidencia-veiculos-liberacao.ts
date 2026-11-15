import {itemPresidencia,type PresidenciaPedido} from './presidencia-economia'

// 15/11: carros continuam expostos, mas Diego suspendeu negociações até revisar a arte.
export const NEGOCIACAO_VEICULOS_LIBERADA:boolean=false
export function ehVeiculoPresidencia(id:string){const item=itemPresidencia(id);return item?.slot==='carro'||item?.slot==='duas-rodas'}
export function pedidoVeiculoLiberado(pedido:Pick<PresidenciaPedido,'id'|'replaceId'>){
 return NEGOCIACAO_VEICULOS_LIBERADA||(!ehVeiculoPresidencia(pedido.id)&&(!pedido.replaceId||!ehVeiculoPresidencia(pedido.replaceId)))
}
