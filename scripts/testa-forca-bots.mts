// 🧪 📏 FORÇA DOS BOTS DA SALA × RÉGUA NOVA DAS CARTAS (05/11)
//
// Em 02/11 os overs do baralho foram refeitos e as cartas da galera ficaram ~2,5 pontos mais fracas, mas os bots das salas
// eram nivelados a números FIXOS da régua velha (ONLINE_BASE 74, VARZEA_BASE 69, LIBERTA_CLUBS, FAIXA da Champions). A
// taça fugiu da galera (medido em 500 salas: liga 68% → 49%, Liberta 58% → 19%, Várzea 53% → 7%). O conserto é o degrau
// `ESCALA_BOTS` do store, gravado na sala no START_ONLINE (`escalaBots`).
//
// Esta trava confere:
//  1) sala nova nasce com a escala; carreira online e basquete NÃO (a carreira é outra régua — só medida);
//  2) sala que já estava rodando (sem o campo) segue com os números VELHOS — e o número viaja no estado do dono;
//  3) o degrau não gasta dado: com e sem a escala, o leilão, os elencos dos bots e os sorteios saem IGUAIS;
//  4) o EQUILÍBRIO numa simulação curta e determinística (salas de 2 a 6 pessoas, lance simples, baralho BR): a taça
//     voltou pra faixa de antes de 02/11 — nem bot ganhando tudo, nem a galera passeando.
//
// Rodar: npx tsx scripts/testa-forca-bots.mts   (ou npm run forca-bots)
import { reducer, INITIAL, cpuEnvelope, ESCALA_BOTS_ATUAL } from '../src/escalacao/store'
import { LIBERTA_CLUBS } from '../src/escalacao/data'
import type { EscState } from '../src/escalacao/types'

let falhas = 0
const ok = (c: boolean, m: string) => { console.log(`  ${c ? '✅' : '❌'} ${m}`); if (!c) falhas++ }

// relógio e dado presos: a trava dá SEMPRE o mesmo resultado (nada de teste que pisca)
let agora = 1_800_000_000_000
Date.now = () => agora
const mul = (a: number) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 }
const calado = <T,>(f: () => T): T => { const w = console.warn, e = console.error; console.warn = () => {}; console.error = () => {}; try { return f() } finally { console.warn = w; console.error = e } }
const R = (s: EscState, a: unknown) => calado(() => reducer(s, a as never))

type Opc = { copaMode?: string; varzea?: boolean; ligaDraft?: boolean; career?: boolean; sport?: string; deck?: string }
const largada = (seed: number, nh: number, o: Opc = {}) => (Math.random = mul(seed * 31 + 7), R(INITIAL, {
  type: 'START_ONLINE', roomId: 'r' + seed, roomCode: 'FB' + seed, isHost: true, playerIndex: 0,
  playerNames: Array.from({ length: nh }, (_, i) => `Pessoa ${i + 1}`), formation: '4-3-3', deck: o.deck ?? 'br',
  copaMode: o.copaMode ?? 'liga_copa', relampagoChave: 16, varzea: o.varzea, ligaDraft: o.ligaDraft, career: o.career, sport: o.sport,
}))

// joga a sala inteira: leilão de envelope (gente com lance simples) → liga → a competição da sala
function jogaSala(s0: EscState, seed: number, olha?: (s: EscState) => EscState) {
  const rng = mul(seed * 7919 + 13)
  Math.random = mul(seed * 31 + 7) // o reducer usa Math.random em alguns sorteios de tela: preso também
  let s = s0
  const modo = s.copaMode
  const ehH = (id: number) => s.managers.some(m => m.id === id && m.isHuman)
  let ligaH: boolean | null = null, compH: boolean | null = null
  for (let step = 0; step < 20000; step++) {
    if (olha) s = olha(s)
    const sc = s.screen, ph = s.phase
    let a: Record<string, unknown> | null = null
    if (sc === 'streamIntro') a = { type: 'START_STREAM_AUCTION' }
    else if (sc === 'auction') {
      if (ph === 'envelope' || ph === 'resq_envelope') {
        const h = s.managers.find(m => m.isHuman && !s.submitted.includes(m.id))
        if (h) a = { type: 'SUBMIT_ENVELOPE', mgrId: h.id, bids: cpuEnvelope({ ...h, aggression: 0.5 }, s.currentCards, s.sectorIdx, rng, ph === 'resq_envelope').map(b => ({ cardId: b.cardId, amount: b.amount })) }
        else { agora += 600_000; a = { type: 'FORCE_SEAL' } }
      } else if (ph === 'reveal' || ph === 'resq_reveal') a = { type: 'ADVANCE_REVEAL' }
      else if (ph === 'tiebreak') {
        const tb = s.tiebreaks[s.tiebreakIdx]
        const h = tb?.managers.find(id => ehH(id) && !tb.submitted.includes(id))
        if (h != null) { const m = s.managers.find(x => x.id === h)!; a = { type: 'SUBMIT_TIEBREAK', mgrId: h, amount: Math.min(m.money, tb.amount + Math.floor(rng() * 3)) } }
        else { agora += 600_000; a = { type: 'FORCE_TIEBREAK' } }
      } else throw new Error('fase inesperada: ' + ph)
    } else if (sc === 'monte') {
      const id = s.monteOrder[s.monteIdx]
      const m = s.managers.find(x => x.id === id)
      let feito = false
      if (m?.isHuman) for (const c of [...s.monte].sort((x, y) => (y.lo + y.hi) - (x.lo + x.hi))) {
        const n = R(s, { type: 'MONTE_PICK', mgrId: id, cardId: c.id })
        if (n !== s && (n.monteIdx !== s.monteIdx || n.screen !== s.screen)) { s = n; feito = true; break }
      }
      if (feito) continue
      agora += 600_000; a = { type: 'MONTE_TIMEOUT' }
    } else if (sc === 'cerimonia') a = { type: 'FINISH_CEREMONY' }
    else if (sc === 'season') {
      const total = s.fixtures.length || 38
      const semLiga = modo === 'champions' || modo === 'relampago'
      const qc = s.quickCopa
      if (qc && qc.phase !== 'done' && (s.round >= total || semLiga)) a = { type: 'PLAY_COPA_LEG' }
      else if (s.round < total && !semLiga) a = { type: 'SIM_MANY', count: total }
      else a = { type: 'FINISH_SEASON' }
    } else if (sc === 'liberta') a = { type: 'PLAY_LIBERTA_RODADA' }
    else if (sc === 'champions') a = s.champions?.fase === 'repescao' ? { type: 'START_COPA' } : { type: 'PLAY_CHAMPIONS_RODADA' }
    else if (sc === 'end') {
      if (ligaH === null && s.champion != null && modo !== 'champions' && modo !== 'relampago') ligaH = ehH(s.champion)
      if (s.liberta?.fase === 'grupos') a = { type: 'START_LIBERTA' }
      else if (s.champions && s.champions.fase !== 'mata' && s.champions.fase !== 'repescao') a = { type: 'START_CHAMPIONS' }
      else if (s.quickCopa && s.quickCopa.phase !== 'done') a = { type: 'START_COPA' }
      else if (s.champions?.fase === 'repescao' && !s.quickCopa) a = { type: 'START_COPA' }
      else { if (s.quickCopa?.champion) compH = ehH(s.quickCopa.champion.id); break }
    } else throw new Error('tela inesperada: ' + sc)
    const n = R(s, a)
    if (n === s && a.type !== 'FORCE_SEAL') throw new Error(`a sala travou em ${sc}/${ph} (${a.type})`)
    s = n
  }
  // folga = força média da galera − força com que os bots de fundo jogam (a natural + o ajuste da sala). É o número que a
  // régua nova tinha derrubado: sem sorte no meio, então separa o certo do errado mesmo numa amostra pequena.
  const forca = (m: { squad: { pos: string; lo: number; hi: number }[] }) => {
    const r = m.squad.map(c => ({ pos: c.pos, l: (c.lo + c.hi) / 2 }))
    const sec = (p: string) => { const x = r.filter(y => y.pos === p); if (!x.length) return 40; const av = x.reduce((a, y) => a + y.l, 0) / x.length; return av - (av - Math.min(...x.map(y => y.l))) * 0.35 }
    const g = sec('GOL'), la = sec('LAT'), z = sec('ZAG'), me = sec('MEI'), at = sec('ATA')
    return ((at * .45 + me * .35 + la * .2) + (g * .3 + z * .4 + la * .15 + me * .15)) / 2
  }
  const media = (l: EscState['managers']) => l.reduce((a, m) => a + forca(m), 0) / Math.max(1, l.length)
  const folga = media(s.managers.filter(m => m.isHuman)) - (media(s.managers.filter(m => !m.isHuman && !m.auctionRival && m.squad.length)) + s.cpuAtkAdj)
  return { s, ligaH, compH, folga }
}

console.log('1) quem nasce com a escala nova')
{
  ok(largada(1, 3).escalaBots === ESCALA_BOTS_ATUAL, `sala rápida nova: escalaBots = ${ESCALA_BOTS_ATUAL}`)
  ok(largada(1, 3, { copaMode: 'champions' }).escalaBots === ESCALA_BOTS_ATUAL, 'Só Champions: também')
  ok(largada(1, 3, { varzea: true }).escalaBots === ESCALA_BOTS_ATUAL, 'Várzea: também')
  ok(largada(1, 3, { career: true }).escalaBots === undefined, 'carreira online: NÃO (a carreira é a régua da divisão — só medida por enquanto)')
  ok(largada(1, 3, { sport: 'basquete' }).escalaBots === undefined, 'basquete: NÃO (as cartas da NBA não mudaram)')
}

console.log('\n2) sala que já estava rodando segue com o número velho; o número viaja no estado')
// Do MESMO estado, o mesmo passo com e sem o campo: é assim que fica uma sala que começou antes do conserto
// (o estado dela não tem `escalaBots`) quando o dono abre o jogo já atualizado.
const fotos: Record<string, EscState> = {}
jogaSala(largada(7, 3, { copaMode: 'liga_liberta' }), 7, s => {
  if (s.screen === 'cerimonia' && !fotos.cerimonia) fotos.cerimonia = s
  if (s.screen === 'season' && s.round === 0 && !fotos.liga) fotos.liga = s
  return s
})
const semCampo = (s: EscState) => { const c = { ...s }; delete c.escalaBots; return c }
{
  const nova = R(fotos.cerimonia, { type: 'FINISH_CEREMONY' }), velha = R(semCampo(fotos.cerimonia), { type: 'FINISH_CEREMONY' })
  const dif = velha.cpuAtkAdj - nova.cpuAtkAdj
  ok(Math.abs(dif - 2.5) < 1e-9, `bots de fundo: na sala antiga ficam 2,5 acima da nova (diferença ${dif.toFixed(2)})`)
  ok(nova.escalaBots === ESCALA_BOTS_ATUAL && velha.escalaBots === undefined, 'a sala antiga continua sem o campo até acabar (ninguém carimba no meio)')
  const sync = R({ ...INITIAL, youIdx: 1, isHost: false } as EscState, { type: 'SYNC_STATE', newState: nova })
  ok(sync.escalaBots === nova.escalaBots && sync.cpuAtkAdj === nova.cpuAtkAdj, 'o convidado recebe do dono a MESMA escala e o MESMO ajuste')
}
const ligaNova = R(fotos.liga, { type: 'SIM_MANY', count: 38 }), ligaVelha = R(semCampo(fotos.liga), { type: 'SIM_MANY', count: 38 })
{
  const conv = (st: EscState) => st.liberta!.times.filter(t => !t.isManager)
  const base = new Map(LIBERTA_CLUBS.map(c => [c.name, c.atk]))
  ok(conv(ligaVelha).every(t => t.baseAtk === base.get(t.name)), 'Liberta da sala antiga: os 24 convidados com a força de sempre')
  ok(conv(ligaNova).every(t => t.baseAtk === base.get(t.name)! - 5), 'Liberta da sala nova: os 24 convidados 5 abaixo')
}

console.log('\n3) o degrau não gasta dado: do mesmo estado, os sorteios saem iguais com e sem a escala')
{
  const nova = R(fotos.cerimonia, { type: 'FINISH_CEREMONY' }), velha = R(semCampo(fotos.cerimonia), { type: 'FINISH_CEREMONY' })
  const idc = (c: { name: string; club: string; year: number }) => `${c.name}|${c.club}|${c.year}`
  const elenco = (s: EscState) => s.managers.map(m => m.squad.map(idc).join(',')).join('|')
  ok(elenco(nova) === elenco(velha), 'a cerimônia fecha os MESMOS elencos')
  ok(JSON.stringify(nova.fixtures) === JSON.stringify(velha.fixtures), 'a MESMA tabela de jogos')
  // (os 8 da liga podem mudar — o placar muda com a força —, então o que se compara é o sorteio dos 24 convidados)
  const grupos = (st: EscState) => st.liberta!.times.filter(t => !t.isManager).map(t => `${t.name}@${t.grupo}`).join(',')
  ok(grupos(ligaNova) === grupos(ligaVelha), 'o sorteio da Liberta (potes e grupos dos convidados) é o MESMO — só a força deles muda')
}
console.log('\n4) equilíbrio (simulação curta, sempre a mesma): % de salas em que a taça ficou com GENTE')
// faixas: o que se media antes de 02/11 (500 salas, baralho BR) com folga pro tamanho da amostra. O "bug" é o que as salas
// estavam dando entre 02/11 e o conserto — a faixa de baixo existe pra pegar a volta dele.
const CASOS: { nome: string; o: Opc; ligaMin?: number; compMin?: number; max: number; antes: string; bug: string; folga?: [number, number] }[] = [
  { nome: 'Liga + Copa dos 8', o: { copaMode: 'liga_copa' }, ligaMin: 60, compMin: 48, max: 92, folga: [4.2, 6.3], antes: 'liga 68% · Copa 62% · folga 5,2', bug: 'liga 49% · Copa 39% · folga 3,0' },
  { nome: 'Liga + Libertadores', o: { copaMode: 'liga_liberta' }, compMin: 38, max: 92, antes: 'Liberta 58%', bug: 'Liberta 19%' },
  { nome: 'Liga + Champions', o: { copaMode: 'liga_champions' }, compMin: 36, max: 92, antes: 'Champions 53%', bug: 'Champions 23%' },
  { nome: 'Só Champions', o: { copaMode: 'champions' }, compMin: 33, max: 85, antes: '51%', bug: '22%' },
  { nome: 'Relâmpago', o: { copaMode: 'relampago' }, compMin: 42, max: 85, antes: '55%', bug: '40%' },
  { nome: 'Várzea', o: { copaMode: 'liga_copa', varzea: true }, ligaMin: 30, max: 85, folga: [2.5, 4.8], antes: 'liga 53% · folga 3,5', bug: 'liga 7% · folga −1,2' },
  { nome: 'Liga Draft (começo fraco)', o: { copaMode: 'liga_copa', ligaDraft: true, deck: 'todos' }, ligaMin: 40, max: 92, antes: 'liga 73%', bug: 'liga 14%' },
]
const N = Number(process.env.FORCA_BOTS_N ?? 60)
const S0 = Number(process.env.FORCA_BOTS_S0 ?? 5000)
for (const c of CASOS) {
  let lh = 0, ln = 0, ch = 0, cn = 0, fo = 0
  for (let i = 0; i < N; i++) {
    const seed = S0 + i
    const r = jogaSala(largada(seed, 2 + (i % 5), c.o), seed)
    if (r.ligaH !== null) { ln++; if (r.ligaH) lh++ }
    if (r.compH !== null) { cn++; if (r.compH) ch++ }
    fo += r.folga / N
  }
  const pl = ln ? Math.round(100 * lh / ln) : null, pc = cn ? Math.round(100 * ch / cn) : null
  const txt = [pl != null ? `liga ${pl}%` : '', pc != null && c.compMin != null ? `taça ${pc}%` : '', c.folga ? `folga ${fo.toFixed(1)}` : ''].filter(Boolean).join(' · ')
  const bom = (c.ligaMin == null || (pl != null && pl >= c.ligaMin && pl <= c.max)) && (c.compMin == null || (pc != null && pc >= c.compMin && pc <= c.max))
    && (!c.folga || (fo >= c.folga[0] && fo <= c.folga[1]))
  ok(bom, `${c.nome}: ${txt}  (antes de 02/11: ${c.antes} · com o bug: ${c.bug})`)
}

if (falhas) { console.log(`\n❌ ${falhas} falha(s)`); process.exit(1) }
console.log('\n✅ força dos bots da sala na régua nova')
process.exit(0) // (o cliente do banco acorda depois e reclama do import.meta — não é deste teste)
