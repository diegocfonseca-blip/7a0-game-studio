// 📊 ANTES × AGORA do dinheiro da carreira (15/09) — a conta que virou o stories.
// O "ANTES" saiu do PRÓPRIO GIT (commits `2f151197^` e `b4857483^`), não da memória;
// o "AGORA" sai das funções de verdade do jogo. Rodar depois de mexer em qualquer
// régua pra refazer os números do post:  node scripts/mede-antes-depois.mjs
import { createServer } from 'vite'
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
const est = await server.ssrLoadModule('/src/escalacao/estadiodata.ts')
const loja = await server.ssrLoadModule('/src/escalacao/loja.ts')
// réguas ANTIGAS (tiradas do git: commit 2f151197^ e b4857483^)
const MASTER_ANTES = { V: 2, D: 4, C: 8, B: 16, A: 32 }
const TV_ANTES = { A: 20, B: 15, C: 10, D: 5, V: 1 }
const BICO_ANTES = { V: 2, D: 4, C: 0, B: 0, A: 0 }
const mstAntes = (d, a) => Math.round(MASTER_ANTES[d] * (1.25 + (a - 1) / 2))
const TV_AGORA = { A: 50, B: 40, C: 30, D: 20, V: 10 }
const BICO_AGORA = { V: 5, D: 7, C: 10, B: 0, A: 0 }
// camisa: um clube de Série C com estádio médio (o mesmo da conta anterior)
const st = { inv: { geral: 40, cadeiras: 20 }, ext: ['loja', 'telao', 'estac'] }
for (const d of ['V', 'D', 'C', 'B', 'A']) {
  const a = { tv: TV_ANTES[d], bico: BICO_ANTES[d], master: mstAntes(d, 3) }
  const b = { tv: TV_AGORA[d], bico: BICO_AGORA[d], master: est.masterPorTemporada(d, 3),
              forn: loja.fornPorTemporada(d, 3),
              camisa: loja.calculaVendas({ st, pos: 10, preco: 'normal', fornLoja: 0.30 }).moedas }
  const sa = a.tv + a.bico + a.master
  const sb = b.tv + b.bico + b.master + b.forn + b.camisa
  console.log(`${d}: ANTES tv ${a.tv} + bico ${a.bico} + master ${a.master} = ${sa}`)
  console.log(`   AGORA tv ${b.tv} + bico ${b.bico} + master ${b.master} + forn ${b.forn} + camisa ${b.camisa} = ${sb}   (${(sb/Math.max(1,sa)).toFixed(1)}x)`)
}
await server.close()
