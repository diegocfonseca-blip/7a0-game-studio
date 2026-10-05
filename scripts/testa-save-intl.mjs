// 🗜️ trava do save da carreira internacional (03/10, save do marcomak03 que não gravou 2 temporadas):
// a lista de gols/assistências dos jogadores da máquina vira um placar ACUMULADO. Confere que nenhum
// número se perde, que rodar de novo não conta duas vezes e que o save para de crescer por temporada.
//   node scripts/testa-save-intl.mjs
import assert from 'node:assert/strict'
import { createServer } from 'vite'
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'silent' })
try {
  const { CATALOG_BOTH } = await vite.ssrLoadModule('/src/escalacao/data.ts')
  const { makeInternationalCampaign } = await vite.ssrLoadModule('/src/escalacao/career-international-season.ts')
  const { summarizeInternationalCampaign } = await vite.ssrLoadModule('/src/escalacao/career-international-summary.ts')
  const { compactaHistoricoIntl } = await vite.ssrLoadModule('/src/escalacao/store.tsx')
  const needs = { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }
  const xi = Object.entries(needs).flatMap(([pos, n]) => CATALOG_BOTH[pos].slice(0, n).map((c, i) => ({ ...c, pos, id: `m-${pos}-${i}` })))
  const hist = []
  for (let season = 40; season < 46; season++) hist.push(summarizeInternationalCampaign(makeInternationalCampaign({ season, seed: 777, representedClub: 'Flamengo', userTeam: 'Meu FC', userId: 0, priority: 1, userXI: xi })))
  // o que tinha antes, somado na mão
  const esperado = {}
  for (const e of hist) for (const [k, , g, gl, as] of e.botPlayerStats) { const c = esperado[k] ?? [0, 0, 0]; esperado[k] = [c[0] + g, c[1] + gl, c[2] + as] }
  const antes = { seasonNo: 46, careerInternationalHistory: hist }
  const depois = compactaHistoricoIntl(antes)
  assert.deepEqual(depois.careerIntlBotTotals, esperado, 'nenhum jogo/gol/assistência da máquina se perde')
  assert.ok(depois.careerInternationalHistory.every(e => !('botPlayerStats' in e)), 'a lista por temporada sai')
  for (const [i, e] of depois.careerInternationalHistory.entries()) {
    const { botPlayerStats: _x, ...resto } = hist[i]
    assert.deepEqual(e, resto, 'o resto da temporada (campeões, artilheiros, jogadores do usuário, ranking) fica igual')
  }
  assert.deepEqual(compactaHistoricoIntl(depois), depois, 'rodar de novo não conta duas vezes')
  const kb = x => Math.round(JSON.stringify(x).length / 1024)
  console.log(`6 temporadas: ${kb(antes)} KB → ${kb(depois)} KB`)
  assert.ok(kb(depois) < kb(antes) / 2)
  console.log('✅ save internacional compacto sem perder nenhum número')
} finally { await vite.close() }
