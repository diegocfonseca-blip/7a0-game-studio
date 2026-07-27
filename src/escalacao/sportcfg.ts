// 🏀/⚽ TABELA DE TRADUÇÃO POR ESPORTE — o motor é o MESMO; muda só o RÓTULO.
// Cada esporte diz como CHAMAR cada um dos 5 setores/slots que o motor já usa,
// e quantas vagas cada posição vale no leilão INICIAL. As regras de cada slot
// (piso, lance cego, martelo…) são as mesmas — só o nome e a quantidade mudam.
//
// ⚠️ FUTEBOL = EXATAMENTE o de hoje (mesmos nomes do types.ts). Não muda nada.

import type { Sector } from './types'
import { SECTORS } from './types'
import type { Sport } from './sport'

export type PosLabel = {
  plural: { pt: string; en: string } // título da rodada/lista (ex.: "Goleiros" / "Armadores")
  singular: { pt: string; en: string } // 1 jogador (ex.: "Goleiro" / "Armador")
  tag: string // selo curto na carta (ex.: "GOL" / "PG")
}

// rótulo de cada SETOR por esporte. Futebol repete o texto em en (nunca é
// exibido em inglês — o futebol é 100% PT); basquete é bilíngue de verdade.
export const POS_LABELS: Record<Sport, Record<Sector, PosLabel>> = {
  futebol: {
    GOL: { plural: { pt: 'Goleiros', en: 'Goleiros' }, singular: { pt: 'Goleiro', en: 'Goleiro' }, tag: 'GOL' },
    LAT: { plural: { pt: 'Laterais', en: 'Laterais' }, singular: { pt: 'Lateral', en: 'Lateral' }, tag: 'LAT' },
    ZAG: { plural: { pt: 'Zagueiros', en: 'Zagueiros' }, singular: { pt: 'Zagueiro', en: 'Zagueiro' }, tag: 'ZAG' },
    MEI: { plural: { pt: 'Meio-campo', en: 'Meio-campo' }, singular: { pt: 'Meia', en: 'Meia' }, tag: 'MEI' },
    ATA: { plural: { pt: 'Ataque', en: 'Ataque' }, singular: { pt: 'Atacante', en: 'Atacante' }, tag: 'ATA' },
  },
  // basquete: as 5 posições da NBA nos mesmos 5 slots (PG→GOL … C→ATA)
  basquete: {
    GOL: { plural: { pt: 'Armadores', en: 'Point Guards' }, singular: { pt: 'Armador', en: 'Point Guard' }, tag: 'PG' },
    LAT: { plural: { pt: 'Ala-armadores', en: 'Shooting Guards' }, singular: { pt: 'Ala-armador', en: 'Shooting Guard' }, tag: 'SG' },
    ZAG: { plural: { pt: 'Alas', en: 'Small Forwards' }, singular: { pt: 'Ala', en: 'Small Forward' }, tag: 'SF' },
    MEI: { plural: { pt: 'Ala-pivôs', en: 'Power Forwards' }, singular: { pt: 'Ala-pivô', en: 'Power Forward' }, tag: 'PF' },
    ATA: { plural: { pt: 'Pivôs', en: 'Centers' }, singular: { pt: 'Pivô', en: 'Center' }, tag: 'C' },
  },
}

// vagas no LEILÃO INICIAL por setor:
//  - futebol: vem da FORMAÇÃO (1/2/2/3/3 ou 1/2/2/4/2) — este mapa NÃO é usado
//    no futebol; fica como referência da regra atual.
//  - basquete: 2 por posição (a "rotação" = 10). Titular no quinteto = 1 por posição.
export const INITIAL_SLOTS: Record<Sport, Record<Sector, number>> = {
  futebol: { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }, // = 11 (formação 4-3-3, base)
  basquete: { GOL: 2, LAT: 2, ZAG: 2, MEI: 2, ATA: 2 }, // = 10 (rotação)
}

// quinteto TITULAR do basquete = 1 por posição (5). (futebol titular = a formação.)
export const STARTER_SLOTS: Record<Sport, Record<Sector, number>> = {
  futebol: { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 },
  basquete: { GOL: 1, LAT: 1, ZAG: 1, MEI: 1, ATA: 1 },
}

// palavra de "gol" por esporte (placar/artilharia) — pro texto da temporada depois.
export const SCORE_WORD: Record<Sport, { goal: { pt: string; en: string }; scorer: { pt: string; en: string } }> = {
  futebol: { goal: { pt: 'gol', en: 'gol' }, scorer: { pt: 'Artilheiros', en: 'Artilheiros' } },
  basquete: { goal: { pt: 'cesta', en: 'basket' }, scorer: { pt: 'Cestinhas', en: 'Scoring leaders' } },
}

// helpers curtos (o esporte é resolvido por quem chama; futebol é o padrão)
export function posLabel(sport: Sport, s: Sector): PosLabel { return POS_LABELS[sport][s] }
export function sectorTitle(sport: Sport, s: Sector, lang: 'pt' | 'en'): string { return POS_LABELS[sport][s].plural[lang] }

// sanity: garante que todo setor tem rótulo nos dois esportes (pega erro de digitação em build)
SECTORS.forEach(s => { void POS_LABELS.futebol[s]; void POS_LABELS.basquete[s] })
