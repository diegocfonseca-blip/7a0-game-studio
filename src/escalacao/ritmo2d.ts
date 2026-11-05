// ⏩📺 RITMO DO CAMPO 2D — TESTE NA PARTIDA RÁPIDA (05/11, Diego: *"bota no Partida Rápida pra eu ver… em relação a tempo, à Liga,
// à Copa… botão manual e sem botão manual… pra eu depois saber o tempo antes de publicar"*).
// Vale SÓ com o Campo 2D ligado (que hoje só existe na conta do Diego) e SÓ na Partida Rápida offline (nunca sala online, nunca
// carreira). Regra em teste:
//   • AUTOMÁTICO = 2× (o jogo de 1:30 vira 45 s) — é o que valeria pra quem não tem o botão Manual (ex.: sala sem Manual).
//   • com o MANUAL: 🐢 Lento (3:00) · Normal (1:30) · ⚡ 2× (45 s, onde o Manual começa) · ⚡ 3× (30 s) · ⚡ 4× (22 s).
//   • "sem botão Manual" (escolha na tela de criar a Partida Rápida, guardada no aparelho): some o Manual e fica o 2× automático —
//     pra ele ver como seria numa sala criada sem o Manual.
// Desligar o teste = `RITMO2D_TESTE = false` (volta tudo ao de antes: 1:30 e as marchas antigas).
import { useEffect, useState } from 'react'
import { useCampo2DLigado } from './campo2d-modo'
import { useCampo2DTester } from './sport'
import { useEscTalvez } from './store'

export const RITMO2D_TESTE = true
export const RITMO2D_PADRAO = 2
export const RITMO2D_OPTS: { v: number; pt: string; en: string }[] = [
  { v: 0.5, pt: '🐢 Lento', en: '🐢 Slow' },
  { v: 1, pt: 'Normal', en: 'Normal' },
  { v: 2, pt: '⚡ 2×', en: '⚡ 2×' },
  { v: 3, pt: '⚡ 3×', en: '⚡ 3×' },
  { v: 4, pt: '⚡ 4×', en: '⚡ 4×' },
]

const K = 'esc-ritmo2d-sem-manual'
const ouvintes = new Set<() => void>()
export function ritmo2dSemManual(): boolean { try { return localStorage.getItem(K) === '1' } catch { return false } }
export function setRitmo2dSemManual(v: boolean): void {
  try { if (v) localStorage.setItem(K, '1'); else localStorage.removeItem(K) } catch { /* sem armazenamento: fica com Manual */ }
  ouvintes.forEach(f => { try { f() } catch { /* ignora */ } })
}
export function useRitmo2dSemManual(): boolean {
  const [, bump] = useState(0)
  useEffect(() => { const f = () => bump(n => n + 1); ouvintes.add(f); return () => { ouvintes.delete(f) } }, [])
  return ritmo2dSemManual()
}

/** o teste está valendo AGORA? (2D ligado + Partida Rápida offline, fora da carreira) */
export function useRitmo2D(): { teste: boolean; semManual: boolean } {
  const c2d = useCampo2DLigado()
  const tester = useCampo2DTester() // 🧪 05/11: o 2D foi liberado pra todos; o teste de ritmo segue só na conta do Diego
  const s = useEscTalvez()?.state
  const sem = useRitmo2dSemManual()
  const teste = RITMO2D_TESTE && tester && c2d && !!s && s.onlineMode !== 'online' && !s.careerDivision && !s.careerOnline && s.sport !== 'basquete'
  return { teste, semManual: teste && sem }
}

/** o divisor do tempo do jogo no 2D: automático = 2×; no Manual, a marcha escolhida (sem marcha ainda = 2×) */
export function fatorRitmo2D(manual: boolean, simSpeed: number | undefined): number {
  if (!manual) return RITMO2D_PADRAO
  return simSpeed && simSpeed > 0 ? simSpeed : RITMO2D_PADRAO
}
