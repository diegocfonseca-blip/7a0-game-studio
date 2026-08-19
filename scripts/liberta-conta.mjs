// 🌎 conta o baralho temático da Libertadores a partir da lista clube+ano.
// A lista vive em `docs/libertadores-participantes.md` (fonte única) — este
// script LÊ a tabela de lá, então corrigir o doc já corrige a conta.
import { readFileSync } from 'node:fs'

const md = readFileSync('docs/libertadores-participantes.md', 'utf8')
const PART = {}
for (const l of md.split('\n')) {
  const m = l.match(/^\|\s*(\d{4})\s*\|\s*(.+?)\s*\|\s*[✅🟡❓⛔]/)
  if (!m) continue
  const ano = +m[1]
  let txt = m[2]
  if (/Brasil não participou|só começou/.test(txt)) { PART[ano] = []; continue }
  // "Clube NÃO (motivo)" = quem caiu na pré ou não jogou → sai da lista
  txt = txt.replace(/\*\*([^*]+?)\s*NÃO\*\*\s*\([^)]*\)/g, '').replace(/—\s*$/, '')
  PART[ano] = txt.split(',').map(t => t
    .replace(/\*\*/g, '').replace(/\([^)]*\)/g, '').replace(/←.*$/, '')
    .replace(/^\s*[–—-]\s*/, '').trim()).filter(t => t && !/^(não checado|resto)/i.test(t))
}

const data = readFileSync('src/escalacao/data.ts', 'utf8')
const blocos = [...data.matchAll(/const (\w+): C\[\] = \[/g)].map(m => ({ n: m[1], p: m.index }))
const blocoDe = p => { let r = ''; for (const b of blocos) { if (b.p < p) r = b.n; else break } return r }
const re = /\{[^{}]*?name:\s*("[^"]+"|'[^']+'),\s*club:\s*("[^"]*"|'[^']*'),\s*year:\s*(\d+),\s*fame:\s*(\d)/g
const st = x => x.slice(1, -1)
const all = [...data.matchAll(re)].map(m => ({ bl: blocoDe(m.index), nome: st(m[1]), club: st(m[2]), year: +m[3], fame: +m[4] }))
const BR = all.filter(c => /^(GOL|LAT|ZAG|MEI|ATA|NOVOS_BR_)/.test(c.bl) && !/_EU|_WORLD/.test(c.bl))
const pos = c => c.bl.includes('GOL') ? 'GOL' : c.bl.includes('LAT') ? 'LAT' : c.bl.includes('ZAG') ? 'ZAG' : c.bl.includes('MEI') ? 'MEI' : 'ATA'
// o baralho aceita as duas grafias do Athletico/Atlético Paranaense
const mesmo = (a, b) => a === b || [a, b].every(x => /^(Athletico|Atlético)-PR$/.test(x))
const passa = c => (PART[c.year] ?? []).some(p => mesmo(p, c.club))

const dentro = BR.filter(passa)
const cnt = l => { const m = { GOL: 0, LAT: 0, ZAG: 0, MEI: 0, ATA: 0 }; for (const c of l) m[pos(c)]++; return m }
const F = { '4-3-3': { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }, '4-4-2': { GOL: 1, LAT: 2, ZAG: 2, MEI: 4, ATA: 2 } }
const m = cnt(dentro)
const teto = f => Math.min(...Object.keys(F[f]).map(p => Math.floor(m[p] / F[f][p])))
console.log(`baralho 🌎 Libertadores: ${dentro.length} de ${BR.length} cartas BR (${Math.round(100 * dentro.length / BR.length)}%)`)
console.log('por posição:', JSON.stringify(m))
console.log(`cabe até ${Math.min(teto('4-3-3'), teto('4-4-2'))} técnicos na sala (4-3-3: ${teto('4-3-3')} · 4-4-2: ${teto('4-4-2')})`)
console.log(`lendas: ${dentro.filter(c => c.fame === 5).length} · craques: ${dentro.filter(c => c.fame === 4).length}`)
