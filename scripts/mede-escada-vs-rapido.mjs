// 📏 MEDE a diferença entre o baralho do JOGO RÁPIDO e o que a ESCADA deixa em cada
// divisão — o número que embasa o mockup 'rapido-vira-carreira' (Diego 15/09).
// Rodar: npx tsx scripts/mede-escada-vs-rapido.mjs
import { CATALOG } from '../src/escalacao/data.ts'
import { escadaAllows } from '../src/escalacao/store.tsx'
const SET = ['GOL','LAT','ZAG','MEI','ATA']
const forca = c => ((c.lo ?? 50) + (c.hi ?? 70)) / 2
const stat = (arr) => {
  const f = arr.map(forca).sort((a,b)=>b-a)
  return { n: arr.length, top11: (f.slice(0,11).reduce((a,b)=>a+b,0)/Math.min(11,f.length)).toFixed(1), melhor: f[0]?.toFixed(0), media: (f.reduce((a,b)=>a+b,0)/f.length).toFixed(1) }
}
const todas = SET.flatMap(p => CATALOG[p])
console.log('BARALHO INTEIRO (o do jogo rápido):', JSON.stringify(stat(todas)))
for (const d of ['V','D','C','B','A']) {
  const ok = todas.filter(c => escadaAllows(d, c))
  console.log(`ESCADA ${d}:`, JSON.stringify(stat(ok)))
}
// quantas LENDAS (fame>=4) o baralho do rápido tem, e quantas a Várzea vê
const lendas = todas.filter(c => (c.fame ?? 1) >= 4)
console.log('\nlendas/craques (fame>=4) no baralho todo:', lendas.length)
console.log('desses, quantos a VÁRZEA deixa:', lendas.filter(c => escadaAllows('V', c)).length)
console.log('fame>=5 (lenda pura):', todas.filter(c=>(c.fame??1)>=5).length, '— na Várzea:', todas.filter(c=>(c.fame??1)>=5 && escadaAllows('V',c)).length)
