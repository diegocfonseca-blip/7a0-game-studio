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

// 🏀 VAGAS POR POSIÇÃO NO BASQUETE — cada posição usa a regra de um slot que o
// motor JÁ conhece (decidido com o Diego 27/07):
//   - modo RÁPIDO (offline + online): 1 por posição → 5 (o quinteto titular).
//     Cada posição se comporta como o GOLEIRO do futebol (1 vaga). Você leiloa
//     o time que entra em quadra, igual o rápido do futebol leiloa o XI.
//   - modo CARREIRA: 2 por posição → 10 (a rotação). Cada posição se comporta
//     como o LATERAL (2 vagas). Reservas (parada do meio) +1 por posição →
//     3 por posição = elenco 15.
// (No futebol as vagas vêm da FORMAÇÃO 1/2/2/3/3 — nada disso muda lá.)
// 🗳️ MODELO APROVADO (Diego 27/07) — espelho FIEL do futebol:
//   • TODO time começa com o QUINTETO (1/posição = 5) — o "XI do basquete", os 5
//     que entram em quadra. Igual o futebol começa todo mundo com o XI (11).
//   • O leilão de RESERVAS enche SÓ você + rivais: quinteto → rotação (2/pos=10)
//     → elenco cheio (3/pos=15). Os bots ficam no quinteto (5), como a Série D do
//     futebol fica no XI (11). Desbloqueios por temporada, iguais ao futebol:
//     T1 monta titulares · T2 reservas · T3 vender.
export const NBA_SLOTS_PER_POS = { quick: 1, career: 1, rotation: 2, roster: 3 } as const

// total de jogadores por etapa (5 posições × vagas): quinteto → rotação → elenco.
export const NBA_INITIAL_TOTAL = { quick: 5, career: 5, rotation: 10, roster: 15 } as const

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
