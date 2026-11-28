import assert from 'node:assert/strict'
import { INITIAL, reducer } from '../src/escalacao/store'
import { usaPregaoVisualPublico } from '../src/escalacao/pregao-visual-policy'
let state = reducer(structuredClone(INITIAL), {type:'START',teamName:'Visitante FC',formation:'4-3-3',rivals:3,career:false,league:'br',copaMode:'liga_copa',intro:true,pregaoAberto:true} as never)
state = reducer(state,{type:'START_STREAM_AUCTION'} as never)
assert(usaPregaoVisualPublico(state), 'uma carta pública sem depender da conta')
assert(usaPregaoVisualPublico({...state,pa:{...state.pa!,duplo:true}}), 'duas cartas públicas')
assert(!usaPregaoVisualPublico({...state,sport:'basquete'}))
assert(!usaPregaoVisualPublico(state,true))
assert(!usaPregaoVisualPublico({...state,pa:undefined}))
assert(!usaPregaoVisualPublico({...state,leilaoClubes:true}))
for (const formation of ['kings','pokemon'] as const) {
 const managers = state.managers.map((m,i)=>i===state.youIdx?{...m,formation}:m)
 assert(!usaPregaoVisualPublico({...state,managers}), `${formation} mantém apresentação própria`)
}
assert(!usaPregaoVisualPublico({...state,pa:{...state.pa!,vice:{} as never}}))
console.log('OK: liberação pública de uma/duas cartas; formatos especiais preservados')
