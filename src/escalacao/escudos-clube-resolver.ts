import { clubCanon } from './data'
import { ESCUDOS_OFICIAIS } from './escudos-oficiais'
import { ESCUDOS_INTERNACIONAIS } from './escudos-internacionais'

// A carreira exibe o nome por extenso; cartas e Leilão de Clubes usam algumas
// grafias curtas para a mesma instituição.
const CHAVES: Record<string, string> = {
  'Bayern de Munique': 'Bayern', 'Manchester City': 'Man City',
  'Manchester United': 'Man United', 'Inter de Milão': 'Inter',
  'Borussia Dortmund': 'Dortmund', 'Bayer Leverkusen': 'Leverkusen',
  'LDU': 'LDU Quito', 'Barcelona-EQU': 'Barcelona SC',
  'Universidad de Chile': 'U. de Chile',
}

export function escudoOficialDoClube(clube: string) {
  const chave = CHAVES[clube] ?? clubCanon(clube)
  return ESCUDOS_OFICIAIS[chave] ?? ESCUDOS_OFICIAIS[clube]
    ?? ESCUDOS_INTERNACIONAIS[chave] ?? ESCUDOS_INTERNACIONAIS[clube]
}
