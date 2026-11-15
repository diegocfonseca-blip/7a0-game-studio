// 👑 O CAMPINHO DE 7 DA KINGS LEAGUE (15/10) — com a cara da ARENA de verdade (fotos do Diego): piso preto, linha branca,
// círculo do meio em neon azul/rosa. — o mesmo desenho no leilão de sempre (`YourPitch`, screens.tsx) e na
// temporada (a de sempre, com a regra da Kings por cima: `kings-liga.ts`). Arquivo pequeno à parte pra não puxar o jogo da Kings inteiro pro leilão.
import type { Sector } from './types'
import { coresDoPresidente, tintaSobre } from './kings-presidentes'
import { tr } from './lang'

const INK = '#0C0C0C', GOLD = '#FFC400'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 900 as const, textTransform: 'uppercase' as const }
export interface CartaCampinho { name: string; pos: Sector; fame: number; club?: string; presidente?: boolean }
type Tier = { grad: string; ink: string }
const sobrenome = (n: string) => { const l = n.replace(/\s*\(.*?\)\s*/g, ' ').trim(); return l.split(' ').pop() || l }

export function CampinhoKings({ elenco, tier }: { elenco: CartaCampinho[]; tier: (fame: number) => Tier }) {
  const SPOT: { pos: Sector; x: number; y: number; i: number }[] = [
    { pos: 'ATA', x: 32, y: 20, i: 0 }, { pos: 'ATA', x: 68, y: 20, i: 1 }, { pos: 'MEI', x: 24, y: 44, i: 0 }, { pos: 'MEI', x: 76, y: 44, i: 1 },
    { pos: 'ZAG', x: 30, y: 67, i: 0 }, { pos: 'ZAG', x: 70, y: 67, i: 1 }, { pos: 'GOL', x: 50, y: 85, i: 0 },
  ]
  // 🎩 12/11: o PRESIDENTE (vaga 'LAT') não entra em campo — fica numa faixa embaixo do campinho, nas cores do time dele
  const pres = elenco.find(e => e.presidente || e.pos === 'LAT')
  const pc = pres?.club ? coresDoPresidente(pres.club) : null
  return (<div style={{ width: '100%', maxWidth: 330, margin: '0 auto' }}>
    <div style={{ position: 'relative', width: '100%', maxWidth: 330, margin: '0 auto', aspectRatio: '1 / 1.3', border: `3px solid ${INK}`, borderRadius: 14, overflow: 'hidden', boxShadow: `4px 4px 0 ${INK}`, background: 'radial-gradient(ellipse at 50% 30%,rgba(30,200,255,.14),transparent 50%),radial-gradient(ellipse at 50% 75%,rgba(255,43,214,.14),transparent 50%),repeating-linear-gradient(180deg,#0d0f12 0 9%,#111418 9% 18%)' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '5.5%', background: '#111', color: GOLD, ...OSW, fontSize: 9, letterSpacing: '.15em', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, whiteSpace: 'nowrap' }}>KINGS LEAGUE · 👑 · KINGS LEAGUE · 👑 · KINGS LEAGUE</div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '5.5%', background: '#111', color: GOLD, ...OSW, fontSize: 9, letterSpacing: '.15em', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, whiteSpace: 'nowrap' }}>LEILÃO LEGENDS · 🔨 · LEILÃO LEGENDS · 🔨</div>
      <svg viewBox="0 0 100 130" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <g fill="none" stroke="rgba(255,255,255,.85)" strokeWidth="0.9"><rect x="6" y="8" width="88" height="114" rx="2" /><line x1="6" y1="65" x2="94" y2="65" /><circle cx="50" cy="65" r="11" /><rect x="28" y="8" width="44" height="17" /><rect x="28" y="105" width="44" height="17" /></g>
      </svg>
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 80, height: 80, borderRadius: '50%', border: '4px solid', borderColor: '#1EC8FF #FF2BD6 #FF2BD6 #1EC8FF', boxShadow: '0 0 12px #1EC8FF, 0 0 12px #FF2BD6, inset 0 0 10px rgba(255,43,214,.4)', background: 'rgba(0,0,0,.35)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.9)' }}><span style={{ ...OSW, fontSize: 11, lineHeight: .95, textAlign: 'center' }}>KINGS<br />LEAGUE</span><span>👑</span></div>
      {SPOT.map(({ pos, x, y, i }) => {
        const c = elenco.filter(e => e.pos === pos)[i]
        const t = c ? tier(c.fame) : null
        return (
          <div key={`${pos}${i}`} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)', width: 78, textAlign: 'center', zIndex: 3 }}>
            <div style={{ border: `3px ${c ? 'solid' : 'dashed'} ${INK}`, borderRadius: 10, boxShadow: c ? `2px 3px 0 ${INK}` : 'none', padding: '3px 3px 4px', background: c && t ? t.grad : 'rgba(255,255,255,.4)' }}>
              <span style={{ ...OSW, display: 'inline-block', fontSize: 9.5, background: c ? INK : 'rgba(0,0,0,.55)', color: '#fff', borderRadius: 6, padding: '1px 6px' }}>{pos}</span>
              {c && t ? <div style={{ ...OSW, fontSize: 12, lineHeight: 1, color: t.ink, textTransform: 'none', marginTop: 2 }}>{sobrenome(c.name)}</div> /* 13/11 (Diego): sem o emoji da categoria — só a cor, a posição e o nome */ : <div style={{ ...OSW, fontSize: 10.5, color: 'rgba(12,12,12,.7)', textTransform: 'none' }}>Vazio</div>}
            </div>
          </div>
        )
      })}
    </div>
    <div style={{ marginTop: 8, border: `3px ${pres ? 'solid' : 'dashed'} ${INK}`, borderRadius: 12, boxShadow: pres ? `3px 3px 0 ${INK}` : 'none', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8,
      background: pc ? `linear-gradient(150deg, ${pc[0]} 0%, ${pc[0]} 55%, ${pc[1]} 100%)` : 'rgba(255,255,255,.5)', color: pc ? tintaSobre(pc[0]) : INK }}>
      <span style={{ fontSize: 18 }}>🎩</span>
      <span style={{ ...OSW, fontSize: 13, textTransform: 'none', lineHeight: 1.1 }}>{pres ? <>{tr('Presidente', 'President')}: {pres.name}{pres.club ? <span style={{ opacity: .7, fontSize: 11 }}> · {pres.club}</span> : null}</> : tr('Presidente: ainda não tem (vem depois do ataque)', 'President: none yet (comes after the forwards)')}</span>
    </div>
  </div>)
}

