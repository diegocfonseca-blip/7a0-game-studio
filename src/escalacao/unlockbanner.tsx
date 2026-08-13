// 🗺️ GUIA DA CARREIRA — banner de desbloqueio explicado (Diego 13/08): explica
// a mecânica na hora em que ela passa a valer, com os números REAIS do jogo.
// Fecha com "Entendi!" (MARK_CAREER_SEEN) e NUNCA MAIS aparece nesta carreira
// (`state.careerSeen`, zera só na fundação de carreira nova). Cada chamada usa
// uma chave `k` própria — banners são independentes entre si.
//
// Módulo À PARTE (não mora em pyramidseason.tsx nem estadio.tsx) só pra dar pra
// usar dos dois lados sem import circular — estadio.tsx é importado por
// pyramidseason.tsx, então não pode importar de volta.
import { useEsc } from './store'

const INK = '#0C0C0C'
const GOLD = '#FFC400'
const OSWALD = { fontFamily: "'Oswald','Arial Narrow',system-ui,sans-serif" } as const

export function UnlockBanner({ k, tag, tagBg = GOLD, title, ctaBg = GOLD, ctaColor = INK, children }: {
  k: string; tag: string; tagBg?: string; title: string; ctaBg?: string; ctaColor?: string; children: React.ReactNode
}) {
  const { state, dispatch } = useEsc()
  if (state.careerSeen?.[k]) return null
  return (
    <div style={{ background: '#fff', border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 0 ${INK}`, padding: 16, marginBottom: 10 }}>
      <span style={{ display: 'inline-flex', ...OSWALD, fontWeight: 800, fontSize: 10.5, letterSpacing: .5, textTransform: 'uppercase', color: INK, background: tagBg, border: `2px solid ${INK}`, borderRadius: 999, padding: '3px 10px', marginBottom: 10 }}>{tag}</span>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 17, textTransform: 'uppercase', margin: '0 0 8px', lineHeight: 1.05 }}>{title}</p>
      <div style={{ fontSize: 12.5, color: '#3a3527', fontWeight: 600, lineHeight: 1.42 }}>{children}</div>
      <button onClick={() => dispatch({ type: 'MARK_CAREER_SEEN', key: k })} style={{ marginTop: 12, ...OSWALD, fontWeight: 800, fontSize: 12.5, textTransform: 'uppercase', color: ctaColor, background: ctaBg, border: `2px solid ${INK}`, borderRadius: 9, padding: '8px 16px', boxShadow: `2.5px 2.5px 0 0 ${INK}`, cursor: 'pointer' }}>Entendi!</button>
    </div>
  )
}
