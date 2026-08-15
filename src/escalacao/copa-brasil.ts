// ─── 🏆🇧🇷 COPA DO BRASIL LEGENDS — motor do chaveamento ──────────────────
// Especificação FECHADA com o Diego em docs/conceito-copa-brasil.md (ler
// antes de mexer aqui — não inventar variação). Constrói em CIMA do mesmo
// motor de simulação que a Copa Legends usa (`pyramidseason.tsx`, funções
// exportadas 15/08 só pra isso, sem mudar nenhuma linha de lógica delas).
//
// ⚠️ ESTE ARQUIVO AINDA NÃO ESTÁ LIGADO AO JOGO. É só o motor/simulação,
// construído isolado (pedido do Diego: ir "em pedaços"). Ninguém chama
// `computeCopaBrasil` de lugar nenhum ainda — zero risco pro que já está
// no ar. Os próximos pedaços: (1) trocar a Copa Legends por isto de
// verdade, (2) telas/mockup já aprovado, (3) prêmios/ranking.
//
// 🔢 UMA CONTA QUE NÃO FECHOU SOZINHA (decisão minha, sinalizando pro
// Diego conferir): a pirâmide tem 100 clubes de verdade (20 por série,
// A-B-C-D-V — "REDE DE SEGURANÇA" em pyramidseason.tsx). A especificação
// do Diego fala em 96 no total (32 de bye + 64 de peneira). Isso sobra 4
// clubes que preciso EXCLUIR de algum lugar pra fechar em 96. Escolhi
// excluir os 4 ÚLTIMOS da Várzea (a série mais fraca, mais parecido com
// "time que nem se filiou à federação esse ano" na vida real) — mas o
// Diego nunca disse isso explicitamente. Fácil de mudar (é só a constante
// `VARZEA_EXCLUI_ULTIMOS`), só avisar se ele quiser outra régua.

import type { Div, SimTeam, Goal, SeasonScorer, RoundLineups, PoolCard, Tac } from './pyramidseason'
import { mulberry, shuffle, poisson, rollForm, lineupAt, TACS, GOAL_TUNE, teamKey, mid } from './pyramidseason'

export const VARZEA_EXCLUI_ULTIMOS = 4

type Entrant = { t: SimTeam; div: Div }
type StandRow = Entrant & { pts: number; w: number; d: number; l: number; gf: number; ga: number }

export interface CBGroup { idx: number; teams: Entrant[]; table: StandRow[] }
export interface CBTie {
  a: SimTeam; b: SimTeam; aDiv: Div; bDiv: Div
  aggA: number; aggB: number
  pens?: [number, number]
  win: 'a' | 'b'
  goals: Goal[]; legs: [number, number][]; legGoals: Goal[][]
  /** decidido pela regra do azarão (empate na 1ª rodada, jogo único) — não foi pênalti */
  zebraDraw?: boolean
}
export interface CBRound { name: string; ties: CBTie[] }
export interface CopaBrasilResult {
  groups: CBGroup[]
  round64: CBRound | null
  rounds: CBRound[] // oitavas · quartas · semifinal · final
  champion: SimTeam | null; championDiv: Div | null
  vice: SimTeam | null; viceDiv: Div | null
  scorers: SeasonScorer[]; topScorer?: SeasonScorer
}

// prestígio por divisão (Diego 15/08: Várzea JOGA a Copa do Brasil — ao
// contrário da Copa Legends, que a exclui — então precisa da própria régua).
const CB_DIV_STRENGTH: Record<Div, number> = { A: 10, B: 6, C: 3, D: 1, V: 0 }

export function computeCopaBrasil(tables: Record<Div, SimTeam[]>, seed: number, seasonNo: number, capElite = 1.2, realGoals = false, lineups: RoundLineups = {}): CopaBrasilResult {
  const empty: CopaBrasilResult = { groups: [], round64: null, rounds: [], champion: null, championDiv: null, vice: null, viceDiv: null, scorers: [] }
  const rng = mulberry((seed ^ (seasonNo * 0x9E3779B1) ^ 0xB0A5111) >>> 0)
  const withXI = (t: SimTeam): SimTeam => t.human ? { ...t, xi: lineupAt(lineups, t.teamId, 38, t.squad, t.formation) } : t
  const of = (d: Div): Entrant[] => (tables[d] ?? []).map(t => ({ t: withXI(t), div: d }))
  const A = of('A'), B = of('B'), C = of('C'), D = of('D'), V = of('V')
  if (A.length < 20 || B.length < 12) return empty // pirâmide incompleta (save velho/incomum) — sem Copa

  // ── 1) BALDE DE BYE (direto da posição final da tabela, NADA de sorteio) ──
  const eliteBye = A.slice(0, 16)   // Pote 1: 16 melhores da Série A
  const apoioA = A.slice(16, 20)    // 4 últimos da Série A
  const apoioB = B.slice(0, 12)     // 12 melhores da Série B
  const apoioBye = [...apoioA, ...apoioB] // Pote 2: 16 (4+12)

  // ── 2) FASE DE GRUPOS: 64 clubes (resto da B + C + D + V, cortando os 4
  //    últimos da Várzea pra fechar a conta em 96 — ver nota no topo do arquivo) ──
  const restB = B.slice(12, 20) // 8 restantes da Série B
  const restV = VARZEA_EXCLUI_ULTIMOS > 0 ? V.slice(0, Math.max(0, V.length - VARZEA_EXCLUI_ULTIMOS)) : V
  const groupPool: Entrant[] = [...restB, ...C, ...D, ...restV]

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

  // ── grupos: 64 → 4 potes de força (16 cada, por pontos da temporada) →
  //    16 grupos de 4, exatamente 1 time de cada pote (equilíbrio) ──
  const byStrength = [...groupPool].sort((x, y) => y.t.pts - x.t.pts || CB_DIV_STRENGTH[y.div] - CB_DIV_STRENGTH[x.div])
  const pot1 = shuffle(byStrength.slice(0, 16), rng)
  const pot2 = shuffle(byStrength.slice(16, 32), rng)
  const pot3 = shuffle(byStrength.slice(32, 48), rng)
  const pot4 = shuffle(byStrength.slice(48, 64), rng)
  const groups: CBGroup[] = Array.from({ length: 16 }, (_, i) => ({ idx: i, teams: [pot1[i], pot2[i], pot3[i], pot4[i]], table: [] }))

  // jogo único entre cada par do grupo (round-robin simples — 6 jogos por
  // grupo de 4). Mando alternado só pra variar (não afeta classificação:
  // é fase de grupos, não mata-mata).
  for (const grp of groups) {
    const rows = new Map<string, StandRow>()
    for (const e of grp.teams) rows.set(teamKey(e.t), { ...e, pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 })
    for (let i = 0; i < grp.teams.length; i++) {
      for (let j = i + 1; j < grp.teams.length; j++) {
        const home = rng() < 0.5 ? grp.teams[i] : grp.teams[j], away = home === grp.teams[i] ? grp.teams[j] : grp.teams[i]
        const { hg, ag } = leg(home, away, true)
        const rh = rows.get(teamKey(home.t))!, ra = rows.get(teamKey(away.t))!
        rh.gf += hg; rh.ga += ag; ra.gf += ag; ra.ga += hg
        if (hg > ag) { rh.pts += 3; rh.w++; ra.l++ } else if (ag > hg) { ra.pts += 3; ra.w++; rh.l++ } else { rh.pts++; ra.pts++; rh.d++; ra.d++ }
      }
    }
    grp.table = [...rows.values()].sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf)
  }
  const leaders: Entrant[] = groups.map(g => ({ t: g.table[0].t, div: g.table[0].div }))
  const runnersUp: Entrant[] = groups.map(g => ({ t: g.table[1].t, div: g.table[1].div }))

  // ── chave de 64: Pote 1 (elite bye + 16 líderes) × Pote 2 (apoio bye + 16
  //    vice-líderes), sorteio livre entre os potes ──
  const bracketPot1 = shuffle([...eliteBye, ...leaders], rng)
  const bracketPot2 = shuffle([...apoioBye, ...runnersUp], rng)

  // 1ª rodada da chave de 64 (jogo único): quem vem do Pote 1 manda o jogo.
  // Empate = regra do AZAROU (Diego): o time do Pote 2 avança, SEM pênaltis.
  const round64Ties: CBTie[] = []
  const round64Winners: Entrant[] = []
  for (let i = 0; i < 32; i++) {
    const p1 = bracketPot1[i], p2 = bracketPot2[i]
    const r = leg(p1, p2, true)
    const goals: Goal[] = [...r.hEvs.map(e => ({ ...e, home: true })), ...r.aEvs.map(e => ({ ...e, home: false }))].sort((x, y) => x.min - y.min)
    let win: 'a' | 'b', zebraDraw = false
    if (r.hg === r.ag) { win = 'b'; zebraDraw = true } // azarão (Pote 2) avança no empate
    else win = r.hg > r.ag ? 'a' : 'b'
    round64Ties.push({ a: p1.t, b: p2.t, aDiv: p1.div, bDiv: p2.div, aggA: r.hg, aggB: r.ag, win, goals, legs: [[r.hg, r.ag]], legGoals: [goals], zebraDraw })
    round64Winners.push(win === 'a' ? p1 : p2)
  }

  // das oitavas em diante: ida e volta (jogo único só na final), mando por
  // SORTEIO PURO (não por campanha) — mesma trava de pênaltis da Copa Legends.
  const playTie = (a: Entrant, b: Entrant, single: boolean): CBTie => {
    let aggA = 0, aggB = 0
    const goals: Goal[] = []
    const legs: [number, number][] = []
    const legGoals: Goal[][] = []
    const l1 = leg(a, b, true); aggA += l1.hg; aggB += l1.ag
    const g1: Goal[] = [...l1.hEvs.map(e => ({ ...e, home: true })), ...l1.aEvs.map(e => ({ ...e, home: false }))].sort((x, y) => x.min - y.min)
    g1.forEach(e => goals.push(e)); legs.push([l1.hg, l1.ag]); legGoals.push(g1)
    if (!single) {
      const l2 = leg(b, a, true); aggB += l2.hg; aggA += l2.ag
      const g2: Goal[] = [...l2.aEvs.map(e => ({ ...e, home: true })), ...l2.hEvs.map(e => ({ ...e, home: false }))].sort((x, y) => x.min - y.min)
      g2.forEach(e => goals.push(e)); legs.push([l2.ag, l2.hg]); legGoals.push(g2)
    }
    goals.sort((x, y) => x.min - y.min)
    let pens: [number, number] | undefined, win: 'a' | 'b'
    if (aggA === aggB) { let x = 2 + Math.floor(rng() * 4), y = 2 + Math.floor(rng() * 4); if (x === y) (rng() < 0.5 ? x++ : y++); pens = [x, y]; win = x > y ? 'a' : 'b' }
    else win = aggA > aggB ? 'a' : 'b'
    return { a: a.t, b: b.t, aDiv: a.div, bDiv: b.div, aggA, aggB, pens, win, goals, legs, legGoals }
  }

  // ⚠️ OUTRO FURO NA CONTA original do Diego (sinalizando, não travando
  // sozinho): o funil dele pula uma fase — "Semifinal: 8 clubes → sobram 4"
  // seguido direto de "Grande Final: jogo único entre os 2 finalistas" —
  // falta o passo que reduz de 4 pra 2. Depois da 1ª rodada (64→32), sobram
  // 32 times e são NECESSÁRIAS 5 fases (32→16→8→4→2→1), não 4. Usei a
  // nomenclatura padrão de futebol (oitavas=16, quartas=8, semi=4, final=2)
  // e completei com "Rodada dos 32" a fase que faltava nome.
  const roundNames = ['Rodada dos 32', 'Oitavas', 'Quartas', 'Semifinal', 'Final']
  const rounds: CBRound[] = []
  let cur = shuffle(round64Winners, rng) // sorteio puro das oitavas em diante
  let ri = 0
  while (cur.length > 1) {
    const single = cur.length === 2 // final = jogo único
    const ties: CBTie[] = [], next: Entrant[] = []
    for (let i = 0; i + 1 < cur.length; i += 2) {
      const tie = playTie(cur[i], cur[i + 1], single)
      ties.push(tie); next.push(tie.win === 'a' ? cur[i] : cur[i + 1])
    }
    rounds.push({ name: roundNames[ri] ?? `Fase ${ri + 1}`, ties }); cur = next; ri++
  }

  const champEnt = cur[0]
  const fin = rounds[rounds.length - 1]
  // vice = quem perdeu a final (já é SimTeam direto, sem precisar buscar)
  const ft = fin && fin.ties.length === 1 ? fin.ties[0] : null
  const list = [...scorers.values()].sort((a, b) => b.goals - a.goals)

  return {
    groups,
    round64: { name: '1ª rodada', ties: round64Ties },
    rounds,
    champion: champEnt?.t ?? null,
    championDiv: champEnt?.div ?? null,
    vice: ft ? (ft.win === 'a' ? ft.b : ft.a) : null,
    viceDiv: ft ? (ft.win === 'a' ? ft.bDiv : ft.aDiv) : null,
    scorers: list.slice(0, 20),
    topScorer: list[0],
  }
}

// ─── premiação (docs/conceito-copa-brasil.md § 7 — proposta, ainda não
// travada em número final pelo Diego pra alguns itens). `r32` é NOVO — não
// tava na tabela original do Diego, porque a fase "Rodada dos 32" também
// não tinha nome na especificação dele (ver nota acima). Fica entre o
// valor de r64 e o de oitavas, mesmo espaçamento dos outros degraus. ───
export const CB_PAY = { grupos: 2, r64: 4, r32: 5, oitavas: 6, quartas: 10, semi: 16, vice: 25, camp: 50 }
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
  // quem nem chegou na chave de 64 (caiu na fase de grupos) leva a
  // participação mínima.
  for (const g of r.groups) for (const row of g.table.slice(2)) paga(row.t, CB_PAY.grupos)
  // fundo: até onde cada time chegou na chave de 64 (round64 + oitavas..final)
  const fundo: Record<string, { tm: SimTeam; depth: number }> = {}
  const put = (tm: SimTeam, depth: number) => { const k = teamKey(tm); if (!fundo[k] || depth > fundo[k].depth) fundo[k] = { tm, depth } }
  if (r.round64) for (const t of r.round64.ties) { put(t.a, 0); put(t.b, 0) }
  r.rounds.forEach((rd, ri) => { for (const t of rd.ties) { put(t.a, ri + 1); put(t.b, ri + 1) } })
  const nR = r.rounds.length // 5: Rodada dos 32 · Oitavas · Quartas · Semifinal · Final
  for (const k in fundo) {
    const { tm, depth } = fundo[k]
    const pay = (championKey && k === championKey) ? CB_PAY.camp
      : depth === nR ? CB_PAY.vice       // perdeu a final
        : depth === nR - 1 ? CB_PAY.semi   // caiu na semi
          : depth === nR - 2 ? CB_PAY.quartas // caiu nas quartas
            : depth === nR - 3 ? CB_PAY.oitavas // caiu nas oitavas
              : depth === nR - 4 ? CB_PAY.r32    // caiu na Rodada dos 32
                : CB_PAY.r64                        // caiu na 1ª rodada da chave de 64
    paga(tm, pay)
  }
  if (r.topScorer) {
    const scorerTeam = [...r.groups.flatMap(g => g.teams.map(e => e.t)), ...(r.round64?.ties.flatMap(t => [t.a, t.b]) ?? [])].find(t => t.teamId === r.topScorer!.teamId)
    if (scorerTeam) paga(scorerTeam, CB_SCORER_BONUS)
  }
  return { rewards, clubRewards, championKey }
}
