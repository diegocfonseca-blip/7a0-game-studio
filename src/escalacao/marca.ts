// 🏷️ 09/11: a MARCA que aparece no topo das telas novas (online, loja, salão). O futebol continua
// "LEILÃO LEGENDS"; o basquete (só na conta liberada — getSport já vem travado em sport.ts) vira "BIDLEGENDS".
import { getSport } from './sport'
import { tr } from './lang'

export const ehBasquete = (): boolean => getSport() === 'basquete'
export const marcaNome = (): string => ehBasquete() ? 'BIDLEGENDS' : 'LEILÃO LEGENDS'
export const marcaSigla = (): string => ehBasquete() ? 'BL' : 'LL'
/** frase curta embaixo da marca (a do topo das telas de jogo) */
export const marcaFraseLance = (): string => ehBasquete()
  ? tr('O SEU QUINTETO COMEÇA NO LANCE.', 'YOUR FIVE STARTS WITH A BID.')
  : tr('O SEU TIME COMEÇA NO LANCE.', 'YOUR TEAM STARTS WITH A BID.')
/** frase da marca nas telas de conta/loja/salão */
export const marcaFraseClube = (): string => ehBasquete()
  ? tr('SEU QUINTETO. SUA LENDA.', 'YOUR FIVE. YOUR LEGEND.')
  : tr('SEU CLUBE. SUA HISTÓRIA.', 'YOUR CLUB. YOUR STORY.')
