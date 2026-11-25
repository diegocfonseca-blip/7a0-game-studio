import assert from 'node:assert/strict'
import {INITIAL,reducer,ZERA_NA_CARREIRA_NOVA,sanitize} from '../src/escalacao/store'
const s={...INITIAL,careerOnline:true,seasonNo:2,round:8,managers:[{...INITIAL.managers[0],id:0,isHuman:true,teamName:'Clube teste',squad:[]}],careerCoins:{0:100},careerLoja:{0:{preco:2}}} as typeof INITIAL
const action={type:'MARK_NEIGHBORHOOD_SCENE' as const,mgrId:0,key:`${s.seed}:0:classico:2:8`,group:`${s.seed}:0:jogo:2:8`,kind:'classico' as const}
const next=reducer(s,action)
assert.equal(next.careerNeighborhood?.[0].seen.length,1)
assert.equal(next.managers,s.managers,'não clona/recalcula elencos ou simulação')
assert.equal(next.careerCoins,s.careerCoins,'sem movimento financeiro')
assert.equal(next.careerLoja,s.careerLoja,'não inventa vendas de camisa')
assert.equal(reducer(next,action),next,'marca duplicada não renderiza de novo')
assert.equal(reducer({...s,onlineMode:'online'},action).careerNeighborhood,undefined,'não interfere em sala online')
assert.equal(reducer({...s,sport:'basquete'},action).careerNeighborhood,undefined)
assert.equal(reducer(s,{...action,key:'outra-carreira:0:x'}),s)
assert.equal(reducer(s,{...action,mgrId:999}),s)
assert.equal(sanitize(next).careerNeighborhood,next.careerNeighborhood,'save offline mantém histórico')
assert.equal(sanitize({...next,onlineMode:'online'}).careerNeighborhood,undefined,'histórico pessoal não viaja no rádio da sala')
assert.equal(sanitize({...next,careerOnline:false}).careerNeighborhood,undefined)
assert(ZERA_NA_CARREIRA_NOVA.includes('careerNeighborhood'))
assert.equal(JSON.parse(JSON.stringify(next)).careerNeighborhood[0].seen[0].id,action.key,'histórico incluído no save')
console.log('PASS save cenas: identidade; idempotência; sem clone caro; sem dinheiro, elenco ou calendário alterado; isolamento online/basquete; reset carreira nova')
const injury={season:2,round:7,mgrId:0,cardId:'player',minute:60,rodadas:2,status:'resolvida' as const}
assert.equal(sanitize({...next,careerMatchInjury:injury}).careerMatchInjury,injury)
assert.equal(sanitize({...next,careerMatchInjury:injury,onlineMode:'online'}).careerMatchInjury,undefined)
assert.equal(sanitize({...next,careerMatchInjury:injury,careerOnline:false}).careerMatchInjury,undefined)
assert(ZERA_NA_CARREIRA_NOVA.includes('careerMatchInjury'))
console.log('PASS save médico: preservado offline, removido do online e da carreira nova')
