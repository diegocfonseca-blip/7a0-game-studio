import assert from 'node:assert/strict'
import {agendaCopaCarreira,convitesSelecoes} from '../src/escalacao/copa-mundo-calendario'
import {copaMundoDaTemporada,isCopaSeason,nextCopaSeason,loadCopaSave,type CopaSave} from '../src/escalacao/copa-mundo'
const fresh=agendaCopaCarreira(null,1,4)
for(const s of [1,5,9,13])assert(isCopaSeason(fresh,s),`edição na T${s}`)
for(const s of [2,3,4,6,100])assert(!isCopaSeason(fresh,s))
assert.equal(nextCopaSeason(fresh,2),5)
const mural=[{season:100,selecao:'Brasil',campeao:'Brasil',voce:true},{season:110,selecao:'Portugal',campeao:'Alemanha',voce:false}]
const old:CopaSave={anchor:100,ciclo:10,played:[100,110],mural}
const before=JSON.stringify(old),migrated=agendaCopaCarreira(old,1,4)
assert.equal(JSON.stringify(old),before,'não altera o save recebido')
assert.equal(migrated.anchor,110);assert.equal(migrated.ciclo,4)
assert.deepEqual(migrated.played,old.played);assert.deepEqual(migrated.mural,old.mural)
assert(isCopaSeason(migrated,114));assert(!isCopaSeason(migrated,112));assert.equal(nextCopaSeason(migrated,119),122)
assert.deepEqual(agendaCopaCarreira(migrated,1,4),migrated,'migração idempotente')
const partial=agendaCopaCarreira({anchor:100} as CopaSave,1,4);assert.equal(partial.anchor,1);assert.deepEqual(partial.played,[])
const stamp={season:120,pais:'Brasil',xiKeys:['carta-salva'],form:'4-3-3' as const,n:32 as const,potes:true,m2:true,passo:5,ents:[]}
const running=agendaCopaCarreira({...old,emAndamento:stamp},1,4)
assert.equal(running.anchor,120);assert.equal(running.emAndamento,stamp,'preserva fase/seleção/formato/cartas da Copa em andamento')
assert(isCopaSeason(running,120));assert.equal(nextCopaSeason(running,121),124)
const offCycle=agendaCopaCarreira({...running,anchor:110},1,4)
assert.equal(offCycle.anchor,120);assert.equal(offCycle.emAndamento,stamp)
assert.deepEqual(agendaCopaCarreira(offCycle,1,4),offCycle)
const mirror=agendaCopaCarreira(null,1,4,mural)
assert.deepEqual(mirror.played,[100,110]);assert.equal(mirror.anchor,migrated.anchor,'histórico do save mantém agenda em outro aparelho')
const legacy=agendaCopaCarreira(old,100,10);assert.equal(legacy.anchor,100);assert.equal(legacy.ciclo,10,'chamada legada explícita preservada')
assert.deepEqual(convitesSelecoes(['Brasil','Argentina','França','Portugal'],2),['França','Portugal'])
for(const pos of [-1,4,100,1.5,NaN])assert.deepEqual(convitesSelecoes(['Brasil','Argentina','França','Portugal'],pos),[])
assert.equal(convitesSelecoes(Array.from({length:32},(_,i)=>String(i)),31).length,1)
const keep=globalThis.localStorage,items=new Map<string,string>()
Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>items.get(k)??null,setItem:(k:string,v:string)=>items.set(k,String(v)),removeItem:(k:string)=>items.delete(k)}})
try{
 assert.equal(copaMundoDaTemporada(4,1,1,4).ano,true,'tradicional pode receber convite já na T1')
 items.set('llcopa:5',JSON.stringify(old))
 const result=copaMundoDaTemporada(5,110,1,4)
 assert(result.jogada);assert.equal(result.proxima,114);assert.equal(loadCopaSave(5)?.mural.filter(m=>m.voce).length,1)
 items.set('llcopa:6',JSON.stringify({...old,emAndamento:stamp}))
 assert(copaMundoDaTemporada(6,120,1,4).emAndamento)
 assert.deepEqual(loadCopaSave(6)?.emAndamento,stamp)
 assert(copaMundoDaTemporada(7,110,1,4,mural).jogada,'edição do mural guardado não oferece segundo prêmio')
}finally{Object.defineProperty(globalThis,'localStorage',{configurable:true,value:keep})}
console.log('PASS ciclo de 4, T1, ranking, migração, legado explícito, torneio em andamento, espelho e idempotência')
