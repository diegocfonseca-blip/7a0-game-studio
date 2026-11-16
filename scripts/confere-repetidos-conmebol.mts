// 🃏 o MESMO jogador não pode estar duas vezes no MESMO baralho (regra do Diego, 26/09; 16/11: *"só disse que não pode no mesmo
// baralho"*). As cartas dos lotes Conmebol (docs/brasil-oficial/cartas-conmebol-*.md) moram no baralho do BRASIL OFICIAL — então
// confere só contra as outras cartas desse baralho (data-oficial.ts) e entre os próprios lotes. Ter carta no baralho Brasil, Europa
// ou Mundo (data.ts) NÃO impede: o Jhon Arias do Fluminense (Brasil) pode ter carta no Atlético Nacional (Brasil Oficial).
// Linha marcada "xará" na obs é outra pessoa e passa. Uso: npx tsx scripts/confere-repetidos-conmebol.mts
import { readFileSync, readdirSync } from 'node:fs'
import { CATALOG_OFICIAL } from '../src/escalacao/data-oficial.ts'
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const base = new Map<string, Set<string>>()
const add = (n: string, c: string) => { const k = norm(n); (base.get(k) ?? base.set(k, new Set()).get(k)!).add(c) }
const lotes: { nome: string; clube: string; arq: string; xara: boolean }[] = []
for (const f of readdirSync('docs/brasil-oficial').filter(f => f.startsWith('cartas-conmebol-'))) {
  let clube = ''
  for (const ln of readFileSync('docs/brasil-oficial/' + f, 'utf8').split('\n')) {
    if (ln.startsWith('## ')) { clube = ln.slice(3).trim(); continue }
    if (!ln.startsWith('|') || /^\|\s*(nome|-)/i.test(ln) || /dúvidas/i.test(clube)) continue
    const cel = ln.split('|').map(x => x.trim())
    if (!['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'].includes(cel[2])) continue
    lotes.push({ nome: cel[1], clube, arq: f, xara: /xar/i.test(cel[10] ?? '') })
  }
}
const deLote = new Set(lotes.map(x => `${norm(x.nome)}|${x.clube}`))
for (const l of Object.values(CATALOG_OFICIAL)) for (const c of l) if (!deLote.has(`${norm(c.name)}|${c.club}`)) add(c.name, c.club)
let n = 0
const vistos = new Map<string, string>()
for (const x of lotes) {
  if (x.xara) continue
  const k = norm(x.nome)
  const outros = [...(base.get(k) ?? [])].filter(c => c !== x.clube)
  if (outros.length) { n++; console.log(`⚠️ ${x.nome} (${x.clube}, ${x.arq}) já tem carta no baralho do Brasil Oficial em: ${outros.join(', ')}`) }
  const v = vistos.get(k)
  if (v && v !== x.clube) { n++; console.log(`⚠️ ${x.nome} em dois lotes: ${v} e ${x.clube} (${x.arq})`) }
  vistos.set(k, x.clube)
}
console.log(n ? `❌ ${n} nome(s) pra conferir` : `✅ ${lotes.length} cartas dos lotes Conmebol, nenhum nome repetido em outro clube`)
