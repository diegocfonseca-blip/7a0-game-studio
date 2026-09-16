import { chromium } from 'playwright-core'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage()
p.on('pageerror', e => console.log('ERRO:', e.message))
await p.goto('http://localhost:5173/7a0-game-studio/bench-sim.html', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(6000)
const r = await p.evaluate(async () => {
  const B = '/7a0-game-studio/src/escalacao/'
  await import(B + 'screens.tsx')
  const P = await import(B + 'pyramidseason.tsx')
  const D = await import(B + 'data.ts')
  const F = D.CATALOG_BOTH
  const mid = c => ((c.lo ?? 1) + (c.hi ?? 2)) / 2
  // força de um XI = média do mid das 11 cartas
  const forcaXI = xi => xi.length ? Math.round(xi.reduce((n, c) => n + mid(c), 0) / xi.length * 10) / 10 : 0
  // monta o mundo com a Várzea e lê a força dos times de LÁ
  const world = P.buildPyramid([{ id: 0, name: 'Você', teamName: 'T', isHuman: true, formation: '4-4-2', money: 0, squad: [] }],
    0, 424242, 'br', { m0: 'V' })
  const out = {}
  for (const d of ['V', 'D', 'C', 'B', 'A']) {
    const times = (world[d] ?? []).filter(t => !t.human)
    const fs = times.map(t => forcaXI(t.xi ?? [])).filter(x => x > 0).sort((a, b) => b - a)
    out[d] = { n: fs.length, top: fs[0], mediana: fs[Math.floor(fs.length / 2)], pior: fs[fs.length - 1] }
  }
  // e a força das cartas que a escada libera em cada degrau
  const degrau = {}
  const pool = (dv, pos) => {
    const t = (F[pos] ?? []).filter(c => !c.fake)
    if (dv === 'V') return t.filter(c => !c.promessa && (c.fame ?? 1) <= 3)
    if (dv === 'D') return t.filter(c => c.promessa || ((c.fame ?? 1) >= 2 && (c.fame ?? 1) <= 3))
    if (dv === 'C' || dv === 'B') return t.filter(c => c.promessa || (!c.promessa && (c.fame ?? 1) === 4))
    return t.filter(c => !c.promessa && (c.fame ?? 1) >= 4)
  }
  for (const dv of ['V', 'D', 'C', 'B', 'A']) {
    const todas = ['GOL','LAT','ZAG','MEI','ATA'].flatMap(pz => pool(dv, pz).map(mid)).sort((a,b)=>b-a)
    degrau[dv] = { n: todas.length, melhor: Math.round(todas[0]), top11: Math.round(todas.slice(0,11).reduce((a,b)=>a+b,0)/11),
                   mediana: Math.round(todas[Math.floor(todas.length/2)]), pior: Math.round(todas[todas.length-1]) }
  }
  // e o fame 1 puro (foi profissional)
  const f1 = ['GOL','LAT','ZAG','MEI','ATA'].flatMap(pz => (F[pz]??[]).filter(c=>!c.fake && (c.fame??1)===1 && !c.promessa).map(mid)).sort((a,b)=>b-a)
  const f23 = ['GOL','LAT','ZAG','MEI','ATA'].flatMap(pz => (F[pz]??[]).filter(c=>!c.fake && ((c.fame??1)===2||(c.fame??1)===3) && !c.promessa).map(mid)).sort((a,b)=>b-a)
  return { timesDeFundo: out, degrauEscada: degrau,
    foiProfissional: { n: f1.length, melhor: Math.round(f1[0]), mediana: Math.round(f1[Math.floor(f1.length/2)]), pior: Math.round(f1[f1.length-1]) },
    bomJogador: { n: f23.length, melhor: Math.round(f23[0]), mediana: Math.round(f23[Math.floor(f23.length/2)]), pior: Math.round(f23[f23.length-1]) } }
})
console.log(JSON.stringify(r, null, 1))
await b.close()
