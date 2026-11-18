// 🇧🇷 BRASIL OFICIAL: o baralho EXTRA do modo = as cartas pesquisadas pro modo (`data-oficial.ts`, gerado) + as cartas do
// baralho REGIONAL dos clubes do modo (CSA, Bangu, Moto Club, ABC… já moram em `cartas-regionais.ts` desde 10/10 — os lotes
// da Série D contaram com elas e não repetiram ninguém). Continua valendo a regra de 15/11: nada daqui sai do modo
// (Partida Rápida, salas e carreira de time criado nunca leem este arquivo).
import type { Sector } from './types'
import { CATALOG_OFICIAL, type CartaOficial } from './data-oficial'
import { CARTAS_REGIONAIS } from './cartas-regionais'
import { CLUBES_BR_TODOS } from './brasil-oficial'

// 🃏 MESMA PESSOA em duas cartas (conferido no Transfermarkt em 15/11): no modo fica só a carta mais importante; a outra some
// SÓ daqui (o baralho regional continua igual nas copas regionais). Regra do Diego: a mesma pessoa uma vez no baralho Brasil.
const ESCONDIDAS = new Set([
  // (Zenon: 17/11 virou o contrário — fica o Guarani 1978 e o Corinthians 1983 some do modo, `BASE_ESCONDIDA_NO_MODO`)
  'Pintado|América-MG|1997', // fica o do São Paulo 1993
  'Wilson|Figueirense|2007', // fica o Figueirense 2010 (fame 3)
  'Lucas Ramon|Londrina|2017', // fica o Mirassol 2025 (está no regional E na pesquisa: some dos dois)
  'Fernando Sobral|Sampaio Corrêa|2018', // fica o Ceará 2021
  'Danielzinho|Sampaio Corrêa|2018', // fica o Mirassol 2025
])
const DO_MODO = new Set(CLUBES_BR_TODOS.flatMap(c => [c.nome, ...(c.apelidos ?? [])]))
export const CATALOG_OFICIAL_MODO: Record<Sector, (CartaOficial & { folk?: boolean })[]> = (() => {
  const out = {} as Record<Sector, (CartaOficial & { folk?: boolean })[]>
  // a mesma carta (nome|clube|ano) não entra duas vezes nem em posição diferente — a da pesquisa do modo ganha (ex.: Capone,
  // Juventude 1999: zagueiro na pesquisa, outra posição no regional)
  const vistas = new Set(Object.values(CATALOG_OFICIAL).flat().map(c => `${c.name}|${c.club}|${c.year}`))
  for (const p of Object.keys(CATALOG_OFICIAL) as Sector[]) {
    const reg = (CARTAS_REGIONAIS[p] ?? []).filter(c => DO_MODO.has(c.club) && !vistas.has(`${c.name}|${c.club}|${c.year}`))
      .map(c => ({ ...c, bio: c.bio ?? '', bioEn: '' }))
    out[p] = [...CATALOG_OFICIAL[p], ...reg].filter(c => !ESCONDIDAS.has(`${c.name}|${c.club}|${c.year}`))
  }
  return out
})()
