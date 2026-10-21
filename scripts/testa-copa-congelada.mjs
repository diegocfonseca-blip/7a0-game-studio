// 🧊⏯️ COPA DO MUNDO DA CARREIRA QUE NÃO RECOMEÇA (21/10, caso do Gimenes Junior Barranquila). O carimbo guarda as 32 seleções
// com as cartas inteiras: congelar → gravar (JSON, como no aparelho) → descongelar tem que dar o MESMO torneio, jogo a jogo — e
// continuar igual mesmo se o catálogo mudar depois (carta nova, nível novo).
//   npm run copa-congelada
import assert from 'node:assert/strict'
import { createServer } from 'vite'
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'silent' })
try {
  const M = await vite.ssrLoadModule('/src/escalacao/copa-mundo-online.tsx')
  const C = await vite.ssrLoadModule('/src/escalacao/copa-mundo.tsx')
  const paises = M.paisesDaCopa().slice(0, 32)
  const ents = paises.map((p, i) => { const pool = C.countryPool(p); const f = C.formationFits(pool, '4-3-3') ? '4-3-3' : '4-4-2'; const xi = C.bestXI(pool, f); return { club: `Clube ${i}`, you: i === 5, pais: p, xi, str: C.xiStrength(xi), form: f } })
  const resumo = w => JSON.stringify([w.groups.map(g => g.matches), w.r16, w.qf, w.sf, w.final])
  let iguais = 0
  for (let s = 1; s <= 40; s++) {
    const seed = s * 7919
    const antes = C.simulaCopaMundo(ents, seed, 100, true, true)
    const gravado = JSON.parse(JSON.stringify(ents.map(C.congela)))
    const volta = gravado.map(C.descongela)
    assert.equal(resumo(C.simulaCopaMundo(volta, seed, 100, true, true)), resumo(antes), `semente ${seed}: o torneio reaberto mudou`)
    // o catálogo "muda" depois de carimbar (nível de uma carta da seleção 0): o torneio congelado NÃO pode mudar
    ents[0].xi[0] = { ...ents[0].xi[0], lo: ents[0].xi[0].lo + 15, hi: ents[0].xi[0].hi + 15 }
    assert.equal(resumo(C.simulaCopaMundo(gravado.map(C.descongela), seed, 100, true, true)), resumo(antes), `semente ${seed}: mudar o catálogo mexeu na Copa congelada`)
    ents[0].xi[0] = volta[0].xi[0]
    iguais++
  }
  const kb = (JSON.stringify(ents.map(C.congela)).length / 1024).toFixed(1)
  console.log(`✅ ${iguais} Copas reabertas iguais, jogo a jogo, mesmo com o catálogo mudando · o carimbo das 32 seleções pesa ${kb} KB`)
} finally { await vite.close() }
