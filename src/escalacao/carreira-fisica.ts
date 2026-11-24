import type { Card, EscState } from './types'
import { chaveCarry } from './condicao'

/** Um jogo encerrado, com os participantes reais. Id estável torna a gravação idempotente. */
export interface JogoFisicoOficial { id: string; r: number; clubes: Record<string, string[]>; inicio?: Record<string,Record<string,number>> }
export function eventosFisicos(s: Pick<EscState, 'oficialFisica' | 'seasonNo'>, clube: string, squad: readonly Card[]): { r: number; ids: string[] }[] {
  if (s.oficialFisica?.season !== s.seasonNo) return []
  const ids = new Map(squad.map(c => [chaveCarry(c), c.id]))
  return Object.values(s.oficialFisica.copas ?? {}).flatMap(j => j.clubes[clube] ? [{r:j.r,ids:j.clubes[clube].map(k => ids.get(k)).filter((id): id is string => !!id)}] : [])
}
