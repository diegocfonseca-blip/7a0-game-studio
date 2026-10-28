// 🧪 ⚡ ENVELOPE ÚNICO (28/10, mockup scripts/mockups/envelope-unico.png). Regras do Diego: *"pode fazer esse modo… faça tb pro
// partida rápida… tempo de 90s troque para 180s"*.
// Confere: abre UM envelope com as 5 posições · 180s · um lance por posição respeita as vagas · uma revelação só · empate = sorteio
// (nunca fase de desempate) · ninguém fica com caixa negativa · todo elenco fecha (Monte de sempre) · nada de jogador de mentira em
// time de gente · e os outros jeitos de lance (envelope de sempre) seguem iguais. Carreira nunca liga.
// uso: npx tsx scripts/testa-envelope-unico.mts   (ou npm run envelope-unico)
import { reducer, INITIAL, ENVELOPE_UNICO_MS } from '../src/escalacao/store'
import type { EscState } from '../src/escalacao/types'
let falhas = 0
const ok = (c: boolean, m: string) => { console.log(c ? '✅' : '❌', m); if (!c) falhas++ }
const SECT = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'] as const

// cada humano dá lance em até (vagas) cartas de cada posição, com o dinheiro dividido — igual a tela faz
function envelopeDe(s: EscState, mgrId: number, agressivo: number) {
  const m = s.managers.find(x => x.id === mgrId)!
  const bids: { cardId: string; amount: number }[] = []
  let caixa = m.money
  for (const p of SECT) {
    const cartas = s.currentCards.filter(c => c.pos === p).slice(0, 2)
    for (const c of cartas) { const v = Math.min(caixa, agressivo); if (v <= 0) break; bids.push({ cardId: c.id, amount: v }); caixa -= v }
  }
  return bids
}

function anda(s: EscState, lance: (s: EscState) => EscState): { s: EscState; viuEnvelope: number; viuDesempate: boolean; revelacoes: number } {
  let viuEnvelope = 0, viuDesempate = false, revelacoes = 0
  for (let i = 0; i < 8000 && s.screen !== 'season'; i++) {
    if (s.screen === 'auction') {
      if (s.phase === 'envelope') {
        viuEnvelope++
        const antes = s
        s = lance(s)
        if (s === antes || s.phase === 'envelope') s = reducer({ ...s, phaseDeadline: 1 }, { type: 'FORCE_SEAL' })
        continue
      }
      if (s.phase === 'tiebreak') { viuDesempate = true; s = reducer({ ...s, phaseDeadline: 1 }, { type: 'FORCE_TIEBREAK' }); continue }
      if (s.phase === 'reveal' || s.phase === 'resq_reveal') { if (s.revealIdx === 0) revelacoes++; s = reducer(s, { type: 'ADVANCE_REVEAL' }); continue }
      s = reducer({ ...s, phaseDeadline: 1 }, { type: 'FORCE_SEAL' }); continue
    }
    if (s.screen === 'monte') { s = reducer({ ...s, monteDeadline: 1 }, { type: 'MONTE_TIMEOUT' }); continue }
    if (s.screen === 'cerimonia') { s = reducer(s, { type: 'FINISH_CEREMONY' }); continue }
    s = reducer(s, { type: 'FORCE_SEAL' })
  }
  return { s, viuEnvelope, viuDesempate, revelacoes }
}

console.log('⚡ 1) Partida Rápida')
{
  let s = reducer(structuredClone(INITIAL) as EscState, { type: 'START', teamName: 'Teste FC', formation: '4-3-3', rivals: 7, envUnico: true } as never)
  for (let i = 0; i < 20 && s.screen !== 'auction'; i++) s = reducer(s, { type: 'FINISH_CEREMONY' } as never)
  ok(s.envUnico === true && s.euAberto === true && s.phase === 'envelope', `abre o envelope único (fase ${s.phase})`)
  const posicoes = new Set(s.currentCards.map(c => c.pos))
  ok(posicoes.size === 5, `as 5 posições na mesma tela (${[...posicoes].join(' ')} · ${s.currentCards.length} cartas)`)
  const dur = (s.phaseDeadline ?? 0) - Date.now()
  ok(dur > ENVELOPE_UNICO_MS - 2000 && dur <= ENVELOPE_UNICO_MS, `relógio de 180s (${Math.round(dur / 1000)}s)`)
  const eu = s.managers[s.youIdx]
  const r = anda(s, st => reducer(st, { type: 'SUBMIT_ENVELOPE', mgrId: eu.id, bids: envelopeDe(st, eu.id, 6) }))
  s = r.s
  ok(r.viuEnvelope === 1, `um envelope só (${r.viuEnvelope})`)
  ok(!r.viuDesempate, 'empate não abre rodada de desempate (sorteio na hora)')
  ok(r.revelacoes === 1, `uma revelação só (${r.revelacoes})`)
  ok(s.screen === 'season', `chegou na temporada (${s.screen})`)
  const neg = s.managers.filter(m => m.money < 0).length
  ok(neg === 0, 'ninguém com caixa negativa')
  const eu2 = s.managers.find(m => m.id === eu.id)!
  ok(eu2.squad.length >= 11, `meu elenco fechou (${eu2.squad.length})`)
  ok(!eu2.squad.some(c => c.fake), 'nenhum jogador de mentira no meu time')
}

console.log('\n🌐 2) Sala online (3 pessoas)')
{
  let s = reducer(structuredClone(INITIAL) as EscState, { type: 'START_ONLINE', roomId: 't', roomCode: 'T1', isHost: true, playerIndex: 0, playerNames: ['A', 'B', 'C'], formation: '4-3-3', deck: 'br', copaMode: 'liga_copa', envUnico: true } as never)
  for (let i = 0; i < 20 && s.screen !== 'auction'; i++) s = reducer(s, { type: 'FINISH_CEREMONY' } as never)
  ok(s.euAberto === true, 'abre o envelope único na sala')
  const humanos = s.managers.filter(m => m.isHuman).map(m => m.id)
  const r = anda(s, st => {
    let x = st
    // dois apostam IGUAL na mesma carta → empate → sorteio
    for (const id of humanos) x = reducer(x, { type: 'SUBMIT_ENVELOPE', mgrId: id, bids: envelopeDe(x, id, 5) })
    return x
  })
  s = r.s
  ok(r.viuEnvelope === 1 && !r.viuDesempate && r.revelacoes === 1, `um envelope, sem desempate, uma revelação (${r.viuEnvelope}/${r.viuDesempate}/${r.revelacoes})`)
  ok(s.screen === 'season', `chegou na temporada (${s.screen})`)
  for (const id of humanos) {
    const m = s.managers.find(x => x.id === id)!
    ok(m.squad.length >= 11 && m.money >= 0 && !m.squad.some(c => c.fake), `${m.name}: elenco ${m.squad.length}, caixa ${m.money}, sem fake`)
  }
}

console.log('\n🔨 3) os outros jeitos ficam iguais')
{
  let s = reducer(structuredClone(INITIAL) as EscState, { type: 'START', teamName: 'Teste FC', formation: '4-3-3', rivals: 7 } as never)
  for (let i = 0; i < 20 && s.screen !== 'auction'; i++) s = reducer(s, { type: 'FINISH_CEREMONY' } as never)
  ok(!s.envUnico && !s.euAberto && new Set(s.currentCards.map(c => c.pos)).size === 1, 'sem a escolha, o envelope de sempre (uma posição por vez)')
  const c = reducer(structuredClone(INITIAL) as EscState, { type: 'START_ONLINE', roomId: 't', roomCode: 'T1', isHost: true, playerIndex: 0, playerNames: ['A', 'B'], formation: '4-3-3', deck: 'br', career: true, envUnico: true } as never)
  ok(!c.envUnico, 'carreira nunca liga o envelope único')
  const d = reducer(structuredClone(INITIAL) as EscState, { type: 'START_ONLINE', roomId: 't', roomCode: 'T1', isHost: true, playerIndex: 0, playerNames: ['A', 'B'], formation: '4-3-3', deck: 'br', duplasMode: true, envUnico: true } as never)
  ok(!d.envUnico, 'duplas não ligam o envelope único')
}

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ Envelope único: tudo certo.')
process.exit(falhas ? 1 : 0)
