// 🔗 ENTROSAMENTO (24/10, aprovado pelo Diego: "ok pode fazer"). Cartas do MESMO clube e do MESMO ano juntas no
// TIME TITULAR jogaram juntas de verdade — então rendem um pouco mais juntas:
//   · 2 juntas → +1 de nível pra cada · 3 ou mais → +2 pra cada (teto: nunca passa de +2).
//   · Só os 11 titulares (banco e machucado não contam). Jogador de mentira (Várzea/Pickup/fake) nunca entrosa.
//   · Só carreira, e só a partir da rodada em que ligou (`entroDesde`): jogo já jogado nunca muda de placar.
// Entra no `lo`/`hi` da carta naquele jogo — o mesmo lugar do gás — então o dado da rodada é consumido igual e nenhum
// jogo de bot muda. Mockup: `scripts/mockups/carreira-entrosamento.png`.
export interface CartaEntro { id: string; name: string; club: string; year: number; fake?: boolean }
export interface GrupoEntro { club: string; year: number; nomes: string[]; ids: string[]; bonus: number }

export const ENTRO_TETO = 2
const ehDeMentira = (c: CartaEntro) => !!c.fake || c.club === 'Várzea' || c.club === 'Pickup'
export const chaveEntro = (c: { club: string; year: number }) => `${c.club}|${c.year}`
export const bonusDoGrupo = (n: number): number => (n >= 3 ? ENTRO_TETO : n === 2 ? 1 : 0)

/** os grupos entrosados de um time titular (2+ cartas do mesmo clube e ano), do maior pro menor */
export function gruposEntro(xi: CartaEntro[]): GrupoEntro[] {
  const m = new Map<string, CartaEntro[]>()
  for (const c of xi) {
    if (!c || ehDeMentira(c)) continue
    const k = chaveEntro(c), l = m.get(k)
    if (l) { if (!l.some(x => x.name === c.name)) l.push(c) } else m.set(k, [c]) // a mesma pessoa duas vezes não conta 2
  }
  const out: GrupoEntro[] = []
  for (const l of m.values()) if (l.length >= 2) out.push({ club: l[0].club, year: l[0].year, nomes: l.map(c => c.name), ids: l.map(c => c.id), bonus: bonusDoGrupo(l.length) })
  return out.sort((a, b) => b.nomes.length - a.nomes.length || a.club.localeCompare(b.club))
}

/** id da carta → bônus (só quem está num grupo) */
export function bonusEntro(xi: CartaEntro[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const g of gruposEntro(xi)) for (const id of g.ids) out[id] = g.bonus
  return out
}

/** o time com o bônus aplicado no `lo`/`hi` (carta nova, a original não muda). Sem grupo = o MESMO array. */
export function comEntro<T extends CartaEntro & { lo: number; hi: number }>(xi: T[]): T[] {
  const b = bonusEntro(xi)
  if (!Object.keys(b).length) return xi
  return xi.map(c => (b[c.id] ? { ...c, lo: c.lo + b[c.id], hi: c.hi + b[c.id], entro: b[c.id] } : c))
}

/** 🔨 leilão: com quem do SEU elenco esta carta entrosaria (só nomes que você já tem — o nível segue escondido) */
export function entrosaCom(carta: { name: string; club: string; year: number }, elenco: CartaEntro[]): string[] {
  if (carta.club === 'Várzea' || carta.club === 'Pickup') return []
  const k = chaveEntro(carta), nomes: string[] = []
  for (const c of elenco) if (!ehDeMentira(c) && chaveEntro(c) === k && c.name !== carta.name && !nomes.includes(c.name)) nomes.push(c.name)
  return nomes
}
