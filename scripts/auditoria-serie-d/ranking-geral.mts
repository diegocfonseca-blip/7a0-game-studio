// Fotografia de diagnóstico: uma lista global, sem tratar classificação ou caixa como força.
import {mkdirSync,writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'
import {reducer,INITIAL,completaBancoDosBots} from '../../src/escalacao/store'
import {carregaBaralhoOficial} from '../../src/escalacao/baralho-oficial-carga'
import {_forcaBrasilOficialParaTeste,botBancoParaTeste} from '../../src/escalacao/sport'
import {CLUBES_BR_TODOS} from '../../src/escalacao/brasil-oficial'
import {lineupAt,mulberry} from '../../src/escalacao/pyramidseason'
import {rankingGeralCarreira} from '../../src/escalacao/ranking-clubes-carreira'
const out='/workspace/shared/carreira-correcao-20261124'
mkdirSync(out,{recursive:true});_forcaBrasilOficialParaTeste(true);botBancoParaTeste(true);await carregaBaralhoOficial()
const rng=Math.random;Math.random=mulberry(20261123)
const s=reducer(INITIAL,{type:'START_CAREER_SOLO',teamName:'Portuguesa',formation:'4-3-3',rivals:5,oficial:{clube:'Portuguesa'}});Math.random=rng
function fotografar(){
 return CLUBES_BR_TODOS.map(cl=>{
  const m=s.managers.find(m=>m.teamName===cl.nome),sq=m?.squad??s.cpuSquads?.[cl.nome]??[]
  const xi=lineupAt({},m?.id??-1,0,sq,m?.formation??'4-3-3')
  assert.equal(xi.filter(c=>!c.fake).length,11,cl.nome+' fecha XI')
  return {clube:cl.nome,divisao:cl.div,uf:cl.uf,forca:xi.reduce((n,c)=>n+(c.lo+c.hi)/2,0)/11,elenco:sq.length}
 }).sort((a,b)=>b.forca-a.forca||a.clube.localeCompare(b.clube,'pt-BR')).map((c,i)=>({posicao:i+1,...c}))
}
const inicial=fotografar();completaBancoDosBots(s);const aposJanela=fotografar()
assert.deepEqual(rankingGeralCarreira(s),aposJanela,'função de produto e fotografia independente concordam para todos os clubes')
const original=rankingGeralCarreira(s)
const dinheiro={...s,careerCoins:{0:999999},clubCash:Object.fromEntries(CLUBES_BR_TODOS.map(c=>[c.nome,999999]))}
assert.deepEqual(rankingGeralCarreira(dinheiro),original,'caixa sozinho não dá força')
const promoted=structuredClone(s);promoted.careerPlacements!.m0='A'
assert.equal(rankingGeralCarreira(promoted).find(c=>c.clube==='Portuguesa')!.forca,original.find(c=>c.clube==='Portuguesa')!.forca,'subir não dá nota por divisão')
const human=promoted.managers[0];const changed=human.squad.map(c=>({...c,lo:Math.max(0,c.lo-25),hi:Math.max(0,c.hi-25)}));human.squad=changed
assert(rankingGeralCarreira(promoted).find(c=>c.clube==='Portuguesa')!.posicao!>original.find(c=>c.clube==='Portuguesa')!.posicao!,'perder qualidade no elenco reduz posição global')
assert.deepEqual(rankingGeralCarreira({...s,onlineMode:'online'}),[],'salas online fora do ranking oficial')
assert.equal(new Set(inicial.map(c=>c.clube)).size,CLUBES_BR_TODOS.length)
const report={metodo:'Uma lista de todos os clubes brasileiros cadastrados, incluindo sem divisão nacional (E); força média do melhor XI na formação atual, por notas reais. Fotografia sintética semente20261123; não é ranking CBF, previsão, nova régua de notas ou ordem imposta ao jogo. Inicial antes do pregão de abertura e após gestão dos bots, sem novas compras humanas.',total:inicial.length,inicial,aposJanela}
writeFileSync(out+'/ranking-geral-diagnostico.json',JSON.stringify(report,null,2))
const csv=['posição;clube;divisão;UF;força do XI;elenco',...inicial.map(c=>`${c.posicao};${c.clube};${c.divisao};${c.uf};${c.forca.toFixed(2).replace('.',',')};${c.elenco}`)].join('\n')+'\n'
writeFileSync(out+'/ranking-geral-diagnostico.csv','\uFEFF'+csv)
console.log('RANKING_GLOBAL',inicial.length,'clubes',JSON.stringify(inicial.slice(0,8)))
