// ─── CARREIRA ONLINE · 4 DIVISÕES (em construção — só testers) ────────
// Modo grande, sendo montado em fases. Isolado num arquivo próprio (igual o
// Manager) e travado no login dos testers via useCanCareerOnline. Nada aqui
// afeta o online atual, a carreira solo ou o Manager.
//
// FASE 2 (esta): entrada gated na home + o host escolhe o baralho
// (Brasileirão / Liga Europa / Os dois juntos), com o aviso de que juntando
// os dois quase não sobra fake. O motor das 4 ligas vem nas próximas fases.

import { useEffect, useState } from 'react'
import { useCanCareerOnline } from './admin'

const CREAM = '#F4ECD6'
const INK = '#0C0C0C'
const GOLD = '#FFC400'
const GREEN = '#1B7A3D'
const BLUE = '#2563EB'
const OSWALD = { fontFamily: 'Oswald, sans-serif' } as const

export type DeckChoice = 'br' | 'eu' | 'both'
const DECKS: { id: DeckChoice; label: string; desc: string }[] = [
  { id: 'br', label: '🇧🇷 Brasileirão', desc: 'Auges do futebol brasileiro — de Pelé a Estêvão.' },
  { id: 'eu', label: '🌍 Liga Europa', desc: 'Auges nos clubes europeus — de Yashin a Mbappé.' },
  { id: 'both', label: '🌎 Os dois juntos', desc: 'Brasileirão + Europa (~700 craques). Nessa opção quase não sobra fake — tem craque de sobra pra encher os times.' },
]

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
  if (!open || !can) return null
  const close = () => { window.location.hash = '' }
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

      <div style={{ ...box('#FFF6DE'), padding: 14, textAlign: 'center', marginBottom: 12 }}>
        <p style={{ fontWeight: 900, fontSize: 15, ...OSWALD, margin: 0 }}>🚧 Em construção</p>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#666', marginTop: 4 }}>
          O motor das 4 divisões (rodada ao vivo, classificação das 4 juntas, artilharia geral e o fim de temporada) vem nas próximas atualizações. Por enquanto isso aqui é só a entrada e a escolha do baralho — travado só pra vocês.
        </p>
      </div>

      <button onClick={close} style={{ width: '100%', border: `3px solid ${INK}`, borderRadius: 14, padding: 12, fontWeight: 900, fontSize: 15, background: GREEN, color: '#fff', boxShadow: `4px 4px 0 0 ${INK}`, cursor: 'pointer', ...OSWALD }}>
        ← Voltar
      </button>
    </Overlay>
  )
}
