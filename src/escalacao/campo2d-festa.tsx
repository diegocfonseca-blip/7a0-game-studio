// ⚽ A FESTA DO GOL do Campo 2D — UM componente só, usado no campinho da aba Jogos e por cima do campo do MAPA (04/11, Diego:
// *"o gol na aba do mapa também não está aparecendo as coisas do mascote, nome do jogador que fez gol, etc!"*).
// "GOOOOL!" + o mascote do clube (quem tem) ou o escudo + a faixinha do autor, minuto e 🅰️ assistência. O mesmo teatro, uma vez só.
import { useSyncExternalStore, type ReactNode } from 'react'
import { useT } from './lang'

const INK = '#0C0C0C', GOLD = '#FFC400'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 700 } as const

export type FestaCampo2D = { lado: 0 | 1; autor: string; assist?: string; min: number }
export type FestaComArte = FestaCampo2D & { mascote?: ReactNode | null; escudo?: ReactNode }

export function FestaGolCampo2D({ festa, larg }: { festa: FestaComArte; larg: number }) {
  const t = useT()
  return (
    <div data-festa-gol-campo2d style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, animation: 'c2dEntra .3s ease', pointerEvents: 'none' }}>
      <style>{'@keyframes c2dEntra{from{opacity:0}to{opacity:1}}@keyframes c2dQuica{0%{transform:translateX(220px) rotate(10deg)}55%{transform:translateX(0) rotate(0)}70%{transform:translateY(-14px)}85%{transform:translateY(0)}100%{transform:translateY(-6px)}}'}</style>
      <div style={{ ...OSW, fontSize: Math.round(Math.min(larg, 520) / 6.5), color: GOLD, textShadow: `4px 4px 0 ${INK}`, lineHeight: 1 }}>{t('GOOOOL!', 'GOOOAL!')}</div>
      <div style={{ animation: 'c2dQuica .9s cubic-bezier(.3,1.4,.5,1)', transform: 'scale(1.15)' }}>{festa.mascote ?? festa.escudo ?? null}</div>
      <div style={{ ...OSW, fontSize: 18, background: '#fff', color: INK, border: `3px solid ${INK}`, borderRadius: 12, padding: '2px 12px', boxShadow: `3px 3px 0 ${INK}`, whiteSpace: 'nowrap', maxWidth: '92%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        ⚽ {festa.autor.toUpperCase()} {festa.min > 90 ? `90+${festa.min - 90}` : festa.min}'{festa.assist ? `  ·  🅰️ ${festa.assist}` : ''}
      </div>
    </div>
  )
}

// 🗺️ a ponte pro mapa: o campinho (que roda escondido enquanto o mapa mostra o jogo) avisa a festa por partida; o HUD do mapa lê.
// Só memória da aba — nada vai pro save, pra sala ou pro banco.
const festas = new Map<string, FestaComArte>(), ouvintes = new Set<() => void>()
export function publicarFestaCampo2D(id: string, festa: FestaComArte | null) {
  if (festa) festas.set(id, festa); else if (festas.has(id)) festas.delete(id); else return
  ouvintes.forEach(fn => fn())
}
const assina = (fn: () => void) => { ouvintes.add(fn); return () => { ouvintes.delete(fn) } }
export function useFestaCampo2D(id: string | undefined): FestaComArte | null {
  return useSyncExternalStore(assina, () => (id ? festas.get(id) ?? null : null), () => null)
}

// 📺 07/11: o TELÃO do gol (escudo + nome de quem fez, ~10 s depois da festa) — a mesma ponte, pro HUD do mapa
export type TelaoCampo2D = { lado: 0 | 1; autor: string; min: number; escudo?: ReactNode }
const telaos = new Map<string, TelaoCampo2D>()
export function publicarTelaoCampo2D(id: string, telao: TelaoCampo2D | null) {
  if (telao) telaos.set(id, telao); else if (telaos.has(id)) telaos.delete(id); else return
  ouvintes.forEach(fn => fn())
}
export function useTelaoCampo2D(id: string | undefined): TelaoCampo2D | null {
  return useSyncExternalStore(assina, () => (id ? telaos.get(id) ?? null : null), () => null)
}
/** o telão no HUD do mapa: o mesmo LED do campinho (escudo + GOL! + nome + minuto) */
export function TelaoGolMapa({ telao }: { telao: TelaoCampo2D }) {
  const t = useT()
  return (
    <div data-telao-mapa style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#05070a', border: `2px solid ${INK}`, outline: '1px solid #3a434d', borderRadius: 6, padding: '4px 10px', boxShadow: '0 0 10px rgba(80,170,255,.25)', backgroundImage: 'radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px)', backgroundSize: '3px 3px', pointerEvents: 'none' }}>
      {telao.escudo && <div style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ transform: `scale(${34 / 110})` }}>{telao.escudo}</div></div>}
      <span style={{ ...OSW, color: GOLD, fontSize: 16, fontWeight: 900 }}>{t('GOL!', 'GOAL!')}</span>
      <span style={{ ...OSW, color: '#fff', fontSize: 16, whiteSpace: 'nowrap' }}>{telao.autor.toUpperCase()} {telao.min > 90 ? `90+${telao.min - 90}` : telao.min}'</span>
    </div>
  )
}
