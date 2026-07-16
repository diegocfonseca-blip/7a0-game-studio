// ─── CARREIRA ONLINE · VISÃO DAS 4 DIVISÕES ──────────────────────────────
// A Série D é a SUA liga real (motor de verdade, elencos do leilão). As outras
// três (A/B/C, sem amigos na temporada 1) rolam por CPU de forma DETERMINÍSTICA
// pelo código da sala — todos os aparelhos chegam na mesma tabela sem precisar
// mandar resultado por resultado. Aqui é só a VISÃO; não muda o motor.

import { DIVISION_TEAMS, CATALOG, CATALOG_EU, CATALOG_BOTH } from './data'
import { sortedTable } from './store'
import type { LeagueTeam, ScorerRow, Manager } from './types'

const CREAM = '#F4ECD6'
const INK = '#0C0C0C'
const GOLD = '#FFC400'
const GREEN = '#1B7A3D'
const OSWALD = { fontFamily: 'Oswald, sans-serif' } as const

type Div = 'A' | 'B' | 'C'
const CPU_DIVS: Div[] = ['A', 'B', 'C']
const DIV_LABEL: Record<'A' | 'B' | 'C' | 'D', string> = { A: '🏆 Série A', B: '🥈 Série B', C: '🥉 Série C', D: 'Série D' }
const DIV_BASE: Record<'A' | 'B' | 'C' | 'D', number> = { A: 80, B: 71, C: 63, D: 55 }
const DIV_TAG: Record<'A' | 'B' | 'C' | 'D', { l: string; bg: string }> = { A: { l: 'A', bg: '#B8892B' }, B: { l: 'B', bg: '#3E8E4E' }, C: { l: 'C', bg: '#9A7B33' }, D: { l: 'D', bg: '#7A7460' } }

interface Sim { name: string; str: number; w: number; d: number; l: number; gf: number; ga: number; pts: number }

function mulberry(seed: number) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function poisson(lambda: number, rng: () => number) { const L = Math.exp(-lambda); let k = 0, p = 1; do { k++; p *= rng() } while (p > L); return k - 1 }
function hashCode(str: string): number { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }

// tabela de rodadas (returno duplo, método do círculo) — 20 times = 38 rodadas
function roundRobin(n: number): number[][][] {
  const idx = [...Array(n).keys()]
  const turno: number[][][] = []
  for (let r = 0; r < n - 1; r++) {
    const pairs: number[][] = []
    for (let i = 0; i < n / 2; i++) { const h = idx[i], a = idx[n - 1 - i]; pairs.push(r % 2 ? [a, h] : [h, a]) }
    turno.push(pairs)
    idx.splice(1, 0, idx.pop() as number)
  }
  return [...turno, ...turno.map(rd => rd.map(([h, a]) => [a, h]))]
}

// simula uma divisão de CPU até a rodada `round` (determinístico pela semente)
function simDivTo(seed: number, div: Div, round: number): Sim[] {
  const rng = mulberry(seed)
  const teams: Sim[] = DIVISION_TEAMS[div].slice(0, 20).map(t => ({ name: t.team, str: DIV_BASE[div] + Math.round((rng() - 0.5) * 14), w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }))
  const fix = roundRobin(20)
  for (let r = 0; r < Math.min(round, 38); r++) {
    const rr = mulberry((seed ^ (r * 2654435761)) >>> 0)
    for (const [hi, ai] of fix[r]) {
      const H = teams[hi], A = teams[ai]
      const diff = (H.str - A.str) / 22
      const gh = poisson(Math.max(0.15, 1.45 + diff + 0.25), rr)
      const ga = poisson(Math.max(0.15, 1.15 - diff), rr)
      H.gf += gh; H.ga += ga; A.gf += ga; A.ga += gh
      if (gh > ga) { H.w++; H.pts += 3; A.l++ } else if (gh < ga) { A.w++; A.pts += 3; H.l++ } else { H.d++; A.d++; H.pts++; A.pts++ }
    }
  }
  return teams
}
function sortSim(ts: Sim[]) { return [...ts].sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf) }

// artilheiros das divisões de CPU (nomes do baralho, gols ~ proporção dos gols do time)
interface Goal { name: string; team: string; div: 'A' | 'B' | 'C' | 'D'; goals: number }
function cpuScorers(seed: number, div: Div, teams: Sim[], deck: 'br' | 'eu' | 'both'): Goal[] {
  const cat = deck === 'eu' ? CATALOG_EU : deck === 'both' ? CATALOG_BOTH : CATALOG
  const pool = [...cat.ATA, ...cat.MEI].map(c => c.name)
  const rng = mulberry((seed ^ 0x51ED2C) >>> 0)
  const sh = pool.slice()
  for (let i = sh.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1));[sh[i], sh[j]] = [sh[j], sh[i]] }
  let pi = 0
  const rows: Goal[] = []
  for (const t of teams) {
    const g1 = Math.round(t.gf * (0.26 + rng() * 0.12))
    if (g1 > 0) rows.push({ name: sh[pi++ % sh.length], team: t.name, div, goals: g1 })
  }
  return rows
}

const box = (bg = '#fff'): React.CSSProperties => ({ background: bg, border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 0 ${INK}` })
const zone = (rank: number) => rank <= 4 ? '#D6E9FA' : rank >= 17 ? '#F9D8D3' : undefined
const th: React.CSSProperties = { color: 'rgba(0,0,0,0.7)', fontWeight: 900, fontSize: 10.5 }

function ZoneLegend() {
  const chip = (bg: string, label: string, border = false) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <i style={{ width: 10, height: 10, borderRadius: 3, display: 'inline-block', background: bg, border: border ? '1px solid rgba(0,0,0,0.2)' : 'none' }} />{label}
    </span>
  )
  return <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, fontWeight: 700, color: 'rgba(0,0,0,0.6)' }}>{chip('#D6E9FA', 'G4')}{chip('#fff', 'Meio', true)}{chip('#F9D8D3', 'Z4')}</div>
}

// tabela de uma divisão de CPU (sim)
function CpuTable({ div, teams }: { div: Div; teams: Sim[] }) {
  const sorted = sortSim(teams)
  return (
    <div style={{ ...box('#fff'), padding: 12, marginBottom: 12, overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, margin: 0 }}>{DIV_LABEL[div]}</p><ZoneLegend />
      </div>
      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
        <thead><tr style={{ textAlign: 'left' }}><th style={{ ...th, paddingRight: 4 }}>#</th><th style={th}>Time</th><th style={{ ...th, textAlign: 'center' }}>P</th><th style={{ ...th, textAlign: 'center' }}>V</th><th style={{ ...th, textAlign: 'center' }}>E</th><th style={{ ...th, textAlign: 'center' }}>D</th><th style={{ ...th, textAlign: 'center' }}>SG</th></tr></thead>
        <tbody>
          {sorted.map((t, i) => (
            <tr key={t.name + i} style={{ borderTop: '1px solid rgba(0,0,0,0.1)', background: zone(i + 1), fontWeight: 500 }}>
              <td style={{ paddingRight: 4 }}>{i + 1}</td>
              <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{t.name}</td>
              <td style={{ textAlign: 'center', fontWeight: 900 }}>{t.pts}</td>
              <td style={{ textAlign: 'center' }}>{t.w}</td><td style={{ textAlign: 'center' }}>{t.d}</td><td style={{ textAlign: 'center' }}>{t.l}</td>
              <td style={{ textAlign: 'center' }}>{t.gf - t.ga}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// tabela da Série D REAL (motor de verdade) — você em dourado, amigos com 🔥
function RealTable({ league, managers, youId }: { league: LeagueTeam[]; managers: Manager[]; youId: number }) {
  const sorted = sortedTable(league)
  const humanIds = new Set(managers.filter(m => m.isHuman).map(m => m.id))
  return (
    <div style={{ ...box('#fff'), padding: 12, marginBottom: 12, overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, margin: 0 }}>{DIV_LABEL.D} <span style={{ fontSize: 10, color: GREEN }}>· ao vivo</span></p><ZoneLegend />
      </div>
      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
        <thead><tr style={{ textAlign: 'left' }}><th style={{ ...th, paddingRight: 4 }}>#</th><th style={th}>Time</th><th style={{ ...th, textAlign: 'center' }}>P</th><th style={{ ...th, textAlign: 'center' }}>V</th><th style={{ ...th, textAlign: 'center' }}>E</th><th style={{ ...th, textAlign: 'center' }}>D</th><th style={{ ...th, textAlign: 'center' }}>SG</th></tr></thead>
        <tbody>
          {sorted.map((t, i) => {
            const you = t.id === youId
            const other = !you && humanIds.has(t.id)
            return (
              <tr key={t.id} style={{ borderTop: '1px solid rgba(0,0,0,0.1)', background: you ? GOLD : other ? '#FFE0D6' : zone(i + 1), fontWeight: (you || other) ? 800 : 500 }}>
                <td style={{ paddingRight: 4 }}>{i + 1}</td>
                <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{you ? '👤 ' : other ? '🔥 ' : ''}{t.name}</td>
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

// overlay com as 4 divisões + artilharia geral. Fecha voltando pra temporada.
export function PyramidOverlay({ league, scorers, managers, youId, seed, round, deckLeague, onClose }: {
  league: LeagueTeam[]; scorers: ScorerRow[]; managers: Manager[]; youId: number; seed: number; round: number; deckLeague: 'br' | 'eu' | 'both'; onClose: () => void
}) {
  // simula A/B/C determinístico (semente por divisão, derivada do código da sala)
  const cpu: Record<Div, Sim[]> = { A: simDivTo(seed ^ hashCode('A'), 'A', round), B: simDivTo(seed ^ hashCode('B'), 'B', round), C: simDivTo(seed ^ hashCode('C'), 'C', round) }
  // artilharia geral: D real + A/B/C simulados
  const humanIds = new Set(managers.filter(m => m.isHuman).map(m => m.id))
  const dGoals: Goal[] = scorers.map(s => ({ name: s.name, team: s.teamName, div: 'D' as const, goals: s.goals }))
  const cpuG: Goal[] = CPU_DIVS.flatMap(d => cpuScorers((seed ^ hashCode(d)) >>> 0, d, cpu[d], deckLeague))
  const merged = [...dGoals, ...cpuG].sort((a, b) => b.goals - a.goals).slice(0, 20)
  // pra marcar você/amigo na artilharia da D
  const scorerTeamHuman = (g: Goal) => {
    if (g.div !== 'D') return { you: false, hum: false }
    const t = league.find(x => x.name === g.team)
    if (!t) return { you: false, hum: false }
    return { you: t.id === youId, hum: t.id !== youId && humanIds.has(t.id) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: CREAM, color: INK, zIndex: 9500, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div className="max-w-xl mx-auto" style={{ padding: '18px 16px 64px' }}>
        <div style={{ ...box(INK), padding: 12, color: '#fff', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 900, fontSize: 15, ...OSWALD }}>🪜 AS 4 DIVISÕES · rodada {Math.min(round + 1, 38)}/38</span>
          <button onClick={onClose} className="font-black text-sm active:opacity-60" style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer', ...OSWALD }}>Fechar ✕</button>
        </div>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#5a5647', textAlign: 'center', marginBottom: 12 }}>🟡 Você · 🔥 Amigos · 🔵 Acesso (G4) · 🔴 Queda (Z4). A Série D é a sua liga ao vivo; A/B/C rolam por CPU.</p>

        <CpuTable div="A" teams={cpu.A} />
        <CpuTable div="B" teams={cpu.B} />
        <CpuTable div="C" teams={cpu.C} />
        <RealTable league={league} managers={managers} youId={youId} />

        <div style={{ ...box('#fff'), padding: 12, marginBottom: 12, overflowX: 'auto' }}>
          <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, marginBottom: 8 }}>⚽ ARTILHARIA · TODAS AS DIVISÕES</p>
          {merged.length === 0 ? <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.6)', fontWeight: 700 }}>Sem gols ainda. Bola rolando…</p> : (
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead><tr style={{ textAlign: 'left' }}><th style={{ ...th, paddingRight: 4 }}>#</th><th style={th}>Jogador</th><th style={th}>Time</th><th style={{ ...th, textAlign: 'center' }}>Gols</th></tr></thead>
              <tbody>
                {merged.map((s, i) => {
                  const mk = scorerTeamHuman(s)
                  return (
                    <tr key={s.name + s.team + i} style={{ borderTop: '1px solid rgba(0,0,0,0.1)', fontWeight: 600, background: mk.you ? GOLD : mk.hum ? '#FFE0D6' : undefined }}>
                      <td style={{ paddingRight: 4 }}>{i + 1}</td>
                      <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}><span style={{ display: 'inline-block', fontSize: 8, fontWeight: 800, color: '#fff', background: DIV_TAG[s.div].bg, borderRadius: 4, padding: '0 4px', marginRight: 4, verticalAlign: 'middle' }}>{DIV_TAG[s.div].l}</span>{s.name}</td>
                      <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110, color: 'rgba(0,0,0,0.7)' }}>{mk.you ? '👤 ' : mk.hum ? '🔥 ' : ''}{s.team}</td>
                      <td style={{ textAlign: 'center', fontWeight: 900 }}>{s.goals}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <button onClick={onClose} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 12, fontWeight: 900, fontSize: 15, background: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD }}>← Voltar pra temporada</button>
      </div>
    </div>
  )
}
