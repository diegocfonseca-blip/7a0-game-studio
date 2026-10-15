// 👑 O CAMPINHO DE 7 DA KINGS LEAGUE (15/10) — o mesmo desenho no leilão de sempre (`YourPitch`, screens.tsx) e na
// tela da liga (`kings-rapida.tsx`). Arquivo pequeno à parte pra não puxar o jogo da Kings inteiro pro leilão.
import type { Sector } from './types'

const INK = '#0C0C0C', GOLD = '#FFC400'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 900 as const, textTransform: 'uppercase' as const }
export interface CartaCampinho { name: string; pos: Sector; fame: number }
type Tier = { grad: string; ink: string }
const tierEmoji = (f: number) => (f >= 5 ? '👑' : f === 4 ? '⭐' : f === 1 ? '🪵' : '🎯')
const sobrenome = (n: string) => { const l = n.replace(/\s*\(.*?\)\s*/g, ' ').trim(); return l.split(' ').pop() || l }

export function CampinhoKings({ elenco, tier }: { elenco: CartaCampinho[]; tier: (fame: number) => Tier }) {
  const SPOT: { pos: Sector; x: number; y: number; i: number }[] = [
    { pos: 'ATA', x: 32, y: 20, i: 0 }, { pos: 'ATA', x: 68, y: 20, i: 1 }, { pos: 'MEI', x: 24, y: 44, i: 0 }, { pos: 'MEI', x: 76, y: 44, i: 1 },
    { pos: 'ZAG', x: 30, y: 67, i: 0 }, { pos: 'ZAG', x: 70, y: 67, i: 1 }, { pos: 'GOL', x: 50, y: 85, i: 0 },
  ]
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 330, margin: '0 auto', aspectRatio: '1 / 1.3', border: `3px solid ${INK}`, borderRadius: 14, overflow: 'hidden', boxShadow: `4px 4px 0 ${INK}`, background: 'repeating-linear-gradient(180deg,#1f8f4a 0 9%,#1a8042 9% 18%)' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '5.5%', background: '#111', color: GOLD, ...OSW, fontSize: 9, letterSpacing: '.15em', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, whiteSpace: 'nowrap' }}>KINGS LEAGUE · 👑 · KINGS LEAGUE · 👑 · KINGS LEAGUE</div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '5.5%', background: '#111', color: GOLD, ...OSW, fontSize: 9, letterSpacing: '.15em', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, whiteSpace: 'nowrap' }}>LEILÃO LEGENDS · 🔨 · LEILÃO LEGENDS · 🔨</div>
      <svg viewBox="0 0 100 130" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <g fill="none" stroke="rgba(255,255,255,.85)" strokeWidth="0.9"><rect x="6" y="8" width="88" height="114" rx="2" /><line x1="6" y1="65" x2="94" y2="65" /><circle cx="50" cy="65" r="11" /><rect x="28" y="8" width="44" height="17" /><rect x="28" y="105" width="44" height="17" /></g>
      </svg>
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 80, height: 80, borderRadius: '50%', border: '3px solid rgba(255,255,255,.55)', background: 'rgba(0,0,0,.18)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.9)' }}><span style={{ ...OSW, fontSize: 11, lineHeight: .95, textAlign: 'center' }}>KINGS<br />LEAGUE</span><span>👑</span></div>
      {SPOT.map(({ pos, x, y, i }) => {
        const c = elenco.filter(e => e.pos === pos)[i]
        const t = c ? tier(c.fame) : null
        return (
          <div key={`${pos}${i}`} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)', width: 78, textAlign: 'center', zIndex: 3 }}>
            <div style={{ border: `3px ${c ? 'solid' : 'dashed'} ${INK}`, borderRadius: 10, boxShadow: c ? `2px 3px 0 ${INK}` : 'none', padding: '3px 3px 4px', background: c && t ? t.grad : 'rgba(255,255,255,.4)' }}>
              <span style={{ ...OSW, display: 'inline-block', fontSize: 9.5, background: c ? INK : 'rgba(0,0,0,.55)', color: '#fff', borderRadius: 6, padding: '1px 6px' }}>{pos}</span>
              {c && t ? <><div style={{ ...OSW, fontSize: 12, lineHeight: 1, color: t.ink, textTransform: 'none' }}>{sobrenome(c.name)}</div><div style={{ fontSize: 10 }}>{tierEmoji(c.fame)}</div></> : <div style={{ ...OSW, fontSize: 10.5, color: 'rgba(12,12,12,.7)', textTransform: 'none' }}>Vazio</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

