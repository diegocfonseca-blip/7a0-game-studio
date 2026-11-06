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
import { VEL2D_CHAVE, VEL2D_SOLO_OPTS, VEL2D_SOLO_PADRAO, VEL2D_SOLO_VALORES, VEL2D_SALA_OPTS, modoVel2D, vel2dDoContexto, vel2dSala, vel2dCarreiraOnline, vel2dSoloDoGuardado, type OpcaoVel2D } from './vel2d-regra'

export const RITMO2D_TESTE = true
// ⏩ 06/11: as marchas viraram ABSOLUTAS (`vel2d-regra.ts`): carreira/Partida Rápida offline 1× · 1,5× · 2× (padrão) · 2,5× · 3× · 3,5× · 4×
export const RITMO2D_PADRAO = VEL2D_SOLO_PADRAO
export const RITMO2D_OPTS: OpcaoVel2D[] = VEL2D_SOLO_OPTS

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
  // ⏩ 05/11 (Diego): virou REGRA pra todos — todo 2D OFFLINE (Partida Rápida e carreira) usa a marcha guardada no aparelho.
  // Sala online (e a carreira online, que sincroniza pelo dono) fica fora: lá o tempo é da sala.
  // ⚠️ 06/11: a carreira OFFLINE tem `careerOnline = true` (é a flag da pirâmide) — o `!careerOnline` daqui deixava ela de fora e o
  // 2D da carreira multiplicava o simSpeed por cima do 2×. Quem decide offline × online é só o `onlineMode`.
  const teste = RITMO2D_TESTE && c2d && !!s && s.onlineMode !== 'online' && s.sport !== 'basquete'
  const semManualOk = tester && !s?.careerDivision // o "sem botão Manual" segue só como teste na Partida Rápida do Diego
  return { teste, semManual: teste && semManualOk && sem }
}

// ⏩ A MARCHA DO 2D FICA GUARDADA (05/11, Diego: *"se ele deixou por último no 4x e apertou em auto deveria valer o que ele apertou
// por último… auto 4x"*). Começa no 2× (*"no carreira deixa 2x a velocidade do auto"*); a escolha no Manual vale pro automático também.
const KV = VEL2D_CHAVE
const ouvVel = new Set<() => void>()
export function vel2D(): number {
  try { return vel2dSoloDoGuardado(localStorage.getItem(KV)) } catch { return RITMO2D_PADRAO }
}
export function setVel2D(v: number): void {
  if (!VEL2D_SOLO_VALORES.includes(v)) return
  try { localStorage.setItem(KV, String(v)) } catch { /* sem armazenamento: vale só agora */ }
  ouvVel.forEach(f => { try { f() } catch { /* ignora */ } })
}
export function useVel2D(): number {
  const [, bump] = useState(0)
  useEffect(() => { const f = () => bump(n => n + 1); ouvVel.add(f); return () => { ouvVel.delete(f) } }, [])
  return vel2D()
}

/** ⏩ a velocidade ABSOLUTA do 2D aqui (06/11): sala online = 3× ou a do dono com Manual · carreira online = a do dono (2×) ·
 *  offline = a marcha guardada no aparelho (2×). O teste "sem botão Manual" do Diego = o automático padrão (2×). */
export function useVel2DAqui(): number {
  const s = useEscTalvez()?.state
  const local = useVel2D()
  const r2d = useRitmo2D()
  if (r2d.semManual) return VEL2D_SOLO_PADRAO
  return s ? vel2dDoContexto(s, local) : local
}

/** 🎮 o seletor de marcha do 2D aqui (`null` = não é 2D: vale o seletor de sempre, com o simSpeed).
 *  Offline grava no aparelho; online (sala e carreira online) vai no ESTADO da sala (`SET_VEL_2D`) — só o dono manda. */
export function useControleVel2D(c2d: boolean): null | { opts: OpcaoVel2D[]; cur: number; set: (v: number) => void } {
  const ctx = useEscTalvez()
  const local = useVel2D()
  const s = ctx?.state
  if (!c2d || !s || s.sport === 'basquete') return null
  const modo = modoVel2D(s)
  if (modo === 'solo') return { opts: VEL2D_SOLO_OPTS, cur: local, set: setVel2D }
  const opts = modo === 'sala' ? VEL2D_SALA_OPTS : VEL2D_SOLO_OPTS
  const cur = modo === 'sala' ? vel2dSala(s) : vel2dCarreiraOnline(s)
  return { opts, cur, set: v => { if (s.isHost && !s.espectador) ctx!.dispatch({ type: 'SET_VEL_2D', vel: v }) } }
}
