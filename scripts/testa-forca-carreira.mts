// 🧪 📏 FORÇA DOS BOTS DA CARREIRA × RÉGUA NOVA DAS CARTAS (05/11)
//
// Em 02/11 os overs do baralho foram refeitos. Na carreira (a PIRÂMIDE, START_CAREER_SOLO) os clubes de fundo são montados
// com as cartas do catálogo fatiadas por força — e a fatia do meio do baralho (os clubes da Série C) caiu bem mais que o time
// que o jogador monta no leilão da divisão. Medido (150 carreiras por divisão, 1ª temporada com o elenco do leilão daquela
// divisão): a Série C virou passeio (top-4 42% → 80%) e a B ficou mais mole (24% → 33%); V, D e A quase iguais.
// Decisão do Diego: voltar ao equilíbrio de 01/11 → bônus da casa v9 (`CPU_DIV_BOOST_V9`: C +3 → +6, B +3 → +4).
//
// Esta trava confere:
//  1) carreira NOVA nasce no v9; a VIRADA (novo leilão / mesmo time / leilão de reservas) carimba v9 pra temporada que começa;
//  2) temporada em andamento (save com simV 8) segue no v8 — e a simulação dela sai BYTE A BYTE igual à de antes;
//  3) o v9 não gasta dado: nas divisões em que o bônus não mudou (V, D, A) a tabela sai idêntica com v8 e v9;
//  4) carreira online v2 (co2): vale o carimbo da SALA (`mundo.fc`), nunca o simV do aparelho;
//  5) o EQUILÍBRIO: folga (força do jogador − força dos bots de fundo com o bônus) da B e da C de volta à de 01/11.
//
// Rodar: npx tsx scripts/testa-forca-carreira.mts   (ou npm run forca-carreira)
import { createServer } from 'vite'

const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } })
const st: any = await vite.ssrLoadModule('/src/escalacao/store.tsx')
const py: any = await vite.ssrLoadModule('/src/escalacao/pyramidseason.tsx')
const { reducer, INITIAL, cpuEnvelope } = st
const { buildPyramid, simulatePyramid, sortDiv, bonusDaCasa, CPU_DIV_BOOST_V9 } = py

let falhas = 0
const ok = (c: boolean, m: string) => { console.log(`  ${c ? '✅' : '❌'} ${m}`); if (!c) falhas++ }
let agora = 1_800_000_000_000
Date.now = () => agora
const mul = (a: number) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 }
const calado = <T,>(f: () => T): T => { const w = console.warn, e = console.error, l = console.log; console.warn = () => {}; console.error = () => {}; console.log = () => {}; try { return f() } finally { console.warn = w; console.error = e; console.log = l } }
const R = (s: any, a: any) => calado(() => reducer(s, a))

// leilão de envelope com lance simples (mesmo jeito do `npm run forca-bots`)
function leilao(s: any, rng: () => number) {
  for (let step = 0; step < 20000; step++) {
    const sc = s.screen, ph = s.phase
    let a: any = null
    if (sc === 'streamIntro') a = { type: 'START_STREAM_AUCTION' }
    else if (sc === 'auction') {
      if (ph === 'envelope' || ph === 'resq_envelope') {
        const h = s.managers.find((m: any) => m.isHuman && !s.submitted.includes(m.id))
        if (h) a = { type: 'SUBMIT_ENVELOPE', mgrId: h.id, bids: cpuEnvelope({ ...h, aggression: 0.5 }, s.currentCards, s.sectorIdx, rng, ph === 'resq_envelope').map((b: any) => ({ cardId: b.cardId, amount: b.amount })) }
        else { agora += 600_000; a = { type: 'FORCE_SEAL' } }
      } else if (ph === 'reveal' || ph === 'resq_reveal') a = { type: 'ADVANCE_REVEAL' }
      else if (ph === 'tiebreak') {
        const tb = s.tiebreaks[s.tiebreakIdx]
        const h = tb?.managers.find((id: number) => s.managers.some((m: any) => m.id === id && m.isHuman) && !tb.submitted.includes(id))
        if (h != null) { const m = s.managers.find((x: any) => x.id === h); a = { type: 'SUBMIT_TIEBREAK', mgrId: h, amount: Math.min(m.money, tb.amount + Math.floor(rng() * 3)) } }
        else { agora += 600_000; a = { type: 'FORCE_TIEBREAK' } }
      } else return s
    } else if (sc === 'monte') {
      const id = s.monteOrder[s.monteIdx]
      const m = s.managers.find((x: any) => x.id === id)
      let feito = false
      if (m?.isHuman) for (const c of [...s.monte].sort((x: any, y: any) => (y.lo + y.hi) - (x.lo + x.hi))) {
        const n = R(s, { type: 'MONTE_PICK', mgrId: id, cardId: c.id })
        if (n !== s && (n.monteIdx !== s.monteIdx || n.screen !== s.screen)) { s = n; feito = true; break }
      }
      if (feito) continue
      agora += 600_000; a = { type: 'MONTE_TIMEOUT' }
    } else if (sc === 'cerimonia') a = { type: 'FINISH_CEREMONY' }
    else return s
    const n = R(s, a)
    if (n === s && a.type !== 'FORCE_SEAL') return s
    s = n
  }
  return s
}
// carreira com o jogador na divisão `div`, elenco do leilão daquela divisão (a escada limita o leilão pela divisão)
function carreira(seed: number, div: string) {
  Math.random = mul(seed * 31 + 7)
  const rng = mul(seed * 7919 + 13)
  let s = R(INITIAL, { type: 'START_CAREER_SOLO', teamName: 'Humano FC', formation: '4-3-3', rivals: 5, league: 'both' })
  const nasceu = s.simV
  s = leilao(s, rng)
  if (div !== 'V') {
    const you = s.managers[s.youIdx].id
    const pl = { ...s.careerPlacements }
    pl[`m${you}`] = div
    const w0 = buildPyramid(s.managers, you, s.seed, s.deckLeague, s.careerPlacements, s.cpuSquads)
    pl[w0[div].find((t: any) => !t.human && t.teamId < 0).name] = 'V' // um clube de fundo desce pra caber (20 em cada)
    s = R({ ...s, simV: 8 }, { type: 'REAUCTION_ONLINE', placements: pl, rewards: {}, clubRewards: {}, champions: {}, finalPos: {} })
    s = leilao(s, rng)
  }
  return { s, nasceu }
}
const mundo = (s: any) => buildPyramid(s.managers, s.managers[s.youIdx].id, s.seed, s.deckLeague, s.careerPlacements, s.cpuSquads)
const semente = (s: any) => (s.seed ^ ((s.seasonNo ?? 1) * 2654435761)) >>> 0
const roda = (s: any, fb: any) => simulatePyramid(mundo(s), semente(s), 38, {}, {}, 1.12, true, fb)

console.log('1) quem nasce e quem vira no v9')
const c1 = carreira(11, 'C')
ok(c1.nasceu === 9, `carreira nova nasce no v9 (simV = ${c1.nasceu})`)
ok(c1.s.simV === 9, 'a virada com leilão novo (save que vinha no v8) carimba v9 pra temporada que começa')
ok(CPU_DIV_BOOST_V9.C === 6 && CPU_DIV_BOOST_V9.B === 4 && CPU_DIV_BOOST_V9.A === 2 && CPU_DIV_BOOST_V9.D === 2 && CPU_DIV_BOOST_V9.V === 1, 'bônus da casa v9: A 2 · B 4 · C 6 · D 2 · V 1')

console.log('\n2) temporada em andamento segue no número velho')
ok(bonusDaCasa(8, false, undefined, 7) === 8, 'save com simV 8 (temporada que já estava rolando) → tabela v8')
ok(bonusDaCasa(9, false, undefined, 7) === 9, 'save com simV 9 → tabela v9')
ok(bonusDaCasa(undefined, false, undefined, 1) === false && bonusDaCasa(4, false, undefined, 1) === true, 'saves bem antigos continuam onde estavam')
{
  // a simulação de uma temporada v8 não depende da tabela nova: rodar de novo sai igual, byte a byte
  const a = JSON.stringify(roda(c1.s, 8).tables), b = JSON.stringify(roda(c1.s, bonusDaCasa(8, false, undefined, c1.s.seasonNo)).tables)
  ok(a === b, 'temporada v8: a tabela inteira (5 divisões) sai idêntica')
}

console.log('\n3) o v9 não gasta dado')
{
  const r8 = roda(c1.s, 8), r9 = roda(c1.s, 9)
  const igual = (d: string) => JSON.stringify(r8.tables[d]) === JSON.stringify(r9.tables[d]) && JSON.stringify(r8.matches[d]) === JSON.stringify(r9.matches[d])
  ok(['V', 'D', 'A'].every(igual), 'V, D e A (bônus igual): mesmos jogos e mesma tabela com v8 e v9')
  ok(!igual('C'), 'C (bônus mudou): a tabela muda — só a força, o calendário é o mesmo')
  const cal = (r: any) => r.matches.C.map((m: any) => `${m.h}x${m.a}`).join(',')
  ok(cal(r8) === cal(r9), 'C: mesma rodada, mesmos confrontos')
}

console.log('\n4) carreira online v2: o carimbo é da SALA')
ok(bonusDaCasa(9, true, undefined, 3) === 8, 'sala sem carimbo fica no v8 mesmo com o aparelho no v9')
ok(bonusDaCasa(8, true, 5, 4) === 8 && bonusDaCasa(8, true, 5, 5) === 9 && bonusDaCasa(8, true, 5, 9) === 9, 'carimbo na temporada 5: a 4 termina no v8, da 5 em diante v9')

console.log('\n5) equilíbrio: folga do jogador sobre os bots de fundo (média de cartas, sem sorte — sempre igual)')
// folga = força do XI do jogador − (força média dos clubes de fundo da divisão + bônus da casa). Medido em 150 carreiras:
// 01/11 · régua nova sem conserto · com o v9 →  B −0,16 · +1,05 · +0,05   C +2,04 · +5,32 · +2,32
const forca = (t: any) => {
  const r = t.xi.map((c: any) => ({ pos: c.pos, l: (c.lo + c.hi) / 2 }))
  const sec = (p: string) => { const x = r.filter((y: any) => y.pos === p); if (!x.length) return 40; const av = x.reduce((a: number, y: any) => a + y.l, 0) / x.length; return av - (av - Math.min(...x.map((y: any) => y.l))) * 0.35 }
  const g = sec('GOL'), la = sec('LAT'), z = sec('ZAG'), me = sec('MEI'), at = sec('ATA')
  return ((at * .45 + me * .35 + la * .2) + (g * .3 + z * .4 + la * .15 + me * .15)) / 2
}
const N = Number(process.env.FORCA_CARREIRA_N ?? 12)
for (const [div, faixa, antes] of [['C', [0.9, 3.3], '+2,0'], ['B', [-1.3, 1.0], '−0,2']] as const) {
  let fo = 0, top4 = 0
  for (let i = 0; i < N; i++) {
    const { s } = carreira(3000 + i, div)
    const w = mundo(s)
    const me = w[div].find((t: any) => t.you), bots = w[div].filter((t: any) => !t.human && !t.rival)
    fo += (forca(me) - (bots.reduce((a: number, t: any) => a + forca(t), 0) / bots.length + CPU_DIV_BOOST_V9[div])) / N
    const tab = sortDiv(roda(s, 9).tables[div])
    if (tab.findIndex((t: any) => t.you) < 4) top4++
  }
  ok(fo >= faixa[0] && fo <= faixa[1], `Série ${div}: folga ${fo.toFixed(2)} (01/11: ${antes}) · top-4 em ${top4}/${N}`)
}

if (falhas) { console.log(`\n❌ ${falhas} falha(s)`); process.exit(1) }
console.log('\n✅ força dos bots da carreira na régua nova')
process.exit(0)
