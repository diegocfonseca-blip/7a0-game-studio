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

// ─────────────────────────────────────────────────────────────────────────────
// 🪜 A PIRÂMIDE INTEIRA (correção de 14/09, depois do Diego perguntar):
// "no carreira precisamos que TODOS os times estejam completos, então temos que
//  ver a quantidade também — porque tem a NBA, antes dela a G League e antes a
//  Street League".
// Ele está certo em olhar por andar, e a conta muda: quem manda é o andar MAIS
// PESADO (a NBA, 30 times), não a sala de 20.
// ⚠️ Mas "completo" aqui é o QUINTETO, não o elenco de 15: o bot do basquete fica
// em 1 por posição, igual o bot do futebol fica no XI de 11 (`slotsOf`: bot sem
// `nbaSlots` = quinteto). Só VOCÊ cresce pra 10 e depois 15. Isso derruba muito a
// demanda — e foi por confundir isso que a primeira medição do dia saiu inflada.
// O gargalo REAL é o pool de BOM JOGADOR (fame 2-3), porque 76% dos bots são
// "médios" e é dele que eles se servem.
const planos = nBots => { const f = Math.max(1, Math.floor(nBots * 0.09)), w = Math.max(1, Math.round(nBots * 0.15)); return { forte: f, fraco: w, medio: nBots - f - w } }
const ANDARES = [['🛝 Street League', 20], ['🔷 G League', 24], ['💍 NBA', 30]]
const quantos = (l, f) => l.filter(f).length
console.log('\n════ A PIRÂMIDE: quantos BOM JOGADOR (fame 2-3) cada andar pede ════')
for (const [nome, times] of ANDARES) {
  const bots = times - 1, pl = planos(bots)
  console.log(`\n${nome} — ${times} times (${pl.forte} fortes · ${pl.medio} médios · ${pl.fraco} fracos)`)
  for (const [pos, lista] of Object.entries(CATALOG_NBA)) {
    const pool = quantos(lista, c => c.fame === 2 || c.fame === 3)
    const x = pool / pl.medio
    console.log(`  ${pos.padEnd(3)} bom jogador: ${String(pool).padStart(3)} pra ${String(pl.medio).padStart(2)} times médios = ${x.toFixed(1)}x${x < 2 ? '  ⚠️ abaixo do futebol' : ''}`)
  }
}
console.log('\n──── o mesmo no FUTEBOL (carreira de 20, baralho BR) — a régua ────')
{
  const pl = planos(19)
  for (const [pos, lista] of Object.entries(CATALOG)) {
    const pool = quantos(lista, c => c.fame === 2 || c.fame === 3)
    console.log(`  ${pos.padEnd(3)} bom jogador: ${String(pool).padStart(3)} pra ${pl.medio} times médios = ${(pool / pl.medio).toFixed(1)}x`)
  }
}
