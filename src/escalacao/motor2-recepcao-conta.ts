import { VERSAO_RECEPCAO_M2 } from './motor2/versao'

const CONTA_RECEPCAO = 'diego.c.fonseca@gmail.com'
export type MarcoRecepcaoM2 = { season: number; round: number }
type CarreiraRecepcao = {
  careerOnline?: boolean
  onlineMode?: string
  co2?: unknown
  sport?: string
  seasonNo?: number
  round?: number
  motor2Desde?: unknown
  motor2RecepcaoDesde?: MarcoRecepcaoM2
}
export const recepcaoM2DaConta = (email: string | null | undefined) => email?.trim().toLowerCase() === CONTA_RECEPCAO
export function podeAtivarRecepcaoM2(s: CarreiraRecepcao, email: string | null | undefined) {
  return recepcaoM2DaConta(email) && !!s.careerOnline && s.onlineMode !== 'online' && !s.co2 && s.sport !== 'basquete' && !!s.motor2Desde
}
export function marcoNovaRecepcaoM2(s: CarreiraRecepcao, email: string | null | undefined): MarcoRecepcaoM2 | undefined {
  if (!podeAtivarRecepcaoM2(s, email) || s.motor2RecepcaoDesde) return undefined
  // round conta os jogos já iniciados/vistos: a alteração entra no seguinte.
  return { season: s.seasonNo ?? 1, round: Math.max(0, Math.min(38, s.round ?? 0)) }
}
export function recepcaoM2Desde(s: CarreiraRecepcao, email: string | null | undefined): number | undefined {
  if (!podeAtivarRecepcaoM2(s, email)) return undefined
  const start = s.motor2RecepcaoDesde, season = s.seasonNo ?? 1
  return !start || start.season > season ? undefined : start.season === season ? start.round : 0
}
export const versaoRecepcaoNaRodada = (round: number, start: number | undefined) => start !== undefined && round >= start ? VERSAO_RECEPCAO_M2 : undefined
/** Copa já iniciada permanece inteira na mesma versão, inclusive suas fases futuras. */
export const versaoRecepcaoNaCopa = (start: number | undefined, primeiraRodada: number) => start !== undefined && start < primeiraRodada ? VERSAO_RECEPCAO_M2 : undefined
