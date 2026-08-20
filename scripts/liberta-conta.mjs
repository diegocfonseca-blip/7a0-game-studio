// 🌎 conta o baralho temático da Libertadores.
//
// REGRA (Diego, 20/08): a carta entra se **o clube dela disputou a Libertadores
// naquele ano**. *"N importa a nacionalidade"* — então o filtro olha o CLUBE da
// carta, não o baralho (BR/Europa/Mundo) em que ela mora. Marzolini/Boca/1965
// está no baralho Mundo e entra, porque o Boca jogou a Libertadores de 1965.
//
// FONTE: `docs/libertadores-por-clube.txt` — a lista que o Diego mandou, todos
// os países, até a edição de 2026. Corrigir uma linha lá corrige tudo aqui.
import { readFileSync } from 'node:fs'

const txt = readFileSync('docs/libertadores-por-clube.txt', 'utf8')
const PART = {}
for (const l of txt.split('\n')) {
  if (!l.includes('—') || l.startsWith('#')) continue
  const [clube, anos] = l.split('—').map(x => x.trim())
  for (const a of anos.split(',').map(x => +x.trim())) {
    if (a) (PART[a] = PART[a] || new Set()).add(clube)
  }
}
// 🚫 caiu na PRÉ e não chegou aos grupos → regra do Diego: NÃO conta
const CAIU_NA_PRE = { 2011: ['Corinthians'], 2020: ['Corinthians'], 2021: ['Grêmio'], 2022: ['Fluminense'], 2024: ['Red Bull Bragantino'] }
for (const a of Object.keys(CAIU_NA_PRE)) for (const c of CAIU_NA_PRE[a]) PART[a]?.delete(c)

const data = readFileSync('src/escalacao/data.ts', 'utf8')
const blocos = [...data.matchAll(/const (\w+): C\[\] = \[/g)].map(m => ({ n: m[1], p: m.index }))
const blocoDe = p => { let r = ''; for (const b of blocos) { if (b.p < p) r = b.n; else break } return r }
const re = /\{[^{}]*?name:\s*("[^"]+"|'[^']+'),\s*club:\s*("[^"]*"|'[^']*'),\s*year:\s*(\d+),\s*fame:\s*(\d)/g
const st = x => x.slice(1, -1)
const all = [...data.matchAll(re)].map(m => ({ bl: blocoDe(m.index), nome: st(m[1]), club: st(m[2]), year: +m[3], fame: +m[4] }))
const pos = c => /GOL/.test(c.bl) ? 'GOL' : /LAT/.test(c.bl) ? 'LAT' : /ZAG/.test(c.bl) ? 'ZAG' : /MEI/.test(c.bl) ? 'MEI' : 'ATA'

const dentro = all.filter(c => PART[c.year]?.has(c.club))
const cnt = l => { const m = { GOL: 0, LAT: 0, ZAG: 0, MEI: 0, ATA: 0 }; for (const c of l) m[pos(c)]++; return m }
const m = cnt(dentro)
console.log(`baralho 🌎 Libertadores: ${dentro.length} cartas (de ${all.length} do jogo inteiro)`)
console.log(`lendas: ${dentro.filter(c => c.fame === 5).length} · craques: ${dentro.filter(c => c.fame === 4).length}`)
console.log('')
// ⚠️ os 20 times da liga TÊM elenco nomeado (makeManagers) e o botSquad completa
// com incógnita quando o catálogo acaba — então a conta é 20 × vagas da posição.
const S = { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }
console.log('vestir a liga de 20 times:')
let falta = 0
for (const p of ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']) {
  const tem = m[p], precisa = 20 * S[p]
  if (tem < precisa) falta += precisa - tem
  console.log(`  ${p}: tem ${String(tem).padStart(3)} · precisa ${String(precisa).padStart(3)} → ` +
    (tem >= precisa ? `✅ sobra ${tem - precisa}` : `❌ faltam ${precisa - tem}`))
}
console.log(falta === 0 ? '\n✅ DÁ: a liga de 20 fecha inteira com jogador de verdade.'
  : `\n⚠️ faltam ${falta} cartas.`)
if (process.argv.includes('--estrangeiros')) {
  const est = dentro.filter(c => !/^(GOL|LAT|ZAG|MEI|ATA)$|_BR/.test(c.bl))
  console.log(`\n🌎 dos ${dentro.length}, ${est.length} vieram dos baralhos Europa/Mundo:`)
  console.log(est.map(c => `${c.nome} (${c.club} ${c.year})`).join(' · '))
}
