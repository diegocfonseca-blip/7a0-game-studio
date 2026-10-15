import assert from 'node:assert/strict'
import fs from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { registerHooks } from 'node:module'
registerHooks({
 resolve(specifier, context, next) {
  if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
   const candidate = fileURLToPath(new URL(specifier, context.parentURL))
   if (fs.existsSync(candidate + '.ts')) return { url: pathToFileURL(candidate + '.ts').href, shortCircuit: true }
  }
  return next(specifier, context)
 },
 load(url, context, next) {
  if (url.endsWith('/lang.ts')) return { format: 'module', source: "export const getLang=()=> 'pt'", shortCircuit: true }
  return next(url, context)
 },
})
const { adaptarCarreiraAoComplexo } = await import('../src/escalacao/presidencia-complexo-carreira.ts')
const { carteiraDaCarreira, negociarNaCarreira, salvarPresidenteNaCarreira } = await import('../src/escalacao/presidencia-carreira.ts')
const { orcarPresidencia } = await import('../src/escalacao/presidencia-economia.ts')
const { camadasDoPresidente } = await import('../src/escalacao/presidente-aparencia.ts')
const { montarPresidenteLayers } = await import('../src/escalacao/presidente-rig.ts')
const { podeSentarPresidente, camadasNaPose, arteSentada } = await import('../src/escalacao/presidente-pose.ts')
const { VESTUARIO_MODULAR } = await import('../src/escalacao/presidente-vestuario-modular.ts')
const { TONS_PELE } = await import('../src/escalacao/presidente-pele.ts')
const { conquistasDaCarreira } = await import('../src/escalacao/presidencia-conquistas.ts')
const { publicoDoEstadio } = await import('../src/escalacao/presidencia-estadio-publico.ts')
const { STADIUM_SECTORS } = await import('../src/escalacao/estadiodata.ts')

const mgrId = 17, awayId = 42, inv = Object.fromEntries(STADIUM_SECTORS.map(s => [s.k, s.cost]))
const team = side => ['GOL', 'LAT', 'LAT', 'ZAG', 'ZAG', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA'].map((pos, i) => ({ id: side + i, name: side + i, pos }))
const match = { context: { id: 'contrato-local-carreira', homeClubId: mgrId, home: team('h'), away: team('a'), speed: .25 }, minute: 32, homeScore: 1, awayScore: 0, paused: false, finished: false, homeColor: '#1b7a3d', awayColor: '#c2452f', visualClock: { seconds: 84.25, sampledAt: 1234.5, running: true, rate: .25 }, goal: { id: 'g1', home: true, name: 'h8', minute: 32, phase: 'confirmed' } }
const originalState = { careerOnline: true, onlineMode: 'cpu', sport: 'futebol', youIdx: 1, seasonNo: 3,
 managers: [{ id: awayId, isHuman: false }, { id: mgrId, isHuman: true }],
 stadiums: { [mgrId]: { inv, ext: [] }, [awayId]: { inv: { grama: inv.grama, geral: inv.geral }, ext: [] } },
 careerCoins: { [mgrId]: 5000, [awayId]: 11 }, careerHonors: { m17: { A: 0, B: 0, C: 2, D: 1, V: 1 }, m42: { A: 99, B: 0, C: 0, D: 0 } }, careerCopaHonors: { m17: 1, m42: 55 },
 careerPresidentBase: { version: 5, name: 'Presidente local', outfit: 'terno', appearance: { version: 22, hair: 'classic-hair', beard: 'classic-beard', accessories: ['silver-studs'], skinTone: 'medium' }, sinceSeason: 1 },
}
const day = { division: 'C', support: 74, rain: true }, away = { matchId: match.context.id, mgrId: awayId, day: { division: 'D', support: 31, rain: true } }
const identity = { name: 'Clube local', crest: null, shirt: null, mascot: null, color: '#b2a583' }
const input = { enabled: true, state: originalState, mgrId, day, match, away, identity }
const before = JSON.stringify(input), result = adaptarCarreiraAoComplexo(input)
assert(result)
assert.equal(Object.hasOwn(result.complexo,'journey'),false,'sem agenda o contrato legado mantém a mesma forma')
assert.equal(JSON.stringify(input), before, 'adaptar não muda carreira/partida/identidade')
assert.equal(result.complexo.qaPopulation, false)
assert.deepEqual(result.complexo.presidency, carteiraDaCarreira(originalState, mgrId))
assert.strictEqual(result.complexo.match, match, 'relógio/contexto compartilhado é a mesma referência')
assert.deepEqual(result.complexo.day, { ...day, match: 'playing' })
assert.deepEqual(result.complexo.awayDay, { ...away.day, match: 'playing' })
assert.deepEqual(result.complexo.awayStadium, originalState.stadiums[awayId])
assert.equal(result.sala.status, 'ready'); assert.equal(result.sala.physicalPresident, false)
assert.deepEqual(result.sala.president, originalState.careerPresidentBase)
assert.deepEqual(result.sala.layerIds, camadasDoPresidente(originalState.careerPresidentBase))
assert.deepEqual(result.sala.trophies, conquistasDaCarreira(originalState, mgrId))
assert.deepEqual(result.sala.identity, identity)
assert.equal(result.sala.hasShelf, false); assert.equal(result.sala.pose, 'standing')
assert.deepEqual(publicoDoEstadio(result.complexo.stadium, result.complexo.day), publicoDoEstadio(originalState.stadiums[mgrId], { ...day, match: 'playing' }))

// Detached mutable presentation values do not damage the actual career.
result.complexo.stadium.inv.geral = 0; result.complexo.awayStadium.ext.push('loja')
result.sala.president.appearance.accessories.length = 0; result.sala.identity.color = '#000000'
result.complexo.presidency.owned.push({ id: 'planta', paid: 10 })
assert.equal(JSON.stringify(input), before)

for (const denied of [
 { ...input, enabled: false }, { ...input, enabled: undefined }, { ...input, mgrId: awayId },
 { ...input, mgrId: -1 }, { ...input, mgrId: 1.5 }, { ...input, state: { ...originalState, sport: 'basquete' } },
 { ...input, state: { ...originalState, onlineMode: 'online' } }, { ...input, state: { ...originalState, careerOnline: false } },
 { ...input, state: { ...originalState, youIdx: 0 } }, { ...input, state: { ...originalState, youIdx: 99 } },
 { ...input, state: { ...originalState, managers: [] } }, { ...input, state: undefined }, undefined,
]) assert.equal(adaptarCarreiraAoComplexo(denied), null, 'chamador/gestor/modalidade inválidos não exibem prévia')

for (const absentDay of [undefined, {}, { division: 'C', support: NaN }, { division: 'C', support: 101 }, { division: 'C', support: -1 }, { division: 'desconhecida', support: 50 }, { division: 'C', support: 50, rain: 'sim' }]) {
 const noDay = adaptarCarreiraAoComplexo({ ...input, day: absentDay })
 assert.equal(noDay.complexo.day, undefined); assert.equal(noDay.complexo.circulation, false)
 assert.equal(noDay.complexo.awayDay, undefined); assert.equal(noDay.complexo.qaPopulation, false)
}
assert.equal(adaptarCarreiraAoComplexo({ ...input, day: { division: 'V', support: 0 } }).complexo.day.support, 0, 'torcida zero não vira50')
for (const wrongMatch of [undefined, null, { ...match, finished: true }, { ...match, context: { ...match.context, homeClubId: awayId } }, { ...match, context: { ...match.context, homeClubId: undefined } }, { ...match, minute: NaN }]) {
 const idle = adaptarCarreiraAoComplexo({ ...input, match: wrongMatch })
 assert.equal(idle.complexo.match, undefined); assert.equal(idle.complexo.day.match, 'idle'); assert.equal(idle.complexo.awayDay, undefined)
}
for (const [minute, paused, phase] of [[20, true, 'playing'], [45, true, 'interval'], [46, false, 'playing']]) {
 const output = adaptarCarreiraAoComplexo({ ...input, match: { ...match, minute, paused } })
 assert.equal(output.complexo.day.match, phase); assert.equal(output.complexo.awayDay.match, phase)
}
// Calendar is an explicitly supplied read-only fact. Season and match id alone
// do not prove its order. Finished snapshots can signal departure without
// restarting or retaining the visual match that the legacy bridge filters out.
const agenda={fixtureId:match.context.id,seasonKey:'carreira-local:3',competition:'league',ordinal:1,homeClubId:mgrId}
for(const [ordinal,weekday,period,kickoffTime] of [[1,'quarta','night','21:00'],[2,'domingo','day','16:00'],[39,'quarta','night','21:00'],[40,'domingo','day','16:00']]){
 const scheduled=adaptarCarreiraAoComplexo({...input,agenda:{...agenda,ordinal}})
 assert.equal(scheduled.complexo.journey.weekday,weekday);assert.equal(scheduled.complexo.journey.period,period)
 assert.equal(scheduled.complexo.journey.kickoffTime,kickoffTime)
 assert.equal(scheduled.complexo.journey.phase,'playing');assert.equal(scheduled.complexo.journey.hosting,true)
 assert.strictEqual(scheduled.complexo.match,match,'agenda conserva referência da partida e relógio')
 assert.deepEqual(scheduled.complexo.presidency,carteiraDaCarreira(originalState,mgrId))
 assert.deepEqual(scheduled.complexo.stadium,originalState.stadiums[mgrId])
}
const sunday={...agenda,ordinal:2}
const arrived=adaptarCarreiraAoComplexo({...input,agenda:sunday,match:undefined,journeyPhase:'arrival'})
assert.equal(arrived.complexo.journey.phase,'arrival');assert.equal(arrived.complexo.match,undefined)
assert.equal(arrived.complexo.journey.period,'day');assert.equal(arrived.complexo.journey.kickoffTime,'16:00');assert.equal(arrived.complexo.day.match,'idle')
assert.deepEqual(arrived.complexo.awayStadium,originalState.stadiums[awayId],'adversário explicitamente identificado pode chegar antes do apito')
assert.deepEqual(arrived.complexo.awayDay,{...away.day,match:'idle'})
const departure=adaptarCarreiraAoComplexo({...input,agenda:sunday,match:{...match,finished:true}})
assert.equal(departure.complexo.journey.phase,'departure');assert.equal(departure.complexo.journey.period,'day');assert.equal(departure.complexo.journey.kickoffTime,'16:00')
assert.equal(departure.complexo.match,undefined);assert.equal(departure.complexo.day.match,'idle')
assert.deepEqual(departure.complexo.awayStadium,originalState.stadiums[awayId],'visitantes identificados conservam patrimônio para o percurso de saída')
assert.deepEqual(departure.complexo.awayDay,{...away.day,match:'idle'},'dados visitantes preservados na jornada conhecida, sem fabricar nova partida')
for(const absentAway of [undefined,{...away,matchId:'outra-partida'}]){
 const noVisitors=adaptarCarreiraAoComplexo({...input,agenda:sunday,match:{...match,finished:true},away:absentAway})
 assert.equal(noVisitors.complexo.awayDay,undefined);assert.equal(noVisitors.complexo.awayStadium,undefined)
 const noArrivals=adaptarCarreiraAoComplexo({...input,agenda:sunday,match:undefined,journeyPhase:'arrival',away:absentAway})
 assert.equal(noArrivals.complexo.awayDay,undefined);assert.equal(noArrivals.complexo.awayStadium,undefined)
}
const pausedLate=adaptarCarreiraAoComplexo({...input,agenda,match:{...match,minute:70,paused:true}})
assert.equal(pausedLate.complexo.journey.phase,'playing');assert.equal(pausedLate.complexo.day.match,'playing');assert.equal(pausedLate.complexo.awayDay.match,'playing')
const actualInterval=adaptarCarreiraAoComplexo({...input,agenda,match:{...match,minute:45,paused:true}})
assert.equal(actualInterval.complexo.journey.phase,'interval');assert.equal(actualInterval.complexo.day.match,'interval')
for(const broken of [{...match,minute:NaN},{...match,context:{...match.context,id:''}},{...match,context:{...match.context,homeClubId:undefined}}]){
 const invalidSnapshot=adaptarCarreiraAoComplexo({...input,agenda,match:broken,journeyPhase:'arrival'})
 assert.equal(invalidSnapshot.complexo.journey.phase,'idle','snapshot inválido não deve fabricar uma chegada')
 assert.equal(invalidSnapshot.complexo.match,undefined);assert.equal(invalidSnapshot.complexo.day.match,'idle')
}
for(const patch of [{agenda:{...agenda,fixtureId:'outro-jogo'}},{agenda:{...agenda,homeClubId:awayId}},{match:{...match,context:{...match.context,homeClubId:awayId}}}]){
 const other=adaptarCarreiraAoComplexo({...input,agenda,...patch})
 assert.equal(other.complexo.journey.phase,'idle');assert.equal(other.complexo.journey.hosting,false)
 assert.equal(other.complexo.day.match,'idle');assert.equal(other.complexo.awayDay?.match??'idle','idle')
}
for(const badAgenda of [undefined,{...agenda,ordinal:0},{...agenda,ordinal:NaN},{...agenda,seasonKey:''}]){
 const unknown=adaptarCarreiraAoComplexo({...input,agenda:badAgenda})
 assert.equal(Object.hasOwn(unknown.complexo,'journey'),false,'agenda ausente/inválida não ganha data inventada')
 assert.deepEqual(unknown,adaptarCarreiraAoComplexo(input))
}
assert.equal(JSON.stringify(input),before)
for (const opponent of [undefined, { ...away, matchId: 'outro-jogo' }, { ...away, mgrId }, { ...away, mgrId: 999 }, { ...away, mgrId: -1 }, { ...away, day: undefined }]) {
 const without = adaptarCarreiraAoComplexo({ ...input, away: opponent })
 assert.equal(without.complexo.awayDay, undefined); assert.equal(without.complexo.awayStadium, undefined)
}
const missingOpponentStadium = adaptarCarreiraAoComplexo({ ...input, state: { ...originalState, stadiums: { [mgrId]: originalState.stadiums[mgrId] } } })
assert.equal(missingOpponentStadium.complexo.awayDay, undefined, 'não cria patrimônio do adversário')
const missingStadium = adaptarCarreiraAoComplexo({ ...input, state: { ...originalState, stadiums: undefined } })
assert.equal(missingStadium.complexo.stadium, undefined); assert.equal(missingStadium.complexo.circulation, false)
const invalidStadium = adaptarCarreiraAoComplexo({ ...input, state: { ...originalState, stadiums: { [mgrId]: { inv: { geral: NaN }, ext: [] } } } })
assert(Number.isNaN(invalidStadium.complexo.stadium.inv.geral), 'save inválido não vira obra válida')
assert.equal(invalidStadium.complexo.circulation, false)

let state = structuredClone(originalState)
const trade = pedido => {
 const quote = orcarPresidencia(carteiraDaCarreira(state, mgrId), pedido); assert(quote.ok)
 const traded = negociarNaCarreira(state, mgrId, quote.value, true); assert(traded.ok); state = traded.value
 return adaptarCarreiraAoComplexo({ ...input, state })
}
assert.equal(trade({ kind: 'buy', id: 'mesa-simples' }).sala.pose, 'standing')
assert.equal(trade({ kind: 'buy', id: 'cadeira-simples' }).sala.pose, 'seated')
assert.equal(trade({ kind: 'buy', id: 'estante-madeira' }).sala.hasShelf, true)
assert.equal(trade({ kind: 'buy', id: 'quadro' }).sala.hasFrame, true)
assert.equal(trade({ kind: 'buy', id: 'mesa-madeira', replaceId: 'mesa-simples' }).sala.pose, 'seated')
assert.equal(state.careerCoins[awayId], originalState.careerCoins[awayId], 'gestor adversário intacto')
const acquired = structuredClone(state)
assert.equal(trade({ kind: 'sell', id: 'cadeira-simples' }).sala.pose, 'standing')
assert.equal(trade({ kind: 'sell', id: 'estante-madeira' }).sala.hasShelf, false)
const badWallet = adaptarCarreiraAoComplexo({ ...input, state: { ...state, careerCoins: { ...state.careerCoins, [mgrId]: -5 } } })
assert.equal(badWallet.complexo.presidency, null); assert.equal(badWallet.sala.pose, 'standing'); assert.equal(badWallet.sala.hasDesk, false)

let checkedLooks = 0
assert.equal(VESTUARIO_MODULAR.length, 33)
for (const outfit of VESTUARIO_MODULAR) for (const skin of TONS_PELE) {
 const president = { version: 5, name: 'Visual preservado', outfit: outfit.id,
  appearance: { version: 22, hair: 'marcelo-2017-hair', beard: 'gullit-1988-moustache', accessories: ['silver-studs'], skinTone: skin.id }, sinceSeason: 1 }
 // Existing validator/access rule, with an explicit local fixture tier. The
 // adapter never reads a tier from the avatar and never changes a saved outfit.
 const saved = salvarPresidenteNaCarreira(acquired, mgrId, president, 'ouro'); assert(saved.ok)
 const output = adaptarCarreiraAoComplexo({ ...input, state: saved.value })
 assert.deepEqual(output.sala.president, president)
 assert.deepEqual(output.sala.layerIds, camadasDoPresidente(president))
 assert.equal(output.sala.pose, podeSentarPresidente(president.outfit, carteiraDaCarreira(saved.value, mgrId).owned) ? 'seated' : 'standing')
 const layers = montarPresidenteLayers(output.sala.layerIds); assert(layers.ok)
 assert.equal(camadasNaPose(layers.layers, output.sala.pose).find(layer => layer.kind === 'base').src, arteSentada(outfit.id))
 checkedLooks++
}
for (const appearance of [undefined, { version: 16, hair: 'classic', beard: 'none' }]) {
 const president = { version: 5, name: 'Antigo', outfit: 'polo', ...(appearance ? { appearance } : {}) }
 const output = adaptarCarreiraAoComplexo({ ...input, state: { ...originalState, careerPresidentBase: president } })
 assert.deepEqual(output.sala.president, president); assert.deepEqual(output.sala.layerIds, camadasDoPresidente(president))
}
for (const president of [undefined, { version: 5, name: '', outfit: 'terno' }, { version: 2, name: 'Antigo', outfit: 'terno' }, { version: 5, name: 'Inválido', outfit: 'terno', appearance: { version: 22, hair: 'fake', beard: 'none', accessories: [] } }]) {
 const output = adaptarCarreiraAoComplexo({ ...input, identity: undefined, state: { ...originalState, careerPresidentBase: president, careerPresident: { name: 'Retrato legado', outfit: 'casual' } } })
 assert.equal(output.sala.status, president === undefined ? 'missing' : 'invalid')
 assert.equal(output.sala.president, undefined); assert.deepEqual(output.sala.layerIds, []); assert.equal(output.sala.identity, undefined)
}
assert.equal(JSON.stringify(input), before)
console.log(`PASS adaptador carreira: ${checkedLooks} visuais (33 roupas ×5tons), poses/camadas existentes, compras/revendas reais, gestor correto, calendário explícito quarta/domingo/chegada/saída e mismatch, dia/visitante ausentes, vínculo explícito da partida, relógio preservado, sem mutação/autenticação/gravação.`)
