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
import { SECTORS } from './types'
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
export interface SeasonScorer { name: string; teamName: string; div: Div; goals: number; you: boolean; human: boolean }

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

export interface SimMatch { h: string; a: string; hg: number; ag: number; you: boolean; hum: boolean }

// joga UMA divisão até a rodada `round` (determinístico), acumulando artilharia.
// `lastMatches` recebe os jogos da ÚLTIMA rodada jogada (com placar) pra exibir.
function simDivTo(teams: SimTeam[], div: Div, seed: number, round: number, scorers: Map<string, SeasonScorer>, lastMatches?: SimMatch[]) {
  const rng = mulberry((seed ^ 0x51ED2C) >>> 0)
  const fix = roundRobin(20)
  const credit = (t: SimTeam, goals: number) => {
    for (let g = 0; g < goals; g++) {
      const pool = t.xi.map(c => ({ c, w: c.pos === 'ATA' ? 6 : c.pos === 'MEI' ? 3 : c.pos === 'LAT' ? 1 : c.pos === 'ZAG' ? 0.4 : 0.05 }))
      const total = pool.reduce((s, p) => s + p.w, 0)
      let r = rng() * total, pick = pool[0].c
      for (const p of pool) { r -= p.w; if (r <= 0) { pick = p.c; break } }
      const key = `${t.name}:${pick.id}`, row = scorers.get(key)
      if (row) row.goals++; else scorers.set(key, { name: pick.name, teamName: t.name, div, goals: 1, you: t.you, human: t.human })
    }
  }
  const nr = Math.min(round, 38)
  for (let r = 0; r < nr; r++) for (const [hi, ai] of fix[r]) {
    const H = teams[hi], A = teams[ai]
    const th: Tac = H.you || H.human ? 'equilibrio' : TACS[Math.floor(rng() * 3)]
    const ta: Tac = A.you || A.human ? 'equilibrio' : TACS[Math.floor(rng() * 3)]
    const fh = rollForm(H.xi, th, ta, rng), fa = rollForm(A.xi, ta, th, rng)
    const lh = Math.max(0.08, 1.35 + (fh.atk - fa.def) * 0.055 + 0.25), la = Math.max(0.08, 1.35 + (fa.atk - fh.def) * 0.055)
    const hg = poisson(lh, rng), ag = poisson(la, rng)
    H.gf += hg; H.ga += ag; A.gf += ag; A.ga += hg; credit(H, hg); credit(A, ag)
    if (hg > ag) { H.pts += 3; H.w++; A.l++ } else if (ag > hg) { A.pts += 3; A.w++; H.l++ } else { H.pts++; A.pts++; H.d++; A.d++ }
    if (lastMatches && r === nr - 1) lastMatches.push({ h: H.name, a: A.name, hg, ag, you: !!(H.you || A.you), hum: !!(H.human || A.human) })
  }
}
export function sortDiv(teams: SimTeam[]) { return teams.slice().sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf) }

// simula as 4 divisões até a rodada atual — resultado idêntico em todos os aparelhos
export function simulatePyramid(world: Record<Div, SimTeam[]>, seed: number, round: number): { tables: Record<Div, SimTeam[]>; scorers: SeasonScorer[]; matches: Record<Div, SimMatch[]> } {
  const scorers = new Map<string, SeasonScorer>()
  const tables = {} as Record<Div, SimTeam[]>
  const matches = {} as Record<Div, SimMatch[]>
  for (const d of DIVS) {
    const teams = world[d].map(t => ({ ...t, xi: t.xi, pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 }))
    const lm: SimMatch[] = []
    simDivTo(teams, d, (seed ^ (d.charCodeAt(0) * 2654435761)) >>> 0, round, scorers, lm)
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
function DivTable({ div, teams }: { div: Div; teams: SimTeam[] }) {
  return (
    <div style={{ ...box('#fff'), padding: 12, marginBottom: 12, overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, margin: 0 }}>{DIV_LABEL[div]}</p><ZoneLegend />
      </div>
      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
        <thead><tr style={{ textAlign: 'left' }}><th style={{ ...th, paddingRight: 4 }}>#</th><th style={th}>Time</th><th style={{ ...th, textAlign: 'center' }}>P</th><th style={{ ...th, textAlign: 'center' }}>V</th><th style={{ ...th, textAlign: 'center' }}>E</th><th style={{ ...th, textAlign: 'center' }}>D</th><th style={{ ...th, textAlign: 'center' }}>SG</th></tr></thead>
        <tbody>
          {teams.map((t, i) => {
            const other = t.human && !t.you
            return (
              <tr key={t.name + i} style={{ borderTop: '1px solid rgba(0,0,0,0.1)', background: t.you ? GOLD : other ? '#FFE0D6' : zone(i + 1), fontWeight: (t.you || other) ? 800 : 500 }}>
                <td style={{ paddingRight: 4 }}>{i + 1}</td>
                <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{t.you ? '👤 ' : other ? '🔥 ' : ''}{t.name}</td>
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
export function PyramidTables({ tables, scorers }: { tables: Record<Div, SimTeam[]>; scorers: SeasonScorer[] }) {
  return (
    <>
      {DIVS.map(d => <DivTable key={d} div={d} teams={tables[d]} />)}
      <div style={{ ...box('#fff'), padding: 12, marginBottom: 12, overflowX: 'auto' }}>
        <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, marginBottom: 8 }}>⚽ ARTILHARIA · TODAS AS DIVISÕES</p>
        {scorers.length === 0 ? <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.6)', fontWeight: 700 }}>Sem gols ainda. Bola rolando…</p> : (
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead><tr style={{ textAlign: 'left' }}><th style={{ ...th, paddingRight: 4 }}>#</th><th style={th}>Jogador</th><th style={th}>Time</th><th style={{ ...th, textAlign: 'center' }}>Gols</th></tr></thead>
            <tbody>
              {scorers.map((s, i) => (
                <tr key={s.name + s.teamName + i} style={{ borderTop: '1px solid rgba(0,0,0,0.1)', fontWeight: 600, background: s.you ? GOLD : s.human ? '#FFE0D6' : undefined }}>
                  <td style={{ paddingRight: 4 }}>{i + 1}</td>
                  <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}><span style={{ display: 'inline-block', fontSize: 8, fontWeight: 800, color: '#fff', background: DIV_TAG[s.div].bg, borderRadius: 4, padding: '0 4px', marginRight: 4, verticalAlign: 'middle' }}>{DIV_TAG[s.div].l}</span>{s.name}</td>
                  <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110, color: 'rgba(0,0,0,0.7)' }}>{s.you ? '👤 ' : s.human ? '🔥 ' : ''}{s.teamName}</td>
                  <td style={{ textAlign: 'center', fontWeight: 900 }}>{s.goals}</td>
                </tr>
              ))}
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
const ROUND_MS = Math.round(SEASON_TOTAL_MS / 38) // MESMO ritmo dos outros modos (~4,7s/rodada, temporada ~3 min)

// ── os JOGOS da rodada (com placar) nas 4 divisões — igual à simulação dos
// outros modos: você em dourado, amigos com 🔥. ──
function RoundMatches({ matches, round }: { matches: Record<Div, SimMatch[]>; round: number }) {
  return (
    <>
      <div style={{ ...box(INK), padding: 10, color: '#fff', marginBottom: 10, textAlign: 'center' }}>
        <p style={{ fontWeight: 900, fontSize: 14, ...OSWALD, margin: 0 }}>🗓️ Rodada {round} · os jogos</p>
      </div>
      {DIVS.map(d => (
        <div key={d} style={{ ...box('#fff'), padding: 9, marginBottom: 8 }}>
          <p style={{ fontWeight: 900, fontSize: 12, ...OSWALD, marginBottom: 5 }}>{DIV_LABEL[d]}</p>
          {matches[d].map((m, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 5, padding: '2.5px 2px', borderTop: i ? '1px solid rgba(0,0,0,0.07)' : 'none', background: m.you ? GOLD : m.hum ? '#FFE0D6' : undefined, borderRadius: (m.you || m.hum) ? 5 : 0 }}>
              <span style={{ textAlign: 'right', fontWeight: (m.you || m.hum) ? 900 : 600, fontSize: 11.5, ...OSWALD, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.h}</span>
              <span style={{ fontWeight: 900, fontSize: 12, ...OSWALD, background: (m.you || m.hum) ? INK : '#eee', color: (m.you || m.hum) ? '#fff' : INK, borderRadius: 5, padding: '0 7px' }}>{m.hg}×{m.ag}</span>
              <span style={{ textAlign: 'left', fontWeight: (m.you || m.hum) ? 900 : 600, fontSize: 11.5, ...OSWALD, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#5a5647' }}>{m.a}</span>
            </div>
          ))}
        </div>
      ))}
    </>
  )
}

// ── TELA da temporada simulada da carreira online (toma o lugar da temporada
// ao vivo). O host conduz o ritmo (PLAY_ROUND avança a rodada, já sincronizado);
// os clientes seguem a rodada do estado. Tudo determinístico → mesma tabela. ──
export function PyramidSeasonScreen() {
  const { state, dispatch } = useEsc()
  const round = state.round
  const done = round >= 38
  const [tab, setTab] = useState<'jogos' | 'tabelas'>('jogos')
  const world = useMemo(() => buildPyramid(state.managers, state.managers[state.youIdx]?.id ?? 0, state.seed, state.deckLeague, state.careerPlacements), [state.seed, state.managers.length, state.deckLeague, state.careerPlacements, state.seasonNo])
  const { tables, scorers, matches } = useMemo(() => simulatePyramid(world, state.seed, round), [world, state.seed, round])
  const me = myStanding(tables)
  const hasMatches = round >= 1 && matches.D.length > 0

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
            <CardCollectPrompt you={state.managers[state.youIdx]} seasonKey={`careeronline:${state.roomId}:${state.seasonNo}`} origin="online" />
          </div>
        )}
        {done && (
          state.isHost ? (
            <div style={{ ...box('#EAF3FF'), padding: 13, marginBottom: 12 }}>
              <p style={{ fontWeight: 900, fontSize: 13.5, ...OSWALD, margin: '0 0 3px' }}>👑 Você é o host — próxima temporada</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#5a5647', marginBottom: 10 }}>Acessos e quedas (por nome exato) já entram. Escolha: seguir com o mesmo elenco, ou refazer o leilão (orçamento parelho pra todos).</p>
              <button onClick={() => dispatch({ type: 'NEXT_SEASON_ONLINE', placements: computePromotions(tables) })}
                style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 13, fontWeight: 900, fontSize: 15, background: GREEN, color: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD, marginBottom: 9 }}>
                ▶️ Mesmo time
              </button>
              <button onClick={() => dispatch({ type: 'REAUCTION_ONLINE', placements: computePromotions(tables) })}
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

        <p style={{ fontSize: 11, fontWeight: 700, color: '#5a5647', textAlign: 'center', marginBottom: 10 }}>🟡 Você · 🔥 Amigos · 🔵 Acesso (G4) · 🔴 Queda (Z4)</p>

        {/* toggle: os jogos (placares) ↔ as tabelas + artilharia */}
        <div style={{ display: 'flex', border: `3px solid ${INK}`, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
          {([['jogos', '🗓️ Jogos'], ['tabelas', '📊 Tabelas']] as [typeof tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '9px 0', fontWeight: 900, fontSize: 13, textTransform: 'uppercase', background: tab === t ? INK : '#fff', color: tab === t ? '#fff' : INK, border: 'none', cursor: 'pointer', ...OSWALD }}>{label}</button>
          ))}
        </div>

        {tab === 'jogos' && hasMatches ? <RoundMatches matches={matches} round={round} /> : <PyramidTables tables={tables} scorers={scorers} />}

        <button onClick={() => dispatch({ type: 'GO_LOBBY_ONLINE' })} className="text-black/40 text-xs font-semibold underline" style={{ display: 'block', margin: '8px auto 0', background: 'none', border: 'none', cursor: 'pointer', ...OSWALD }}>sair do jogo</button>
      </div>
    </div>
  )
}

export { DIV_LABEL, GREEN, INK, GOLD, OSWALD, box }
