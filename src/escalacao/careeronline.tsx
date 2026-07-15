// ─── CARREIRA ONLINE · 4 DIVISÕES (em construção — só testers) ────────
// Modo grande, montado em fases. Isolado (igual o Manager) e travado no login
// dos testers via useCanCareerOnline. Nada aqui afeta o resto do jogo.
//
// FASE 2: entrada gated + escolha de baralho.
// FASE 3: motor das 4 ligas (mundo + simulação de temporada).
// FASE 4: artilharia geral ligada ao baralho.
// FASE 5 (esta): motor de RODADAS — joga rodada a rodada, com a "rodada ao
//   vivo" (jogos das 4 divisões) e a tabela/artilharia atualizando ao longo da
//   temporada. Ainda LOCAL; a sincronia online multiplayer é a próxima fase.

import { useEffect, useState } from 'react'
import { useCanCareerOnline } from './admin'
import { DIVISION_TEAMS, CATALOG, CATALOG_EU, CATALOG_BOTH } from './data'

const CREAM = '#F4ECD6'
const INK = '#0C0C0C'
const GOLD = '#FFC400'
const GREEN = '#1B7A3D'
const BLUE = '#2563EB'
const RED = '#E8503A'
const OSWALD = { fontFamily: 'Oswald, sans-serif' } as const

export type DeckChoice = 'br' | 'eu' | 'both'
const DECKS: { id: DeckChoice; label: string; desc: string }[] = [
  { id: 'br', label: '🇧🇷 Brasileirão', desc: 'Auges do futebol brasileiro — de Pelé a Estêvão.' },
  { id: 'eu', label: '🌍 Liga Europa', desc: 'Auges nos clubes europeus — de Yashin a Mbappé.' },
  { id: 'both', label: '🌎 Os dois juntos', desc: 'Brasileirão + Europa (~700 craques). Nessa opção quase não sobra fake.' },
]

type Div = 'A' | 'B' | 'C' | 'D'
const DIVS: Div[] = ['A', 'B', 'C', 'D']
const DIV_LABEL: Record<Div, string> = { A: '🏆 Série A', B: '🥈 Série B', C: '🥉 Série C', D: 'Série D' }
const DIV_BASE: Record<Div, number> = { A: 80, B: 71, C: 63, D: 55 }
const DIV_TAG: Record<Div, { l: string; bg: string }> = { A: { l: 'A', bg: '#B8892B' }, B: { l: 'B', bg: '#3E8E4E' }, C: { l: 'C', bg: '#9A7B33' }, D: { l: 'D', bg: '#7A7460' } }

interface Team { name: string; str: number; you?: boolean; hum?: boolean; w: number; d: number; l: number; gf: number; ga: number; pts: number }
interface Match { h: string; a: string; gh: number; ga: number; you?: boolean; hum?: boolean }
interface Scorer { name: string; team: string; div: Div; goals: number; you?: boolean; hum?: boolean }
interface Career { seed: number; deck: DeckChoice; world: Record<Div, Team[]>; fix: Record<Div, number[][][]>; round: number; last: Record<Div, Match[]> | null }

// amigos humanos (simulação): você na Série D + outros espalhados pela pirâmide
const FRIEND_NAMES = ['vfranca', 'Serginho zava', 'Don Julio', 'Pavanelli', 'Bruno FC', 'Marcelo', 'Zé da Bola']

function mulberry(seed: number) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function poisson(lambda: number, rng: () => number) { const L = Math.exp(-lambda); let k = 0, p = 1; do { k++; p *= rng() } while (p > L); return k - 1 }

function blankStats() { return { w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 } }
// monta as 4 divisões e coloca os humanos: você (Meu Time) na Série D e os
// `friends` amigos espalhados pelas divisões (A/B/C/D em rodízio).
function buildWorld(seed: number, friends: number): Record<Div, Team[]> {
  const rng = mulberry(seed)
  const world = {} as Record<Div, Team[]>
  for (const d of DIVS) {
    const pool = DIVISION_TEAMS[d].slice(0, 20)
    world[d] = pool.map(t => ({ name: t.team, str: DIV_BASE[d] + Math.round((rng() - 0.5) * 14), ...blankStats() }))
  }
  // você sempre começa na Série D (último slot)
  world.D[19] = { name: 'Meu Time', str: DIV_BASE.D + 2, you: true, hum: true, ...blankStats() }
  // amigos espalhados: A, B, C, D, A... (usa slot 0,1,2... de cada divisão)
  const slotUsed: Record<Div, number> = { A: 0, B: 0, C: 0, D: 0 }
  for (let i = 0; i < friends; i++) {
    const d = DIVS[i % 4]
    const slot = slotUsed[d]++
    if (d === 'D' && slot >= 19) continue // não pisa no seu slot
    world[d][slot] = { name: FRIEND_NAMES[i % FRIEND_NAMES.length], str: DIV_BASE[d] + Math.round((rng() - 0.3) * 12), hum: true, ...blankStats() }
  }
  return world
}

// tabela de rodadas (returno duplo) pelo método do círculo — 20 times = 38 rodadas
function roundRobin(n: number): number[][][] {
  const idx = [...Array(n).keys()]
  const turno: number[][][] = []
  for (let r = 0; r < n - 1; r++) {
    const pairs: number[][] = []
    for (let i = 0; i < n / 2; i++) { const h = idx[i], a = idx[n - 1 - i]; pairs.push(r % 2 ? [a, h] : [h, a]) }
    turno.push(pairs)
    idx.splice(1, 0, idx.pop() as number)
  }
  const returno = turno.map(rd => rd.map(([h, a]) => [a, h]))
  return [...turno, ...returno]
}
function buildFix(): Record<Div, number[][][]> {
  const f = {} as Record<Div, number[][][]>
  for (const d of DIVS) f[d] = roundRobin(20)
  return f
}

// joga UMA rodada em todas as divisões — PURO: clona as tabelas e devolve o
// novo mundo + os placares (não muta o estado anterior, seguro no StrictMode).
function playRound(c: Career): { world: Record<Div, Team[]>; last: Record<Div, Match[]> } {
  const rng = mulberry((c.seed ^ (c.round * 2654435761)) >>> 0)
  const world = {} as Record<Div, Team[]>
  const res = {} as Record<Div, Match[]>
  for (const d of DIVS) {
    const teams = c.world[d].map(t => ({ ...t }))
    const pairs = c.fix[d][c.round] ?? []
    const ms: Match[] = []
    for (const [hi, ai] of pairs) {
      const H = teams[hi], A = teams[ai]
      const diff = (H.str - A.str) / 22
      const gh = poisson(Math.max(0.15, 1.45 + diff + 0.25), rng)
      const ga = poisson(Math.max(0.15, 1.15 - diff), rng)
      H.gf += gh; H.ga += ga; A.gf += ga; A.ga += gh
      if (gh > ga) { H.w++; H.pts += 3; A.l++ } else if (gh < ga) { A.w++; A.pts += 3; H.l++ } else { H.d++; A.d++; H.pts++; A.pts++ }
      ms.push({ h: H.name, a: A.name, gh, ga, you: H.you || A.you, hum: H.hum || A.hum })
    }
    world[d] = teams
    res[d] = ms
  }
  return { world, last: res }
}
function sortDiv(ts: Team[]) { return [...ts].sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf) }

function pickScorers(world: Record<Div, Team[]>, deck: DeckChoice, seed: number): Scorer[] {
  const cat = deck === 'eu' ? CATALOG_EU : deck === 'both' ? CATALOG_BOTH : CATALOG
  const pool = [...cat.ATA, ...cat.MEI].map(c => c.name)
  const rng = mulberry((seed ^ 0x51ED2C) >>> 0)
  const sh = pool.slice()
  for (let i = sh.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1));[sh[i], sh[j]] = [sh[j], sh[i]] }
  let pi = 0
  const rows: Scorer[] = []
  for (const d of DIVS) for (const t of world[d]) {
    const s1 = sh[pi++ % sh.length], s2 = sh[pi++ % sh.length]
    const g1 = Math.round(t.gf * (0.26 + rng() * 0.12))
    const g2 = Math.round(t.gf * (0.15 + rng() * 0.08))
    if (g1 > 0) rows.push({ name: s1, team: t.name, div: d, goals: g1, you: t.you, hum: t.hum })
    if (g2 > 0) rows.push({ name: s2, team: t.name, div: d, goals: g2, you: t.you, hum: t.hum })
  }
  rows.sort((a, b) => b.goals - a.goals)
  return rows.slice(0, 20)
}

export function CareerOnlineButton() {
  const can = useCanCareerOnline()
  if (!can) return (
    <div style={{ width: '100%', boxSizing: 'border-box', background: '#e7e3d7', color: '#8a8577', border: '2px solid #bdb7a6', borderRadius: 99, padding: '9px 16px', fontWeight: 800, fontSize: 14, textAlign: 'center', marginTop: 2, ...OSWALD, cursor: 'default' }}>
      🌐 Carreira Online · 4 divisões <span style={{ opacity: 0.85 }}>(em breve)</span>
    </div>
  )
  return (
    <button onClick={() => { window.location.hash = 'carreiraonline' }} style={{ width: '100%', boxSizing: 'border-box', background: BLUE, color: '#fff', border: `2px solid ${INK}`, borderRadius: 99, padding: '9px 16px', fontWeight: 800, fontSize: 14, cursor: 'pointer', marginTop: 2, ...OSWALD }}>
      🌐 Carreira Online · 4 divisões <span style={{ color: GOLD }}>(teste)</span>
    </button>
  )
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: CREAM, color: INK, zIndex: 9000, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div className="max-w-xl mx-auto" style={{ padding: '20px 16px 64px' }}>{children}</div>
    </div>
  )
}
const box = (bg = '#fff'): React.CSSProperties => ({ background: bg, border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 0 ${INK}` })

// ── rodada ao vivo: os jogos das 4 divisões da rodada atual ──
function RoundView({ c, onNext, onTable }: { c: Career; onNext: () => void; onTable: () => void }) {
  const done = c.round >= 38
  return (
    <div>
      <div style={{ ...box(INK), padding: 12, color: '#fff', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 900, fontSize: 15, ...OSWALD }}>🗓️ {done ? 'Temporada encerrada' : `Rodada ${c.round}/38`}</span>
        {!done && c.last && <span style={{ fontSize: 10.5, fontWeight: 700, color: GOLD }}>✅ jogos simulados</span>}
      </div>

      {c.last ? DIVS.map(d => (
        <div key={d} style={{ ...box('#fff'), padding: 9, marginBottom: 10 }}>
          <p style={{ fontWeight: 900, fontSize: 12, ...OSWALD, marginBottom: 5 }}>{DIV_LABEL[d]}</p>
          {c.last![d].map((m, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 5, padding: '2.5px 2px', borderTop: i ? '1px solid rgba(0,0,0,0.07)' : 'none', background: m.you ? GOLD : m.hum ? '#FFE79A' : undefined, borderRadius: (m.you || m.hum) ? 5 : 0 }}>
              <span style={{ textAlign: 'right', fontWeight: (m.you || m.hum) ? 900 : 600, fontSize: 11.5, ...OSWALD, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.h}</span>
              <span style={{ fontWeight: 900, fontSize: 12, ...OSWALD, background: (m.you || m.hum) ? INK : '#eee', color: (m.you || m.hum) ? '#fff' : INK, borderRadius: 5, padding: '0 7px' }}>{m.gh}×{m.ga}</span>
              <span style={{ textAlign: 'left', fontWeight: (m.you || m.hum) ? 900 : 600, fontSize: 11.5, ...OSWALD, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#5a5647' }}>{m.a}</span>
            </div>
          ))}
        </div>
      )) : (
        <div style={{ ...box('#FFF6DE'), padding: 14, textAlign: 'center', marginBottom: 12 }}>
          <p style={{ fontWeight: 800, fontSize: 13, color: '#666', margin: 0 }}>Aperte "jogar rodada" pra rolar a 1ª rodada nas 4 divisões.</p>
        </div>
      )}

      {!done && <button onClick={onNext} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 13, fontWeight: 900, fontSize: 15, background: GREEN, color: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD, marginBottom: 9 }}>▶️ Jogar {c.round === 0 ? '1ª rodada' : 'próxima rodada'}</button>}
      <button onClick={onTable} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 11, fontWeight: 900, fontSize: 14, background: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD }}>📊 Tabela + artilharia</button>
    </div>
  )
}

// ── classificação das 4 divisões + artilharia geral ──
function Standings({ c, onBack }: { c: Career; onBack: () => void }) {
  const zone = (i: number, n: number) => i < 4 ? '#D6E9FA' : i >= n - 4 ? '#F9D8D3' : undefined
  const scorers = pickScorers(c.world, c.deck, c.seed)
  return (
    <div>
      <div style={{ ...box(INK), padding: 12, color: '#fff', marginBottom: 12, textAlign: 'center' }}>
        <p style={{ fontWeight: 900, fontSize: 16, ...OSWALD, margin: 0 }}>📊 Classificação · rodada {c.round}/38</p>
        <p style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>🔵 Acesso (G4) · 🔴 Rebaixamento (Z4) · 🟡 Você</p>
      </div>
      {DIVS.map(d => {
        const sorted = sortDiv(c.world[d])
        return (
          <div key={d} style={{ ...box('#fff'), padding: 10, marginBottom: 12 }}>
            <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, marginBottom: 6 }}>{DIV_LABEL[d]}</p>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead><tr style={{ textAlign: 'left', color: '#8a8368', fontWeight: 800, fontSize: 10 }}><th>#</th><th>Time</th><th style={{ textAlign: 'center' }}>P</th><th style={{ textAlign: 'center' }}>V</th><th style={{ textAlign: 'center' }}>SG</th></tr></thead>
              <tbody>
                {sorted.map((t, i) => (
                  <tr key={t.name + i} style={{ borderTop: '1px solid rgba(0,0,0,0.08)', background: t.you ? GOLD : t.hum ? '#FFE79A' : zone(i, sorted.length), fontWeight: (t.you || t.hum) ? 900 : 600 }}>
                    <td style={{ padding: '2px 3px' }}>{i + 1}</td>
                    <td style={{ padding: '2px 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>{(t.you || t.hum) ? '👤 ' : ''}{t.name}</td>
                    <td style={{ textAlign: 'center', fontWeight: 900 }}>{t.pts}</td>
                    <td style={{ textAlign: 'center' }}>{t.w}</td>
                    <td style={{ textAlign: 'center' }}>{t.gf - t.ga}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
      <div style={{ ...box('#fff'), padding: 10, marginBottom: 12 }}>
        <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, marginBottom: 2 }}>⚽ Artilharia geral</p>
        <p style={{ fontSize: 10, fontWeight: 600, color: '#8a8368', marginBottom: 7 }}>Goleadores de todas as divisões · o selo mostra a série</p>
        {scorers.length === 0 ? <p style={{ fontSize: 11, color: '#888', fontWeight: 700 }}>Sem gols ainda — jogue algumas rodadas.</p> : scorers.map((s, i) => (
          <div key={s.name + s.team + i} style={{ display: 'grid', gridTemplateColumns: '20px 1fr auto', alignItems: 'center', gap: 7, padding: '3px 2px', borderTop: i ? '1px solid rgba(0,0,0,0.08)' : 'none', background: s.you ? GOLD : s.hum ? '#FFE79A' : undefined, borderRadius: (s.you || s.hum) ? 5 : 0 }}>
            <span style={{ fontWeight: 900, ...OSWALD, textAlign: 'center' }}>{i + 1}</span>
            <span style={{ minWidth: 0 }}>
              <span style={{ fontWeight: 900, fontSize: 12.5, ...OSWALD }}><span style={{ display: 'inline-block', fontSize: 8, fontWeight: 800, color: '#fff', background: DIV_TAG[s.div].bg, borderRadius: 4, padding: '0 4px', marginRight: 4, verticalAlign: 'middle' }}>{DIV_TAG[s.div].l}</span>{s.name}</span>
              <span style={{ fontSize: 10, color: '#7a7460', fontWeight: 600, display: 'block' }}>{(s.you || s.hum) ? '👤 ' : ''}{s.team}</span>
            </span>
            <span style={{ fontWeight: 900, ...OSWALD, color: GREEN }}>{s.goals} <span style={{ fontSize: 10, color: '#8a8368' }}>⚽</span></span>
          </div>
        ))}
      </div>
      <button onClick={onBack} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 12, fontWeight: 900, fontSize: 15, background: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD }}>← Voltar pra rodada</button>
    </div>
  )
}

export function CareerOnlineGame() {
  const can = useCanCareerOnline()
  const [open, setOpen] = useState(() => typeof window !== 'undefined' && window.location.hash === '#carreiraonline')
  useEffect(() => {
    const f = () => setOpen(window.location.hash === '#carreiraonline')
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  const [deck, setDeck] = useState<DeckChoice>('br')
  const [friends, setFriends] = useState(3) // amigos humanos (além de você) na simulação
  const [career, setCareer] = useState<Career | null>(null)
  const [view, setView] = useState<'menu' | 'round' | 'table'>('menu')

  if (!open || !can) return null
  const close = () => { window.location.hash = '' }

  const start = () => {
    const seed = Math.floor(Math.random() * 1e9)
    setCareer({ seed, deck, world: buildWorld(seed, friends), fix: buildFix(), round: 0, last: null })
    setView('round')
  }
  const next = () => setCareer(c => {
    if (!c || c.round >= 38) return c
    const r = playRound(c)
    return { ...c, world: r.world, round: c.round + 1, last: r.last }
  })

  if (career && view === 'round') return <Overlay><RoundView c={career} onNext={next} onTable={() => setView('table')} /></Overlay>
  if (career && view === 'table') return <Overlay><Standings c={career} onBack={() => setView('round')} /></Overlay>

  return (
    <Overlay>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontWeight: 900, ...OSWALD }}>🌐 CARREIRA ONLINE</span>
        <button onClick={close} className="text-black/60 font-black text-sm active:opacity-60" style={OSWALD}>Fechar ✕</button>
      </div>

      <div style={{ ...box(INK), padding: 16, color: '#fff', marginBottom: 12 }}>
        <p style={{ fontWeight: 900, fontSize: 22, ...OSWALD, margin: 0 }}>4 divisões, a galera junta</p>
        <p style={{ fontSize: 13, opacity: 0.85, fontWeight: 600, marginTop: 4 }}>Os amigos ficam espalhados pela pirâmide (Série A à D). Todos jogam a mesma rodada e sobem/caem juntos.</p>
      </div>

      <div style={{ ...box('#EAF3FF'), padding: 12, marginBottom: 12 }}>
        <p style={{ fontSize: 12, fontWeight: 700 }}>🎴 Baralho de craques — <b>o host escolhe pra sala toda</b>:</p>
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          {DECKS.map(d => {
            const on = deck === d.id
            return (
              <button key={d.id} onClick={() => setDeck(d.id)} style={{ textAlign: 'left', border: `3px solid ${INK}`, borderRadius: 12, padding: '9px 11px', background: on ? GOLD : '#fff', boxShadow: on ? `3px 3px 0 0 ${INK}` : 'none', cursor: 'pointer' }}>
                <div style={{ fontWeight: 900, fontSize: 14, ...OSWALD }}>{d.label}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#5a5647', marginTop: 2 }}>{d.desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ ...box('#EAF3FF'), padding: 12, marginBottom: 12 }}>
        <p style={{ fontSize: 12, fontWeight: 700 }}>👥 Amigos na sala <span style={{ color: '#888' }}>(simulação — você + estes espalhados pelas divisões)</span>:</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {[1, 3, 5, 7].map(n => (
            <button key={n} onClick={() => setFriends(n)} style={{ flex: 1, border: `3px solid ${INK}`, borderRadius: 10, padding: '8px 0', fontWeight: 900, fontSize: 14, background: friends === n ? GOLD : '#fff', boxShadow: friends === n ? `2px 2px 0 0 ${INK}` : 'none', cursor: 'pointer', ...OSWALD }}>{n}</button>
          ))}
        </div>
      </div>

      <div style={{ ...box('#FFF6DE'), padding: 12, marginBottom: 12 }}>
        <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, margin: 0 }}>🧪 Protótipo do motor (Fase 6)</p>
        <p style={{ fontSize: 11.5, fontWeight: 700, color: '#666', marginTop: 3 }}>Você (Série D) + os amigos espalhados pela pirâmide, todos destacados nas rodadas, tabelas e artilharia. É local por enquanto — a sincronia online de verdade (cada um no seu aparelho, host manda) e o fim de temporada com carta vêm na próxima fase.</p>
      </div>

      <button onClick={start} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 13, fontWeight: 900, fontSize: 15, background: GREEN, color: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD, marginBottom: 9 }}>▶️ Começar temporada (rodada a rodada)</button>
      <button onClick={close} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 11, fontWeight: 900, fontSize: 13, background: RED, color: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD }}>← Sair</button>
    </Overlay>
  )
}
