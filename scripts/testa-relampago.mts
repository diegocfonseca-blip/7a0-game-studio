// 🧪 ⚡ MATA-MATA RELÂMPAGO (28/10) — a sala chega no mata-mata sem liga e anda até o campeão.
// Regras do Diego: *"faz c 16 então msm e 32 a pessoa escolhe ao criar e pênalti padrão igual as outras normais"*.
// Confere: a sala tem o tamanho da chave · o leilão de sempre chega na temporada · a chave é sorteada com os times da sala ·
// 32 começa na Rodada de 32 e 16 nas oitavas · ida e volta, só a final em jogo único (*"tem q ter ida e volta, somente final que
// não"*) · empate no agregado decide nos pênaltis automáticos · sai um campeão ·
// ninguém joga com jogador de mentira · "mesmo time" sorteia uma chave nova · a Liga + Copa continua igual.
// uso: npx tsx scripts/testa-relampago.mts   (ou npm run relampago)
import { reducer, INITIAL, chaveRelampago, MARCAS_DE_MODO } from '../src/escalacao/store'
import type { EscState } from '../src/escalacao/types'
let falhas = 0
const ok = (c: boolean, m: string) => { console.log(c ? '✅' : '❌', m); if (!c) falhas++ }

function leilaoAteTemporada(s: EscState): EscState {
  for (let i = 0; i < 6000 && s.screen !== 'season'; i++) {
    if (s.screen === 'auction') {
      if (s.phase === 'envelope' || s.phase === 'resq_envelope') {
        // sala online: TODO humano precisa lacrar (lance zero — o elenco vem do Monte)
        const antes = s
        for (const m of s.managers.filter(x => x.isHuman)) s = reducer(s, { type: 'SUBMIT_ENVELOPE', mgrId: m.id, bids: [] })
        if (s === antes || (s.screen === 'auction' && s.phase === antes.phase && s.sectorIdx === antes.sectorIdx && s.roundIdx === antes.roundIdx)) s = reducer(s, { type: 'FORCE_SEAL' })
        continue
      }
      if (s.phase === 'tiebreak') { s = reducer(s, { type: 'FORCE_TIEBREAK' }); continue }
      if (s.phase === 'holandes') { s = reducer(s, { type: 'HOLANDES_TICK' } as never); continue }
      s = reducer(s, { type: 'ADVANCE_REVEAL' }); continue
    }
    if (s.screen === 'monte') { s = { ...s, monteDeadline: 1 }; s = reducer(s, { type: 'MONTE_TIMEOUT' }); continue }
    if (s.screen === 'cerimonia') { s = reducer(s, { type: 'FINISH_CEREMONY' }); continue }
    s = reducer(s, { type: 'FORCE_SEAL' })
  }
  return s
}

function roda(chave: 16 | 32, pessoas: number, deck: 'br' | 'todos') {
  const nome = `chave ${chave} · ${pessoas} pessoas · baralho ${deck}`
  const nomes = Array.from({ length: pessoas }, (_, i) => `Técnico ${i + 1}`)
  let s = reducer(structuredClone(INITIAL) as EscState, {
    type: 'START_ONLINE', roomId: 'teste', roomCode: 'TESTE1', isHost: true, playerIndex: 0, playerNames: nomes,
    formation: '4-3-3', deck, copaMode: 'relampago', relampagoChave: chave,
  } as never)
  ok(s.copaMode === 'relampago' && s.relampagoChave === chave, `${nome}: guardou o modo e a chave`)
  ok(s.managers.length === chave, `${nome}: a sala tem ${chave} times (tem ${s.managers.length})`)
  s = leilaoAteTemporada(s)
  ok(s.screen === 'season', `${nome}: o leilão de sempre chegou na temporada (parou em ${s.screen})`)
  const qc = s.quickCopa
  ok(!!qc && qc.phase === (chave === 32 ? 'r32' : 'oitavas'), `${nome}: começa na ${chave === 32 ? 'Rodada de 32' : 'oitavas'} (está em ${qc?.phase})`)
  ok(qc?.ties.length === chave / 2, `${nome}: ${chave / 2} confrontos (tem ${qc?.ties.length})`)
  const ids = new Set(qc?.ties.flatMap(t => [t.aId, t.bId]))
  ok(ids.size === chave && s.managers.every(m => ids.has(m.id)), `${nome}: todo time da sala está na chave, sem repetir`)
  ok(s.round === s.fixtures.length && s.champion == null, `${nome}: a liga não é jogada e não tem campeão de liga`)
  const fakes = s.managers.reduce((n, m) => n + m.squad.filter(c => c.fake).length, 0)
  ok(fakes === 0, `${nome}: nenhum jogador de mentira nos elencos (${fakes})`)

  // 🏁 o mata-mata até o campeão: PLAY_COPA_LEG joga a fase, o seguinte fecha e monta a próxima
  const fases: string[] = []
  let empates = 0
  for (let i = 0; i < 80 && s.quickCopa && s.quickCopa.phase !== 'done'; i++) {
    if (!fases.includes(s.quickCopa.phase)) fases.push(s.quickCopa.phase)
    s = reducer(s, { type: 'PLAY_COPA_LEG' })
  }
  // cada fase fechada: ida e volta (2 jogos), a final 1 · empate no agregado tem pênaltis
  for (const b of s.quickCopa?.bracket ?? []) for (const t of b.ties) {
    const precisa = b.phase === 'final' ? 1 : 2
    if (t.legs.length !== precisa) ok(false, `${nome}: ${b.phase} ${t.aName} × ${t.bName} teve ${t.legs.length} jogo(s), devia ${precisa}`)
    const ga = t.legs.reduce((n, g) => n + g[0], 0), gb = t.legs.reduce((n, g) => n + g[1], 0)
    if (ga === gb) { empates++; if (!t.pens || t.winner == null) ok(false, `${nome}: empate no agregado sem pênaltis (${t.aName} × ${t.bName})`) }
    if (t.winner == null) ok(false, `${nome}: ${b.phase} ${t.aName} × ${t.bName} ficou sem vencedor`)
  }
  ok((s.quickCopa?.bracket ?? []).every(b => b.ties.every(t => t.legs.length === (b.phase === 'final' ? 1 : 2))), `${nome}: ida e volta em toda fase, final em jogo único`)
  const esperado = chave === 32 ? ['r32', 'oitavas', 'quartas', 'semis', 'final'] : ['oitavas', 'quartas', 'semis', 'final']
  ok(JSON.stringify(fases) === JSON.stringify(esperado), `${nome}: fases ${fases.join(' → ')}`)
  const camp = s.quickCopa?.champion
  ok(!!camp && s.managers.some(m => m.id === camp.id) && s.screen === 'end', `${nome}: saiu o campeão (${camp?.name}) e foi pro fim`)
  ok(/RELÂMPAGO/.test(s.news[0] ?? ''), `${nome}: a manchete fala do Relâmpago ("${(s.news[0] ?? '').slice(0, 60)}")`)
  console.log(`   ↳ ${empates} empate(s) decididos nos pênaltis`)

  // 🔁 "mesmo time": nova chave sorteada, de novo sem liga
  const antes = JSON.stringify(s.quickCopa?.bracket[0]?.ties.map(t => [t.aId, t.bId]))
  s = reducer(s, { type: 'REPLAY_SEASON' })
  ok(s.quickCopa?.phase === esperado[0] && s.quickCopa.ties.length === chave / 2 && s.round === s.fixtures.length, `${nome}: "mesmo time" sorteia uma chave nova e pula a liga de novo`)
  ok(JSON.stringify(s.quickCopa?.ties.map(t => [t.aId, t.bId])) !== antes, `${nome}: o sorteio novo não repete a chave anterior`)
}

console.log('⚡ 1) a chave')
ok(chaveRelampago(16, 4) === 16 && chaveRelampago(32, 4) === 32 && chaveRelampago(undefined, 2) === 16, 'o dono escolhe 16 ou 32 (padrão 16)')
ok(chaveRelampago(16, 20) === 32, 'sala com mais de 16 pessoas vira chave de 32 (ninguém fica de fora)')
ok((MARCAS_DE_MODO as readonly string[]).includes('relampagoChave'), 'a chave é marca de MODO (não vaza pra carreira)')

console.log('\n⚡ 2) a sala inteira, do leilão ao campeão')
roda(16, 2, 'br')
roda(16, 9, 'br')
roda(32, 3, 'br')
roda(32, 20, 'todos')

console.log('\n🏆 3) a Liga + Copa continua igual (ida e volta, começa nas quartas depois da liga)')
{
  let s = reducer(structuredClone(INITIAL) as EscState, { type: 'START_ONLINE', roomId: 't', roomCode: 'T2', isHost: true, playerIndex: 0, playerNames: ['A', 'B'], formation: '4-3-3', deck: 'br', copaMode: 'liga_copa' } as never)
  ok(s.managers.length === 20 && !s.relampagoChave, 'sala de liga continua com 20 times e sem chave')
  s = leilaoAteTemporada(s)
  ok(s.screen === 'season' && s.round === 0 && !s.quickCopa, 'começa a liga na rodada 0, sem Copa sorteada')
}

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ Mata-mata Relâmpago: tudo certo.')
process.exit(falhas ? 1 : 0)
