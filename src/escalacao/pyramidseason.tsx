// ─── CARREIRA ONLINE · TEMPORADA SIMULADA (as 4 divisões) ────────────────
// Depois do LEILÃO REAL, a temporada roda SIMULADA a partir dos elencos de
// verdade (mesmo motor da Dinastia, aqui auto-contido). Tudo é DETERMINÍSTICO
// pela semente da sala + a rodada atual (state.round, que já sincroniza pelo
// host), então todos os aparelhos veem a MESMA tabela sem mandar resultado por
// resultado. A Série D tem os humanos com os times montados no pregão; A/B/C são
// preenchidas pelo resto do baralho, distribuído por força (A a mais forte).

import { useEffect, useMemo, useState } from 'react'
import { CATALOG, CATALOG_EU, CATALOG_BOTH, DIVISION_TEAMS } from './data'
import type { Card, Manager, Sector, WonCard } from './types'
import { SECTORS, FORMATIONS } from './types'
import { useEsc } from './store'
import { CardCollectPrompt, SEASON_TOTAL_MS } from './screens'

const INK = '#0C0C0C'
const GOLD = '#FFC400'
const GREEN = '#1B7A3D'
const OSWALD = { fontFamily: 'Oswald, sans-serif' } as const

export type Div = 'A' | 'B' | 'C' | 'D'
export const DIVS: Div[] = ['A', 'B', 'C', 'D']
const DIV_LABEL: Record<Div, string> = { A: '🏆 Série A', B: '🥈 Série B', C: '🥉 Série C', D: 'Série D' }
const DIV_TAG: Record<Div, { l: string; bg: string }> = { A: { l: 'A', bg: '#B8892B' }, B: { l: 'B', bg: '#3E8E4E' }, C: { l: 'C', bg: '#9A7B33' }, D: { l: 'D', bg: '#7A7460' } }

// ── motor de simulação por elenco (espelha o da Dinastia) ──
const NEED: Record<Sector, number> = { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }
type PoolCard = Card
const mid = (c: PoolCard) => (c.lo + c.hi) / 2
function mulberry(seed: number) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function poisson(l: number, rng: () => number): number { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= rng() } while (p > L); return k - 1 }
function sectorPow(rolls: number[]): number { if (rolls.length === 0) return 40; const avg = rolls.reduce((a, b) => a + b, 0) / rolls.length; const min = Math.min(...rolls); return avg - (avg - min) * 0.35 }
function shuffle<T>(arr: T[], rng: () => number): T[] { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a }
let filCounter = 0
const FIL_NAMES = ['Perna-de-pau', 'Ferro Velho', 'Pé de Anjo', 'Canela Seca', 'Zé Ninguém', 'Trapalhão', 'Bola Murcha', 'Meia-Boca']
function filler(pos: Sector, rng: () => number): PoolCard { const lo = 40 + Math.floor(rng() * 6); return { id: `fil-${filCounter++}`, name: FIL_NAMES[Math.floor(rng() * FIL_NAMES.length)], club: 'Várzea', year: 2000, pos, fame: 1, lo, hi: lo + 7 + Math.floor(rng() * 4) } }
type Tac = 'retranca' | 'equilibrio' | 'ataque'
const TACS: Tac[] = ['retranca', 'equilibrio', 'ataque']
function rollForm(squad: PoolCard[], tac: Tac, _opp: Tac, rng: () => number) {
  const rolls = squad.map(c => ({ c, lvl: c.lo + rng() * (c.hi - c.lo) }))
  const by = (p: Sector) => sectorPow(rolls.filter(r => r.c.pos === p).map(r => r.lvl))
  const gol = by('GOL'), lat = by('LAT'), zag = by('ZAG'), mei = by('MEI'), ata = by('ATA')
  let atk = ata * 0.45 + mei * 0.35 + lat * 0.20
  let def = gol * 0.30 + zag * 0.40 + lat * 0.15 + mei * 0.15
  if (tac === 'retranca') { def += 4; atk -= 3 } if (tac === 'ataque') { atk += 4; def -= 3 } if (tac === 'equilibrio') { atk += 1; def += 1 }
  return { atk, def }
}
function bestXI(squad: PoolCard[]): PoolCard[] {
  const out: PoolCard[] = []
  for (const p of SECTORS) { const cands = squad.filter(c => c.pos === p).sort((a, b) => mid(b) - mid(a)); for (let i = 0; i < NEED[p] && i < cands.length; i++) out.push(cands[i]) }
  return out
}
function dealSquads(bucket: PoolCard[], nTeams: number, rng: () => number): PoolCard[][] {
  const squads: PoolCard[][] = Array.from({ length: nTeams }, () => [])
  const byPos: Record<Sector, PoolCard[]> = { GOL: [], LAT: [], ZAG: [], MEI: [], ATA: [] }
  for (const c of bucket) byPos[c.pos].push(c)
  for (const p of SECTORS) { const list = shuffle(byPos[p], rng); for (let slot = 0; slot < NEED[p]; slot++) for (let t = 0; t < nTeams; t++) squads[t].push(list.shift() ?? filler(p, rng)) }
  return squads
}
function roundRobin(n: number): [number, number][][] {
  const ids = Array.from({ length: n }, (_, i) => i), rounds: [number, number][][] = [], rot = ids.slice(1)
  for (let r = 0; r < n - 1; r++) {
    const round: [number, number][] = []
    const left = [ids[0], ...rot.slice(0, n / 2 - 1)], right = rot.slice(n / 2 - 1).reverse()
    for (let i = 0; i < n / 2; i++) round.push(r % 2 === 0 ? [left[i], right[i]] : [right[i], left[i]])
    rounds.push(round); rot.unshift(rot.pop()!)
  }
  return [...rounds, ...rounds.map(r => r.map(([h, a]) => [a, h] as [number, number]))]
}

export interface SimTeam { name: string; you: boolean; human: boolean; teamId: number; squad: PoolCard[]; xi: PoolCard[]; pts: number; w: number; d: number; l: number; gf: number; ga: number }
export interface SeasonScorer { name: string; teamName: string; teamId: number; div: Div; goals: number; you: boolean; human: boolean }

function pickCatalog(deck: 'br' | 'eu' | 'both') { return deck === 'eu' ? CATALOG_EU : deck === 'both' ? CATALOG_BOTH : CATALOG }

// elencos determinísticos dos 60 times de CPU (A/B/C), por NOME — estável entre
// temporadas: quando um time sobe/desce, leva o mesmo elenco (chave = nome).
function buildCpuSquads(managers: Manager[], seed: number, deck: 'br' | 'eu' | 'both'): Map<string, PoolCard[]> {
  const rng = mulberry((seed ^ 0x9E3779B1) >>> 0)
  const used = new Set<string>()
  for (const m of managers) for (const c of m.squad) used.add(c.name)
  const cat = pickCatalog(deck)
  const pool: PoolCard[] = (Object.keys(cat) as Sector[]).flatMap(pos => cat[pos].map((c, i) => ({ ...c, pos, id: `${pos}-${i}` })))
  const rest = shuffle(pool.filter(c => !used.has(c.name)), rng).sort((a, b) => mid(b) - mid(a))
  const q = Math.ceil(rest.length / 3)
  const bucket: Record<'A' | 'B' | 'C', PoolCard[]> = { A: rest.slice(0, q), B: rest.slice(q, q * 2), C: rest.slice(q * 2) }
  const map = new Map<string, PoolCard[]>()
  for (const d of ['A', 'B', 'C'] as const) {
    const names = DIVISION_TEAMS[d].map(t => t.team).slice(0, 20)
    const dealt = dealSquads(bucket[d], 20, rng)
    names.forEach((nm, i) => map.set(nm, dealt[i]))
  }
  return map
}
// divisão de origem de um time de CPU (temporada 1) — usada como fallback
const cpuOrigDiv = (name: string): Div => DIVISION_TEAMS.A.some(t => t.team === name) ? 'A' : DIVISION_TEAMS.B.some(t => t.team === name) ? 'B' : 'C'
// chave estável de um time: técnico = m<id>; CPU = nome
export const teamKey = (t: { teamId: number; name: string }) => t.teamId >= 0 ? `m${t.teamId}` : t.name

// monta as 4 divisões pela COLOCAÇÃO guardada (placements): D começa com os
// técnicos reais; a cada temporada os times sobem/descem por nome exato.
export function buildPyramid(managers: Manager[], youId: number, seed: number, deck: 'br' | 'eu' | 'both', placements?: Record<string, string> | null): Record<Div, SimTeam[]> {
  const mk = (name: string, squad: PoolCard[], human: boolean, you: boolean, teamId: number): SimTeam => ({ name, you, human, teamId, squad, xi: bestXI(squad), pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 })
  const world: Record<Div, SimTeam[]> = { A: [], B: [], C: [], D: [] }
  const divOf = (key: string, fallback: Div): Div => { const d = placements?.[key]; return (d === 'A' || d === 'B' || d === 'C' || d === 'D') ? d : fallback }
  for (const m of managers.slice(0, 20)) {
    const t = mk(m.teamName, (m.squad as WonCard[]).map(c => ({ ...c })), m.isHuman, m.id === youId, m.id)
    world[divOf(`m${m.id}`, 'D')].push(t)
  }
  const cpu = buildCpuSquads(managers, seed, deck)
  for (const [name, squad] of cpu) world[divOf(name, cpuOrigDiv(name))].push(mk(name, squad, false, false, -1))
  return world
}

// acessos/quedas por NOME EXATO: top 4 sobe, últimos 4 caem, entre divisões
// vizinhas. Devolve a nova colocação (chave do time → divisão).
export function computePromotions(tables: Record<Div, SimTeam[]>): Record<string, string> {
  const pl: Record<string, string> = {}
  for (const d of DIVS) for (const t of tables[d]) pl[teamKey(t)] = d
  for (let i = 0; i < 3; i++) {
    const U = DIVS[i], L = DIVS[i + 1] // U = de cima, L = de baixo
    for (const t of tables[U].slice(-4)) pl[teamKey(t)] = L // caem
    for (const t of tables[L].slice(0, 4)) pl[teamKey(t)] = U // sobem
  }
  return pl
}

// moedas da temporada por técnico — SEM base recorrente (o técnico já começou
// com 100). Só desempenho, com valores DIFERENTES por série:
//   campeão: A 25 · B 20 · C 15 · D 10
//   top 4 (zona): A 20 · B 15 · C 10 · D 5 — nas de baixo é acesso (sobe); na A é
//     "manter entre os 4" (não tem pra onde subir). Campeão da A = 25 + 20 = 45.
//   queda (caiu, pela série de onde caiu): A 20 · B 15 · C 10 · D 5
const DIV_RANK: Record<Div, number> = { A: 3, B: 2, C: 1, D: 0 }
const CAMPEAO: Record<Div, number> = { A: 25, B: 20, C: 15, D: 10 }
const ZONA: Record<Div, number> = { A: 20, B: 15, C: 10, D: 5 }
const QUEDA: Record<Div, number> = { A: 20, B: 15, C: 10, D: 5 }
export function seasonRewards(tables: Record<Div, SimTeam[]>): Record<number, number> {
  const newPl = computePromotions(tables)
  const out: Record<number, number> = {}
  for (const d of DIVS) tables[d].forEach((t, i) => {
    if (!t.human || t.teamId < 0) return
    let delta = 0
    if (i === 0) delta += CAMPEAO[d] // campeão da divisão
    if (i < 4) delta += ZONA[d] // top 4: acesso nas de baixo, "manter entre os 4" na A
    const nd = newPl[teamKey(t)] as Div | undefined
    if (nd && DIV_RANK[nd] < DIV_RANK[d]) delta -= QUEDA[d] // queda (caiu da série d)
    out[t.teamId] = delta
  })
  return out
}
// campeão de cada divisão nesta temporada (chave do time → divisão) — pro ranking
export function seasonChampions(tables: Record<Div, SimTeam[]>): Record<string, Div> {
  const out: Record<string, Div> = {}
  for (const d of DIVS) if (tables[d][0]) out[teamKey(tables[d][0])] = d
  return out
}

export interface Goal { name: string; min: number; home: boolean }
export interface SimMatch { h: string; a: string; hg: number; ag: number; hId: number; aId: number; you: boolean; hum: boolean; goals: Goal[] }

// joga UMA divisão até a rodada `round` (determinístico), acumulando artilharia.
// `lastMatches` recebe os jogos da ÚLTIMA rodada jogada (placar + quem fez os
// gols e em que minuto) pra exibir com a simulação.
// tática de um humano é POR JOGO: `tactics[teamId]` é um mapa rodada→tática; numa
// rodada r vale a última tática escolhida numa rodada <= r (senão equilíbrio).
export type RoundTactics = Record<number, Record<number, Tac>>
function tacAt(tactics: RoundTactics, teamId: number, r: number): Tac {
  const byRound = tactics[teamId]; if (!byRound) return 'equilibrio'
  let best: Tac = 'equilibrio', bestK = -1
  for (const k in byRound) { const kn = +k; if (kn <= r && kn > bestK) { bestK = kn; best = byRound[kn] } }
  return best
}
function simDivTo(teams: SimTeam[], div: Div, seed: number, round: number, scorers: Map<string, SeasonScorer>, tactics: RoundTactics, lastMatches?: SimMatch[]) {
  const rng = mulberry((seed ^ 0x51ED2C) >>> 0)
  const fix = roundRobin(20)
  // credita os gols na artilharia da temporada e devolve os eventos (nome + minuto)
  const scoreGoals = (t: SimTeam, goals: number): { name: string; min: number }[] => {
    const evs: { name: string; min: number }[] = []
    for (let g = 0; g < goals; g++) {
      const pool = t.xi.map(c => ({ c, w: c.pos === 'ATA' ? 6 : c.pos === 'MEI' ? 3 : c.pos === 'LAT' ? 1 : c.pos === 'ZAG' ? 0.4 : 0.05 }))
      const total = pool.reduce((s, p) => s + p.w, 0)
      let r = rng() * total, pick = pool[0].c
      for (const p of pool) { r -= p.w; if (r <= 0) { pick = p.c; break } }
      const key = `${t.name}:${pick.id}`, row = scorers.get(key)
      if (row) row.goals++; else scorers.set(key, { name: pick.name, teamName: t.name, teamId: t.teamId, div, goals: 1, you: t.you, human: t.human })
      const min = rng() < 0.08 ? 90 + 1 + Math.floor(rng() * 6) : 1 + Math.floor(rng() * 90)
      evs.push({ name: pick.name, min })
    }
    return evs
  }
  const nr = Math.min(round, 38)
  for (let r = 0; r < nr; r++) for (const [hi, ai] of fix[r]) {
    const H = teams[hi], A = teams[ai]
    // humano usa a tática que ELE escolheu (sincronizada); CPU sorteia
    const th: Tac = H.human ? tacAt(tactics, H.teamId, r) : TACS[Math.floor(rng() * 3)]
    const ta: Tac = A.human ? tacAt(tactics, A.teamId, r) : TACS[Math.floor(rng() * 3)]
    const fh = rollForm(H.xi, th, ta, rng), fa = rollForm(A.xi, ta, th, rng)
    const lh = Math.max(0.08, 1.35 + (fh.atk - fa.def) * 0.055 + 0.25), la = Math.max(0.08, 1.35 + (fa.atk - fh.def) * 0.055)
    const hg = poisson(lh, rng), ag = poisson(la, rng)
    const hev = scoreGoals(H, hg), aev = scoreGoals(A, ag)
    H.gf += hg; H.ga += ag; A.gf += ag; A.ga += hg
    if (hg > ag) { H.pts += 3; H.w++; A.l++ } else if (ag > hg) { A.pts += 3; A.w++; H.l++ } else { H.pts++; A.pts++; H.d++; A.d++ }
    if (lastMatches && r === nr - 1) {
      const goals: Goal[] = [...hev.map(e => ({ ...e, home: true })), ...aev.map(e => ({ ...e, home: false }))].sort((x, y) => x.min - y.min)
      lastMatches.push({ h: H.name, a: A.name, hg, ag, hId: H.teamId, aId: A.teamId, you: !!(H.you || A.you), hum: !!(H.human || A.human), goals })
    }
  }
}
export function sortDiv(teams: SimTeam[]) { return teams.slice().sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf) }

// simula as 4 divisões até a rodada atual — resultado idêntico em todos os aparelhos
export function simulatePyramid(world: Record<Div, SimTeam[]>, seed: number, round: number, tactics: RoundTactics = {}): { tables: Record<Div, SimTeam[]>; scorers: SeasonScorer[]; matches: Record<Div, SimMatch[]> } {
  const scorers = new Map<string, SeasonScorer>()
  const tables = {} as Record<Div, SimTeam[]>
  const matches = {} as Record<Div, SimMatch[]>
  for (const d of DIVS) {
    const teams = world[d].map(t => ({ ...t, xi: t.xi, pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 }))
    const lm: SimMatch[] = []
    simDivTo(teams, d, (seed ^ (d.charCodeAt(0) * 2654435761)) >>> 0, round, scorers, tactics, lm)
    tables[d] = sortDiv(teams)
    matches[d] = lm
  }
  return { tables, scorers: [...scorers.values()].sort((a, b) => b.goals - a.goals).slice(0, 20), matches }
}

// ── VISÃO das 4 divisões (mesmo visual das outras tabelas do jogo) ──
const box = (bg = '#fff'): React.CSSProperties => ({ background: bg, border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 0 ${INK}` })
const zone = (rank: number) => rank <= 4 ? '#D6E9FA' : rank >= 17 ? '#F9D8D3' : undefined
const th: React.CSSProperties = { color: 'rgba(0,0,0,0.7)', fontWeight: 900, fontSize: 10.5 }
function ZoneLegend() {
  const chip = (bg: string, label: string, border = false) => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><i style={{ width: 10, height: 10, borderRadius: 3, display: 'inline-block', background: bg, border: border ? '1px solid rgba(0,0,0,0.2)' : 'none' }} />{label}</span>
  return <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, fontWeight: 700, color: 'rgba(0,0,0,0.6)' }}>{chip('#D6E9FA', 'G4')}{chip('#fff', 'Meio', true)}{chip('#F9D8D3', 'Z4')}</div>
}
function DivTable({ div, teams, colors, mine }: { div: Div; teams: SimTeam[]; colors: Record<number, FCol>; mine?: boolean }) {
  const humans = teams.filter(t => t.human).map(t => ({ name: t.name, teamId: t.teamId, you: t.you }))
  return (
    <div style={{ ...box(mine ? '#FFFBEB' : '#fff'), padding: 12, marginBottom: 12, overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, margin: 0 }}>{DIV_LABEL[div]}{mine ? ' · você' : ''}</p><ZoneLegend />
      </div>
      <DivChips humans={humans} colors={colors} />
      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', marginTop: 6 }}>
        <thead><tr style={{ textAlign: 'left' }}><th style={{ ...th, paddingRight: 4 }}>#</th><th style={th}>Time</th><th style={{ ...th, textAlign: 'center' }}>P</th><th style={{ ...th, textAlign: 'center' }}>V</th><th style={{ ...th, textAlign: 'center' }}>E</th><th style={{ ...th, textAlign: 'center' }}>D</th><th style={{ ...th, textAlign: 'center' }}>SG</th></tr></thead>
        <tbody>
          {teams.map((t, i) => {
            const fc = colors[t.teamId]
            const bg = t.human ? (fc?.light ?? '#eee') : zone(i + 1)
            const nameColor = t.human ? (fc?.solid ?? INK) : INK
            return (
              <tr key={t.name + i} style={{ borderTop: '1px solid rgba(0,0,0,0.1)', background: bg, fontWeight: t.human ? 800 : 500 }}>
                <td style={{ paddingRight: 4 }}>{i + 1}</td>
                <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140, color: nameColor }}>{t.you ? '👤 ' : ''}{t.name}</td>
                <td style={{ textAlign: 'center', fontWeight: 900 }}>{t.pts}</td>
                <td style={{ textAlign: 'center' }}>{t.w}</td><td style={{ textAlign: 'center' }}>{t.d}</td><td style={{ textAlign: 'center' }}>{t.l}</td>
                <td style={{ textAlign: 'center' }}>{t.gf - t.ga}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
export function PyramidTables({ tables, scorers, order, colors, myDiv }: { tables: Record<Div, SimTeam[]>; scorers: SeasonScorer[]; order?: Div[]; colors?: Record<number, FCol>; myDiv?: Div | null }) {
  const cols = colors ?? {}
  return (
    <>
      {(order ?? DIVS).map(d => <DivTable key={d} div={d} teams={tables[d]} colors={cols} mine={d === myDiv} />)}
      <div style={{ ...box('#fff'), padding: 12, marginBottom: 12, overflowX: 'auto' }}>
        <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, marginBottom: 8 }}>⚽ ARTILHARIA · TODAS AS DIVISÕES</p>
        {scorers.length === 0 ? <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.6)', fontWeight: 700 }}>Sem gols ainda. Bola rolando…</p> : (
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead><tr style={{ textAlign: 'left' }}><th style={{ ...th, paddingRight: 4 }}>#</th><th style={th}>Jogador</th><th style={th}>Time</th><th style={{ ...th, textAlign: 'center' }}>Gols</th></tr></thead>
            <tbody>
              {scorers.map((s, i) => {
                const fc = s.human ? cols[s.teamId] : undefined
                return (
                <tr key={s.name + s.teamName + i} style={{ borderTop: '1px solid rgba(0,0,0,0.1)', fontWeight: 600, background: fc?.light }}>
                  <td style={{ paddingRight: 4 }}>{i + 1}</td>
                  <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}><span style={{ display: 'inline-block', fontSize: 8, fontWeight: 800, color: '#fff', background: DIV_TAG[s.div].bg, borderRadius: 4, padding: '0 4px', marginRight: 4, verticalAlign: 'middle' }}>{DIV_TAG[s.div].l}</span>{s.name}</td>
                  <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110, color: fc?.solid ?? 'rgba(0,0,0,0.7)', fontWeight: fc ? 800 : 600 }}>{s.you ? '👤 ' : s.human ? '🔥 ' : ''}{s.teamName}</td>
                  <td style={{ textAlign: 'center', fontWeight: 900 }}>{s.goals}</td>
                </tr>
              )})}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

// onde EU terminei/estou: divisão, posição, campeão
export function myStanding(tables: Record<Div, SimTeam[]>): { div: Div; pos: number; champ: boolean; team: string } | null {
  for (const d of DIVS) {
    const i = tables[d].findIndex(t => t.you)
    if (i >= 0) return { div: d, pos: i + 1, champ: i === 0, team: tables[d][i].name }
  }
  return null
}
const DIV_NAME: Record<Div, string> = { A: 'Série A', B: 'Série B', C: 'Série C', D: 'Série D' }
// ritmo da carreira online: +1s por jogo em relação aos outros modos, pra dar
// tempo de decidir tática/Time A-B durante a partida (~5,7s/rodada). Só aqui.
const ROUND_MS = Math.round(SEASON_TOTAL_MS / 38) + 1000

// CADA usuário (você e amigos) tem UMA cor fixa e ÚNICA: `solid` (nome/chip) +
// `light` (fundo da faixa/linha). Nada de preto — o preto já é dos botões. A cor
// é sorteada pela SEMENTE da sala → a MESMA cor pra cada jogador em todos os
// aparelhos, o jogo inteiro, e persegue ele quando o time sobe/desce (chave = id
// do técnico, que não muda entre temporadas).
export interface FCol { solid: string; light: string }
const PLAYER_PALETTE: FCol[] = [
  { solid: '#8B5E34', light: '#EAD8C4' }, // marrom
  { solid: '#DB2777', light: '#FBD0E4' }, // rosa
  { solid: '#2563EB', light: '#D4E1FC' }, // azul
  { solid: '#16A34A', light: '#CBEFD7' }, // verde
  { solid: '#7C3AED', light: '#E4D6FB' }, // roxo
  { solid: '#EA580C', light: '#FBDBC5' }, // laranja
  { solid: '#0D9488', light: '#C6EDE8' }, // teal
  { solid: '#DC2626', light: '#F7CFCF' }, // vermelho
  { solid: '#C026D3', light: '#F2CDF6' }, // magenta
  { solid: '#0284C7', light: '#C7E5F5' }, // ciano
  { solid: '#65A30D', light: '#DCEFBE' }, // lima
  { solid: '#4F46E5', light: '#D9D7F7' }, // índigo
  { solid: '#E11D48', light: '#F9CFDA' }, // rosa-forte
  { solid: '#0F766E', light: '#C4E7E2' }, // teal-escuro
  { solid: '#B45309', light: '#F1DEBF' }, // âmbar
  { solid: '#9333EA', light: '#E8D6F9' }, // violeta
  { solid: '#059669', light: '#C4EFDC' }, // esmeralda
  { solid: '#BE123C', light: '#F5CBD4' }, // carmim
  { solid: '#1D4ED8', light: '#CFDCF9' }, // azul-real
  { solid: '#A16207', light: '#EFE0BD' }, // ocre
]
// atribui uma cor pra CADA humano (incluindo você). Ordena por id pra ser estável
// e sorteia a paleta pela semente → todos veem a mesma cor pra cada um.
export function playerColors(humanIds: number[], _youId: number, seed: number): Record<number, FCol> {
  const pal = PLAYER_PALETTE.slice()
  const rng = mulberry((seed ^ 0xBADA55) >>> 0)
  for (let i = pal.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1));[pal[i], pal[j]] = [pal[j], pal[i]] }
  const map: Record<number, FCol> = {}
  const ids = humanIds.slice().sort((a, b) => a - b)
  ids.forEach((id, i) => { map[id] = pal[i % pal.length] })
  return map
}
// ordem das divisões: a SUA primeiro, depois a pirâmide de cima pra baixo
function orderedDivs(myDiv: Div | null): Div[] { return myDiv ? [myDiv, ...DIVS.filter(d => d !== myDiv)] : DIVS }
const matchBg = (m: { hId: number; aId: number }, colors: Record<number, FCol>) => colors[m.hId]?.light ?? colors[m.aId]?.light ?? undefined

// chips com os times dos AMIGOS (e você) que estão numa divisão — pra bater o
// olho quem está em qual série. Cada um com a SUA cor (inclusive você).
function DivChips({ humans, colors }: { humans: { name: string; teamId: number; you: boolean }[]; colors: Record<number, FCol> }) {
  if (humans.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
      {humans.map((h, i) => (
        <span key={i} style={{ fontSize: 9.5, fontWeight: 900, ...OSWALD, color: '#fff', background: colors[h.teamId]?.solid ?? '#888', borderRadius: 6, padding: '1px 7px', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.you ? '👤 ' : ''}{h.name}</span>
      ))}
    </div>
  )
}

// ── SEU JOGO em destaque: card grande com o minuto correndo + os gols (nome do
// artilheiro), igual à simulação do modo off-line. ──
function MyMatchCard({ m, youName, finished, col, roundKey }: { m: SimMatch; youName: string; finished?: boolean; col: FCol; roundKey: number }) {
  const [min, setMin] = useState(finished ? 93 : 0)
  useEffect(() => {
    // o relógio só zera/anima quando MUDA A RODADA (roundKey). Trocar a tática na
    // mesma rodada não reinicia o jogo que está na tela — ele não re-simula.
    if (finished) { setMin(93); return }
    setMin(0)
    const step = Math.max(30, (ROUND_MS * 0.82) / 93)
    let cur = 0
    const iv = setInterval(() => { cur++; setMin(cur); if (cur >= 93) clearInterval(iv) }, step)
    return () => clearInterval(iv)
  }, [roundKey, finished])
  const shown = m.goals.filter(g => g.min <= min)
  const hg = shown.filter(g => g.home).length, ag = shown.filter(g => !g.home).length
  const done = min >= 93
  const minLabel = min >= 93 ? 'FIM' : min > 90 ? `90+${min - 90}'` : `${min}'`
  const iAmHome = m.h === youName
  const last = shown.length ? shown[shown.length - 1] : null
  return (
    <div style={{ ...box(col.light), padding: '9px 11px', marginBottom: 10 }}>
      {/* minuto EM CIMA do placar (90' + acréscimos) */}
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <span style={{ fontWeight: 900, fontSize: 12, ...OSWALD, color: done ? GREEN : '#e8503a' }}>{done ? '⏱️ FIM' : `⏱️ ${minLabel}`}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 6 }}>
        <span style={{ textAlign: 'right', fontWeight: 900, fontSize: 12.5, ...OSWALD, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: iAmHome ? col.solid : '#5a5647' }}>{iAmHome ? '👤 ' : ''}{m.h}</span>
        <span style={{ fontWeight: 900, fontSize: 17, ...OSWALD, background: INK, color: '#fff', borderRadius: 6, padding: '1px 10px' }}>{hg}×{ag}</span>
        <span style={{ textAlign: 'left', fontWeight: 900, fontSize: 12.5, ...OSWALD, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: !iAmHome ? col.solid : '#5a5647' }}>{!iAmHome ? '👤 ' : ''}{m.a}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <span style={{ fontSize: 9.5, fontWeight: 800, ...OSWALD, color: 'rgba(0,0,0,0.55)' }}>🎯 sua partida</span>
        <span style={{ fontSize: 10.5, fontWeight: 800, ...OSWALD, color: 'rgba(0,0,0,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '62%' }}>
          {last ? <>⚽ {last.name} <span style={{ opacity: 0.6 }}>{last.min > 90 ? `90+${last.min - 90}'` : `${last.min}'`}</span></> : (done ? 'sem gols' : 'bola rolando…')}
        </span>
      </div>
    </div>
  )
}

// ── os JOGOS de uma divisão (placar + quem fez os gols), cores por amigo ──
function DivMatches({ div, matches, colors, humans, hideId }: { div: Div; matches: SimMatch[]; colors: Record<number, FCol>; humans: { name: string; teamId: number; you: boolean }[]; hideId?: number }) {
  const nameCol = (id: number) => colors[id]?.solid ?? '#5a5647'
  return (
    <div style={{ ...box('#fff'), padding: 9, marginBottom: 8 }}>
      <p style={{ fontWeight: 900, fontSize: 12, ...OSWALD, margin: 0 }}>{DIV_LABEL[div]}</p>
      <DivChips humans={humans} colors={colors} />
      <div style={{ marginTop: 6 }}>
        {matches.map((m, i) => {
          if (hideId != null && (m.hId === hideId || m.aId === hideId)) return null
          const bg = matchBg(m, colors)
          const last = m.goals.length ? m.goals[m.goals.length - 1] : null
          return (
            <div key={i} style={{ padding: '3px 4px', borderTop: i ? '1px solid rgba(0,0,0,0.07)' : 'none', background: bg, borderRadius: bg ? 5 : 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 5 }}>
                <span style={{ textAlign: 'right', fontWeight: bg ? 900 : 600, fontSize: 11.5, ...OSWALD, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: nameCol(m.hId) }}>{m.h}</span>
                <span style={{ fontWeight: 900, fontSize: 12, ...OSWALD, background: bg ? INK : '#eee', color: bg ? '#fff' : INK, borderRadius: 5, padding: '0 7px' }}>{m.hg}×{m.ag}</span>
                <span style={{ textAlign: 'left', fontWeight: bg ? 900 : 600, fontSize: 11.5, ...OSWALD, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: nameCol(m.aId) }}>{m.a}</span>
              </div>
              {last && <p style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(0,0,0,0.55)', margin: '1px 0 0', textAlign: 'center' }}>⚽ {last.name} <span style={{ opacity: 0.7 }}>{last.min > 90 ? `90+${last.min - 90}'` : `${last.min}'`}</span></p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── ELENCO: seu time por posição, com o VALOR (piso) de cada jogador. Os
// melhores de cada posição (pela formação) são os titulares (fundo creme); as
// reservas aparecem AO LADO, na mesma linha de posição. Sem estrela/badge. ──
const POS_LABEL: Record<Sector, string> = { GOL: 'Goleiros', LAT: 'Laterais', ZAG: 'Zagueiros', MEI: 'Meias', ATA: 'Atacantes' }
function PlayerRow({ c, titular, col }: { c: WonCard; titular: boolean; col: FCol }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '4px 7px', borderRadius: 6, background: titular ? '#fff' : 'rgba(255,255,255,0.5)', borderLeft: `3px solid ${titular ? col.solid : 'transparent'}`, marginBottom: 3 }}>
      <span style={{ fontWeight: titular ? 800 : 600, fontSize: 12, ...OSWALD, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: titular ? INK : '#6a6658' }}>{c.name}</span>
      <span style={{ fontWeight: 900, fontSize: 11, ...OSWALD, whiteSpace: 'nowrap', color: '#5a5647', flexShrink: 0 }}>💰 {c.paid ?? 0}</span>
    </div>
  )
}
function SquadTab({ mgr, col, coins }: { mgr: Manager; col: FCol; coins: number }) {
  const need = FORMATIONS[mgr.formation]
  const total = mgr.squad.reduce((s, c) => s + (c.paid ?? 0), 0)
  const hasReserves = SECTORS.some(pos => mgr.squad.filter(c => c.pos === pos).length > need[pos])
  // o elenco herda a COR do jogador (a mesma sorteada pra ele no jogo todo)
  return (
    <div style={{ ...box(col.light), padding: 12, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <p style={{ fontWeight: 900, fontSize: 14, ...OSWALD, margin: 0, color: col.solid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>👥 {mgr.teamName}</p>
        <span style={{ fontWeight: 900, fontSize: 11.5, ...OSWALD, background: col.solid, color: '#fff', border: `2px solid ${INK}`, borderRadius: 8, padding: '2px 8px', whiteSpace: 'nowrap' }}>{mgr.squad.length}/22 · 💰 {total}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, background: 'rgba(255,255,255,0.6)', border: `2px solid ${col.solid}`, borderRadius: 8, padding: '4px 8px' }}>
        <span style={{ fontWeight: 900, fontSize: 12, ...OSWALD, color: INK }}>🪙 Caixa: {coins}</span>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: '#5a5647' }}>· moedas pra reforços (mercado em breve)</span>
      </div>
      {hasReserves && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
          <p style={{ flex: 1, fontWeight: 900, fontSize: 9.5, ...OSWALD, color: col.solid, margin: 0, textTransform: 'uppercase', letterSpacing: 0.3 }}>Titulares</p>
          <p style={{ flex: 1, fontWeight: 900, fontSize: 9.5, ...OSWALD, color: 'rgba(0,0,0,0.45)', margin: 0, textTransform: 'uppercase', letterSpacing: 0.3 }}>Reservas</p>
        </div>
      )}
      {SECTORS.map(pos => {
        const players = mgr.squad.filter(c => c.pos === pos).sort((a, b) => mid(b) - mid(a))
        const titulars = players.slice(0, need[pos])
        const reserves = players.slice(need[pos])
        return (
          <div key={pos} style={{ marginBottom: 8 }}>
            <p style={{ fontWeight: 900, fontSize: 10, ...OSWALD, color: col.solid, opacity: 0.85, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: 0.3 }}>{POS_LABEL[pos]}</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>{titulars.map(c => <PlayerRow key={c.id} c={c} titular col={col} />)}</div>
              {reserves.length > 0 && <div style={{ flex: 1, minWidth: 0 }}>{reserves.map(c => <PlayerRow key={c.id} c={c} titular={false} col={col} />)}</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── RANKING GERAL: TODOS os times do jogo (amigos + CPUs), ordenados por
// TÍTULOS (Série A → B → C → D) e depois DINHEIRO, com desempate em cascata. ──
type Honors = { A: number; B: number; C: number; D: number }
const EMPTY_HONORS: Honors = { A: 0, B: 0, C: 0, D: 0 }
function RankingTab({ tables, honors, coins, colors, youId }: { tables: Record<Div, SimTeam[]>; honors: Record<string, Honors>; coins: Record<number, number>; colors: Record<number, FCol>; youId: number }) {
  const rows = DIVS.flatMap(d => tables[d]).map(t => {
    const key = teamKey(t)
    return { t, key, h: honors[key] ?? EMPTY_HONORS, money: t.teamId >= 0 ? (coins[t.teamId] ?? 0) : 0 }
  })
  rows.sort((a, b) => b.h.A - a.h.A || b.h.B - a.h.B || b.h.C - a.h.C || b.h.D - a.h.D || b.money - a.money || a.t.name.localeCompare(b.t.name))
  return (
    <div style={{ ...box('#fff'), padding: 12, marginBottom: 12, overflowX: 'auto' }}>
      <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, margin: '0 0 2px' }}>🏆 RANKING GERAL</p>
      <p style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(0,0,0,0.5)', margin: '0 0 8px' }}>Títulos (Série A › B › C › D) e depois dinheiro — todos os times.</p>
      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
        <thead><tr style={{ textAlign: 'left' }}><th style={{ ...th, paddingRight: 4 }}>#</th><th style={th}>Time</th><th style={{ ...th, textAlign: 'center' }}>Títulos</th><th style={{ ...th, textAlign: 'right' }}>💰</th></tr></thead>
        <tbody>
          {rows.map((r, i) => {
            const you = r.t.teamId === youId && r.t.teamId >= 0
            const fc = r.t.human ? colors[r.t.teamId] : undefined
            return (
              <tr key={r.key} style={{ borderTop: '1px solid rgba(0,0,0,0.08)', background: fc?.light, fontWeight: r.t.human ? 800 : 500 }}>
                <td style={{ paddingRight: 4, color: 'rgba(0,0,0,0.5)' }}>{i + 1}</td>
                <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140, color: fc?.solid ?? INK }}>{you ? '👤 ' : r.t.human ? '🔥 ' : ''}{r.t.name}</td>
                <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                  {(r.h.A + r.h.B + r.h.C + r.h.D) === 0 ? <span style={{ opacity: 0.3 }}>—</span> : (['A', 'B', 'C', 'D'] as Div[]).map(d => r.h[d] > 0 ? (
                    <span key={d} style={{ display: 'inline-block', fontSize: 9, fontWeight: 900, color: '#fff', background: DIV_TAG[d].bg, borderRadius: 4, padding: '0 4px', marginLeft: 2 }}>🏆{DIV_TAG[d].l}{r.h[d]}</span>
                  ) : null)}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 900, whiteSpace: 'nowrap', color: '#5a5647' }}>{r.money}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── TELA da temporada simulada da carreira online (toma o lugar da temporada
// ao vivo). O host conduz o ritmo (PLAY_ROUND avança a rodada, já sincronizado);
// os clientes seguem a rodada do estado. Tudo determinístico → mesma tabela. ──
export function PyramidSeasonScreen() {
  const { state, dispatch } = useEsc()
  const round = state.round
  const done = round >= 38
  const [tab, setTab] = useState<'jogos' | 'tabelas' | 'elenco' | 'ranking'>('jogos')
  const world = useMemo(() => buildPyramid(state.managers, state.managers[state.youIdx]?.id ?? 0, state.seed, state.deckLeague, state.careerPlacements), [state.seed, state.managers.length, state.deckLeague, state.careerPlacements, state.seasonNo])
  const careerTactics = (state.careerTactics ?? {}) as RoundTactics
  const { tables, scorers, matches } = useMemo(() => simulatePyramid(world, state.seed, round, careerTactics), [world, state.seed, round, careerTactics])
  const me = myStanding(tables)
  const hasMatches = round >= 1 && matches.D.length > 0
  const youId = state.managers[state.youIdx]?.id ?? 0
  const myTactic = tacAt(careerTactics, youId, round) // tática que vale do PRÓXIMO jogo em diante
  const humanKey = state.managers.filter(m => m.isHuman).map(m => m.id).join(',')
  const colors = useMemo(() => playerColors(humanKey ? humanKey.split(',').map(Number) : [], youId, state.seed), [humanKey, youId, state.seed])
  const myCol = colors[youId] ?? PLAYER_PALETTE[0]
  const myDiv = me?.div ?? null
  const ord = orderedDivs(myDiv)
  const myMatch = myDiv ? matches[myDiv]?.find(x => x.you) : undefined
  const humansOf = (d: Div) => tables[d].filter(t => t.human).map(t => ({ name: t.name, teamId: t.teamId, you: t.you }))

  // host conduz: avança a rodada a cada ~1,4s (isso sincroniza pra todos)
  useEffect(() => {
    if (!state.isHost || done) return
    const t = setTimeout(() => dispatch({ type: 'PLAY_ROUND' }), ROUND_MS)
    return () => clearTimeout(t)
  }, [round, state.isHost, done, dispatch])

  return (
    <div style={{ minHeight: '100vh', background: '#F4ECD6', color: INK }}>
      <div className="max-w-xl mx-auto" style={{ padding: '16px 14px 48px' }}>
        <div style={{ ...box(INK), padding: 12, color: '#fff', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 900, fontSize: 15, ...OSWALD }}>🪜 TEMP. {state.seasonNo} · {done ? 'encerrada' : round === 0 ? 'começando…' : `rodada ${round}/38`}</span>
          {!done && <span style={{ fontSize: 10.5, fontWeight: 700, color: '#ff5b4d', display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: '#ff5b4d', display: 'inline-block' }} /> AO VIVO</span>}
        </div>

        {me && (
          <div style={{ ...box(me.champ && done ? GOLD : '#fff'), padding: 12, marginBottom: 12, textAlign: 'center' }}>
            {done
              ? (me.champ
                ? <p style={{ fontWeight: 900, fontSize: 17, ...OSWALD, margin: 0 }}>🏆 CAMPEÃO DA {DIV_NAME[me.div].toUpperCase()}!</p>
                : <p style={{ fontWeight: 900, fontSize: 15, ...OSWALD, margin: 0 }}>🏁 {me.team} — {me.pos}º na {DIV_NAME[me.div]}</p>)
              : <p style={{ fontWeight: 900, fontSize: 14, ...OSWALD, margin: 0 }}>👤 {me.team} · {me.pos}º na {DIV_NAME[me.div]}</p>}
          </div>
        )}

        {done && me?.champ && state.roomId && (
          <div style={{ marginBottom: 12 }}>
            <CardCollectPrompt you={state.managers[state.youIdx]} seasonKey={`co:${state.roomCode}:${state.seasonNo}`} origin="online" />
          </div>
        )}
        {done && (
          state.isHost ? (
            <div style={{ ...box('#EAF3FF'), padding: 13, marginBottom: 12 }}>
              <p style={{ fontWeight: 900, fontSize: 13.5, ...OSWALD, margin: '0 0 3px' }}>👑 Você é o host — próxima temporada</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#5a5647', marginBottom: 10 }}>Acessos e quedas (por nome exato) já entram. Escolha: seguir com o mesmo elenco, ou refazer o leilão (orçamento parelho pra todos).</p>
              <button onClick={() => dispatch({ type: 'NEXT_SEASON_ONLINE', placements: computePromotions(tables), rewards: seasonRewards(tables), champions: seasonChampions(tables) })}
                style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 13, fontWeight: 900, fontSize: 15, background: GREEN, color: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD, marginBottom: 9 }}>
                ▶️ Mesmo time
              </button>
              <button onClick={() => dispatch({ type: 'REAUCTION_ONLINE', placements: computePromotions(tables), rewards: seasonRewards(tables), champions: seasonChampions(tables) })}
                style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 13, fontWeight: 900, fontSize: 15, background: GOLD, color: INK, boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD }}>
                🔨 Novo leilão
              </button>
            </div>
          ) : (
            <div style={{ ...box('#EAF3FF'), padding: 11, textAlign: 'center', marginBottom: 12 }}>
              <p style={{ fontWeight: 800, fontSize: 12, color: '#3a5a8a', margin: 0 }}>⏱️ Aguardando o host começar a próxima temporada…</p>
            </div>
          )
        )}

        {/* toggle: os jogos (placares) ↔ as tabelas + artilharia */}
        <div style={{ display: 'flex', border: `3px solid ${INK}`, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
          {([['jogos', '🗓️ Jogos'], ['tabelas', '📊 Tabelas'], ['elenco', '👥 Elenco'], ['ranking', '🏆 Rank']] as [typeof tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '9px 2px', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', background: tab === t ? INK : '#fff', color: tab === t ? '#fff' : INK, border: 'none', cursor: 'pointer', ...OSWALD }}>{label}</button>
          ))}
        </div>

        {tab === 'ranking' ? (
          <RankingTab tables={tables} honors={(state.careerHonors ?? {}) as Record<string, Honors>} coins={state.careerCoins ?? {}} colors={colors} youId={youId} />
        ) : tab === 'elenco' ? (
          <>
            {/* tática do SEU time — POR JOGO, vale do PRÓXIMO jogo em diante. Agora
                fica AQUI no topo do elenco (era na aba Jogos). */}
            {!done && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 6 }}>
                  {([['retranca', '🧱 Retranca'], ['equilibrio', '⚖️ Equilíbrio'], ['ataque', '🔥 Ataque']] as [Tac, string][]).map(([t, label]) => (
                    <button key={t} onClick={() => dispatch({ type: 'SET_TACTIC', mgrId: youId, tactic: t })}
                      style={{ border: `3px solid ${INK}`, borderRadius: 12, padding: '9px 0', fontWeight: 900, fontSize: 12, ...OSWALD, background: myTactic === t ? GOLD : '#fff', color: INK, boxShadow: myTactic === t ? `3px 3px 0 0 ${INK}` : 'none', cursor: 'pointer' }}>
                      {label}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 9.5, fontWeight: 700, color: '#5a5647', textAlign: 'center', marginBottom: 10 }}>Vale do próximo jogo em diante — o jogo que está rolando não muda. Ataque faz e toma mais · retranca segura mais · equilíbrio no meio.</p>
              </>
            )}
            <SquadTab mgr={state.managers[state.youIdx]} col={myCol} coins={state.careerCoins?.[youId] ?? 0} />
          </>
        ) : tab === 'jogos' && hasMatches ? (
          <>
            {myMatch && me && <MyMatchCard m={myMatch} youName={me.team} finished={done} col={myCol} roundKey={round} />}
            {ord.map(d => <DivMatches key={d} div={d} matches={matches[d]} colors={colors} humans={humansOf(d)} hideId={d === myDiv ? youId : undefined} />)}
          </>
        ) : (
          <PyramidTables tables={tables} scorers={scorers} order={ord} colors={colors} myDiv={myDiv} />
        )}

        <button onClick={() => dispatch({ type: 'GO_LOBBY_ONLINE' })} className="text-black/40 text-xs font-semibold underline" style={{ display: 'block', margin: '8px auto 0', background: 'none', border: 'none', cursor: 'pointer', ...OSWALD }}>sair do jogo</button>
      </div>
    </div>
  )
}

export { DIV_LABEL, GREEN, INK, GOLD, OSWALD, box }
