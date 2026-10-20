// 📺 CAMPO 2D LIGADO OU NÃO (20/10). Diego: *"o 2D é para funcionar em qualquer jogo, em qualquer liga, em qualquer Copa…
// online, offline, serve para tudo"*. Por isso a decisão mora num lugar só e o `LiveScoreCard` (o placar de TODAS as
// competições) desenha o campinho sozinho quando ela diz sim.
//  · OFFLINE (carreira, partida rápida, copas): a escolha é do aparelho (`esc-campo2d`), e só pra quem o 2D está liberado.
//  · SALA ONLINE: quem decide é a SALA (`state.campo2d`, escolhido pelo dono ao criar) — vale igual pra todo mundo dela,
//    porque o tempo do jogo muda junto e os relógios da sala têm que bater.
import { useSyncExternalStore } from 'react'
import { useCampo2DLiberado } from './sport'
import { useEscTalvez } from './store'

export const CAMPO2D_CHAVE = 'esc-campo2d'
let pref = (() => { try { return localStorage.getItem(CAMPO2D_CHAVE) === '1' } catch { return false } })()
const ouvintes = new Set<() => void>()
export function trocaCampo2D() {
  pref = !pref
  try { localStorage.setItem(CAMPO2D_CHAVE, pref ? '1' : '0') } catch { /* sem armazenamento: vale só nesta aba */ }
  ouvintes.forEach(f => f())
}
function usePref() {
  return useSyncExternalStore(f => { ouvintes.add(f); return () => { ouvintes.delete(f) } }, () => pref)
}

/** o 2D está ligado AQUI? (a sala online manda; fora dela, a escolha do aparelho de quem está liberado) */
export function useCampo2DLigado(): boolean {
  const liberado = useCampo2DLiberado()
  const p = usePref()
  const s = useEscTalvez()?.state
  if (s && s.onlineMode === 'online') return !!s.campo2d
  return liberado && p
}

/** o que a tela do jogo sabe e o campinho usa: nome do técnico (carreira) e a tática de cada clube (🧱 −1 · ⚖️ 0 · 🔥 +1) */
export function useCampo2DExtras(): { tecnicoDe: (nome: string) => string | null; taticaDe: (nome: string) => number } {
  const s = useEscTalvez()?.state
  return {
    tecnicoDe: nome => s?.careerTecnicos?.[nome] ?? null,
    taticaDe: nome => {
      const m = s?.managers?.find(x => x.teamName === nome)
      if (!s || !m) return 0
      // carreira: a tática é POR RODADA (vale da rodada em que trocou em diante); fora dela, uma por técnico
      let tac = s.tactics?.[m.id]
      const porRodada = s.careerTactics?.[m.id]
      if (porRodada) { let k = -1; for (const r in porRodada) { const n = +r; if (n <= s.round - 1 && n > k) { k = n; tac = porRodada[n] } } }
      return tac === 'ataque' ? 1 : tac === 'retranca' ? -1 : 0
    },
  }
}
