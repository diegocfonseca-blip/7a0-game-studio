// ─── 🃏 O BARALHO INTEIRO DO JOGO (21/11) ────────────────────────────────────────────────────────────────────────────
// Diego: *"as cartas do jogo têm que ser todas do baralho inteiro… até mesmo de estaduais, do campeonato brasileiro A B C D,
// Sul-Americana, Libertadores. Não importa: a carta que tenha no jogo serve pro baralho inteiro entrar aleatoriamente quando
// alguém for campeão"*.
// Os 3 baralhos de sempre (Brasil, Europa, Mundo) já estavam no pacote do campeão. Aqui moram os que faltavam:
//   · as cartas REGIONAIS (copas regionais; já descem com o jogo);
//   · as do BRASIL OFICIAL (2 mil+; um pedaço separado, que só desce na hora — `carregaBaralhoOficial`).
// Quem usa: o pacote do campeão (`CardCollectPrompt`/`garanteCartaDoTitulo`) e o Bafo (pra saber a força da carta).
import type { Sector } from './types'
import { SECTORS } from './types'
import { CARTAS_REGIONAIS } from './cartas-regionais'
import { baralhoOficial, carregaBaralhoOficial } from './baralho-oficial-carga'

export interface CartaExtra { name: string; club: string; year: number; pos: Sector; fame: number; lo: number; hi: number; folk?: boolean; bio?: string }
type Cru = { name: string; club: string; year: number; fame: number; lo: number; hi: number; folk?: boolean; bio?: string }

function achata(cat: Partial<Record<Sector, readonly Cru[]>> | null | undefined, vistas: Set<string>, out: CartaExtra[]) {
  if (!cat) return
  for (const pos of SECTORS) for (const c of cat[pos] ?? []) {
    const k = `${c.name}|${c.club}|${c.year}`
    if (vistas.has(k)) continue
    vistas.add(k)
    out.push({ name: c.name, club: c.club, year: c.year, pos, fame: c.fame, lo: c.lo, hi: c.hi, folk: c.folk, bio: c.bio || undefined })
  }
}
/** as cartas de fora dos 3 baralhos que JÁ estão no aparelho (regionais sempre; Oficial só se já baixou) */
export function cartasExtras(): CartaExtra[] {
  const out: CartaExtra[] = [], vistas = new Set<string>()
  achata(baralhoOficial(), vistas, out) // a do modo ganha da regional (mesma regra do `CATALOG_OFICIAL_MODO`)
  achata(CARTAS_REGIONAIS, vistas, out)
  return out
}
/** baixa o baralho do Oficial (uma vez) e devolve todas as extras. Sem rede em `esperaMs` → devolve o que já tem (nunca trava o pacote). */
export async function carregaCartasExtras(esperaMs = 6000): Promise<CartaExtra[]> {
  try { await Promise.race([carregaBaralhoOficial(), new Promise(r => setTimeout(r, esperaMs))]) } catch { /* sem rede: segue com as que tem */ }
  return cartasExtras()
}
