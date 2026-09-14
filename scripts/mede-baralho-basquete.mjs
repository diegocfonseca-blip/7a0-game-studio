// 📏 MEDE O BARALHO DO BASQUETE contra a régua do FUTEBOL (oferta e demanda no
// pregão). Pergunta do Diego (14/09): "quais categorias estão precisando encher
// mais pra bater a % que precisamos pra funcionar oferta e demanda no leilão,
// igual já funciona no futebol?".
//
// Lê os DOIS baralhos de verdade e diz, por posição, quantas cartas faltam em
// cada categoria. LENDA fica de fora da conta de propósito: não existem 75
// lendas da NBA, e inventar lenda seria mentir sobre gente de verdade.
//
// Rodar: npx tsx scripts/mede-baralho-basquete.mjs
import { CATALOG, CATALOG_EU } from '../src/escalacao/data.ts'
import { CATALOG_NBA } from '../src/escalacao/data-basquete.ts'
const cat = c => c.promessa ? 'promessa' : c.fame === 5 ? 'lenda' : c.fame === 4 ? 'craque' : c.fame >= 2 ? 'bom' : 'prof'
const ORD = ['craque','bom','prof','promessa','lenda']
const conta = l => { const c = Object.fromEntries(ORD.map(k=>[k,0])); for (const x of l) c[cat(x)]++; return c }
// mistura do FUTEBOL (BR+EU) = a regua que ja funciona
const fut = []
for (const cta of [CATALOG, CATALOG_EU]) for (const l of Object.values(cta)) fut.push(...l)
const cf = conta(fut), nf = fut.length
const mix = Object.fromEntries(ORD.map(k => [k, cf[k]/nf]))
console.log('régua do futebol:', ORD.map(k=>`${k} ${(100*mix[k]).toFixed(1)}%`).join(' · '))

const ALVO = 126 // cartas por posicao = 2,1x por vaga num elenco cheio de 15 (3 por posicao, 20 times)
console.log(`\nALVO: ${ALVO} cartas por posição (${ALVO*5} no total) — é a folga mais APERTADA que o futebol tem hoje (2,1x por vaga)\n`)
let falta = Object.fromEntries(ORD.map(k=>[k,0]))
for (const [pos, lista] of Object.entries(CATALOG_NBA)) {
  const c = conta(lista)
  const linha = ORD.filter(k => k !== 'lenda').map(k => {
    const querido = Math.round(ALVO * mix[k])
    const d = Math.max(0, querido - c[k]); falta[k] += d
    return `${k} +${String(d).padStart(2)}`
  })
  console.log(`${pos.padEnd(3)} tem ${String(lista.length).padStart(3)} → faltam ${String(ALVO-lista.length).padStart(3)} | ${linha.join(' · ')}  (lenda: fica em ${c.lenda}, não se inventa lenda)`)
}
console.log(`\nsoma do que falta: ${ORD.filter(k=>k!=='lenda').map(k=>`${k} ${falta[k]}`).join(' · ')}`)
