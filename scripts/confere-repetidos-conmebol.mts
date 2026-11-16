// 🃏 o MESMO jogador não pode estar duas vezes no MESMO baralho (regra do Diego, 26/09; 16/11: *"só disse que não pode no mesmo
// baralho"*). O Brasil Oficial tem baralho próprio: as cartas de `data-oficial.ts` (geradas de docs/brasil-oficial/cartas-*.md).
// Ter carta no baralho Brasil, Europa ou Mundo (data.ts) NÃO impede: o Jhon Arias do Fluminense (Brasil) pode ter carta no
// Atlético Nacional (Brasil Oficial). Confere: (1) o baralho gerado (`data-oficial.ts`) e (2) os lotes ainda não gerados cujo
// cabeçalho já é o nome do clube (cartas-d-*, cartas-conmebol-*). Linha com "xará" na obs = outra pessoa, passa.
// Uso: npx tsx scripts/confere-repetidos-conmebol.mts
import { readFileSync, readdirSync } from 'node:fs'
import { CATALOG_OFICIAL } from '../src/escalacao/data-oficial.ts'
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const clubes = new Map<string, Set<string>>(), xara = new Set<string>()
const add = (n: string, c: string) => { const k = norm(n); (clubes.get(k) ?? clubes.set(k, new Set()).get(k)!).add(c) }
for (const l of Object.values(CATALOG_OFICIAL)) for (const c of l) add(c.name, c.club)
let total = 0
for (const f of readdirSync('docs/brasil-oficial').filter(f => /^cartas-(d|conmebol)-.*\.md$/.test(f))) {
  let clube = ''
  for (const ln of readFileSync('docs/brasil-oficial/' + f, 'utf8').split('\n')) {
    if (ln.startsWith('## ')) { clube = ln.slice(3).trim(); continue }
    if (!ln.startsWith('|') || /^\|\s*(nome|-)/i.test(ln) || /dúvidas|descart|xar|confer|tota|ponto/i.test(clube)) continue
    const cel = ln.split('|').map(x => x.trim())
    if (!['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'].includes(cel[2])) continue
    total++
    if (/xar/i.test(cel[10] ?? '')) { xara.add(norm(cel[1])); continue }
    add(cel[1], clube)
  }
}
let n = 0
for (const [k, cs] of clubes) if (cs.size > 1 && !xara.has(k)) { n++; console.log(`⚠️ "${k}" em ${cs.size} clubes do baralho do Brasil Oficial: ${[...cs].join(', ')}`) }
console.log(n ? `❌ ${n} nome(s) pra conferir (mesma pessoa? se for xará, escreva "xará" na obs)` : `✅ baralho do Brasil Oficial (${total} cartas nos lotes d/conmebol + o gerado): nenhum nome em dois clubes`)
