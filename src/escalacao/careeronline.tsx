// ─── CARREIRA ONLINE · 4 DIVISÕES (em construção — só testers) ────────
// Modo grande, sendo montado em fases. Isolado num arquivo próprio (igual o
// Manager) e travado no login dos testers via useCanCareerOnline. Nada aqui
// afeta o online atual, a carreira solo ou o Manager.
//
// FASE 2: entrada gated + o host escolhe o baralho.
// FASE 3 (esta): motor das 4 ligas — gera o mundo (80 times nas 4 divisões,
//   você na Série D) e simula uma temporada, mostrando as 4 classificações
//   com acesso/queda. Protótipo LOCAL (a sincronia online vem na próxima fase).

import { useEffect, useMemo, useState } from 'react'
import { useCanCareerOnline } from './admin'
import { DIVISION_TEAMS } from './data'

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
  { id: 'both', label: '🌎 Os dois juntos', desc: 'Brasileirão + Europa (~700 craques). Nessa opção quase não sobra fake — tem craque de sobra pra encher os times.' },
]

type Div = 'A' | 'B' | 'C' | 'D'
const DIVS: Div[] = ['A', 'B', 'C', 'D']
const DIV_LABEL: Record<Div, string> = { A: '🏆 Série A', B: '🥈 Série B', C: '🥉 Série C', D: 'Série D' }
const DIV_BASE: Record<Div, number> = { A: 80, B: 71, C: 63, D: 55 }

interface Team { name: string; str: number; you?: boolean; w: number; d: number; l: number; gf: number; ga: number; pts: number }

// rng determinístico + poisson (mesma ideia usada no resto do jogo)
function mulberry(seed: number) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function poisson(lambda: number, rng: () => number) { const L = Math.exp(-lambda); let k = 0, p = 1; do { k++; p *= rng() } while (p > L); return k - 1 }

// monta as 4 divisões (20 times cada). Você entra no lugar de um time da D.
function buildWorld(myTeam: string, seed: number): Record<Div, Team[]> {
  const rng = mulberry(seed)
  const world = {} as Record<Div, Team[]>
  for (const d of DIVS) {
    const pool = DIVISION_TEAMS[d].slice(0, 20)
    const teams: Team[] = pool.map(t => ({ name: t.team, str: DIV_BASE[d] + Math.round((rng() - 0.5) * 14), w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }))
    if (d === 'D') { teams[teams.length - 1] = { name: myTeam || 'Meu Time', str: DIV_BASE.D + 2, you: true, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 } }
    world[d] = teams
  }
  return world
}

// simula uma temporada inteira (returno duplo) de cada divisão
function simSeason(world: Record<Div, Team[]>, seed: number): Record<Div, Team[]> {
  const rng = mulberry(seed ^ 0x9E3779B9)
  const out = {} as Record<Div, Team[]>
  for (const d of DIVS) {
    const ts = world[d].map(t => ({ ...t, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }))
    for (let h = 0; h < ts.length; h++) for (let a = 0; a < ts.length; a++) {
      if (h === a) continue
      const diff = (ts[h].str - ts[a].str) / 22
      const gh = poisson(Math.max(0.15, 1.45 + diff + 0.25), rng) // +0.25 mando de campo
      const ga = poisson(Math.max(0.15, 1.15 - diff), rng)
      ts[h].gf += gh; ts[h].ga += ga; ts[a].gf += ga; ts[a].ga += gh
      if (gh > ga) { ts[h].w++; ts[h].pts += 3; ts[a].l++ }
      else if (gh < ga) { ts[a].w++; ts[a].pts += 3; ts[h].l++ }
      else { ts[h].d++; ts[a].d++; ts[h].pts++; ts[a].pts++ }
    }
    ts.sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf)
    out[d] = ts
  }
  return out
}

// botão da home: público vê o teaser "(em breve)"; só tester abre
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

// classificação das 4 divisões (empilhadas, sem abas)
function Standings({ world, onBack }: { world: Record<Div, Team[]>; onBack: () => void }) {
  const zone = (i: number, n: number) => i < 4 ? '#D6E9FA' : i >= n - 4 ? '#F9D8D3' : undefined
  return (
    <div>
      <div style={{ ...box(INK), padding: 12, color: '#fff', marginBottom: 12, textAlign: 'center' }}>
        <p style={{ fontWeight: 900, fontSize: 16, ...OSWALD, margin: 0 }}>🏁 Temporada simulada · as 4 divisões</p>
        <p style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>🔵 Acesso (G4) · 🔴 Rebaixamento (Z4) · 🟡 Você</p>
      </div>
      {DIVS.map(d => (
        <div key={d} style={{ ...box('#fff'), padding: 10, marginBottom: 12 }}>
          <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, marginBottom: 6 }}>{DIV_LABEL[d]}</p>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead><tr style={{ textAlign: 'left', color: '#8a8368', fontWeight: 800, fontSize: 10 }}>
              <th>#</th><th>Time</th><th style={{ textAlign: 'center' }}>P</th><th style={{ textAlign: 'center' }}>V</th><th style={{ textAlign: 'center' }}>SG</th>
            </tr></thead>
            <tbody>
              {world[d].map((t, i) => (
                <tr key={t.name + i} style={{ borderTop: '1px solid rgba(0,0,0,0.08)', background: t.you ? GOLD : zone(i, world[d].length), fontWeight: t.you ? 900 : 600 }}>
                  <td style={{ padding: '2px 3px' }}>{i + 1}</td>
                  <td style={{ padding: '2px 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>{t.you ? '👤 ' : ''}{t.name}</td>
                  <td style={{ textAlign: 'center', fontWeight: 900 }}>{t.pts}</td>
                  <td style={{ textAlign: 'center' }}>{t.w}</td>
                  <td style={{ textAlign: 'center' }}>{t.gf - t.ga}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      <button onClick={onBack} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 12, fontWeight: 900, fontSize: 15, background: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD }}>← Voltar</button>
    </div>
  )
}

// raiz do modo (overlay via hash #carreiraonline), montada no app
export function CareerOnlineGame() {
  const can = useCanCareerOnline()
  const [open, setOpen] = useState(() => typeof window !== 'undefined' && window.location.hash === '#carreiraonline')
  useEffect(() => {
    const f = () => setOpen(window.location.hash === '#carreiraonline')
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  const [deck, setDeck] = useState<DeckChoice>('br')
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9))
  const [showTable, setShowTable] = useState(false)
  // gera o mundo e simula uma temporada (memo pelo seed — "nova simulação" troca o seed)
  const simulated = useMemo(() => simSeason(buildWorld('Meu Time', seed), seed), [seed])

  if (!open || !can) return null
  const close = () => { window.location.hash = '' }

  if (showTable) {
    return <Overlay><Standings world={simulated} onBack={() => setShowTable(false)} /></Overlay>
  }

  return (
    <Overlay>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontWeight: 900, ...OSWALD }}>🌐 CARREIRA ONLINE</span>
        <button onClick={close} className="text-black/60 font-black text-sm active:opacity-60" style={OSWALD}>Fechar ✕</button>
      </div>

      <div style={{ ...box(INK), padding: 16, color: '#fff', marginBottom: 12 }}>
        <p style={{ fontWeight: 900, fontSize: 22, ...OSWALD, margin: 0 }}>4 divisões, a galera junta</p>
        <p style={{ fontSize: 13, opacity: 0.85, fontWeight: 600, marginTop: 4 }}>
          Uma carreira online onde os amigos ficam espalhados pela pirâmide (Série A à D). Todo mundo joga a mesma rodada, sobe e cai junto, temporada após temporada.
        </p>
      </div>

      <div style={{ ...box('#EAF3FF'), padding: 12, marginBottom: 12 }}>
        <p style={{ fontSize: 12, fontWeight: 700 }}>🎴 Baralho de craques — <b>o host escolhe pra sala toda</b>:</p>
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          {DECKS.map(d => {
            const on = deck === d.id
            return (
              <button key={d.id} onClick={() => setDeck(d.id)}
                style={{ textAlign: 'left', border: `3px solid ${INK}`, borderRadius: 12, padding: '9px 11px', background: on ? GOLD : '#fff', boxShadow: on ? `3px 3px 0 0 ${INK}` : 'none', cursor: 'pointer' }}>
                <div style={{ fontWeight: 900, fontSize: 14, ...OSWALD }}>{d.label}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#5a5647', marginTop: 2 }}>{d.desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ ...box('#FFF6DE'), padding: 12, marginBottom: 12 }}>
        <p style={{ fontWeight: 900, fontSize: 13, ...OSWALD, margin: 0 }}>🧪 Protótipo do motor (Fase 3)</p>
        <p style={{ fontSize: 11.5, fontWeight: 700, color: '#666', marginTop: 3 }}>
          Gera as 4 divisões (80 times, você na Série D) e simula uma temporada. É local por enquanto — a sincronia online (todos juntos, rodada ao vivo) e o fim de temporada com carta vêm nas próximas fases.
        </p>
      </div>

      <button onClick={() => setShowTable(true)} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 13, fontWeight: 900, fontSize: 15, background: GREEN, color: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD, marginBottom: 9 }}>
        ▶️ Simular temporada e ver as 4 divisões
      </button>
      <button onClick={() => setSeed(Math.floor(Math.random() * 1e9))} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 11, fontWeight: 900, fontSize: 13, background: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD, marginBottom: 9 }}>
        🎲 Nova simulação (sorteia de novo)
      </button>
      <button onClick={close} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 11, fontWeight: 900, fontSize: 13, background: RED, color: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD }}>
        ← Sair
      </button>
    </Overlay>
  )
}
