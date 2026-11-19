// 🏀🇺🇸 as cartas novas do EUA Oficial no formato do motor (Card, com o setor no lugar da posição do basquete). Só o modo usa
// (trava `npm run eua-so-carreira`); a tela baixa este arquivo sob demanda e manda as cartas junto do START_EUA_CAREER.
import type { Card } from './types'
import { CATALOG_NBA_EUA } from './data-basquete-eua'
import { NBA_POS_ORDER, SECTOR_OF_NBA_POS } from './basquete-deck'
import { getLang } from './lang'

export function cartasEuaComoCard(): Card[] {
  const en = getLang() === 'en'
  return NBA_POS_ORDER.flatMap(p => CATALOG_NBA_EUA[p].map((c, i) => ({
    id: `eua_${p}_${i}`, name: c.name, club: c.club, year: c.year, pos: SECTOR_OF_NBA_POS[p],
    fame: c.fame, lo: c.lo, hi: c.hi, bio: en ? c.bioEn : c.bioPt, folk: c.folk, promessa: c.promessa,
  }) as Card))
}
