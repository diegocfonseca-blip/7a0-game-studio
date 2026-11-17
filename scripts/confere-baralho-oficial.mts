// 🃏 REGRA DO DIEGO (16/11, corrigida): são TRÊS baralhos — Brasil, Europa e Mundo. A mesma pessoa pode ter UMA carta em cada,
// nunca duas no mesmo (*"Neymar pode no Santos baralho Brasil, Neymar Barcelona Europa e Neymar Al Hilal do Mundo"*).
// No Brasil Oficial, carta de clube BRASILEIRO é do baralho Brasil e carta de clube de FORA (Liberta/Sula) é do baralho Mundo.
// Então a carta do modo não pode repetir pessoa que já está no MESMO baralho em data.ts, nem outra carta do modo do mesmo baralho.
// Uso: npx tsx scripts/confere-baralho-oficial.mts   (lista os conflitos; sai com erro se tiver algum)
import { readFileSync, readdirSync } from 'node:fs'
import { CATALOG, CATALOG_WORLD } from '../src/escalacao/data.ts'
import { CATALOG_OFICIAL } from '../src/escalacao/data-oficial.ts'
import { ESTRANGEIROS_LIBERTA_2026 } from '../src/escalacao/libertadores-oficial.ts'
import { ESTRANGEIROS_SULA_2026 } from '../src/escalacao/sul-americana-oficial.ts'
import { CLUBES_INTERCONTINENTAL } from '../src/escalacao/intercontinental-oficial.ts'
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s*\(.*\)\s*/g, '').trim()
const fora = new Set([...[...ESTRANGEIROS_LIBERTA_2026, ...ESTRANGEIROS_SULA_2026].map((c: { nome: string }) => c.nome), ...CLUBES_INTERCONTINENTAL])
type Carta = { name: string; club: string; year: number }
const base: Record<'BR' | 'MUNDO', Map<string, Carta[]>> = { BR: new Map(), MUNDO: new Map() }
const pus = (m: Map<string, Carta[]>, c: Carta) => { const k = norm(c.name); (m.get(k) ?? m.set(k, []).get(k)!).push(c) }
for (const l of Object.values(CATALOG)) for (const c of l as Carta[]) pus(base.BR, c)
for (const l of Object.values(CATALOG_WORLD)) for (const c of l as Carta[]) pus(base.MUNDO, c)
const modo: Record<'BR' | 'MUNDO', Map<string, Carta[]>> = { BR: new Map(), MUNDO: new Map() }
for (const l of Object.values(CATALOG_OFICIAL)) for (const c of l as Carta[]) pus(modo[fora.has(c.club) ? 'MUNDO' : 'BR'], c)
// linha do lote com "xará" = outra pessoa com o mesmo nome (conferida na pesquisa) — passa
const xara = new Set<string>()
for (const f of readdirSync('docs/brasil-oficial').filter(f => f.startsWith('cartas-') && f.endsWith('.md')))
  for (const ln of readFileSync('docs/brasil-oficial/' + f, 'utf8').split('\n')) if (ln.startsWith('|') && /xar[áa]/i.test(ln)) xara.add(norm(ln.split('|')[1] ?? ''))
const mesma = (a: Carta, b: Carta) => a.name === b.name && a.club === b.club && a.year === b.year
let n = 0
for (const d of ['BR', 'MUNDO'] as const) for (const [k, cs] of modo[d]) {
  if (xara.has(k)) continue
  const ja = (base[d].get(k) ?? []).filter(b => !cs.some(c => mesma(b, c)))
  if (ja.length || cs.length > 1) { n++; console.log(`${d}\t${k}\tmodo: ${cs.map(c => c.club + ' ' + c.year).join(', ')}\tjá no baralho: ${ja.map(c => c.club + ' ' + c.year).join(', ')}`) }
}
console.log(n ? `❌ ${n} pessoa(s) repetida(s) no mesmo baralho` : '✅ nenhuma pessoa repetida no mesmo baralho (Brasil / Mundo)')
if (n) process.exit(1)
