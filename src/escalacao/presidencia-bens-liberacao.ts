import type {PresidenciaPedido} from './presidencia-economia'
import {pedidoVeiculoLiberado} from './presidencia-veiculos-liberacao'

// Diego: compras dos bens da casa e da garagem ainda ficam em breve.
export const COMPRAS_BENS_PRESIDENCIA_LIBERADAS:boolean=false
export function pedidoBemLiberado(pedido:Pick<PresidenciaPedido,'kind'|'id'|'replaceId'>){
 return (pedido.kind!=='buy'||COMPRAS_BENS_PRESIDENCIA_LIBERADAS)&&pedidoVeiculoLiberado(pedido)
}
