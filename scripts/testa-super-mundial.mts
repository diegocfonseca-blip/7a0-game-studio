// 🧪 🌍 SÓ SUPER MUNDIAL (26/11) — a sala sai do leilão direto pro Mundial de Clubes no formato de 2025, com o time do leilão.
// Confere: sem liga · 32 clubes (os da sala + os reais de 2025) · os reais jogam com as PRÓPRIAS cartas · 8 grupos de 4 em turno
// único (3 rodadas) com a regra das confederações · passam 2 · oitavas na chave de 2025 · TUDO em jogo único (final também) ·
// empate decide nos pênaltis · sai um campeão · "mesmo time" monta tudo de novo · a Libertadores da sala (com o seu time) não mudou.
// uso: npm run super-mundial
import { reducer, INITIAL, elencoConvidado, CHAVE_OITAVAS_MUNDIAL } from '../src/escalacao/store'
import { libertaGrupo } from '../src/escalacao/store'
import { confedDoClube, MUNDIAL_CLUBES } from '../src/escalacao/mundial-sala'
import { poolDoClube } from '../src/escalacao/copa-regional'
import type { EscState } from '../src/escalacao/types'
let falhas = 0
const ok = (c: boolean, m: string) => { console.log(c ? '✅' : '❌', m); if (!c) falhas++ }

function leilaoAteTemporada(s: EscState): EscState {
  for (let i = 0; i < 6000 && s.screen !== 'season' && s.screen !== 'liberta'; i++) {
    if (s.screen === 'auction') {
      if (s.phase === 'envelope' || s.phase === 'resq_envelope') {
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

function roda(pessoas: number) {
  const nome = `${pessoas} pessoas`
  const nomes = Array.from({ length: pessoas }, (_, i) => `Técnico ${i + 1}`)
  let s = reducer(structuredClone(INITIAL) as EscState, {
    type: 'START_ONLINE', roomId: 'teste', roomCode: 'TESTE1', isHost: true, playerIndex: 0, playerNames: nomes,
    formation: '4-3-3', deck: 'todos', copaMode: 'supermundial',
  } as never)
  ok(s.copaMode === 'supermundial', `${nome}: guardou o modo`)
  s = leilaoAteTemporada(s)
  const lb = s.liberta
  ok(s.screen === 'liberta' && !!lb && lb.superMundial === true && lb.rodadas === 3, `${nome}: o leilão vai direto pra fase de grupos do Super Mundial (tela ${s.screen})`)
  if (!lb) return
  ok(s.round === s.fixtures.length && s.champion == null, `${nome}: a liga não é jogada`)
  ok(lb.times.length === 32 && new Set(lb.times.map(t => t.id)).size === 32, `${nome}: 32 clubes sem repetir (${lb.times.length})`)
  const daSala = s.managers.filter(m => m.isHuman)
  ok(daSala.every(m => lb.times.some(x => x.id === m.id)) && lb.times.filter(t => !t.clubeReal).length === daSala.length, `${nome}: todo time de gente está no Mundial e os bots do leilão ficam de fora`)
  const reais = lb.times.filter(t => t.clubeReal)
  ok(reais.every(t => MUNDIAL_CLUBES.some(c => c.clube === t.clubeReal)), `${nome}: os clubes que completam são os do Mundial de 2025`)
  // os reais jogam com as cartas DELES
  for (const t of reais) {
    const el = elencoConvidado(s, t.id), minhas = new Set(Object.values(poolDoClube(t.clubeReal!)).flat().map(c => `${c.name}|${c.club}|${c.year}`))
    if (el.length !== 11 || !el.every(c => minhas.has(`${c.name}|${c.club}|${c.year}`))) ok(false, `${nome}: ${t.clubeReal} não joga com as cartas dele (${el.length})`)
  }
  // grupos: 8 × 4, turno único, regra das confederações
  for (let g = 0; g < 8; g++) {
    const ts = lb.times.filter(t => t.grupo === g)
    const conf = ts.filter(t => t.clubeReal).map(t => confedDoClube(t.clubeReal!))
    const uefa = conf.filter(c => c === 'UEFA').length, outras = conf.filter(c => c !== 'UEFA')
    ok(ts.length === 4 && uefa <= 2 && new Set(outras).size === outras.length, `${nome}: grupo ${'ABCDEFGH'[g]} com 4 e sem confederação repetida (${ts.map(t => t.name).join(', ')})`)
  }
  ok(lb.fixtures.length === 3 && lb.fixtures.every(r => r.length === 16), `${nome}: 3 rodadas de 16 jogos`)
  // joga as 3 rodadas
  for (let i = 0; i < 5 && s.liberta?.fase === 'grupos'; i++) s = reducer(s, { type: 'PLAY_LIBERTA_RODADA' })
  ok(s.liberta?.fase === 'mata' && s.quickCopa?.phase === 'oitavas', `${nome}: depois de 3 rodadas, oitavas (fase ${s.quickCopa?.phase})`)
  const prim = Array.from({ length: 8 }, (_, g) => libertaGrupo(s.liberta!, g)[0].id), seg = Array.from({ length: 8 }, (_, g) => libertaGrupo(s.liberta!, g)[1].id)
  ok(s.quickCopa!.ties.every((t, i) => t.aId === prim[CHAVE_OITAVAS_MUNDIAL[i][0]] && t.bId === seg[CHAVE_OITAVAS_MUNDIAL[i][1]]), `${nome}: oitavas na chave do Mundial de 2025`)
  const fases: string[] = []
  for (let i = 0; i < 40 && s.quickCopa && s.quickCopa.phase !== 'done'; i++) {
    if (!fases.includes(s.quickCopa.phase)) fases.push(s.quickCopa.phase)
    s = reducer(s, { type: 'PLAY_COPA_LEG' })
  }
  ok(JSON.stringify(fases) === JSON.stringify(['oitavas', 'quartas', 'semis', 'final']), `${nome}: fases ${fases.join(' → ')}`)
  let empates = 0
  for (const b of s.quickCopa?.bracket ?? []) for (const t of b.ties) {
    if (t.legs.length !== 1) ok(false, `${nome}: ${b.phase} ${t.aName} × ${t.bName} teve ${t.legs.length} jogos (devia 1)`)
    if (t.legs[0] && t.legs[0][0] === t.legs[0][1]) { empates++; if (!t.pens) ok(false, `${nome}: empate sem pênaltis`) }
    if (t.winner == null) ok(false, `${nome}: confronto sem vencedor`)
  }
  ok((s.quickCopa?.bracket ?? []).every(b => b.ties.every(t => t.legs.length === 1)), `${nome}: todo o mata-mata em jogo único`)
  const camp = s.quickCopa?.champion
  ok(!!camp && s.screen === 'end', `${nome}: campeão ${camp?.name} e fim`)
  ok(/SUPER MUNDIAL|SUPER CLUB WORLD CUP/.test(s.news[0] ?? ''), `${nome}: a manchete fala do Super Mundial ("${(s.news[0] ?? '').slice(0, 60)}")`)
  console.log(`   ↳ ${empates} empate(s) nos pênaltis · ${daSala.length} times da sala`)
  s = reducer(s, { type: 'REPLAY_SEASON' })
  ok(s.screen === 'liberta' && s.liberta?.superMundial === true && s.liberta.rodada === 0, `${nome}: "mesmo time" monta o Super Mundial de novo`)
}
roda(4)
roda(20)
console.log(falhas ? `\n❌ ${falhas} falha(s) no Só Super Mundial` : '\n✅ Só Super Mundial: direto do leilão, 32 clubes, grupos de turno único, chave de 2025 e tudo em jogo único')
if (falhas) process.exit(1)
