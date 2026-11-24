import assert from 'node:assert/strict'
import {reducer,INITIAL,catalogTodos,__sincronizaNiveis,clubesNacionaisDoMercado,salaryOfCard} from '../src/escalacao/store'
import {carregaBaralhoOficial,baralhoOficial} from '../src/escalacao/baralho-oficial-carga'
import {_forcaBrasilOficialParaTeste,botBancoParaTeste} from '../src/escalacao/sport'
import {mulberry,rollForm} from '../src/escalacao/pyramidseason'
import {SECTORS} from '../src/escalacao/types'
import {perfilDoDia} from '../src/escalacao/motor2/motor'

_forcaBrasilOficialParaTeste(true);botBancoParaTeste(true);await carregaBaralhoOficial()
const k=(c:any)=>`${c.name}|${c.club}|${c.year}`
const catalogo=new Map(SECTORS.flatMap(p=>[...baralhoOficial()![p],...catalogTodos()[p]].map(c=>[k(c),c] as const)))
const todos=(s:any)=>[...s.managers.flatMap((m:any)=>m.squad),...Object.values(s.cpuSquads??{}).flat(),...SECTORS.flatMap(p=>s.deck[p])]
const canonico=JSON.stringify([...catalogo])
for(const nome of ['Portuguesa','Gama','Flamengo']){
 const old=Math.random;Math.random=mulberry(20261123)
 const s=reducer(INITIAL,{type:'START_CAREER_SOLO',teamName:nome,formation:'4-3-3',rivals:5,oficial:{clube:nome}})
 Math.random=old
 assert(!s.oficial!.forcaInicial,'sem calibração de notas ou ajuste oculto na largada')
 for(const c of todos(s)){
   assert(!c.calibracaoCarreira,'nenhuma marca oculta em usuário, bots, fundo ou pregão')
   const original=catalogo.get(k(c));assert(original,'jogador real do catálogo: '+k(c))
   assert.equal(c.lo,original.lo,k(c));assert.equal(c.hi,original.hi,k(c))
 }
 assert.equal(clubesNacionaisDoMercado(s).length,155,'melhoria do mercado nacional preservada')
 assert.deepEqual(__sincronizaNiveis(structuredClone(s)).managers,s.managers,'reload preserva os elencos')
 if(nome==='Portuguesa'){
  const julinho=s.managers[0].squad.find(c=>c.name==='Julinho')!
  assert(julinho);assert.equal(julinho.lo,81);assert.equal(julinho.hi,92)
  // Até uma marca órfã de bancada é ignorada pelos motores; não afeta o futebol.
  const fantasma={...julinho,calibracaoCarreira:{versao:2 as const,ciclo:'rejeitado',origem:nome,ajuste:-18.25}}
  assert.deepEqual(rollForm([fantasma],'equilibrio','equilibrio',()=>.5),rollForm([julinho],'equilibrio','equilibrio',()=>.5))
  assert.deepEqual(perfilDoDia(fantasma,'ATA',0,{seed:8}),perfilDoDia(julinho,'ATA',0,{seed:8}))
  for(const versao of [1,2]){
   const velho=structuredClone(s),j=velho.managers[0].squad.find(c=>c.name==='Julinho')!,salario=salaryOfCard(j),pago=j.buyPrice,contrato=j.contratoAte
   velho.oficial!.forcaInicial={versao:versao as 1|2,id:'bancada',clubes:{Portuguesa:{ajuste:-18.25,alvo:58.4,referencia:76.6}}}
   if(versao===1){j.lo=62.8;j.hi=73.8;j.calibracaoCarreira={versao:1,ciclo:'bancada',origem:nome,loCatalogo:81,hiCatalogo:92}}
   else j.calibracaoCarreira=fantasma.calibracaoCarreira
   const limpo=__sincronizaNiveis(velho),restaurado=limpo.managers[0].squad.find(c=>c.name==='Julinho')!
   assert(!limpo.oficial!.forcaInicial);assert(!restaurado.calibracaoCarreira)
   assert.equal(restaurado.lo,81);assert.equal(restaurado.hi,92);assert.equal(salaryOfCard(restaurado),salario)
   assert.equal(restaurado.buyPrice,pago);assert.equal(restaurado.contratoAte,contrato)
  }
 }
 console.log('PASS sem ajuste visível/oculto, catálogo original, pregão, reload e mercado:',nome)
}
assert.equal(JSON.stringify([...catalogo]),canonico,'catálogo canônico intacto')
console.log('PASS Julinho81–92 e remoção segura dos dois experimentos locais; contratos e pagamentos preservados')
