// 🇧🇷 BRASIL OFICIAL: o baralho EXTRA do modo = as cartas pesquisadas pro modo (`data-oficial.ts`, gerado) + as cartas do
// baralho REGIONAL dos clubes do modo (CSA, Bangu, Moto Club, ABC… já moram em `cartas-regionais.ts` desde 10/10 — os lotes
// da Série D contaram com elas e não repetiram ninguém). Continua valendo a regra de 15/11: nada daqui sai do modo
// (Partida Rápida, salas e carreira de time criado nunca leem este arquivo).
import type { Sector } from './types'
import { CATALOG_OFICIAL, type CartaOficial } from './data-oficial'
import { CARTAS_REGIONAIS } from './cartas-regionais'
import { CLUBES_BR_TODOS } from './brasil-oficial'

const DO_MODO = new Set(CLUBES_BR_TODOS.flatMap(c => [c.nome, ...(c.apelidos ?? [])]))
export const CATALOG_OFICIAL_MODO: Record<Sector, (CartaOficial & { folk?: boolean })[]> = (() => {
  const out = {} as Record<Sector, (CartaOficial & { folk?: boolean })[]>
  // a mesma carta (nome|clube|ano) não entra duas vezes nem em posição diferente — a da pesquisa do modo ganha (ex.: Capone,
  // Juventude 1999: zagueiro na pesquisa, outra posição no regional)
  const vistas = new Set(Object.values(CATALOG_OFICIAL).flat().map(c => `${c.name}|${c.club}|${c.year}`))
  for (const p of Object.keys(CATALOG_OFICIAL) as Sector[]) {
    const reg = (CARTAS_REGIONAIS[p] ?? []).filter(c => DO_MODO.has(c.club) && !vistas.has(`${c.name}|${c.club}|${c.year}`))
      .map(c => ({ ...c, bio: c.bio ?? '', bioEn: '' }))
    out[p] = [...CATALOG_OFICIAL[p], ...reg]
  }
  return out
})()
