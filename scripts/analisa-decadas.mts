// 📅 Análise (30/10): quantos pacotes POR DÉCADA fecham em cada posição (clube e seleção) e quais estão perto de fechar.
// Mínimo por pacote = vagas do 4-3-3 + 1 (mesma régua do Leilão de Clubes). Uso: npx tsx scripts/analisa-decadas.mts
import { CATALOG, CATALOG_EU, CATALOG_WORLD, clubCanon } from '../src/escalacao/data'
import { paisDe } from '../src/escalacao/paises'
const SECS = ['GOL','LAT','ZAG','MEI','ATA'] as const
const MIN: Record<string, number> = { GOL: 2, LAT: 3, ZAG: 3, MEI: 4, ATA: 4 } // need(4-3-3)+1, regra do Clubes
const dec = (y: number) => Math.floor(y / 10) * 10
type M = Map<string, Record<string, number>>
const clube: M = new Map(), pais: M = new Map(), clubeT: M = new Map(), paisT: M = new Map()
const inc = (m: M, k: string, s: string) => { const r = m.get(k) ?? m.set(k, { GOL:0,LAT:0,ZAG:0,MEI:0,ATA:0 }).get(k)!; r[s]++ }
for (const [cat, b] of [[CATALOG,'BR'],[CATALOG_EU,'EU'],[CATALOG_WORLD,'WORLD']] as const) for (const s of SECS) for (const c of (cat as any)[s] ?? []) {
  const k = clubCanon(c.club); inc(clube, `${k}|${dec(c.year)}`, s); inc(clubeT, k, s)
  const p = paisDe(c.name, b as any, c.club, c.year); if (p) { inc(pais, `${p}|${dec(c.year)}`, s); inc(paisT, p, s) }
}
const conta = (m: M, nome: string) => {
  console.log(`\n== ${nome}: pacotes possíveis por posição (≥ mínimo) | faltando 1 | faltando 2`)
  for (const s of SECS) {
    let ok = 0, f1 = 0, f2 = 0
    for (const r of m.values()) { const d = MIN[s] - r[s]; if (d <= 0) ok++; else if (d === 1) f1++; else if (d === 2) f2++ }
    console.log(`${s}: ${ok} | ${f1} | ${f2}`)
  }
  // combos "quase completos": já fecham 3+ posições
  let tudo = 0, quatro = 0
  for (const r of m.values()) { const n = SECS.filter(s => r[s] >= MIN[s]).length; if (n === 5) tudo++; else if (n === 4) quatro++ }
  console.log(`fecham as 5 posições: ${tudo} · fecham 4: ${quatro}`)
}
conta(clubeT, 'CLUBE INTEIRO (hoje)'); conta(clube, 'CLUBE POR DÉCADA'); conta(paisT, 'SELEÇÃO INTEIRA'); conta(pais, 'SELEÇÃO POR DÉCADA')
// por década: quantos clubes fecham cada posição em cada década
console.log('\n== CLUBE POR DÉCADA, por década (GOL/LAT/ZAG/MEI/ATA que fecham)')
for (const d of [1950,1960,1970,1980,1990,2000,2010,2020]) { const r = SECS.map(s => [...clube].filter(([k, v]) => k.endsWith('|'+d) && v[s] >= MIN[s]).length); console.log(d, r.join('/')) }
console.log('\n== SELEÇÃO POR DÉCADA, por década')
for (const d of [1950,1960,1970,1980,1990,2000,2010,2020]) { const r = SECS.map(s => [...pais].filter(([k, v]) => k.endsWith('|'+d) && v[s] >= MIN[s]).length); console.log(d, r.join('/')) }
// clubes-década mais perto de fechar as 5 posições (faltam poucas cartas)
const faltam = [...clube].map(([k, r]) => [k, SECS.reduce((a, s) => a + Math.max(0, MIN[s] - r[s]), 0), SECS.map(s => `${s}${Math.max(0, MIN[s]-r[s])}`).filter(x => !x.endsWith('0')).join(' ')] as const).filter(x => x[1] > 0 && x[1] <= 4).sort((a, b) => a[1] - b[1])
console.log('\n== clube|década que fecham as 5 posições com até 4 cartas novas:', faltam.length); console.log(faltam.slice(0, 40).map(x => `${x[0]} (+${x[1]}: ${x[2]})`).join('\n'))
const fp = [...pais].map(([k, r]) => [k, SECS.reduce((a, s) => a + Math.max(0, MIN[s] - r[s]), 0), SECS.map(s => `${s}${Math.max(0, MIN[s]-r[s])}`).filter(x => !x.endsWith('0')).join(' ')] as const).filter(x => x[1] > 0 && x[1] <= 6).sort((a, b) => a[1] - b[1])
console.log('\n== seleção|década que fecham com até 6 cartas novas:', fp.length); console.log(fp.slice(0, 40).map(x => `${x[0]} (+${x[1]}: ${x[2]})`).join('\n'))
