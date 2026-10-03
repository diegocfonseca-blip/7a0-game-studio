import {itemPresidencia,type PresidenciaBem,type PresidenciaItemId} from './presidencia-economia'

/** Duas posições de exposição, independentes das quatro vagas de propriedade. */
export type DuplaGaragem=[PresidenciaItemId|null,PresidenciaItemId|null]
export function veiculosPossuidos(owned:readonly PresidenciaBem[]){
 return owned.filter(b=>{const slot=itemPresidencia(b.id)?.slot;return slot==='carro'||slot==='duas-rodas'})
}
export function duplaGaragemValida(value:unknown,owned:readonly PresidenciaBem[]):value is DuplaGaragem{
 if(!Array.isArray(value)||value.length!==2)return false
 const ids=new Set(veiculosPossuidos(owned).map(b=>b.id))
 return value.every(id=>id===null||ids.has(id))&&(value[0]===null||value[0]!==value[1])
}
/** Save antigo ganha só uma escolha de exibição, nunca bens ou moedas. */
export function duplaDaGaragem(owned:readonly PresidenciaBem[],saved?:unknown):DuplaGaragem{
 const ids=veiculosPossuidos(owned).map(b=>b.id)
 if(saved===undefined)return [ids[0]??null,ids[1]??null]
 if(!Array.isArray(saved)||saved.length!==2)return [null,null]
 const left=ids.includes(saved[0])?saved[0]:null
 const right=ids.includes(saved[1])&&saved[1]!==left?saved[1]:null
 return [left,right]
}
/** Escolher o veículo da outra posição troca os lados, não duplica o bem. */
export function trocarPosicaoGaragem(owned:readonly PresidenciaBem[],current:DuplaGaragem,index:0|1,id:PresidenciaItemId|null):DuplaGaragem|null{
 if(!duplaGaragemValida(current,owned)||(index!==0&&index!==1))return null
 if(id!==null&&!veiculosPossuidos(owned).some(b=>b.id===id))return null
 const next:DuplaGaragem=[...current],other=index===0?1:0
 if(id!==null&&next[other]===id)next[other]=next[index]
 next[index]=id
 return next
}
