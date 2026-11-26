import assert from 'node:assert/strict'
import { reducer, INITIAL, ident, salaryOfCard, valorOficial, folhaBaseDoClube, contratoAtletaFalta, balancoBot, contratacaoOficialPermitida, podeRetirarOficial, podeLiberarContratoOficial, reparaMinimoOficial, garanteEconomiaOficial, completaBancoDosBots } from '../src/escalacao/store'
import { writeFileSync } from 'node:fs'
import { carregaBaralhoOficial } from '../src/escalacao/baralho-oficial-carga'
import { _forcaBrasilOficialParaTeste, botBancoParaTeste } from '../src/escalacao/sport'
import { FORMATIONS, SECTORS } from '../src/escalacao/types'
import { gasDoElenco, jogosDoElenco, chaveCarry } from '../src/escalacao/condicao'
import { planoCansacoBot } from '../src/escalacao/bots-banco'
import { carregaGuardados } from '../src/escalacao/motor2/carreira'
import { VERSAO_CRITERIOS_RECEPCAO_M2 } from '../src/escalacao/motor2/versao'
import { referenciaAtleta, salarioReferencia } from '../src/escalacao/carreira-economia'
import { CATALOG, CATALOG_EU, CATALOG_WORLD } from '../src/escalacao/data'
import { CATALOG_OFICIAL_MODO } from '../src/escalacao/baralho-oficial'
import { CLUBES_BR_TODOS, cartasDoClube, fechaTime } from '../src/escalacao/brasil-oficial'
import { cartasExtras } from '../src/escalacao/baralho-inteiro'
import { eventosFisicos } from '../src/escalacao/carreira-fisica'
import { buildPyramid, vinculaPlanosOficiais, computeEstadualCarreira, simulaTemporadaOficial, mulberry } from '../src/escalacao/pyramidseason'

_forcaBrasilOficialParaTeste(true); botBancoParaTeste(true); await carregaBaralhoOficial()
// Único acréscimo: comprova a necessidade no clube e o isolamento das salas.
const novo = 'Marcos Felipe'
assert.equal(Object.values(CATALOG).flat().filter(c=>c.name===novo).length,0)
assert.equal(Object.values(CATALOG_EU).flat().filter(c=>c.name===novo).length,0)
assert.equal(Object.values(CATALOG_WORLD).flat().filter(c=>c.name===novo).length,0)
assert.equal(Object.values(CATALOG_OFICIAL_MODO).flat().filter(c=>c.name===novo).length,1)
assert(cartasExtras().some(c=>c.name===novo&&c.club==='Bahia'),'cartinha de campeão inclui o novo atleta')
const catalogo = Object.fromEntries(SECTORS.map(p=>[p,[...CATALOG[p],...CATALOG_OFICIAL_MODO[p]]])) as typeof CATALOG
const bahia = CLUBES_BR_TODOS.find(c=>c.nome==='Bahia')!
assert(fechaTime(cartasDoClube(bahia,catalogo)),'catálogo atual cobre o Bahia; necessidade histórica da inclusão não é reaplicada após novos lotes')
for(const c of CLUBES_BR_TODOS)assert(fechaTime(cartasDoClube(c,catalogo)),`${c.nome}: mínimo por posição`)
console.log('PASS cobertura do catálogo atual, XI dos clubes e separação das salas/cartinhas')
for (const clube of ['Brasiliense','Portuguesa','Flamengo']) {
  const s = reducer(INITIAL, { type:'START_CAREER_SOLO',teamName:clube,formation:'4-3-3',rivals:5,oficial:{clube} })
  assert(s.oficial)
  assert(Object.keys(s.cpuSquads ?? {}).length > 100, 'donos do catálogo materializados antes do banco')
  for(const clube of CLUBES_BR_TODOS)assert(s.managers.some(m=>m.teamName===clube.nome)||s.cpuSquads?.[clube.nome],`${clube.nome}: até quem só joga estadual tem dono materializado`)
  const quantidades=s.managers.map(m=>m.squad.length).join(',')+'|'+Object.values(s.cpuSquads!).map(sq=>sq.length).join(',')
  reparaMinimoOficial(s)
  assert.equal(s.managers.map(m=>m.squad.length).join(',')+'|'+Object.values(s.cpuSquads!).map(sq=>sq.length).join(','),quantidades,'time completo não recebe reforço de reparo')
  const m=s.managers[0]
  assert(contratoAtletaFalta(s,m.squad[0])>0,'contrato real inicial vigente')
  assert.equal(contratoAtletaFalta(s,{...m.squad[0],contratoAte:0}),0)
  for (const c of m.squad) {
    assert.equal(c.valorBaseCarreira, referenciaAtleta(c))
    assert(c.contratoAte! >= 1)
    assert(salaryOfCard(c)>0, `salário inicial: ${c.name}`)
    assert(valorOficial(s,c)>0)
    assert.equal(valorOficial({...s,marketValues:{[ident(c)]:999}},c),valorOficial(s,c),'renovação não vira refém de um lance exagerado')
    assert.equal(c.buyPrice,0,'elenco herdado não finge compra no extrato')
    assert.equal(salaryOfCard({...c,paid:60,buyPrice:60}),6, 'compra efetiva usa preço pago, como a tradicional');assert.equal(salaryOfCard({...c,paid:0,buyPrice:0}),salarioReferencia(referenciaAtleta(c)), 'elenco herdado conserva referência')
  }
  assert.equal(s.clubCash?.m0,s.careerCoins?.[0])
  const world=buildPyramid(s.managers,0,s.seed,s.deckLeague,s.careerPlacements,s.cpuSquads,true)
  for (const div of ['A','B','C','D'] as const) for (const t of world[div]) assert.equal(t.xi.length,11,`${clube}: ${t.name} XI`)
  const bot=s.managers[1], um=bot.squad[0]
  const eleven=SECTORS.flatMap(p=>bot.squad.filter(c=>c.pos===p).slice(0,FORMATIONS[bot.formation][p]))
  assert.equal(podeRetirarOficial(s,eleven,um.pos,bot.formation),false)
  const minimo = {...bot,squad:eleven}
  const ultimo = eleven.find(c=>c.pos==='GOL')!
  assert.equal(podeLiberarContratoOficial(s,minimo,ultimo.id),false)
  const reserva={...ultimo,id:'reserva-goleiro'}
  assert.equal(podeLiberarContratoOficial(s,{...minimo,squad:[...eleven,reserva]},ultimo.id),true)
  assert.equal(podeLiberarContratoOficial({...s,contratoRelease:[reserva.id]},{...minimo,squad:[...eleven,reserva]},ultimo.id),false,'saídas pendentes contam juntas')
  const semSaida=reducer({...s,screen:'reserveList',contratosOn:true,managers:[{...minimo,isHuman:true,squad:minimo.squad.map(c=>({...c,contratoAte:0}))}],youIdx:0},{type:'RELEASE_CONTRACT',mgrId:minimo.id,cardId:ultimo.id})
  assert(!semSaida.contratoRelease?.includes(ultimo.id),'reducer também protege o mínimo')
  assert(semSaida.news?.some(n=>n.includes('reposição')),'trava explica como destravar')
  const renovar=structuredClone(s);renovar.screen='reserveList';renovar.reserveListMesmo=true;renovar.seasonNo=12
  renovar.managers[0].squad.forEach(c=>{c.contratoAte=99})
  const rival=renovar.managers[1];rival.squad=eleven.map(c=>({...c,contratoAte:0}));rival.rival=false
  renovar.clubCash!['m'+rival.id]=0
  const nomeFundo=Object.keys(renovar.cpuSquads!).find(n=>renovar.careerPlacements?.[n])!
  renovar.cpuSquads![nomeFundo].forEach(c=>{c.contratoAte=0});renovar.clubCash![nomeFundo]=0
  const aRetomar=structuredClone(renovar);aRetomar.managers[0].squad.forEach(c=>{c.contratoAte=11})
  const retomado=reducer(INITIAL,{type:'RESUME_CAREER_SOLO',saved:aRetomar})
  assert(retomado.managers[0].squad.every(c=>c.contratoAte===11),'reabrir a mesa não renova grátis nem esconde vencidos')
  const renovado=reducer(renovar,{type:'CONFIRM_MESMO_TIME'})
  assert(renovado.managers[1].squad.every(c=>c.contratoAte!>=12),'CPU sem marca rival também renova')
  assert(renovado.cpuSquads![nomeFundo].every(c=>c.contratoAte!>=12),'fundo nacional também renova')
  assert(renovado.clubCash!['m'+rival.id]<0&&renovado.clubCash![nomeFundo]<0,'renovação obrigatória preserva dívida')
  const bad={...um,id:'teste-puyol',fame:5 as const,club:'Barcelona',seller:undefined}
  assert.equal(contratacaoOficialPermitida(s,m,bad),false)
  // Nova entrada automática sempre valida a divisão do comprador.
  const antes=new Map(s.managers.map(m=>[m.id,new Set(m.squad.map(c=>c.id))]))
  completaBancoDosBots(s)
  for(const b of s.managers.filter(m=>!m.isHuman)) for(const c of b.squad) if(!antes.get(b.id)!.has(c.id)) assert(contratacaoOficialPermitida(s,b,c))
  // Legado em andamento: base nova não pode alterar folha da temporada já iniciada.
  const legado=structuredClone(s); legado.seasonNo=8;legado.round=12;delete legado.oficial!.economiaDesde
  for(const c of legado.managers[0].squad) delete c.valorBaseCarreira
  const folhaAntes=folhaBaseDoClube(legado,legado.managers[0]); garanteEconomiaOficial(legado)
  assert.equal(legado.oficial!.economiaDesde,9)
  assert.equal(vinculaPlanosOficiais(world,legado).D[0].planoOficial?.fisicaAtiva,false,'mudança física do legado começa na temporada seguinte')
  assert.equal(folhaBaseDoClube(legado,legado.managers[0]),folhaAntes)
  const foto=JSON.stringify(legado);garanteEconomiaOficial(legado);assert.equal(JSON.stringify(legado),foto)
  const jogo={id:'estadual-teste',r:0,clubes:{[m.teamName]:[chaveCarry(m.squad[0])]}}
  const fisica=reducer(s,{type:'OFICIAL_COPA_FISICA',season:s.seasonNo,jogos:[jogo]})
  const repetido=reducer(fisica,{type:'OFICIAL_COPA_FISICA',season:s.seasonNo,jogos:[jogo]})
  assert.equal(Object.keys(repetido.oficialFisica!.copas!).length,1,'reload não duplica jogo de copa')
  assert.equal(eventosFisicos(repetido,m.teamName,m.squad).length,1)
  assert.deepEqual(eventosFisicos(repetido,m.teamName,m.squad)[0].ids,[m.squad[0].id])
  // Cura usa somente atleta real livre, com salário e contrato, sem tomar do outro.
  const original=s.cpuSquads![Object.keys(s.cpuSquads!)[0]]
  const removido=original.find(c=>c.pos==='GOL')!
  s.cpuSquads![Object.keys(s.cpuSquads!)[0]]=original.filter(c=>c.id!==removido.id)
  reparaMinimoOficial(s);garanteEconomiaOficial(s)
  const curado=s.cpuSquads![Object.keys(s.cpuSquads!)[0]]
  assert(curado.some(c=>c.pos==='GOL'&&!c.fake))
  console.log('PASS abertura, salários, contratos, mínimo e filtro:',clube)
}
// Rodada livre recupera todos, não cria partida para titular nem lesão no bot.
const atleta={id:'atleta',pos:'GOL',lo:60,hi:65}
assert(balancoBot('D',100,0,0,20,undefined,true).caixa<0)
assert.equal(balancoBot('D',100,0).caixa,0,'economia dos modos anteriores preservada')
const escala={0:['atleta'],1:['atleta'],2:['atleta']}
assert.equal(gasDoElenco(escala,3,[atleta],0,undefined,4,new Set([0,2])).atleta,98.6)
assert.equal(jogosDoElenco(escala,3,[atleta],0,undefined,new Set([0,2])).atleta,2)
const plano=planoCansacoBot({squad:[atleta],need:{GOL:1,LAT:0,ZAG:0,MEI:0,ATA:0},seed:1,seasonNo:1,nome:'teste',rodadas:3,rodadasComJogo:new Set([0,2])})
assert.equal(plano.gasFim.atleta,98.6); assert.deepEqual(plano.xi[1],[])
assert.equal(gasDoElenco(escala,3,[atleta],0,undefined,4,new Set([0,2]),[{r:3,ids:['atleta']}]).atleta,97.2)
const oldRandom=Math.random;Math.random=mulberry(20261123)
try {
 const s=reducer(INITIAL,{type:'START_CAREER_SOLO',teamName:'Portuguesa',formation:'4-3-3',rivals:5,oficial:{clube:'Portuguesa'}})
 if(process.env.CARREIRA_FIXTURE)writeFileSync(process.env.CARREIRA_FIXTURE,JSON.stringify({...s,screen:'season',phase:'envelope',oficialAbertura:undefined,round:0,seasonNo:4}))
 const base=buildPyramid(s.managers,0,s.seed,s.deckLeague,s.careerPlacements,s.cpuSquads,true)
 const jogos=[]
 for(const [i,tatica] of ['retranca','ataque'].entries()) {
  const estado={...s,careerTactics:{0:{0:tatica}}}
  const world=vinculaPlanosOficiais(base,estado as typeof s)
  carregaGuardados(undefined,1,`teste-copa-tatica-${i}`)
  const copa=computeEstadualCarreira('Paulista',world,s.seed,1,1.12,true,{},true,VERSAO_CRITERIOS_RECEPCAO_M2)!
  const entrada=copa.rounds.flatMap(r=>r.ties).flatMap(t=>t.legM2??[]).find(e=>e&&(!e.bots[0]||!e.bots[1]))!
  assert(entrada)
  assert.equal(entrada.tatica[entrada.bots[0]?1:0],i===0?-1:1)
  jogos.push(entrada)
 }
 assert.notDeepEqual(jogos[0].tatica,jogos[1].tatica)
 const world=vinculaPlanosOficiais(base,s)
 const temporada=simulaTemporadaOficial(world,s.seed,38,2026)
 assert(temporada.oficial)
 console.log('PASS calendário com folgas e tática consumida no estadual')
} finally {Math.random=oldRandom}
console.log('PASS revisão da carreira oficial')
