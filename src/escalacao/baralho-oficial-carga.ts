// 🇧🇷 BRASIL OFICIAL — as 2 mil+ cartas do modo SÓ DESCEM PRA QUEM ENTRA NELE (15/11).
// O `baralho-oficial.ts` (e o `data-oficial.ts` gerado) pesava +124 KB gz no arquivo principal, pago por TODO jogador. Agora ele
// vira um pedaço separado, baixado na hora que alguém abre o modo. Quem lê as cartas pergunta aqui:
//   · `baralhoOficial()` → o baralho, ou `null` se ainda não baixou;
//   · `carregaBaralhoOficial()` → baixa (uma vez só) e devolve.
// ⚠️ REGRA DE SEGURANÇA: sem o baralho baixado, NADA de carreira oficial roda (a tela espera) e a atualização de ficha dos saves
// (`sincronizaNiveis`) não toca num save oficial — senão ela "corrigia" carta do modo pro xará do baralho de sempre.
import type { Sector } from './types'
import type { CartaOficial } from './data-oficial'

export type BaralhoOficial = Record<Sector, (CartaOficial & { folk?: boolean })[]>
let BARALHO: BaralhoOficial | null = null
let PROMESSA: Promise<BaralhoOficial> | null = null

export const baralhoOficial = (): BaralhoOficial | null => BARALHO
export function carregaBaralhoOficial(): Promise<BaralhoOficial> {
  if (BARALHO) return Promise.resolve(BARALHO)
  if (!PROMESSA) PROMESSA = import('./baralho-oficial').then(m => (BARALHO = m.CATALOG_OFICIAL_MODO)).catch(e => { PROMESSA = null; throw e })
  return PROMESSA
}
