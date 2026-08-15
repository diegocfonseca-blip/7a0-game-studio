// ─── 🏆🇧🇷 COPA DO BRASIL LEGENDS — motor do chaveamento (v2, 16/08) ──────
// Especificação FECHADA com o Diego em docs/conceito-copa-brasil.md, seção
// "1-NOVA" (a v1, com fase de grupos, foi DESCARTADA depois de muita
// conversa — o Diego achou complicado demais de acompanhar). Constrói em
// CIMA do mesmo motor de simulação que a Copa Legends usa
// (`pyramidseason.tsx`, funções exportadas só pra isso, sem mudar nenhuma
// linha de lógica delas).
//
// 🔌 Ligado ao jogo atrás de trava por conta (COPA_BRASIL_TESTERS em
// sport.ts) — só quem está na lista joga essa Copa; todo mundo continua
// 100% Copa Legends. Os adaptadores no fim deste arquivo
// (copaBrasilAsCopaResult / copaBrasilRewardsAsCopaRewards) encaixam o
// resultado nos MESMOS componentes/telas da Copa Legends, sem duplicar UI.
//
// 100% MATA-MATA, sem fase de grupos. 100 clubes reais, ninguém excluído.
// Tudo roda de uma vez, depois que a rodada 38 termina (nada no meio da
// temporada — o Diego cogitou adiantar parte, mas descartou: o tempo
// TOTAL de exibição seria o mesmo, só mudaria quando se assiste).
//
// O FUNIL (sempre potência de 2, zero ajuste/exceção no meio):
//   Peneira (72 → 36, jogo único, sorteio livre)
//   + Direto (28: Série A inteira + 8 melhores da B) = 64 na chave
//   Rodada de 64 (64→32, jogo único, sorteio livre)
//   Rodada de 32 (32→16, jogo único, sorteio livre)
//   Oitavas (16→8, ida e volta) — A PARTIR DAQUI a chave TRAVA (estilo
//     olímpico: vencedor do jogo A encara vencedor do jogo B na fase
//     seguinte, sem sortear de novo)
//   Quartas (8→4, ida e volta, travada)
//   Semifinal (4→2, ida e volta, travada)
//   Final (2→1, jogo único, travada)

import type { Div, SimTeam, Goal, SeasonScorer, RoundLineups, PoolCard, Tac, CopaResult, CopaRound } from './pyramidseason'
import { mulberry, shuffle, poisson, rollForm, lineupAt, TACS, GOAL_TUNE, teamKey, mid } from './pyramidseason'

type Entrant = { t: SimTeam; div: Div }

export interface CBGroup { idx: number; teams: Entrant[]; table: (Entrant & { pts: number; w: number; d: number; l: number; gf: number; ga: number })[] }
export interface CBTie {
  a: SimTeam; b: SimTeam; aDiv: Div; bDiv: Div
  aggA: number; aggB: number
  pens?: [number, number]
  win: 'a' | 'b'
  goals: Goal[]; legs: [number, number][]; legGoals: Goal[][]
}
export interface CBRound { name: string; ties: CBTie[] }
export interface CopaBrasilResult {
  groups: CBGroup[] // 🈳 sempre vazio na v2 (sem fase de grupos) — mantido só pra não quebrar tipos/telas antigas
  round64: CBRound | null // guarda a PENEIRA (72→36) — nome mantido pelo campo, mas o `.name` interno já diz "Peneira"
  rounds: CBRound[] // Rodada de 64 · Rodada de 32 · Oitavas · Quartas · Semifinal · Final
  champion: SimTeam | null; championDiv: Div | null
  vice: SimTeam | null; viceDiv: Div | null
  scorers: SeasonScorer[]; topScorer?: SeasonScorer
}

// prestígio por divisão (Várzea joga a Copa do Brasil inteira, ao contrário
// da Copa Legends, que a exclui — por isso precisa da própria régua).
const CB_DIV_STRENGTH: Record<Div, number> = { A: 10, B: 6, C: 3, D: 1, V: 0 }

// da Oitavas em diante o chaveamento TRAVA (sem sortear de novo); antes
// disso (peneira, Rodada de 64, Rodada de 32) é sorteio livre a cada fase.
const ROUND_NAMES = ['Rodada de 64', 'Rodada de 32', 'Oitavas', 'Quartas', 'Semifinal', 'Final'] as const
const ROUND_LEGS: Record<string, 1 | 2> = { 'Rodada de 64': 1, 'Rodada de 32': 1, Oitavas: 2, Quartas: 2, Semifinal: 2, Final: 1 }
const FREE_DRAW = new Set(['Rodada de 64', 'Rodada de 32']) // sorteio livre só até aqui

export function computeCopaBrasil(tables: Record<Div, SimTeam[]>, seed: number, seasonNo: number, capElite = 1.2, realGoals = false, lineups: RoundLineups = {}): CopaBrasilResult {
  const empty: CopaBrasilResult = { groups: [], round64: null, rounds: [], champion: null, championDiv: null, vice: null, viceDiv: null, scorers: [] }
  const rng = mulberry((seed ^ (seasonNo * 0x9E3779B1) ^ 0xB0A5111) >>> 0)
  const withXI = (t: SimTeam): SimTeam => t.human ? { ...t, xi: lineupAt(lineups, t.teamId, 38, t.squad, t.formation) } : t
  const of = (d: Div): Entrant[] => (tables[d] ?? []).map(t => ({ t: withXI(t), div: d }))
  const A = of('A'), B = of('B'), C = of('C'), D = of('D'), V = of('V')
  if (A.length < 20 || B.length < 20 || C.length < 20 || D.length < 20 || V.length < 20) return empty // pirâmide incompleta (save velho/incomum) — sem Copa

  // ── Série B se divide pela posição final: 8 melhores vão DIRETO na
  //    chave (prêmio pela boa campanha), os 12 piores jogam a peneira.
  //    (16/08: era 12/8 antes; ajustado pra fechar 64 sem excluir
  //    ninguém e sem "passe direto" avulso no meio do caminho.) ──
  const bDireto = B.slice(0, 8)
  const bPeneira = B.slice(8, 20)

  const goalW = (c: PoolCard) => { const n = Math.max(0, (mid(c) - 40) / 42); return 0.12 + n * n * 1.8 }
  const scorers = new Map<string, SeasonScorer>()
  const credit = (e: Entrant, xi: PoolCard[], goals: number): { name: string; min: number }[] => {
    const evs: { name: string; min: number }[] = []
    const day = new Map<string, number>()
    for (const c of xi) day.set(c.id, 0.4 + rng() * 2.2)
    for (let g = 0; g < goals; g++) {
      const pool = xi.map(c => ({ c, w: (c.pos === 'ATA' ? 6 : c.pos === 'MEI' ? 3 : c.pos === 'LAT' ? 1 : c.pos === 'ZAG' ? 0.4 : (/chilavert|ceni/i.test(c.name) ? 0.05 : 0)) * goalW(c) * (day.get(c.id) ?? 1) }))
      const total = pool.reduce((s, p) => s + p.w, 0); let r = rng() * total, pick = pool[0]?.c
      for (const p of pool) { r -= p.w; if (r <= 0) { pick = p.c; break } }
      if (!pick) continue
      const key = `${e.t.name}:${pick.id}`, row = scorers.get(key)
      if (row) row.goals++; else scorers.set(key, { name: pick.name, teamName: e.t.name, teamId: e.t.teamId, div: e.div, goals: 1, you: e.t.you, human: e.t.human, rival: e.t.rival, cardId: pick.id })
      evs.push({ name: pick.name, min: 1 + Math.floor(rng() * 90) })
    }
    return evs
  }
  // um jogo (mesma física da Copa Legends): tática aleatória, forma por
  // elenco + prestígio de divisão + sorte, gol por Poisson.
  const leg = (H: Entrant, Aw: Entrant, homeAdv: boolean) => {
    const th = TACS[Math.floor(rng() * 3)] as Tac, ta = TACS[Math.floor(rng() * 3)] as Tac
    const fh = rollForm(H.t.xi, th, ta, rng), fa = rollForm(Aw.t.xi, ta, th, rng)
    const bh = CB_DIV_STRENGTH[H.div], ba = CB_DIV_STRENGTH[Aw.div]
    fh.atk += bh; fh.def += bh; fa.atk += ba; fa.def += ba
    const lkH = 0.85 + rng() * 0.30, lkA = 0.85 + rng() * 0.30
    fh.atk *= lkH; fh.def *= lkH; fa.atk *= lkA; fa.def *= lkA
    const qual = (atk: number) => Math.max(0.5, Math.min(capElite, atk / 66))
    const G = realGoals ? GOAL_TUNE.v3 : GOAL_TUNE.v2
    const lh = Math.max(0.08, (G.base + (fh.atk - fa.def) * G.coef + (homeAdv ? G.home : 0)) * qual(fh.atk))
    const la = Math.max(0.08, (G.base + (fa.atk - fh.def) * G.coef) * qual(fa.atk))
    const hg = poisson(lh, rng), ag = poisson(la, rng)
    return { hg, ag, hEvs: credit(H, H.t.xi, hg), aEvs: credit(Aw, Aw.t.xi, ag) }
  }
  const pensDecide = (): [number, number] => {
    let x = 2 + Math.floor(rng() * 4), y = 2 + Math.floor(rng() * 4)
    if (x === y) (rng() < 0.5 ? x++ : y++)
    return [x, y]
  }
  // jogo único (peneira, Rodada de 64, Rodada de 32, Final): empate vai
  // pra pênaltis, igual a Copa Legends sempre fez.
  const playSingle = (a: Entrant, b: Entrant): CBTie => {
    const r = leg(a, b, true)
    const goals: Goal[] = [...r.hEvs.map(e => ({ ...e, home: true })), ...r.aEvs.map(e => ({ ...e, home: false }))].sort((x, y) => x.min - y.min)
    let pens: [number, number] | undefined, win: 'a' | 'b'
    if (r.hg === r.ag) { pens = pensDecide(); win = pens[0] > pens[1] ? 'a' : 'b' }
    else win = r.hg > r.ag ? 'a' : 'b'
    return { a: a.t, b: b.t, aDiv: a.div, bDiv: b.div, aggA: r.hg, aggB: r.ag, pens, win, goals, legs: [[r.hg, r.ag]], legGoals: [goals] }
  }
  // ida e volta (Oitavas, Quartas, Semifinal): placar agregado, pênaltis
  // se empatar no total.
  const playTwoLegs = (a: Entrant, b: Entrant): CBTie => {
    let aggA = 0, aggB = 0
    const goals: Goal[] = [], legs: [number, number][] = [], legGoals: Goal[][] = []
    const l1 = leg(a, b, true); aggA += l1.hg; aggB += l1.ag
    const g1: Goal[] = [...l1.hEvs.map(e => ({ ...e, home: true })), ...l1.aEvs.map(e => ({ ...e, home: false }))].sort((x, y) => x.min - y.min)
    g1.forEach(e => goals.push(e)); legs.push([l1.hg, l1.ag]); legGoals.push(g1)
    const l2 = leg(b, a, true); aggB += l2.hg; aggA += l2.ag
    const g2: Goal[] = [...l2.aEvs.map(e => ({ ...e, home: true })), ...l2.hEvs.map(e => ({ ...e, home: false }))].sort((x, y) => x.min - y.min)
    g2.forEach(e => goals.push(e)); legs.push([l2.ag, l2.hg]); legGoals.push(g2)
    goals.sort((x, y) => x.min - y.min)
    let pens: [number, number] | undefined, win: 'a' | 'b'
    if (aggA === aggB) { pens = pensDecide(); win = pens[0] > pens[1] ? 'a' : 'b' }
    else win = aggA > aggB ? 'a' : 'b'
    return { a: a.t, b: b.t, aDiv: a.div, bDiv: b.div, aggA, aggB, pens, win, goals, legs, legGoals }
  }

  // ── FASE 1 — PENEIRA: 72 times (Várzea + Série C + Série D + 12 piores
  //    da B), jogo único, sorteio livre. 72 é par, então sempre dá 36
  //    vencedores certinho, sem sobrar ninguém. ──
  const peneiraPool = shuffle([...V, ...C, ...D, ...bPeneira], rng)
  const peneiraTies: CBTie[] = [], peneiraWinners: Entrant[] = []
  for (let i = 0; i + 1 < peneiraPool.length; i += 2) {
    const tie = playSingle(peneiraPool[i], peneiraPool[i + 1])
    peneiraTies.push(tie)
    peneiraWinners.push(tie.win === 'a' ? peneiraPool[i] : peneiraPool[i + 1])
  }

  // ── forma a chave de 64: 36 (peneira) + 28 (Série A inteira + 8
  //    melhores da B, direto, sem jogar peneira) ──
  const direto: Entrant[] = [...A, ...bDireto]
  let cur: Entrant[] = shuffle([...peneiraWinners, ...direto], rng)

  const rounds: CBRound[] = []
  for (let ri = 0; ri < ROUND_NAMES.length && cur.length > 1; ri++) {
    const name = ROUND_NAMES[ri]
    // sorteio livre até a Rodada de 32; da Oitavas em diante a ORDEM de
    // `cur` já É o chaveamento travado (vencedor do jogo A encara
    // vencedor do jogo B na fase seguinte) — não embaralha mais.
    const pool = FREE_DRAW.has(name) ? shuffle(cur, rng) : cur
    const legs = ROUND_LEGS[name]
    const ties: CBTie[] = [], next: Entrant[] = []
    for (let i = 0; i + 1 < pool.length; i += 2) {
      const tie = legs === 2 ? playTwoLegs(pool[i], pool[i + 1]) : playSingle(pool[i], pool[i + 1])
      ties.push(tie); next.push(tie.win === 'a' ? pool[i] : pool[i + 1])
    }
    rounds.push({ name, ties })
    cur = next
  }

  const champEnt = cur[0] ?? null
  const fin = rounds[rounds.length - 1]
  const ft = fin && fin.ties.length === 1 ? fin.ties[0] : null
  const viceEnt: Entrant | null = ft ? (ft.win === 'a' ? { t: ft.b, div: ft.bDiv } : { t: ft.a, div: ft.aDiv }) : null
  const list = [...scorers.values()].sort((a, b) => b.goals - a.goals)

  return {
    groups: [], // sem fase de grupos na v2
    round64: { name: 'Peneira', ties: peneiraTies },
    rounds,
    champion: champEnt?.t ?? null,
    championDiv: champEnt?.div ?? null,
    vice: viceEnt?.t ?? null,
    viceDiv: viceEnt?.div ?? null,
    scorers: list.slice(0, 20),
    topScorer: list[0],
  }
}

// ─── premiação (docs/conceito-copa-brasil.md § 7, atualizada 16/08pro
// funil novo: peneira · rodada64 · rodada32 · oitavas · quartas · semi ·
// vice · campeão — 8 degraus). ───
export const CB_PAY = { peneira: 2, r64: 4, r32: 5, oitavas: 6, quartas: 10, semi: 16, vice: 25, camp: 50 }
export const CB_SCORER_BONUS = 10 // caixa do time pelo artilheiro da Copa do Brasil
export const CB_SCORER_FLOOR_BONUS = 10 // piso do artilheiro sobe fixo

export function copaBrasilRewards(r: CopaBrasilResult): { rewards: Record<number, number>; clubRewards: Record<string, number>; championKey: string | null } {
  const rewards: Record<number, number> = {}, clubRewards: Record<string, number> = {}
  const championKey = r.champion ? teamKey(r.champion) : null
  const paga = (tm: SimTeam, val: number) => {
    if (val <= 0) return
    if (tm.human && tm.teamId >= 0) rewards[tm.teamId] = (rewards[tm.teamId] ?? 0) + val
    else clubRewards[teamKey(tm)] = (clubRewards[teamKey(tm)] ?? 0) + val
  }
  // fundo: até onde cada time chegou (0=caiu na peneira, 1=rodada de 64,
  // 2=rodada de 32, 3=oitavas, 4=quartas, 5=semi, 6=final/vice)
  const fundo: Record<string, { tm: SimTeam; depth: number }> = {}
  const put = (tm: SimTeam, depth: number) => { const k = teamKey(tm); if (!fundo[k] || depth > fundo[k].depth) fundo[k] = { tm, depth } }
  if (r.round64) for (const t of r.round64.ties) { put(t.a, 0); put(t.b, 0) }
  r.rounds.forEach((rd, ri) => { for (const t of rd.ties) { put(t.a, ri + 1); put(t.b, ri + 1) } })
  const payByDepth = [CB_PAY.peneira, CB_PAY.r64, CB_PAY.r32, CB_PAY.oitavas, CB_PAY.quartas, CB_PAY.semi, CB_PAY.vice]
  for (const k in fundo) {
    const { tm, depth } = fundo[k]
    const pay = (championKey && k === championKey) ? CB_PAY.camp : (payByDepth[depth] ?? CB_PAY.peneira)
    paga(tm, pay)
  }
  if (r.topScorer) {
    const everyone = [...(r.round64?.ties.flatMap(t => [t.a, t.b]) ?? []), ...r.rounds.flatMap(rd => rd.ties.flatMap(t => [t.a, t.b]))]
    const scorerTeam = everyone.find(t => t.teamId === r.topScorer!.teamId)
    if (scorerTeam) paga(scorerTeam, CB_SCORER_BONUS)
  }
  return { rewards, clubRewards, championKey }
}

// ─── ADAPTADORES pra Copa do Brasil encaixar 1:1 nos componentes/telas/
// reducer que já existem pra Copa Legends (CopaBracket, CopaTieRow,
// CopaLiveMatch, ChampionsPanel, o relógio de fases `copaRound`, o
// fechamento de temporada) SEM mudar nenhuma linha delas — só troca QUAL
// motor alimenta a mesma "forma" de dado. A Peneira (round64) vira a 1ª
// entrada de `rounds`, seguida das 6 fases da chave — 7 fases reveladas
// ao todo, cada uma mais uma "página" que a tela já sabe folhear. ──
export function copaBrasilAsCopaResult(r: CopaBrasilResult): CopaResult {
  const rounds: CopaRound[] = []
  if (r.round64) rounds.push({ name: r.round64.name, ties: r.round64.ties })
  rounds.push(...r.rounds)
  return { rounds, champion: r.champion, championDiv: r.championDiv, vice: r.vice, viceDiv: r.viceDiv, scorers: r.scorers, topScorer: r.topScorer }
}

export function copaBrasilRewardsAsCopaRewards(r: CopaBrasilResult): { rewards: Record<number, number>; clubRewards: Record<string, number>; values: Record<string, number>; championKey: string | null } {
  const base = copaBrasilRewards(r)
  const values: Record<string, number> = {}
  if (r.topScorer) values[r.topScorer.name] = (values[r.topScorer.name] ?? 0) + CB_SCORER_FLOOR_BONUS
  return { ...base, values }
}
