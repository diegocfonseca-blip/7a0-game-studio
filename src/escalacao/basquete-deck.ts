// 🏀 ADAPTADOR DO BARALHO NBA PRO MOTOR — o basquete usa o MESMO motor do
// futebol (mesmas telas/botões/cores/fluxo). Pra isso, as 5 posições do
// basquete entram nos 5 SETORES que o motor já conhece (mapa 1:1 por ordem):
//   PG→GOL · SG→LAT · SF→ZAG · PF→MEI · C→ATA
// (o setor é só um "slot" interno — o RÓTULO exibido vira armador/ala/pivô por
// esporte; ver sportcfg). Assim o leilão, o monte e a cerimônia consomem carta
// de basquete sem NENHUMA gambiarra, e o futebol não muda em nada.

import type { Card, Sector } from './types'
import { SECTORS } from './types'
import { CATALOG_NBA, type BPos } from './data-basquete'
import { getLang } from './lang'

// ordem das posições do basquete, casando 1:1 com SECTORS (GOL,LAT,ZAG,MEI,ATA)
export const NBA_POS_ORDER: BPos[] = ['PG', 'SG', 'SF', 'PF', 'C']

export const SECTOR_OF_NBA_POS: Record<BPos, Sector> = NBA_POS_ORDER.reduce((acc, p, i) => {
  acc[p] = SECTORS[i]; return acc
}, {} as Record<BPos, Sector>)

export const NBA_POS_OF_SECTOR: Record<Sector, BPos> = SECTORS.reduce((acc, s, i) => {
  acc[s] = NBA_POS_ORDER[i]; return acc
}, {} as Record<Sector, BPos>)

let uid = 0

// baralho NBA no formato do motor: Record<Setor, Card[]>. A bio sai no idioma
// atual (BidLegends é bilíngue); o resto é idêntico à carta do futebol.
export function buildNbaDeck(): Record<Sector, Card[]> {
  const lang = getLang()
  const out = {} as Record<Sector, Card[]>
  SECTORS.forEach((s, i) => {
    const pos = NBA_POS_ORDER[i]
    out[s] = CATALOG_NBA[pos].map(c => ({
      id: `nba_${pos}_${uid++}`,
      name: c.name,
      club: c.club,
      year: c.year,
      pos: s,
      fame: c.fame,
      lo: c.lo,
      hi: c.hi,
      bio: lang === 'en' ? c.bioEn : c.bioPt,
      folk: c.folk,
      promessa: c.promessa,
    }))
  })
  return out
}
