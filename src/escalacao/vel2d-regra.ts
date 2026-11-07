// ⏩📺 VELOCIDADE DO CAMPO 2D — VALORES ABSOLUTOS (06/11, ordem do Diego).
//
// Antes a marcha do Manual MULTIPLICAVA por cima da base (sala 3× × simSpeed 3 = 9×, ~12 s por jogo na sala 4RVDD8).
// Agora cada opção É a velocidade do jogo, contada sobre o jogo inteiro de 1:30 (1× = 90 s · 2× = 45 s · 3× = 30 s · 4× = 22,5 s):
//   • SALAS ONLINE (todo modo): padrão 2,5× (06/11, o Diego trocou de 3× pra 2,5×). Sem escolha = 2,5× (simSpeed velho é ignorado).
//     🔁 07/11: a ÚLTIMA marcha escolhida no Manual vale no AUTO também. O dono escolhe 1× · 1,5× · 2× · 2,5× · 3× · 3,5× · 4× — vai no estado da sala
//     (`vel2d`), vale pra todos.
//   • CARREIRA (offline e a online) e PARTIDA RÁPIDA offline: padrão 2×; o Manual escolhe 1× · 1,5× · 2× · 2,5× · 3× · 3,5× · 4×.
//     Offline a última marcha fica no aparelho (`esc-vel2d`) e vale no automático também; na carreira online vale a do DONO.
//   • Fora do 2D (placar normal) nada disto vale: lá continua o `simSpeed` de sempre.
// Puro (sem React, sem store): a trava `npm run vel-2d` importa daqui.

/** o jogo inteiro do 2D a 1× (o placar anima em roundMs × 0,82 = 90 s) — o mesmo `DUR_2D_MS` de campo2d-motor.ts */
export const DUR_2D_BASE_MS = Math.round(90_000 / 0.82)

export const VEL2D_SALA_PADRAO = 2.5
export const VEL2D_SALA_VALORES: readonly number[] = [1, 1.5, 2, 2.5, 3, 3.5, 4]
export const VEL2D_SOLO_PADRAO = 2
/** 🏆 07/11 (Diego: *"como se fosse um padrão do modo carreira ser o modo 1,5x… se ele tiver o botão manual, aí ele consegue aumentar"*):
 *  a CARREIRA (offline e online) anda a 1,5× por padrão; sem o Manual fica cravada nisso. A Partida Rápida offline segue 2×. */
export const VEL2D_CARREIRA_PADRAO = 1.5
export const VEL2D_SOLO_VALORES: readonly number[] = [1, 1.5, 2, 2.5, 3, 3.5, 4]
/** a chave do aparelho (carreira/Partida Rápida offline) */
export const VEL2D_CHAVE = 'esc-vel2d'

export type OpcaoVel2D = { v: number; pt: string; en: string }

/** "1,5×" em PT, "1.5×" em EN; com o selo do padrão */
export function rotuloVel2D(v: number, padrao: boolean): { pt: string; en: string } {
  const pt = `${String(v).replace('.', ',')}×`, en = `${v}×`
  return padrao ? { pt: `${pt} (padrão)`, en: `${en} (default)` } : { pt, en }
}
export function opcoesVel2D(sala: boolean): OpcaoVel2D[] {
  const vals = sala ? VEL2D_SALA_VALORES : VEL2D_SOLO_VALORES
  const pad = sala ? VEL2D_SALA_PADRAO : VEL2D_SOLO_PADRAO
  return vals.map(v => ({ v, ...rotuloVel2D(v, v === pad) }))
}
export const VEL2D_SALA_OPTS = opcoesVel2D(true)
export const VEL2D_SOLO_OPTS = opcoesVel2D(false)

const valida = (v: unknown, vals: readonly number[]): v is number => typeof v === 'number' && vals.includes(v)

export function velMaisProxima(v: number, vals: readonly number[]): number {
  let melhor = vals[0]
  for (const o of vals) if (Math.abs(o - v) < Math.abs(melhor - v)) melhor = o
  return melhor
}

/** 💾 o que estava gravado no aparelho → a marcha absoluta. Sem valor (ou lixo) = 2×.
 *  O valor velho do `esc-vel2d` JÁ era absoluto (só a Partida Rápida offline gravava, e lá o jogo durava 1:30 ÷ marcha:
 *  0,5 = 3:00 · 1 = 1:30 · 2 = 45 s · 3 = 30 s · 4 = 22 s) — então a conversão mantém a MESMA velocidade e só encaixa na lista
 *  nova (o 🐢 0,5 vira 1×, a mais lenta que existe agora). */
export function vel2dSoloDoGuardado(raw: string | null | undefined): number {
  if (raw == null || raw === '') return VEL2D_SOLO_PADRAO
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return VEL2D_SOLO_PADRAO
  return velMaisProxima(n, VEL2D_SOLO_VALORES)
}

type EstadoVel = { onlineMode?: string; careerOnline?: boolean; manualRoom?: boolean; streamMode?: boolean; vel2d?: number }
/** a sala tem o Manual (criada manual ou em stream) — só aí o dono escolhe a marcha */
export const salaTemManual = (s: EstadoVel) => !!(s.manualRoom || s.streamMode)
/** 🌐 SALA ONLINE: sem Manual = 2,5× cravado; com Manual = a escolha do dono (inválida/ausente = 2,5×). `simSpeed` NUNCA entra. */
// 🔁 07/11 (Diego): *"clicar em 4x e depois apertar em auto, passa a ser o auto 4x… voltar no manual pra 2,5 e depois auto, vale o 2,5"*.
// A ÚLTIMA marcha escolhida no Manual vale no AUTOMÁTICO também (igual à carreira/rápida offline). Sem escolha = 2,5×.
export function vel2dSala(s: EstadoVel): number {
  return valida(s.vel2d, VEL2D_SALA_VALORES) ? s.vel2d : VEL2D_SALA_PADRAO
}
/** 🌐🏆 CARREIRA ONLINE: a marcha do dono (no estado da sala), padrão 2× */
export function vel2dCarreiraOnline(s: EstadoVel): number {
  return valida(s.vel2d, VEL2D_SOLO_VALORES) ? s.vel2d : VEL2D_CARREIRA_PADRAO
}
export type ModoVel2D = 'sala' | 'carreiraOnline' | 'solo'
export function modoVel2D(s: EstadoVel): ModoVel2D {
  return s.onlineMode === 'online' ? (s.careerOnline ? 'carreiraOnline' : 'sala') : 'solo'
}
/** a velocidade ABSOLUTA do 2D aqui. `guardada` = a marcha do aparelho (offline; `null` = nunca escolheu).
 *  `temManual` = false: na CARREIRA fica cravada em 1,5× (só o Manual muda a marcha). */
export function vel2dDoContexto(s: EstadoVel, guardada: number | null, temManual = true): number {
  const m = modoVel2D(s)
  if (m === 'sala') return vel2dSala(s)
  if (m === 'carreiraOnline') return vel2dCarreiraOnline(s)
  const pad = s.careerOnline ? VEL2D_CARREIRA_PADRAO : VEL2D_SOLO_PADRAO // (a carreira OFFLINE tem careerOnline = true)
  if (s.careerOnline && !temManual) return VEL2D_CARREIRA_PADRAO
  return guardada != null && valida(guardada, VEL2D_SOLO_VALORES) ? guardada : pad
}
/** o `roundMs` do jogo 2D nessa velocidade (o placar anima 0,82 disso = 90 s ÷ v) */
export const dur2DDaVel = (v: number) => Math.round(DUR_2D_BASE_MS / v)
/** segundos de jogo na tela */
export const seg2DDaVel = (v: number) => Math.round(DUR_2D_BASE_MS * 0.82 / v) / 1000

// 🗄️ RELÓGIO DO BANCO (Copa do Mundo/Euro/regionais — `docs/sql/campo2d-sala-2-5x.sql`): mesma régua da sala.
// A marcha do 2D mora numa coluna PRÓPRIA (`vel2d`), separada da `speed` do placar normal — a `speed` nasce 1 ("Normal"), e 1
// agora é uma opção de verdade do 2D (1×); misturar as duas faria toda sala manual cair em 1:30 sem ninguém escolher.
/** a marcha absoluta que o banco usa no passo 2D: Manual com `vel2d` válida = ela; senão 2,5× */
export function vel2dBanco(_manual: boolean, vel2d: number | null | undefined): number {
  return valida(vel2d, VEL2D_SALA_VALORES) ? vel2d : VEL2D_SALA_PADRAO // 🔁 07/11: a última marcha vale no AUTO também
}
/** as durações que o banco carimba no passo 2D com a régua nova (uma por opção) */
export const PASSOS_2D_BANCO_MS = VEL2D_SALA_VALORES.map(dur2DDaVel)
